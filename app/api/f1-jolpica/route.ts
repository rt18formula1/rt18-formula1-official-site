import { NextResponse } from 'next/server';

// Jolpica APIベースURL
const JOLPICA_API_BASE = 'https://api.jolpi.ca/ergast/f1';

// Jolpica APIのレスポンス型
interface JolpicaDriver {
  driverId: string;
  permanentNumber: string;
  code: string;
  url: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
}

interface JolpicaConstructor {
  constructorId: string;
  url: string;
  name: string;
  nationality: string;
}

interface JolpicaTime {
  millis?: string;
  time: string;
}

interface JolpicaFastestLap {
  rank: string;
  lap: string;
  Time: {
    time: string;
  };
  AverageSpeed: {
    units: string;
    speed: string;
  };
}

interface JolpicaResult {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: JolpicaDriver;
  Constructor: JolpicaConstructor;
  grid: string;
  laps: string;
  status: string;
  Time?: JolpicaTime;
  FastestLap?: JolpicaFastestLap;
}

interface JolpicaCircuit {
  circuitId: string;
  url: string;
  circuitName: string;
  Location: {
    lat: string;
    long: string;
    locality: string;
    country: string;
  };
}

interface JolpicaRace {
  season: string;
  round: string;
  url: string;
  raceName: string;
  Circuit: JolpicaCircuit;
  date: string;
  time?: string;
  Results?: JolpicaResult[];
  FirstPractice?: { date: string; time: string };
  SecondPractice?: { date: string; time: string };
  ThirdPractice?: { date: string; time: string };
  Qualifying?: { date: string; time: string };
}

interface JolpicaResponse {
  MRData: {
    xmlns: string;
    series: string;
    url: string;
    limit: string;
    offset: string;
    total: string;
    RaceTable: {
      season?: string;
      Races: JolpicaRace[];
    };
  };
}

// 自分のデータ型に変換
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

interface F1OfficialData {
  season: number;
  races: F1OfficialRace[];
  _scraped?: boolean;
  _fallback?: boolean;
  _error?: string;
}

