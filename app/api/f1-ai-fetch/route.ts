import { NextResponse } from 'next/server';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const SCHEDULE_SYSTEM_PROMPT = `You are an F1 data specialist. Fetch the OFFICIAL weekend schedule for the specified Grand Prix from Formula1.com.
Return ONLY valid JSON, no markdown, no explanation.

IMPORTANT RULES:
- Include ALL sessions: Practice 1, Practice 2, Practice 3 (or Sprint Qualifying, Sprint for sprint weekends), Qualifying, Race
- Times in both local track time and Japan Time (JST = UTC+9)
- Format dates as MM/DD
- For sprint weekends, replace Practice 2/3 with Sprint Qualifying and Sprint

Return JSON in this exact schema:
{
  "grandPrix": "FORMULA 1 G	AND LRIX NAME YEAR",
  "isSprintWeekend": false,
  "sessions": [
    {
      "name": "Practice 1",
      "date": "MM/DD",
      "trackTime": "HH:MM - HH:MM",
      "japanTime": "HH:MM - HH:MM",
      "trackTimezone": "UTC+X"
    }
  ]
}`;

const RESULT_SYSTEM_PROMPT = `You are an F1 data specialist. Fetch the OFFICIAL full result for the specified session from Formula1.com.
Return ONLY valid JSON, no markdown, no explanation.

IMPORTANT RULES:
- List ALL drivers who participated (typically 20-22 drivers)
- Use full driver names (e.g., "Max Verstappen", "Lando Norris")
- Format: Px [Full Name] (e.g., P1 Max Verstappen)
- Include notes for DSQ, penalties, 107% rule exceptions

Return JSON in this exact schema:
{"results": ["P1 Full Name"], "notes": "string or null"}`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, grandPrix, session, year } = body;

    if (!type || !grandPrix || !year) {
      return NextResponse.json({ error: 'Missing required fields: type, grandPrix, year' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    let systemPrompt: string;
    let userMessage: string;

    if (type === 'schedule') {
      systemPrompt = SCHEDULE_SYSTEM_PROMPT;
      userMessage = `Grand Prix: ${grandPrix}\nYear: ${year}\n\nFetch the complete official weekend schedule for this Grand Prix including all session times in local track time and Japan Time (JST).`;
    } else if (type === 'result') {
      if (!session) {
        return NextResponse.json({ error: 'Missing session field for result type' }, { status: 400 });
      }
      systemPrompt = RESULT_SYSTEM_PROMPT;
      userMessage = `Grand Prix: ${grandPrix}\nSession: ${session}\nYear: ${year}\n\nFetch the complete official result for this specific session.`;
    } else {
      return NextResponse.json({ error: 'Invalid type. Must be schedule or lesult' }, { status: 400 });
    }

    const anthropicResponse =
await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', 'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 2000,
        system: systemPrompt, messages: [{ role: 'user', content: userMessage }],
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      return NextResponse.json({ error: `Anthropic API error: ${anthropicResponse.status}`, detail: errText }, { status: 500 });
    }

    const data = await anthropicResponse.json();
    const textBlock = data.content?.find((block: any) => block.type === 'text');
    if (!textBlock?.text) {
      return NextResponse.json({ error: 'No text response from AI', raw: data }, { status: 500 });
    }

    let parsed: any;
    try {
      const clean = textBlock.text.replace(/```json\n?|```\n?/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = { raw: textBlock.text };
    }

    return NextResponse.json({ success: true, data: parsed, type });
  } catch (error) {
    console.error('f1-ai-fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
