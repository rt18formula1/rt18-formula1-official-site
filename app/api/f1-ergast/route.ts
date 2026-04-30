import { NextResponse } from 'next/server';
import type { ErgastResponse, RaceTable, DriverTable, DriverStandingsTable } from '@/lib/ergast-types';

const ERGAST_API_BASE = 'http://ergast.com/api/f1';

// フォールバックデータ
const generateFallbackData = (endpoint: string, year?: string, round?: string) => {
  const currentYear = new Date().getFullYear();
  const targetYear = year ? parseInt(year) : currentYear;
  
  switch (endpoint) {
    case 'races':
      return {
        MRData: {
          xmlns: "http://ergast.com/mrd/1.5",
          series: "f1",
          url: `http://ergast.com/api/f1/${targetYear}.json`,
          limit: "1000",
          offset: "0",
          total: "24",
          RaceTable: {
            season: targetYear.toString(),
            Races: generateFallbackRaces(targetYear)
          }
        }
      };
    
    case 'results':
      return {
        MRData: {
          xmlns: "http://ergast.com/mrd/1.5",
          series: "f1",
          url: `http://ergast.com/api/f1/${targetYear}/${round}/results.json`,
          limit: "1000",
          offset: "0",
          total: "20",
          RaceTable: {
            season: targetYear.toString(),
            round: round || "1",
            Races: [{
              season: targetYear.toString(),
              round: round || "1",
              url: `http://en.wikipedia.org/wiki/2024_Formula_One_World_Championship`,
              raceName: `${targetYear} Grand Prix`,
              Circuit: {
                circuitId: "test",
                url: "http://en.wikipedia.org/wiki/Test_Circuit",
                circuitName: "Test Circuit",
                Location: {
                  lat: "0.0",
                  long: "0.0",
                  locality: "Test",
                  country: "Test Country"
                }
              },
              date: "2024-03-02",
              time: "15:00:00Z",
              Results: generateFallbackResults()
            }]
          }
        }
      };
    
    default:
      return {
        MRData: {
          xmlns: "http://ergast.com/mrd/1.5",
          series: "f1",
          url: "http://ergast.com/api/f1.json",
          limit: "1000",
          offset: "0",
          total: "0",
          RaceTable: null
        }
      };
  }
};

const generateFallbackRaces = (year: number) => {
  const races = [
    { name: "Bahrain Grand Prix", circuit: "Bahrain International Circuit", location: "Sakhir", country: "Bahrain", date: `${year}-03-02` },
    { name: "Saudi Arabian Grand Prix", circuit: "Jeddah Corniche Circuit", location: "Jeddah", country: "Saudi Arabia", date: `${year}-03-09` },
    { name: "Australian Grand Prix", circuit: "Melbourne Grand Prix Circuit", location: "Melbourne", country: "Australia", date: `${year}-03-24` },
    { name: "Japanese Grand Prix", circuit: "Suzuka Circuit", location: "Suzuka", country: "Japan", date: `${year}-04-07` },
    { name: "Chinese Grand Prix", circuit: "Shanghai International Circuit", location: "Shanghai", country: "China", date: `${year}-04-21` },
    { name: "Miami Grand Prix", circuit: "Miami International Autodrome", location: "Miami", country: "United States", date: `${year}-05-05` },
    { name: "Emilia Romagna Grand Prix", circuit: "Autodromo Enzo e Dino Ferrari", location: "Imola", country: "Italy", date: `${year}-05-19` },
    { name: "Monaco Grand Prix", circuit: "Circuit de Monaco", location: "Monte Carlo", country: "Monaco", date: `${year}-05-26` },
    { name: "Canadian Grand Prix", circuit: "Circuit Gilles Villeneuve", location: "Montreal", country: "Canada", date: `${year}-06-09` },
    { name: "Spanish Grand Prix", circuit: "Circuit de Barcelona-Catalunya", location: "Barcelona", country: "Spain", date: `${year}-06-23` }
  ];

  return races.map((race, index) => ({
    season: year.toString(),
    round: (index + 1).toString(),
    url: `http://en.wikipedia.org/wiki/${year}_${race.name.replace(/\s+/g, '_')}`,
    raceName: race.name,
    Circuit: {
      circuitId: race.circuit.toLowerCase().replace(/\s+/g, '_'),
      url: `http://en.wikipedia.org/wiki/${race.circuit.replace(/\s+/g, '_')}`,
      circuitName: race.circuit,
      Location: {
        lat: "0.0",
        long: "0.0",
        locality: race.location,
        country: race.country
      }
    },
    date: race.date,
    time: "15:00:00Z"
  }));
};

