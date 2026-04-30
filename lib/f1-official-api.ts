// F1公式サイトAPIクライアント

export interface F1OfficialRace {
  round: number;
  name: string;
  location: string;
  country: string;
  date: string;
  url: string;
  winner?: {
    name: string;
    code: string;
    time: string;
  };
  second?: {
    name: string;
    code: string;
    time: string;
  };
  third?: {
    name: string;
    code: string;
    time: string;
  };
}

export interface F1OfficialData {
  season: number;
  races: F1OfficialRace[];
  _scraped?: boolean;
  _fallback?: boolean;
  _error?: string;
}

export class F1OfficialApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/f1-official';
  }

  // レーススケジュール取得
  async getRaceSchedule(year?: number): Promise<F1OfficialRace[]> {
    try {
      const params = new URLSearchParams();
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

      const data: F1OfficialData = await response.json();
      
      // フォールバックデータの場合は警告を表示
      if (data._fallback) {
        console.warn('Using fallback data for F1 Official:', data._error);
      }
      
      return data.races || [];
    } catch (error) {
      console.error('Error fetching F1 Official data:', error);
      throw new Error('Failed to fetch F1 Official data');
    }
  }

  // 特定のレース情報取得
  async getRace(year: number, round: number): Promise<F1OfficialRace | null> {
    try {
      const schedule = await this.getRaceSchedule(year);
      return schedule.find(race => race.round === round) || null;
    } catch (error) {
      console.error('Error fetching race:', error);
      throw new Error('Failed to fetch race');
    }
  }

  // 最新のレース情報取得
  async getLatestRace(year: number = new Date().getFullYear()): Promise<{
    race: F1OfficialRace;
    isCompleted: boolean;
  } | null> {
    try {
      const schedule = await this.getRaceSchedule(year);
      if (schedule.length === 0) return null;

      // 最新のレースを取得
      const latestRace = schedule[schedule.length - 1];
      
      // レースが完了したかどうかをチェック（winner情報があるか）
      const isCompleted = !!latestRace.winner;

      return {
        race: latestRace,
        isCompleted
      };
    } catch (error) {
      console.error('Error fetching latest race:', error);
      throw new Error('Failed to fetch latest race data');
    }
  }

  // 利用可能な年を取得
  async getAvailableYears(): Promise<number[]> {
    try {
      const currentYear = new Date().getFullYear();
      const years = [];
      // 2018年から現在までの年を生成
      for (let year = currentYear; year >= 2018; year--) {
        years.push(year);
      }
      return years;
    } catch (error) {
      console.error('Error getting available years:', error);
      return [new Date().getFullYear()];
    }
  }

  // レース結果の詳細情報を取得
  async getRaceResults(year: number, round: number): Promise<{
    winner?: F1OfficialRace['winner'];
    second?: F1OfficialRace['second'];
    third?: F1OfficialRace['third'];
  }> {
    try {
      const race = await this.getRace(year, round);
      if (!race) {
        throw new Error('Race not found');
      }

      return {
        winner: race.winner,
        second: race.second,
        third: race.third
      };
    } catch (error) {
      console.error('Error fetching race results:', error);
      throw new Error('Failed to fetch race results');
    }
  }

  // シーズン統計情報を取得
  async getSeasonStats(year?: number): Promise<{
    totalRaces: number;
    completedRaces: number;
    upcomingRaces: number;
  }> {
    try {
      const schedule = await this.getRaceSchedule(year);
      const completedRaces = schedule.filter(race => race.winner).length;
      const totalRaces = schedule.length;
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
}

// シングルトンインスタンス
export const f1OfficialApi = new F1OfficialApiClient();
