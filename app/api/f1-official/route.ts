import { NextResponse } from 'next/server';

const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface RaceResult {
  position: number;
  name: string;
  code: string;
  time: string;
  points: number;
  team: string;
}

interface F1OfficialRace {
  round: number;
  name: string;
  location: string;
  country: string;
  date: string;
  url: string;
  results?: RaceResult[];
}

// Jolpica API からスケジュール取得
async function fetchScheduleFromJolpica(year: number): Promise<F1OfficialRace[]> {
  const res = await fetch(`${JOLPICA_BASE}/${year}/races.json?limit=30`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Jolpica schedule error: ${res.status}`);
  const data = await res.json();
  const races = data?.MRData?.RaceTable?.Races ?? [];
  return races.map((r: any) => ({
    round: parseInt(r.round),
    name: r.raceName,
    location: r.Circuit?.Location?.locality ?? '',
    country: r.Circuit?.Location?.country ?? '',
    date: r.date,
    url: r.url ?? '',
  }));
}

// Jolpica API からレース結果取得
async function fetchResultsFromJolpica(year: number, round: number): Promise<RaceResult[]> {
  const res = await fetch(`${JOLPICA_BASE}/${year}/${round}/results.json`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Jolpica results error: ${res.status}`);
  const data = await res.json();
  const results = data?.MRData?.RaceTable?.Races?.[0]?.Results ?? [];
  return results.map((r: any) => ({
    position: parseInt(r.position),
    name: `${r.Driver.givenName} ${r.Driver.familyName}`,
    code: r.Driver.code ?? r.Driver.driverId.toUpperCase().slice(0, 3),
    time: r.Time?.time ?? r.status ?? '',
    points: parseFloat(r.points),
    team: r.Constructor?.name ?? '',
  }));
}

// Gemini 2.0 Flash で 2026 以降のスケジュールを補完
async function fetchScheduleFromGemini(year: number): Promise<F1OfficialRace[]> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');

  const prompt = `You are an F1 data specialist. Return the complete ${year} F1 season race schedule based on official Formula1.com data.
Return ONLY valid JSON, no markdown, no explanation.
Schema:
{
  "races": [
    {
      "round": 1,
      "name": "Australian Grand Prix",
      "location": "Melbourne",
      "country": "Australia",
      "date": "YYYY-MM-DD",
      "url": "https://www.formula1.com/en/racing/${year}/australia.html"
    }
  ]
}
Include ALL rounds for the ${year} season.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tools: [{ google_search: {} }],
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini schedule error: ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  const parsed = JSON.parse(text.replace(/\`\`\`json|\`\`\`/g, '').trim());
  return (parsed.races ?? []).map((r: any) => ({
    round: r.round,
    name: r.name,
    location: r.location,
    country: r.country,
    date: r.date,
    url: r.url ?? '',
  }));
}

// Gemini 2.0 Flash で特定レースの結果を補完
async function fetchRaceResultFromGemini(
  year: number,
  raceName: string,
  round: number
): Promise<RaceResult[]> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');

  const prompt = `Fetch the official race result for the ${year} ${raceName} (Round ${round}) from Formula1.com.
Return ONLY valid JSON, no markdown.
Schema:
{
  "results": [
    { "position": 1, "name": "Full Name", "code": "ABC", "time": "1:30:00.000", "points": 25, "team": "Team Name" }
  ]
}
List ALL classified drivers (typically 20). Use actual official results only. Do not invent data.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tools: [{ google_search: {} }],
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini results error: ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  const parsed = JSON.parse(text.replace(/\`\`\`json|\`\`\`/g, '').trim());
  return parsed.results ?? [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()));
  const roundParam = searchParams.get('round');

  try {
    const jolpicaSupported = year <= 2025;

    let races: F1OfficialRace[] = [];

    if (jolpicaSupported) {
      races = await fetchScheduleFromJolpica(year);
      const today = new Date();
      const completedRaces = races.filter(r => new Date(r.date) < today);
      const settled = await Promise.allSettled(
        completedRaces.map(r => fetchResultsFromJolpica(year, r.round))
      );
      settled.forEach((result, i) => {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          const idx = races.findIndex(r => r.round === completedRaces[i].round);
          if (idx !== -1) races[idx].results = result.value;
        }
      });
    } else {
      races = await fetchScheduleFromGemini(year);
      const today = new Date();
      const completedRaces = races.filter(r => new Date(r.date) < today);
      const settled = await Promise.allSettled(
        completedRaces.map(r => fetchRaceResultFromGemini(year, r.name, r.round))
      );
      settled.forEach((result, i) => {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          const idx = races.findIndex(r => r.round === completedRaces[i].round);
          if (idx !== -1) races[idx].results = result.value;
        }
      });
    }

    if (roundParam) {
      const round = parseInt(roundParam);
      const race = races.find(r => r.round === round);
      if (!race) return NextResponse.json({ error: 'Race not found' }, { status: 404 });
      if (!race.results) {
        if (jolpicaSupported) {
          race.results = await fetchResultsFromJolpica(year, round);
        } else {
          race.results = await fetchRaceResultFromGemini(year, race.name, round);
        }
      }
      return NextResponse.json({ season: year, races: [race], _source: jolpicaSupported ? 'jolpica' : 'gemini-2.0-flash' });
    }

    return NextResponse.json({ season: year, races, _source: jolpicaSupported ? 'jolpica' : 'gemini-2.0-flash' });

  } catch (error) {
    console.error('F1 API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch F1 data', detail: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
