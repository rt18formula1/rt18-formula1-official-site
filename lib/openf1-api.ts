import axios from 'axios';

// OpenF1 APIのベースURL
const OPENF1_API_BASE_URL = 'https://api.openf1.org/v1';

// OpenF1 APIのレスポンスタイプ定義
export interface OpenF1Driver {
  broadcast_name: string;
  driver_number: number;
  first_name: string;
  full_name: string;
  headshot_url: string;
  last_name: string;
  meeting_key: number;
  name_acronym: string;
  session_key: number;
  team_colour: string;
  team_name: string;
}

export interface OpenF1Session {
  circuit_key: number;
  circuit_short_name: string;
  country_code: string;
  country_key: number;
  country_name: string;
  date_end: string;
  date_start: string;
  gmt_offset: string;
  is_cancelled: boolean;
  location: string;
  meeting_key: number;
  session_key: number;
  session_name: string;
  session_type: string;
  year: number;
}

export interface OpenF1Meeting {
  circuit_key: number;
  circuit_short_name: string;
  country_code: string;
  country_key: number;
  country_name: string;
  gmt_offset: string;
  location: string;
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  year: number;
}

export interface OpenF1SessionResult {
  position: number;
  position_text: string;
  points: number;
  driver_number: number;
  session_key: number;
  meeting_key: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
}

export interface OpenF1Lap {
  driver_number: number;
  lap_duration: number;
  lap_number: number;
  session_key: number;
  meeting_key: number;
  i1_speed: number;
  i2_speed: number;
  st_speed: number;
}

export interface OpenF1Weather {
  air_temperature: number;
  humidity: number;
  meeting_key: number;
  pressure: number;
  rainfall: number;
  session_key: number;
  track_temperature: number;
  wind_direction: number;
  wind_speed: number;
}

// APIクライアントクラス
export class OpenF1ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = OPENF1_API_BASE_URL;
  }

  // ドライバー情報取得
  async getDrivers(params?: {
    driver_number?: number;
    meeting_key?: number;
    session_key?: number;
  }): Promise<OpenF1Driver[]> {
    try {
      const response = await axios.get<OpenF1Driver[]>(`${this.baseUrl}/drivers`, {
        params,
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching drivers:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout - please try again');
        } else if (error.response) {
          throw new Error(`API Error: ${error.response.status} - ${error.response.statusText}`);
        } else if (error.request) {
          throw new Error('Network error - please check your connection');
        }
      }
      throw new Error('Failed to fetch drivers data');
    }
  }

  // セッション情報取得
  async getSessions(params?: {
    country_name?: string;
    circuit_key?: number;
    meeting_key?: number;
    session_key?: number;
    session_name?: string;
    session_type?: string;
    year?: number;
  }): Promise<OpenF1Session[]> {
    try {
      const response = await axios.get<OpenF1Session[]>(`${this.baseUrl}/sessions`, {
        params,
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw new Error('Failed to fetch sessions data');
    }
  }

  // ミーティング（レースウィークエンド）情報取得
  async getMeetings(params?: {
    circuit_key?: number;
    country_key?: number;
    country_name?: string;
    meeting_key?: number;
    year?: number;
  }): Promise<OpenF1Meeting[]> {
    try {
      console.log('Fetching meetings with params:', params);
      const response = await axios.get<OpenF1Meeting[]>(`${this.baseUrl}/meetings`, {
        params,
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      console.log('Meetings response received:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Error fetching meetings:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout - please try again');
        } else if (error.response) {
          throw new Error(`API Error: ${error.response.status} - ${error.response.statusText}`);
        } else if (error.request) {
          throw new Error('Network error - please check your connection');
        }
      }
      throw new Error('Failed to fetch meetings data');
    }
  }

  // セッション結果取得
  async getSessionResults(params?: {
    session_key?: number;
    meeting_key?: number;
    driver_number?: number;
  }): Promise<OpenF1SessionResult[]> {
    try {
      const response = await axios.get<OpenF1SessionResult[]>(`${this.baseUrl}/session_results`, {
        params,
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching session results:', error);
      throw new Error('Failed to fetch session results data');
    }
  }

  // ラップタイム取得
  async getLaps(params?: {
    driver_number?: number;
    lap_number?: number;
    meeting_key?: number;
    session_key?: number;
  }): Promise<OpenF1Lap[]> {
    try {
      const response = await axios.get<OpenF1Lap[]>(`${this.baseUrl}/laps`, {
        params,
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching laps:', error);
      throw new Error('Failed to fetch laps data');
    }
  }

  // 天気情報取得
  async getWeather(params?: {
    meeting_key?: number;
    session_key?: number;
  }): Promise<OpenF1Weather[]> {
    try {
      const response = await axios.get<OpenF1Weather[]>(`${this.baseUrl}/weather`, {
        params,
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching weather:', error);
      throw new Error('Failed to fetch weather data');
    }
  }

  // 最新のレース情報を取得
  async getLatestRace(): Promise<{
    meeting: OpenF1Meeting;
    sessions: OpenF1Session[];
    drivers: OpenF1Driver[];
    results: OpenF1SessionResult[];
  } | null> {
    try {
      // 最新のミーティングを取得
      const meetings = await this.getMeetings({ year: new Date().getFullYear() });
      if (meetings.length === 0) return null;

      const latestMeeting = meetings[meetings.length - 1];
      
      // セッション情報を取得
      const sessions = await this.getSessions({ meeting_key: latestMeeting.meeting_key });
      
      // レースセッションの結果を取得
      const raceSession = sessions.find(s => s.session_type === 'Race');
      let results: OpenF1SessionResult[] = [];
      let drivers: OpenF1Driver[] = [];

      if (raceSession) {
        results = await this.getSessionResults({ session_key: raceSession.session_key });
        drivers = await this.getDrivers({ session_key: raceSession.session_key });
      }

      return {
        meeting: latestMeeting,
        sessions,
        drivers,
        results,
      };
    } catch (error) {
      console.error('Error fetching latest race:', error);
      throw new Error('Failed to fetch latest race data');
    }
  }

  // 年間のレースカレンダーを取得
  async getSeasonCalendar(year: number = new Date().getFullYear()): Promise<OpenF1Meeting[]> {
    try {
      console.log('Fetching season calendar for year:', year);
      const meetings = await this.getMeetings({ year });
      console.log('Meetings received:', meetings.length);
      return meetings;
    } catch (error) {
      console.error('Error fetching season calendar:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout - please try again');
        } else if (error.response) {
          throw new Error(`API Error: ${error.response.status} - ${error.response.statusText}`);
        } else if (error.request) {
          throw new Error('Network error - please check your connection');
        }
      }
      throw new Error('Failed to fetch season calendar');
    }
  }
}

// シングルトンインスタンス
export const openF1Api = new OpenF1ApiClient();
