import { NextResponse } from 'next/server';

// 静的F1データ（2024年シーズン）
const RACE_SCHEDULE_2024 = [
  {
    round: 1,
    name: "Bahrain Grand Prix",
    location: "Sakhir",
    country: "Bahrain",
    circuit: "Bahrain International Circuit",
    date: "2024-03-02",
    gp_name: "BAHRAIN GRAND PRIX",
    meeting_key: "2024_1"
  },
  {
    round: 2,
    name: "Saudi Arabian Grand Prix",
    location: "Jeddah",
    country: "Saudi Arabia",
    circuit: "Jeddah Corniche Circuit",
    date: "2024-03-09",
    gp_name: "SAUDI ARABIAN GRAND PRIX",
    meeting_key: "2024_2"
  },
  {
    round: 3,
    name: "Australian Grand Prix",
    location: "Melbourne",
    country: "Australia",
    circuit: "Melbourne Grand Prix Circuit",
    date: "2024-03-24",
    gp_name: "AUSTRALIAN GRAND PRIX",
    meeting_key: "2024_3"
  },
  {
    round: 4,
    name: "Japanese Grand Prix",
    location: "Suzuka",
    country: "Japan",
    circuit: "Suzuka Circuit",
    date: "2024-04-07",
    gp_name: "JAPANESE GRAND PRIX",
    meeting_key: "2024_4"
  },
  {
    round: 5,
    name: "Chinese Grand Prix",
    location: "Shanghai",
    country: "China",
    circuit: "Shanghai International Circuit",
    date: "2024-04-21",
    gp_name: "CHINESE GRAND PRIX",
    meeting_key: "2024_5"
  },
  {
    round: 6,
    name: "Miami Grand Prix",
    location: "Miami",
    country: "United States",
    circuit: "Miami International Autodrome",
    date: "2024-05-05",
    gp_name: "MIAMI GRAND PRIX",
    meeting_key: "2024_6"
  },
  {
    round: 7,
    name: "Emilia Romagna Grand Prix",
    location: "Imola",
    country: "Italy",
    circuit: "Autodromo Enzo e Dino Ferrari",
    date: "2024-05-19",
    gp_name: "GRAN PREMIO D'ITALIA EMILIA ROMAGNA",
    meeting_key: "2024_7"
  },
  {
    round: 8,
    name: "Monaco Grand Prix",
    location: "Monte Carlo",
    country: "Monaco",
    circuit: "Circuit de Monaco",
    date: "2024-05-26",
    gp_name: "MONACO GRAND PRIX",
    meeting_key: "2024_8"
  },
  {
    round: 9,
    name: "Canadian Grand Prix",
    location: "Montreal",
    country: "Canada",
    circuit: "Circuit Gilles Villeneuve",
    date: "2024-06-09",
    gp_name: "CANADIAN GRAND PRIX",
    meeting_key: "2024_9"
  },
  {
    round: 10,
    name: "Spanish Grand Prix",
    location: "Barcelona",
    country: "Spain",
    circuit: "Circuit de Barcelona-Catalunya",
    date: "2024-06-23",
    gp_name: "GRAN PREMIO DE ESPAÑA",
    meeting_key: "2024_10"
  }
];

const SAMPLE_DRIVERS = [
  {
    driver_number: 1,
    first_name: "Max",
    last_name: "Verstappen",
    full_name: "Max Verstappen",
    team_name: "Red Bull Racing",
    team_color: "#3671C6",
    abbreviation: "VER"
  },
  {
    driver_number: 11,
    first_name: "Sergio",
    last_name: "Perez",
    full_name: "Sergio Perez",
    team_name: "Red Bull Racing",
    team_color: "#3671C6",
    abbreviation: "PER"
  },
  {
    driver_number: 16,
    first_name: "Charles",
    last_name: "Leclerc",
    full_name: "Charles Leclerc",
    team_name: "Ferrari",
    team_color: "#DC0000",
    abbreviation: "LEC"
  },
  {
    driver_number: 55,
    first_name: "Carlos",
    last_name: "Sainz",
    full_name: "Carlos Sainz",
    team_name: "Ferrari",
    team_color: "#DC0000",
    abbreviation: "SAI"
  },
  {
    driver_number: 4,
    first_name: "Lando",
    last_name: "Norris",
    full_name: "Lando Norris",
    team_name: "McLaren",
    team_color: "#FF8700",
    abbreviation: "NOR"
  },
  {
    driver_number: 81,
    first_name: "Oscar",
    last_name: "Piastri",
    full_name: "Oscar Piastri",
    team_name: "McLaren",
    team_color: "#FF8700",
    abbreviation: "PIA"
  },
  {
    driver_number: 44,
    first_name: "Lewis",
    last_name: "Hamilton",
    full_name: "Lewis Hamilton",
    team_name: "Mercedes",
    team_color: "#00D2BE",
    abbreviation: "HAM"
  },
  {
    driver_number: 63,
    first_name: "George",
    last_name: "Russell",
    full_name: "George Russell",
    team_name: "Mercedes",
    team_color: "#00D2BE",
    abbreviation: "RUS"
  },
  {
    driver_number: 14,
    first_name: "Fernando",
    last_name: "Alonso",
    full_name: "Fernando Alonso",
    team_name: "Aston Martin",
    team_color: "#006F62",
    abbreviation: "ALO"
  },
  {
    driver_number: 18,
    first_name: "Lance",
    last_name: "Stroll",
    full_name: "Lance Stroll",
    team_name: "Aston Martin",
    team_color: "#006F62",
    abbreviation: "STR"
  }
];

