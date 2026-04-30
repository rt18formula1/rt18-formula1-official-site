// Ergast APIデータ構造のTypeScriptインターフェース定義

export interface ErgastResponse<T> {
  MRData: {
    xmlns: string;
    series: string;
    url: string;
    limit: string;
    offset: string;
    total: string;
    RaceTable?: T;
    DriverTable?: T;
    StandingsTable?: T;
    StatusTable?: T;
    SeasonTable?: T;
  };
}

// レース情報
export interface RaceTable {
  season: string;
  round: string;
  Races: Race[];
}

export interface Race {
  season: string;
  round: string;
  url: string;
  raceName: string;
  Circuit: Circuit;
  date: string;
  time: string;
  Results?: Result[];
}

export interface Circuit {
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

export interface Result {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: Driver;
  Constructor: Constructor;
  grid: string;
  laps: string;
  time: Time;
  status: string;
}

export interface Driver {
  driverId: string;
  permanentNumber: string;
  code: string;
  url: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
}

export interface Constructor {
  constructorId: string;
  url: string;
  name: string;
  nationality: string;
}

export interface Time {
  millis: string;
  time: string;
}

// ドライバー情報
export interface DriverTable {
  season: string;
  Drivers: DriverInfo[];
}

export interface DriverInfo {
  driverId: string;
  permanentNumber: string;
  code: string;
  url: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
}

// ドライバースタンディングス
export interface DriverStandingsTable {
  season: string;
  round: string;
  DriverStandings: DriverStanding[];
}

export interface DriverStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Driver: Driver;
  Constructors: Constructor[];
}

// コンストラクタースタンディングス
export interface ConstructorStandingsTable {
  season: string;
  round: string;
  ConstructorStandings: ConstructorStanding[];
}

export interface ConstructorStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Constructor: Constructor;
}

// ラップ情報
export interface LapTable {
  season: string;
  round: string;
  Laps: Lap[];
}

export interface Lap {
  number: string;
  Timings: Timing[];
}

export interface Timing {
  driverId: string;
  position: string;
  time: string;
}

// ピットストップ情報
export interface PitStopTable {
  season: string;
  round: string;
  PitStops: PitStop[];
}

export interface PitStop {
  driverId: string;
  lap: string;
  stop: string;
  time: string;
  duration: string;
}

// ステータス情報
export interface StatusTable {
  season: string;
  round: string;
  Status: Status[];
}

export interface Status {
  statusId: string;
  count: string;
  status: string;
}

// シーズン情報
export interface SeasonTable {
  season: string;
  Seasons: SeasonInfo[];
}

export interface SeasonInfo {
  season: string;
  url: string;
}
