// Ergast APIクライアント
import type { 
  ErgastResponse, 
  RaceTable, 
  DriverTable, 
  DriverStandingsTable,
  Race,
  Driver,
  Result,
  Constructor
} from '@/lib/ergast-types';

// 型を再エクスポート
export type { Race, Driver, Result, Constructor };

export class ErgastApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/f1-ergast';
  }

  // レーススケジュール取得
  async getRaceSchedule(year?: number): Promise<Race[]> {
    try {
      const params = new URLSearchParams();
      params.append('endpoint', 'races');
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

      const data: ErgastResponse<RaceTable> & { _fallback?: boolean; _error?: string } = await response.json();
      
      // フォールバックデータの場合は警告を表示
      if (data._fallback) {
        console.warn('Using fallback data for race schedule:', data._error);
      }
      
      return data.MRData.RaceTable?.Races || [];
    } catch (error) {
      console.error('Error fetching race schedule:', error);
      throw new Error('Failed to fetch race schedule');
    }
  }

  // ドライバー情報取得
  async getDrivers(year?: number): Promise<Driver[]> {
    try {
      const params = new URLSearchParams();
      params.append('endpoint', 'drivers');
      if (year) params.append('year', year.toString());

      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: ErgastResponse<DriverTable> = await response.json();
      return data.MRData.DriverTable?.Drivers || [];
    } catch (error) {
      console.error('Error fetching drivers:', error);
      throw new Error('Failed to fetch drivers');
    }
  }

  // レース結果取得
  async getRaceResults(year: number, round: number): Promise<Result[]> {
    try {
      const params = new URLSearchParams();
      params.append('endpoint', 'results');
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

      const data: ErgastResponse<RaceTable> = await response.json();
      const races = data.MRData.RaceTable?.Races || [];
      return races[0]?.Results || [];
    } catch (error) {
      console.error('Error fetching race results:', error);
      throw new Error('Failed to fetch race results');
    }
  }

  // ドライバースタンディングス取得
  async getDriverStandings(year?: number, round?: number): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      params.append('endpoint', 'driverStandings');
      if (year) params.append('year', year.toString());
      if (round) params.append('round', round.toString());

      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        next: { revalidate: 1800 },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: ErgastResponse<DriverStandingsTable> = await response.json();
      return data.MRData.StandingsTable?.DriverStandings || [];
    } catch (error) {
      console.error('Error fetching driver standings:', error);
      throw new Error('Failed to fetch driver standings');
    }
  }

  // コンストラクタースタンディングス取得
  async getConstructorStandings(year?: number, round?: number): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      params.append('endpoint', 'constructorStandings');
      if (year) params.append('year', year.toString());
      if (round) params.append('round', round.toString());

      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        next: { revalidate: 1800 },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: ErgastResponse<any> = await response.json();
      return data.MRData.StandingsTable?.ConstructorStandings || [];
    } catch (error) {
      console.error('Error fetching constructor standings:', error);
      throw new Error('Failed to fetch constructor standings');
    }
  }

  // 利用可能なシーズン一覧取得
  async getSeasons(): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      params.append('endpoint', 'seasons');

      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        next: { revalidate: 86400 }, // 24時間キャッシュ
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: ErgastResponse<any> = await response.json();
      return data.MRData.SeasonTable?.Seasons || [];
    } catch (error) {
      console.error('Error fetching seasons:', error);
      throw new Error('Failed to fetch seasons');
    }
  }

  // 特定のレース情報取得
  async getRace(year: number, round: number): Promise<Race | null> {
    try {
      const schedule = await this.getRaceSchedule(year);
      return schedule.find(race => race.round === round.toString()) || null;
    } catch (error) {
      console.error('Error fetching race:', error);
      throw new Error('Failed to fetch race');
    }
  }

  // 最新のレース情報取得
  async getLatestRace(year: number = new Date().getFullYear()): Promise<{
    race: Race;
    results: Result[];
    drivers: Driver[];
  } | null> {
    try {
      const schedule = await this.getRaceSchedule(year);
      if (schedule.length === 0) return null;

      // 最新のレースを取得（完了したレース）
      const latestRace = schedule[schedule.length - 1];
      
      const [results] = await Promise.all([
        this.getRaceResults(year, parseInt(latestRace.round)),
      ]);

      return {
        race: latestRace,
        results,
        drivers: [], // ドライバー情報は結果から取得可能
      };
    } catch (error) {
      console.error('Error fetching latest race:', error);
      throw new Error('Failed to fetch latest race data');
    }
  }
}

// シングルトンインスタンス
export const ergastApi = new ErgastApiClient();
