// FastF1 APIクライアント（Pythonスクリプト経由）

export interface FastF1Race {
  round: number;
  name: string;
  location: string;
  country: string;
  circuit: string;
  date: string | null;
  gp_name: string;
  meeting_key: string;
}

export interface FastF1Driver {
  driver_number: number;
  first_name: string;
  last_name: string;
  full_name: string;
  team_name: string;
  team_color: string | null;
  abbreviation: string | null;
}

export interface FastF1Result {
  position: number;
  driver_number: number;
  driver_name: string;
  team_name: string;
  grid_position: number;
  status: string;
  points: number;
  time: string | null;
}

export interface FastF1ScheduleResponse {
  races: FastF1Race[];
}

export interface FastF1DriversResponse {
  drivers: FastF1Driver[];
}

export interface FastF1ResultsResponse {
  results: FastF1Result[];
}

export class FastF1ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/f1-fast';
  }

  async getRaceSchedule(year?: number): Promise<FastF1Race[]> {
    try {
      const params = new URLSearchParams();
      params.append('type', 'schedule');
      if (year) params.append('year', year.toString());

      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        next: { revalidate: 3600 }, // 1時間キャッシュ
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: FastF1ScheduleResponse = await response.json();
      return data.races;
    } catch (error) {
      console.error('Error fetching race schedule:', error);
      throw new Error('Failed to fetch race schedule');
    }
  }

  async getDrivers(year: number, round: number): Promise<FastF1Driver[]> {
    try {
      const params = new URLSearchParams();
      params.append('type', 'drivers');
      params.append('year', year.toString());
      params.append('round', round.toString());

      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        next: { revalidate: 1800 }, // 30分キャッシュ
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: FastF1DriversResponse = await response.json();
      return data.drivers;
    } catch (error) {
      console.error('Error fetching drivers:', error);
      throw new Error('Failed to fetch drivers');
    }
  }

  async getRaceResults(year: number, round: number): Promise<FastF1Result[]> {
    try {
      const params = new URLSearchParams();
      params.append('type', 'results');
      params.append('year', year.toString());
      params.append('round', round.toString());

      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        next: { revalidate: 1800 }, // 30分キャッシュ
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: FastF1ResultsResponse = await response.json();
      return data.results;
    } catch (error) {
      console.error('Error fetching race results:', error);
      throw new Error('Failed to fetch race results');
    }
  }

  async getLatestRace(year: number = new Date().getFullYear()): Promise<{
    race: FastF1Race;
    drivers: FastF1Driver[];
    results: FastF1Result[];
  } | null> {
    try {
      const races = await this.getRaceSchedule(year);
      if (races.length === 0) return null;

      // 最新のレースを取得
      const latestRace = races[races.length - 1];
      
      const [drivers, results] = await Promise.all([
        this.getDrivers(year, latestRace.round),
        this.getRaceResults(year, latestRace.round),
      ]);

      return {
        race: latestRace,
        drivers,
        results,
      };
    } catch (error) {
      console.error('Error fetching latest race:', error);
      throw new Error('Failed to fetch latest race data');
    }
  }
}

// シングルトンインスタンス
export const fastF1Api = new FastF1ApiClient();