// Jolpica APIからデータを取得
async function fetchFromJolpica(endpoint: string): Promise<any> {
  try {
    const response = await fetch(`${JOLPICA_API_BASE}${endpoint}`, {
      headers: {
        'User-Agent': 'F1-Official-Site/1.0'
      },
      next: {
        revalidate: 300 // 5分キャッシュ
      }
    });

    if (!response.ok) {
      throw new Error(`Jolpica API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Jolpica API fetch error:', error);
    throw error;
  }
}

// Jolpicaデータを自前の形式に変換
function convertJolpicaData(jolpicaData: JolpicaResponse, targetYear: number): F1OfficialData {
  const races: F1OfficialRace[] = jolpicaData.MRData.RaceTable.Races.map(race => {
    const convertedRace: F1OfficialRace = {
      round: parseInt(race.round),
      name: race.raceName,
      location: race.Circuit.Location.locality,
      country: race.Circuit.Location.country,
      date: race.date,
      url: race.url
    };

    // レース結果がある場合のみ変換
    if (race.Results && race.Results.length > 0) {
      convertedRace.results = race.Results.map(result => ({
        position: parseInt(result.position),
        name: `${result.Driver.givenName} ${result.Driver.familyName}`,
        code: result.Driver.code,
        time: result.Time?.time || result.status,
        points: parseInt(result.points),
        team: result.Constructor.name
      }));
    }

    return convertedRace;
  });

  return {
    season: targetYear,
    races,
    _scraped: true,
    _fallback: false
  };
}

// ドライバースタンディングスを取得
async function getDriverStandings(year: number): Promise<any> {
  try {
    console.log(`Fetching driver standings for year: ${year}`);
    const response = await fetchFromJolpica(`/${year}/driverstandings.json?limit=100`);
    return response;
  } catch (error) {
    console.error('Error fetching driver standings:', error);
    throw error;
  }
}

// コンストラクタースタンディングスを取得
async function getConstructorStandings(year: number): Promise<any> {
  try {
    console.log(`Fetching constructor standings for year: ${year}`);
    const response = await fetchFromJolpica(`/${year}/constructorstandings.json?limit=100`);
    return response;
  } catch (error) {
    console.error('Error fetching constructor standings:', error);
    throw error;
  }
}

// 指定年のレーススケジュールを取得
async function getRaceSchedule(year: number): Promise<F1OfficialData> {
  try {
    console.log(`Fetching Jolpica data for year: ${year}`);
    
    // まずレース一覧を取得
    const racesResponse = await fetchFromJolpica(`/${year}/races.json?limit=100`);
    
    // 各レースの結果を取得（完了したレースのみ）
    const racesWithResults = await Promise.all(
      racesResponse.MRData.RaceTable.Races.map(async (race: JolpicaRace) => {
        try {
          // レース結果を取得
          const resultsResponse = await fetchFromJolpica(`/${year}/${race.round}/results.json`);
          
          if (resultsResponse.MRData.RaceTable.Races.length > 0) {
            const raceWithResults = resultsResponse.MRData.RaceTable.Races[0];
            return { ...race, Results: raceWithResults.Results };
          }
          
          return race; // 結果がない場合は基本情報のみ
        } catch (error) {
          console.warn(`Failed to fetch results for ${year} round ${race.round}:`, error);
          return race; // エラーの場合は基本情報のみ
        }
      })
    );

    const convertedData = convertJolpicaData(
      { ...racesResponse, MRData: { ...racesResponse.MRData, RaceTable: { ...racesResponse.MRData.RaceTable, Races: racesWithResults } } },
      year
    );

    console.log(`Successfully fetched ${convertedData.races.length} races for ${year}`);
    return convertedData;

  } catch (error) {
    console.error('Error fetching Jolpica data:', error);
    throw error;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const type = searchParams.get('type'); // 'schedule', 'drivers', 'constructors'

  try {
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    
    console.log('Jolpica API request for year:', targetYear, 'type:', type);

    // リクエストタイプに応じてデータを取得
    switch (type) {
      case 'drivers':
        const driverStandings = await getDriverStandings(targetYear);
        return NextResponse.json({
          season: targetYear,
          type: 'driverStandings',
          data: driverStandings,
          _scraped: true,
          _fallback: false
        });

      case 'constructors':
        const constructorStandings = await getConstructorStandings(targetYear);
        return NextResponse.json({
          season: targetYear,
          type: 'constructorStandings',
          data: constructorStandings,
          _scraped: true,
          _fallback: false
        });

      case 'schedule':
      default:
        // Jolpica APIからデータ取得
        const data = await getRaceSchedule(targetYear);
        return NextResponse.json(data);
    }

  } catch (error) {
    console.error('Jolpica API error:', error);
    
    // targetYearを再取得
    const fallbackYear = year ? parseInt(year) : new Date().getFullYear();
    
    // エラー時は静的データにフォールバック
    try {
      // 基本的なフォールバックデータを生成
      const fallbackRaces: F1OfficialRace[] = [
        {
          round: 1,
          name: "Season Opener",
          location: "TBD",
          country: "TBD",
          date: `${fallbackYear}-03-01`,
          url: `https://www.formula1.com/en/racing/${fallbackYear}/`,
        },
        {
          round: 2,
          name: "Second Race", 
          location: "TBD",
          country: "TBD",
          date: `${fallbackYear}-03-15`,
          url: `https://www.formula1.com/en/racing/${fallbackYear}/`,
        },
        {
          round: 3,
          name: "Third Race",
          location: "TBD", 
          country: "TBD",
          date: `${fallbackYear}-04-01`,
          url: `https://www.formula1.com/en/racing/${fallbackYear}/`,
        }
      ];

      const fallbackData = {
        season: fallbackYear,
        races: fallbackRaces,
        _scraped: false,
        _fallback: true,
        _error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      return NextResponse.json(fallbackData);
    } catch (fallbackError) {
      console.error('Fallback data error:', fallbackError);
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch data from both Jolpica API and fallback',
          _scraped: false,
          _fallback: false,
          _error: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  }
}