const generateFallbackResults = () => {
  const drivers = [
    { name: "Max Verstappen", number: "1", team: "Red Bull Racing", nationality: "Dutch" },
    { name: "Sergio Perez", number: "11", team: "Red Bull Racing", nationality: "Mexican" },
    { name: "Charles Leclerc", number: "16", team: "Ferrari", nationality: "Monegasque" },
    { name: "Carlos Sainz", number: "55", team: "Ferrari", nationality: "Spanish" },
    { name: "Lando Norris", number: "4", team: "McLaren", nationality: "British" },
    { name: "Oscar Piastri", number: "81", team: "McLaren", nationality: "Australian" },
    { name: "Lewis Hamilton", number: "44", team: "Mercedes", nationality: "British" },
    { name: "George Russell", number: "63", team: "Mercedes", nationality: "British" },
    { name: "Fernando Alonso", number: "14", team: "Aston Martin", nationality: "Spanish" },
    { name: "Lance Stroll", number: "18", team: "Aston Martin", nationality: "Canadian" }
  ];

  return drivers.map((driver, index) => ({
    number: driver.number,
    position: (index + 1).toString(),
    positionText: (index + 1).toString(),
    points: index < 10 ? [25, 18, 15, 12, 10, 8, 6, 4, 2, 1][index] : "0",
    Driver: {
      driverId: driver.name.toLowerCase().replace(/\s+/g, '_'),
      permanentNumber: driver.number,
      code: driver.name.split(' ').map(n => n[0]).join(''),
      url: `http://en.wikipedia.org/wiki/${driver.name.replace(/\s+/g, '_')}`,
      givenName: driver.name.split(' ')[0],
      familyName: driver.name.split(' ')[1],
      dateOfBirth: "1990-01-01",
      nationality: driver.nationality
    },
    Constructor: {
      constructorId: driver.team.toLowerCase().replace(/\s+/g, '_'),
      url: `http://en.wikipedia.org/wiki/${driver.team.replace(/\s+/g, '_')}`,
      name: driver.team,
      nationality: driver.nationality
    },
    grid: (index + 1).toString(),
    laps: "50",
    time: index === 0 ? { millis: "5400000", time: "1:30:00.000" } : null,
    status: "Finished"
  }));
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint') || 'races';
  const year = searchParams.get('year');
  const round = searchParams.get('round');
  const limit = searchParams.get('limit') || '1000';

  try {
    let apiUrl = `${ERGAST_API_BASE}`;
    
    // APIエンドポイントを構築
    if (year) {
      apiUrl += `/${year}`;
    }
    
    if (round) {
      apiUrl += `/${round}`;
    }
    
    switch (endpoint) {
      case 'races':
        apiUrl += '/races';
        break;
      case 'drivers':
        apiUrl += '/drivers';
        break;
      case 'driverStandings':
        apiUrl += '/driverStandings';
        break;
      case 'constructorStandings':
        apiUrl += '/constructorStandings';
        break;
      case 'results':
        apiUrl = `${ERGAST_API_BASE}/${year}/${round}/results`;
        break;
      case 'qualifying':
        apiUrl = `${ERGAST_API_BASE}/${year}/${round}/qualifying`;
        break;
      case 'laps':
        apiUrl = `${ERGAST_API_BASE}/${year}/${round}/laps`;
        break;
      case 'pitstops':
        apiUrl = `${ERGAST_API_BASE}/${year}/${round}/pitstops`;
        break;
      case 'seasons':
        apiUrl = `${ERGAST_API_BASE}/seasons`;
        break;
      default:
        apiUrl += '/races';
    }
    
    apiUrl += `.json?limit=${limit}`;
    
    console.log('Fetching from Ergast API:', apiUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'rt18-formula1-website/1.0',
      },
      signal: controller.signal,
      next: { revalidate: 3600 }, // 1時間キャッシュ
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Ergast API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Ergast API data received for ${endpoint}`);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error fetching Ergast data:', error);
    
    // フォールバックデータを返す
    console.log('Returning fallback data for', endpoint, year, round);
    const fallbackData = generateFallbackData(endpoint, year || undefined, round || undefined);
    
    return NextResponse.json({
      ...fallbackData,
      _fallback: true,
      _error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
