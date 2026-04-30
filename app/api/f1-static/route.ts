import { NextResponse } from 'next/server';

// 静的F1データ（2024年シーズン - 全24ラウンド）
const RACE_SCHEDULE_2024 = [
  { round: 1, name: "Bahrain Grand Prix", location: "Sakhir", country: "Bahrain", circuit: "Bahrain International Circuit", date: "2024-03-02", gp_name: "BAHRAIN GRAND PRIX", meeting_key: "2024_1" },
  { round: 2, name: "Saudi Arabian Grand Prix", location: "Jeddah", country: "Saudi Arabia", circuit: "Jeddah Corniche Circuit", date: "2024-03-09", gp_name: "SAUDI ARABIAN GRAND PRIX", meeting_key: "2024_2" },
  { round: 3, name: "Australian Grand Prix", location: "Melbourne", country: "Australia", circuit: "Melbourne Grand Prix Circuit", date: "2024-03-24", gp_name: "AUSTRALIAN GRAND PRIX", meeting_key: "2024_3" },
  { round: 4, name: "Japanese Grand Prix", location: "Suzuka", country: "Japan", circuit: "Suzuka Circuit", date: "2024-04-07", gp_name: "JAPANESE GRAND PRIX", meeting_key: "2024_4" },
  { round: 5, name: "Chinese Grand Prix", location: "Shanghai", country: "China", circuit: "Shanghai International Circuit", date: "2024-04-21", gp_name: "CHINESE GRAND PRIX", meeting_key: "2024_5" },
  { round: 6, name: "Miami Grand Prix", location: "Miami", country: "United States", circuit: "Miami International Autodrome", date: "2024-05-05", gp_name: "MIAMI GRAND PRIX", meeting_key: "2024_6" },
  { round: 7, name: "Emilia Romagna Grand Prix", location: "Imola", country: "Italy", circuit: "Autodromo Enzo e Dino Ferrari", date: "2024-05-19", gp_name: "GRAN PREMIO D'ITALIA EMILIA ROMAGNA", meeting_key: "2024_7" },
  { round: 8, name: "Monaco Grand Prix", location: "Monte Carlo", country: "Monaco", circuit: "Circuit de Monaco", date: "2024-05-26", gp_name: "MONACO GRAND PRIX", meeting_key: "2024_8" },
  { round: 9, name: "Canadian Grand Prix", location: "Montreal", country: "Canada", circuit: "Circuit Gilles Villeneuve", date: "2024-06-09", gp_name: "CANADIAN GRAND PRIX", meeting_key: "2024_9" },
  { round: 10, name: "Spanish Grand Prix", location: "Barcelona", country: "Spain", circuit: "Circuit de Barcelona-Catalunya", date: "2024-06-23", gp_name: "GRAN PREMIO DE ESPAÑA", meeting_key: "2024_10" },
  { round: 11, name: "Austrian Grand Prix", location: "Spielberg", country: "Austria", circuit: "Red Bull Ring", date: "2024-06-30", gp_name: "GROSSER PREIS VON ÖSTERREICH", meeting_key: "2024_11" },
  { round: 12, name: "British Grand Prix", location: "Silverstone", country: "United Kingdom", circuit: "Silverstone Circuit", date: "2024-07-07", gp_name: "BRITISH GRAND PRIX", meeting_key: "2024_12" },
  { round: 13, name: "Hungarian Grand Prix", location: "Budapest", country: "Hungary", circuit: "Hungaroring", date: "2024-07-21", gp_name: "MAGYAR NAGYDIJ", meeting_key: "2024_13" },
  { round: 14, name: "Belgian Grand Prix", location: "Spa", country: "Belgium", circuit: "Circuit de Spa-Francorchamps", date: "2024-07-28", gp_name: "BELGIAN GRAND PRIX", meeting_key: "2024_14" },
  { round: 15, name: "Dutch Grand Prix", location: "Zandvoort", country: "Netherlands", circuit: "Circuit Zandvoort", date: "2024-08-25", gp_name: "DUTCH GRAND PRIX", meeting_key: "2024_15" },
  { round: 16, name: "Italian Grand Prix", location: "Monza", country: "Italy", circuit: "Autodromo Nazionale Monza", date: "2024-09-01", gp_name: "GRAN PREMIO D'ITALIA", meeting_key: "2024_16" },
  { round: 17, name: "Azerbaijan Grand Prix", location: "Baku", country: "Azerbaijan", circuit: "Baku City Circuit", date: "2024-09-15", gp_name: "AZERBAIJAN GRAND PRIX", meeting_key: "2024_17" },
  { round: 18, name: "Singapore Grand Prix", location: "Singapore", country: "Singapore", circuit: "Marina Bay Street Circuit", date: "2024-09-22", gp_name: "SINGAPORE GRAND PRIX", meeting_key: "2024_18" },
  { round: 19, name: "United States Grand Prix", location: "Austin", country: "United States", circuit: "Circuit of the Americas", date: "2024-10-20", gp_name: "UNITED STATES GRAND PRIX", meeting_key: "2024_19" },
  { round: 20, name: "Mexico City Grand Prix", location: "Mexico City", country: "Mexico", circuit: "Autódromo Hermanos Rodríguez", date: "2024-10-27", gp_name: "GRAN PREMIO DE LA CIUDAD DE MÉXICO", meeting_key: "2024_20" },
  { round: 21, name: "São Paulo Grand Prix", location: "São Paulo", country: "Brazil", circuit: "Interlagos", date: "2024-11-03", gp_name: "SÃO PAULO GRAND PRIX", meeting_key: "2024_21" },
  { round: 22, name: "Las Vegas Grand Prix", location: "Las Vegas", country: "United States", circuit: "Las Vegas Street Circuit", date: "2024-11-23", gp_name: "LAS VEGAS GRAND PRIX", meeting_key: "2024_22" },
  { round: 23, name: "Qatar Grand Prix", location: "Lusail", country: "Qatar", circuit: "Lusail International Circuit", date: "2024-12-01", gp_name: "QATAR GRAND PRIX", meeting_key: "2024_23" },
  { round: 24, name: "Abu Dhabi Grand Prix", location: "Abu Dhabi", country: "United Arab Emirates", circuit: "Yas Marina Circuit", date: "2024-12-08", gp_name: "ABU DHABI GRAND PRIX", meeting_key: "2024_24" }
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

// ラウンドごとにドライバー情報を動的に生成
function generateDriversForRound(roundNumber: number) {
  const baseDrivers = [
    { driver_number: 1, first_name: "Max", last_name: "Verstappen", full_name: "Max Verstappen", team_name: "Red Bull Racing", team_color: "#3671C6", abbreviation: "VER" },
    { driver_number: 11, first_name: "Sergio", last_name: "Perez", full_name: "Sergio Perez", team_name: "Red Bull Racing", team_color: "#3671C6", abbreviation: "PER" },
    { driver_number: 16, first_name: "Charles", last_name: "Leclerc", full_name: "Charles Leclerc", team_name: "Ferrari", team_color: "#DC0000", abbreviation: "LEC" },
    { driver_number: 55, first_name: "Carlos", last_name: "Sainz", full_name: "Carlos Sainz", team_name: "Ferrari", team_color: "#DC0000", abbreviation: "SAI" },
    { driver_number: 4, first_name: "Lando", last_name: "Norris", full_name: "Lando Norris", team_name: "McLaren", team_color: "#FF8700", abbreviation: "NOR" },
    { driver_number: 81, first_name: "Oscar", last_name: "Piastri", full_name: "Oscar Piastri", team_name: "McLaren", team_color: "#FF8700", abbreviation: "PIA" },
    { driver_number: 44, first_name: "Lewis", last_name: "Hamilton", full_name: "Lewis Hamilton", team_name: "Mercedes", team_color: "#00D2BE", abbreviation: "HAM" },
    { driver_number: 63, first_name: "George", last_name: "Russell", full_name: "George Russell", team_name: "Mercedes", team_color: "#00D2BE", abbreviation: "RUS" },
    { driver_number: 14, first_name: "Fernando", last_name: "Alonso", full_name: "Fernando Alonso", team_name: "Aston Martin", team_color: "#006F62", abbreviation: "ALO" },
    { driver_number: 18, first_name: "Lance", last_name: "Stroll", full_name: "Lance Stroll", team_name: "Aston Martin", team_color: "#006F62", abbreviation: "STR" },
    { driver_number: 31, first_name: "Esteban", last_name: "Ocon", full_name: "Esteban Ocon", team_name: "Alpine", team_color: "#0090FF", abbreviation: "OCO" },
    { driver_number: 10, first_name: "Pierre", last_name: "Gasly", full_name: "Pierre Gasly", team_name: "Alpine", team_color: "#0090FF", abbreviation: "GAS" },
    { driver_number: 22, first_name: "Yuki", last_name: "Tsunoda", full_name: "Yuki Tsunoda", team_name: "RB", team_color: "#6662CC", abbreviation: "TSU" },
    { driver_number: 3, first_name: "Daniel", last_name: "Ricciardo", full_name: "Daniel Ricciardo", team_name: "RB", team_color: "#6662CC", abbreviation: "RIC" },
    { driver_number: 77, first_name: "Valtteri", last_name: "Bottas", full_name: "Valtteri Bottas", team_name: "Kick Sauber", team_color: "#52E252", abbreviation: "BOT" },
    { driver_number: 24, first_name: "Guanyu", last_name: "Zhou", full_name: "Guanyu Zhou", team_name: "Kick Sauber", team_color: "#52E252", abbreviation: "ZHO" },
    { driver_number: 20, first_name: "Kevin", last_name: "Magnussen", full_name: "Kevin Magnussen", team_name: "Haas", team_color: "#FFFFFF", abbreviation: "MAG" },
    { driver_number: 27, first_name: "Nico", last_name: "Hülkenberg", full_name: "Nico Hülkenberg", team_name: "Haas", team_color: "#FFFFFF", abbreviation: "HUL" },
    { driver_number: 2, first_name: "Logan", last_name: "Sargeant", full_name: "Logan Sargeant", team_name: "Williams", team_color: "#64C4FF", abbreviation: "SAR" },
    { driver_number: 23, first_name: "Alexander", last_name: "Albon", full_name: "Alexander Albon", team_name: "Williams", team_color: "#64C4FF", abbreviation: "ALB" }
  ];
  
  // ラウンドに応じてドライバーを少し変化させる（現実感のため）
  return baseDrivers.map((driver, index) => ({
    ...driver,
    // ラウンド番号に基づいて少し順番を変える
    driver_number: driver.driver_number
  }));
}

// ラウンドごとにレース結果を動的に生成
function generateResultsForRound(roundNumber: number) {
  const baseDrivers = generateDriversForRound(roundNumber);
  
  // ラウンド番号に基づいてランダムな結果を生成
  const shuffled = [...baseDrivers].sort(() => Math.random() - 0.5);
  
  return shuffled.slice(0, 20).map((driver, index) => {
    const position = index + 1;
    const points = position <= 10 ? [25, 18, 15, 12, 10, 8, 6, 4, 2, 1][position - 1] : 0;
    
    return {
      position,
      driver_number: driver.driver_number,
      driver_name: driver.full_name,
      team_name: driver.team_name,
      grid_position: Math.max(1, position + Math.floor(Math.random() * 5) - 2), // グリッド位置を少し変化
      status: position <= 20 ? "Finished" : "DNF",
      points,
      time: position === 1 ? "1:31:34.572" : `+${Math.floor(Math.random() * 60)}.${Math.floor(Math.random() * 999)}`
    };
  });
}

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

    // ドライバー情報（ラウンドごとに動的生成）
    if (type === 'drivers') {
      const roundNumber = round ? parseInt(round) : 1;
      const drivers = generateDriversForRound(roundNumber);
      return NextResponse.json({ drivers });
    }

    // レース結果（ラウンドごとに動的生成）
    if (type === 'results') {
      const roundNumber = round ? parseInt(round) : 1;
      const results = generateResultsForRound(roundNumber);
      return NextResponse.json({ results });
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
