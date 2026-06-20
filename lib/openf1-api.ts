const OPENF1_BASE = 'https://api.openf1.org/v1';

export interface OpenF1Meeting {
  meeting_key: number;
  meeting_code: string;
  meeting_name: string;
  country_name: string;
  country_code: string;
  circuit_key: number;
  circuit_short_name: string;
  date_start: string;
  gmt_offset: string;
}

export interface OpenF1Session {
  session_key: number;
  meeting_key: number;
  session_name: string;
  date_start: string;
  date_end: string;
  gmt_offset: string;
}

export interface OpenF1ResultRow {
  position: number;
  driver_number: number;
  full_name: string;
  name_acronym: string;
  team_name: string;
  points: number;
  status: string;
  time: string;
}

export interface OpenF1Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
}

export class OpenF1Client {
  async getMeetings(year?: number): Promise<OpenF1Meeting[]> {
    const url = year ? `${OPENF1_BASE}/meetings?year=${year}` : `${OPENF1_BASE}/meetings`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'rt18-formula1-official-site/1.0' },
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`OpenF1 meetings failed: ${response.status}`);
    return response.json();
  }

  async getSessions(meetingKey: number): Promise<OpenF1Session[]> {
    const response = await fetch(`${OPENF1_BASE}/sessions?meeting_key=${meetingKey}`, {
      headers: { 'User-Agent': 'rt18-formula1-official-site/1.0' },
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`OpenF1 sessions failed: ${response.status}`);
    return response.json();
  }

  async getDrivers(sessionKey: number): Promise<OpenF1Driver[]> {
    const response = await fetch(`${OPENF1_BASE}/drivers?session_key=${sessionKey}`, {
      headers: { 'User-Agent': 'rt18-formula1-official-site/1.0' },
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`OpenF1 drivers failed: ${response.status}`);
    return response.json();
  }

  async getResults(sessionKey: number): Promise<OpenF1ResultRow[]> {
    const response = await fetch(`${OPENF1_BASE}/results?session_key=${sessionKey}`, {
      headers: { 'User-Agent': 'rt18-formula1-official-site/1.0' },
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`OpenF1 results failed: ${response.status}`);
    return response.json();
  }

  async getMeetingByRound(year: number, round: number): Promise<OpenF1Meeting | null> {
    const meetings = await this.getMeetings(year);
    return meetings.find((m) => String(m.meeting_code) === String(round)) || null;
  }
}

export const openf1Api = new OpenF1Client();
