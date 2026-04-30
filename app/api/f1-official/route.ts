import { NextResponse } from 'next/server';

const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';

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

async function fetchSchedule(year: number): Promise<F1OfficialRace[]> {
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

async function fetchResults(year: number, round: number): Promise<RaceResult[]> {
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()));
  const roundParam = searchParams.get('round');

  try {
    const races = await fetchSchedule(year);
    const today = new Date();
    const completedRaces = races.filter(r => new Date(r.date) < today);

    // 完了済みレースの結果を並列取得
    const settled = await Promise.allSettled(
      completedRaces.map(r => fetchResults(year, r.round))
    );

    settled.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        const idx = races.findIndex(r => r.round === completedRaces[i].round);
        if (idx !== -1) races[idx].results = result.value;
      }
    });

    // 特定ラウンドのみ返す
    if (roundParam) {
      const round = parseInt(roundParam);
      const race = races.find(r => r.round === round);
      if (!race) return NextResponse.json({ error: 'Race not found' }, { status: 404 });

      if (!race.results) {
        race.results = await fetchResults(year, round);
      }

      return NextResponse.json({ season: year, races: [race], _source: 'jolpica' });
    }

    return NextResponse.json({ season: year, races, _source: 'jolpica' });

  } catch (error) {
    console.error('F1 API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch F1 data',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
