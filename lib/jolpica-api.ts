// Jolpica F1 APIクライアント

export interface RaceResult {
  position: number;
  name: string;
  code: string;
  time: string;
  points: number;
  team: string;
}

export interface F1OfficialRace {
  round: number;
  name: string;
  location: string;
  country: string;
  date: string;
  url: string;
  results?: RaceResult[];
}

export interface F1OfficialData {
  season: number;
  races: F1OfficialRace[];
  _scraped?: boolean;
  _fallback?: boolean;
  _error?: string;
}

class JolpicaApiClient {
  private baseUrl = 'https://api.jolpi.ca/ergast/f1';

  async fetchRaceSchedule(year?: number): Promise<F1OfficialData> {
    try {
      const targetYear = year || new Date().getFullYear();
      const response = await fetch(`/api/f1-jolpica?year=${targetYear}&type=schedule`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching Jolpica race schedule:', error);
      throw error;
    }
  }

  async fetchDriverStandings(year?: number): Promise<any> {
    try {
      const targetYear = year || new Date().getFullYear();
      const response = await fetch(`/api/f1-jolpica?year=${targetYear}&type=drivers`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching driver standings:', error);
      throw error;
    }
  }

  async fetchConstructorStandings(year?: number): Promise<any> {
    try {
      const targetYear = year || new Date().getFullYear();
      const response = await fetch(`/api/f1-jolpica?year=${targetYear}&type=constructors`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching constructor standings:', error);
      throw error;
    }
  }

  async fetchQualifyingResults(year?: number, round?: number): Promise<any> {
    try {
      const targetYear = year || new Date().getFullYear();
      const url = round 
        ? `/api/f1-jolpica?year=${targetYear}&round=${round}&type=qualifying`
        : `/api/f1-jolpica?year=${targetYear}&type=qualifying`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching qualifying results:', error);
      throw error;
    }
  }

  async fetchCircuits(): Promise<any> {
    try {
      const response = await fetch('/api/f1-jolpica?type=circuits');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching circuits:', error);
      throw error;
    }
  }

  async fetchDrivers(): Promise<any> {
    try {
      const response = await fetch('/api/f1-jolpica?type=drivers-info');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching drivers:', error);
      throw error;
    }
  }

  async fetchConstructors(): Promise<any> {
    try {
      const response = await fetch('/api/f1-jolpica?type=constructors-info');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching constructors:', error);
      throw error;
    }
  }

  async fetchLapTimes(year: number, round: number): Promise<any> {
    try {
      const response = await fetch(`/api/f1-jolpica?year=${year}&round=${round}&type=laps`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching lap times:', error);
      throw error;
    }
  }

  async fetchPitStops(year: number, round: number): Promise<any> {
    try {
      const response = await fetch(`/api/f1-jolpica?year=${year}&round=${round}&type=pitstops`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching pit stops:', error);
      throw error;
    }
  }

  async fetchSessionResults(year: number, round: number, session: string): Promise<any> {
    try {
      const response = await fetch(`/api/f1-jolpica?year=${year}&round=${round}&session=${session}&type=session`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching session results:', error);
      throw error;
    }
  }

  async getRace(year: number, round: number): Promise<F1OfficialRace | null> {
    try {
      const data = await this.fetchRaceSchedule(year);
      return data.races.find(race => race.round === round) || null;
    } catch (error) {
      console.error('Error fetching race:', error);
      throw error;
    }
  }

  async getLatestRace(year: number = new Date().getFullYear()): Promise<{
    race: F1OfficialRace;
    isCompleted: boolean;
  } | null> {
    try {
      const schedule = await this.fetchRaceSchedule(year);
      if (schedule.races.length === 0) return null;

      // 最新のレースを取得
      const latestRace = schedule.races[schedule.races.length - 1];
      
      // レースが完了したかどうかをチェック（results情報があるか）
      const isCompleted = !!(latestRace.results && latestRace.results.length > 0);

      return {
        race: latestRace,
        isCompleted
      };
    } catch (error) {
      console.error('Error fetching latest race:', error);
      throw new Error('Failed to fetch latest race data');
    }
  }

  async getRaceResults(year: number, round: number): Promise<{
    results?: RaceResult[];
  }> {
    try {
      const race = await this.getRace(year, round);
      if (!race) {
        throw new Error('Race not found');
      }

      return {
        results: race.results
      };
    } catch (error) {
      console.error('Error fetching race results:', error);
      throw new Error('Failed to fetch race results');
    }
  }

  async getAvailableYears(): Promise<number[]> {
    try {
      const currentYear = new Date().getFullYear();
      const years = [];
      // 2026年から2018年までの年を生成（未来の年も含む）
      for (let year = 2026; year >= 2018; year--) {
        years.push(year);
      }
      return years;
    } catch (error) {
      console.error('Error getting available years:', error);
      return [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];
    }
  }

  async getSeasonStats(year?: number): Promise<{
    totalRaces: number;
    completedRaces: number;
    upcomingRaces: number;
  }> {
    try {
      const schedule = await this.fetchRaceSchedule(year);
      const completedRaces = schedule.races.filter(race => race.results && race.results.length > 0).length;
      const totalRaces = schedule.races.length;
      const upcomingRaces = totalRaces - completedRaces;

      return {
        totalRaces,
        completedRaces,
        upcomingRaces
      };
    } catch (error) {
      console.error('Error fetching season stats:', error);
      throw new Error('Failed to fetch season stats');
    }
  }

  // APIのステータスを確認
  async getApiStatus(): Promise<{
    isAvailable: boolean;
    responseTime?: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      const response = await fetch(`${this.baseUrl}/status.json`, {
        headers: {
          'User-Agent': 'F1-Official-Site/1.0'
        }
      });
      const responseTime = Date.now() - startTime;

      return {
        isAvailable: response.ok,
        responseTime,
        error: response.ok ? undefined : `HTTP ${response.status}`
      };
    } catch (error) {
      return {
        isAvailable: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const jolpicaApi = new JolpicaApiClient();