const SAMPLE_RESULTS = [
  {
    position: 1,
    driver_number: 1,
    driver_name: "Max Verstappen",
    team_name: "Red Bull Racing",
    grid_position: 1,
    status: "Finished",
    points: 25,
    time: "1:31:34.572"
  },
  {
    position: 2,
    driver_number: 11,
    driver_name: "Sergio Perez",
    team_name: "Red Bull Racing",
    grid_position: 3,
    status: "Finished",
    points: 18,
    time: "+18.957"
  },
  {
    position: 3,
    driver_number: 16,
    driver_name: "Charles Leclerc",
    team_name: "Ferrari",
    grid_position: 2,
    status: "Finished",
    points: 15,
    time: "+22.456"
  },
  {
    position: 4,
    driver_number: 55,
    driver_name: "Carlos Sainz",
    team_name: "Ferrari",
    grid_position: 4,
    status: "Finished",
    points: 12,
    time: "+35.123"
  },
  {
    position: 5,
    driver_number: 4,
    driver_name: "Lando Norris",
    team_name: "McLaren",
    grid_position: 5,
    status: "Finished",
    points: 10,
    time: "+45.789"
  },
  {
    position: 6,
    driver_number: 81,
    driver_name: "Oscar Piastri",
    team_name: "McLaren",
    grid_position: 7,
    status: "Finished",
    points: 8,
    time: "+52.345"
  },
  {
    position: 7,
    driver_number: 44,
    driver_name: "Lewis Hamilton",
    team_name: "Mercedes",
    grid_position: 6,
    status: "Finished",
    points: 6,
    time: "+1:01.234"
  },
  {
    position: 8,
    driver_number: 63,
    driver_name: "George Russell",
    team_name: "Mercedes",
    grid_position: 8,
    status: "Finished",
    points: 4,
    time: "+1:12.567"
  },
  {
    position: 9,
    driver_number: 14,
    driver_name: "Fernando Alonso",
    team_name: "Aston Martin",
    grid_position: 9,
    status: "Finished",
    points: 2,
    time: "+1:23.890"
  },
  {
    position: 10,
    driver_number: 18,
    driver_name: "Lance Stroll",
    team_name: "Aston Martin",
    grid_position: 10,
    status: "Finished",
    points: 1,
    time: "+1:34.123"
  }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const year = searchParams.get('year');
  const round = searchParams.get('round');

  try {
    console.log(`Static F1 data request: type=${type}, year=${year}, round=${round}`);

    // レーススケジュール
    if (type === 'schedule') {
      const schedule = year === '2023' ? RACE_SCHEDULE_2024.slice(0, 5) : 
                       year === '2025' ? [...RACE_SCHEDULE_2024, ...RACE_SCHEDULE_2024.slice(0, 2)] :
                       RACE_SCHEDULE_2024;
      
      return NextResponse.json({ races: schedule });
    }

    // ドライバー情報
    if (type === 'drivers') {
      return NextResponse.json({ drivers: SAMPLE_DRIVERS });
    }

    // レース結果
    if (type === 'results') {
      return NextResponse.json({ results: SAMPLE_RESULTS });
    }

    // デフォルト：スケジュールを返す
    return NextResponse.json({ races: RACE_SCHEDULE_2024 });
    
  } catch (error) {
    console.error('Error in static F1 data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch static F1 data' },
      { status: 500 }
    );
  }
}
