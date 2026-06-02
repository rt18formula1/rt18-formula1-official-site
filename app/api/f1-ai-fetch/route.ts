import { NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

const SCHEDULE_PROMPT_BASE = `You are an F1 data specialist. Fetch the OFFICIAL weekend schedule for the specified Grand Prix from Formula1.com.
Return ONLY valid JSON, no markdown, no explanation.

IMPORTANT RULES:
- Include ALL sessions: Practice 1, Practice 2, Practice 3 (or Sprint Qualifying, Sprint for sprint weekends), Qualifying, Race
- Times in both local track time and Japan Time (JST = UTC+9)
- Format dates as MM/DD
- For sprint weekends, replace Practice 2/3 with Sprint Qualifying and Sprint
- If official Formula1.com data is unavailable, use the most authoritative official F1 source available and include a note

Return JSON in this exact schema:
{
  "grandPrix": "FORMULA 1 GRAND PRIX NAME YEAR",
  "isSprintWeekend": false,
  "sessions": [
    {
      "name": "Practice 1",
      "date": "MM/DD",
      "trackTime": "HH:MM - HH:MM",
      "japanTime": "HH:MM - HH:MM",
      "trackTimezone": "UTC+X"
    }
  ],
  "notes": "string or null"
}`;

const RESULT_PROMPT_BASE = `You are an F1 data specialist. Fetch the OFFICIAL full result for the specified session from Formula1.com.
Return ONLY valid JSON, no markdown, no explanation.

IMPORTANT RULES:
- List ALL drivers who participated (typically 20-22 drivers)
- Use full driver names (e.g., "Max Verstappen", "Lando Norris")
- Format: Px [Full Name] (e.g., P1 Max Verstappen)
- If a driver was disqualified, still list them at their finishing position but add a note
- If there are notes (DSQ, penalties applied post-race, 107% rule exceptions), include them

Return JSON in this exact schema:
{"results": ["P1 Full Name", ...], "notes": "string or null"}`;

const scheduleSchema = {
  type: 'OBJECT',
  properties: {
    grandPrix: { type: 'STRING' },
    isSprintWeekend: { type: 'BOOLEAN' },
    sessions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          date: { type: 'STRING' },
          trackTime: { type: 'STRING' },
          japanTime: { type: 'STRING' },
          trackTimezone: { type: 'STRING' },
        },
        required: ['name', 'date', 'trackTime', 'japanTime', 'trackTimezone'],
      },
    },
    notes: { type: 'STRING', nullable: true },
  },
  required: ['grandPrix', 'isSprintWeekend', 'sessions', 'notes'],
};

const resultSchema = {
  type: 'OBJECT',
  properties: {
    results: {
      type: 'ARRAY',
      items: { type: 'STRING' },
    },
    notes: { type: 'STRING', nullable: true },
  },
  required: ['results', 'notes'],
};

function extractText(data: any) {
  return data?.candidates?.[0]?.content?.parts
    ?.map((part: any) => part.text)
    .filter(Boolean)
    .join('\n')
    .trim();
}

function extractSources(data: any) {
  const chunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!Array.isArray(chunks)) return [];

  return chunks
    .map((chunk: any) => chunk.web)
    .filter((web: any) => web?.uri)
    .map((web: any) => ({
      title: web.title || web.uri,
      uri: web.uri,
    }));
}

async function callGemini(systemPrompt: string, userMessage: string, responseSchema: any) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      status: 500,
      payload: { error: 'GEMINI_API_KEY not configured' },
    };
  }

  const response = await fetch(`${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userMessage }],
        },
      ],
      tools: [
        {
          google_search: {},
        },
      ],
      generationConfig: {
        response_mime_type: 'application/json',
        response_schema: responseSchema,
      },
    }),
  });

  const data = await response.json().catch(async () => ({ raw: await response.text() }));

  if (!response.ok) {
    return {
      ok: false,
      status: 500,
      payload: {
        error: `Gemini API error: ${response.status}`,
        detail: data,
      },
    };
  }

  const text = extractText(data);
  if (!text) {
    return {
      ok: false,
      status: 500,
      payload: { error: 'No text response from Gemini', raw: data },
    };
  }

  try {
    return {
      ok: true,
      payload: {
        data: JSON.parse(text.replace(/```json\n?|```\n?/g, '').trim()),
        sources: extractSources(data),
      },
    };
  } catch {
    return {
      ok: true,
      payload: {
        data: { raw: text },
        sources: extractSources(data),
      },
    };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, grandPrix, session, year } = body;

    if (!type || !grandPrix || !year) {
      return NextResponse.json({ error: 'Missing required fields: type, grandPrix, year' }, { status: 400 });
    }

    let systemPrompt: string;
    let userMessage: string;
    let responseSchema: any;

    if (type === 'schedule') {
      systemPrompt = SCHEDULE_PROMPT_BASE;
      responseSchema = scheduleSchema;
      userMessage = `Grand Prix: ${grandPrix}
Year: ${year}

Fetch the complete official weekend schedule for this Grand Prix including all session times in local track time and Japan Time (JST).`;
    } else if (type === 'result') {
      if (!session) {
        return NextResponse.json({ error: 'Missing session field for result type' }, { status: 400 });
      }
      systemPrompt = RESULT_PROMPT_BASE;
      responseSchema = resultSchema;
      userMessage = `Grand Prix: ${grandPrix}
Session: ${session}
Year: ${year}

Fetch the complete official result for this specific session.`;
    } else {
      return NextResponse.json({ error: 'Invalid type. Must be schedule or result' }, { status: 400 });
    }

    const result = await callGemini(systemPrompt, userMessage, responseSchema);
    if (!result.ok) {
      return NextResponse.json(result.payload, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      type,
      model: GEMINI_MODEL,
      provider: 'gemini',
      ...result.payload,
    });
  } catch (error) {
    console.error('f1-ai-fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
