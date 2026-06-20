const OPENF1_BASE = "https://openf1.org/v1";

const SESSION_NAME_MAP: Record<string, string> = {
  "SPRINT QUALIFYING": "Sprint Qualifying",
  SPRINT: "Sprint",
  QUALIFYING: "Qualifying",
  RACE: "Race",
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function formatDriverName(fullName: string): string {
  return fullName
    .split(" ")
    .map((part, i) => (i === 0 ? part : part.charAt(0) + part.slice(1).toLowerCase()))
    .join(" ");
}

async function fetchOpenF1<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${OPENF1_BASE}/${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json", "User-Agent": "rt18-formula1-website/1.0" },
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`OpenF1 API error: ${response.status}`);
  return response.json();
}

export async function findOpenF1MeetingKey(year: number, raceName: string): Promise<number | null> {
  const meetings = await fetchOpenF1<
    Array<{
      meeting_key: number;
      meeting_name: string;
      country_name: string;
      location: string;
    }>
  >("meetings", { year: String(year) });

  const requested = normalizeText(raceName);
  const skip = new Set(["formula", "grand", "prix", "gran", "premio", "the", "aws", "aramco"]);

  for (const meeting of meetings) {
    const name = normalizeText(meeting.meeting_name || "");
    if (name && (requested.includes(name) || name.includes(requested.slice(-12)))) {
      return meeting.meeting_key;
    }
  }

  const tokens = raceName
    .toLowerCase()
    .replace(/formula\s*1/gi, "")
    .split(/[\s-]+/)
    .map((t) => t.replace(/[^a-z]/g, ""))
    .filter((t) => t.length > 2 && !skip.has(t));

  let best: { key: number; score: number } | null = null;
  for (const meeting of meetings) {
    const hay = `${meeting.meeting_name} ${meeting.country_name} ${meeting.location}`.toLowerCase();
    const score = tokens.filter((t) => hay.includes(t)).length;
    if (score > 0 && (!best || score > best.score)) {
      best = { key: meeting.meeting_key, score };
    }
  }

  return best?.key ?? null;
}

export async function findOpenF1SessionKey(
  meetingKey: number,
  sessionLabel: string,
  calendarStartTime?: string
): Promise<number | null> {
  const sessionName = SESSION_NAME_MAP[sessionLabel.toUpperCase()] || sessionLabel;
  const sessions = await fetchOpenF1<
    Array<{ session_key: number; session_name: string; date_start: string; is_cancelled: boolean }>
  >("sessions", { meeting_key: String(meetingKey) });

  const candidates = sessions.filter((s) => s.session_name === sessionName && !s.is_cancelled);
  if (candidates.length === 0) return null;
  if (candidates.length === 1 || !calendarStartTime) return candidates[0].session_key;

  const target = new Date(calendarStartTime).getTime();
  candidates.sort(
    (a, b) =>
      Math.abs(new Date(a.date_start).getTime() - target) -
      Math.abs(new Date(b.date_start).getTime() - target)
  );
  return candidates[0].session_key;
}

export interface OpenF1SessionResult {
  grandPrix: string;
  sessionLabel: string;
  results: string[];
  notes: string | null;
}

export async function fetchOpenF1SessionResults(
  sessionKey: number,
  grandPrix: string,
  sessionLabel: string
): Promise<OpenF1SessionResult | null> {
  const [results, drivers] = await Promise.all([
    fetchOpenF1<
      Array<{
        position: number;
        driver_number: number;
        dnf: boolean;
        dns: boolean;
        dsq: boolean;
      }>
    >("session_result", { session_key: String(sessionKey) }),
    fetchOpenF1<Array<{ driver_number: number; full_name: string }>>("drivers", {
      session_key: String(sessionKey),
    }),
  ]);

  if (!Array.isArray(results) || results.length === 0) return null;

  const driverMap = new Map(
    drivers.map((d) => [d.driver_number, formatDriverName(d.full_name)])
  );

  const sorted = [...results].sort((a, b) => a.position - b.position);
  const resultLines = sorted.map((r) => {
    const name = driverMap.get(r.driver_number) || `Driver ${r.driver_number}`;
    return `P${r.position}: ${name}`;
  });

  const notes = sorted
    .filter((r) => r.dnf || r.dns || r.dsq)
    .map((r) => {
      const name = driverMap.get(r.driver_number) || `Driver ${r.driver_number}`;
      const status = r.dsq ? "Disqualified" : r.dns ? "Did not start" : "Did not finish";
      return `${name}: ${status}`;
    })
    .join("\n");

  return {
    grandPrix,
    sessionLabel,
    results: resultLines,
    notes: notes || null,
  };
}

export async function fetchOpenF1ResultForRace(
  year: number,
  raceName: string,
  sessionLabel: string,
  calendarStartTime?: string
): Promise<OpenF1SessionResult | null> {
  const meetingKey = await findOpenF1MeetingKey(year, raceName);
  if (!meetingKey) return null;

  const sessionKey = await findOpenF1SessionKey(meetingKey, sessionLabel, calendarStartTime);
  if (!sessionKey) return null;

  return fetchOpenF1SessionResults(sessionKey, raceName, sessionLabel);
}

export interface OpenF1MeetingRow {
  meeting_key: number;
  meeting_name: string;
  meeting_code: string;
  year: number;
  date_start: string;
  country_name: string;
  location: string;
  gmt_offset: string;
}

export interface OpenF1SessionRow {
  session_key: number;
  session_name: string;
  date_start: string;
  gmt_offset: string;
  is_cancelled: boolean;
  meeting_key: number;
}

export interface OpenF1ResultRow {
  position: number;
  driver_number: number;
  full_name?: string;
  team_name?: string;
  dnf: boolean;
  dns: boolean;
  dsq: boolean;
}

export interface OpenF1DriverRow {
  driver_number: number;
  broadcast_name?: string;
  name_acronym?: string;
  full_name?: string;
}

export async function getMeetings(year: number): Promise<OpenF1MeetingRow[]> {
  return fetchOpenF1<OpenF1MeetingRow>("meetings", { year: String(year) });
}

export async function getSessions(meetingKey: number): Promise<OpenF1SessionRow[]> {
  return fetchOpenF1<OpenF1SessionRow>("sessions", { meeting_key: String(meetingKey) });
}

export async function getResultRows(sessionKey: number): Promise<OpenF1ResultRow[]> {
  return fetchOpenF1<OpenF1ResultRow>("session_result", { session_key: String(sessionKey) });
}

export async function getDriverRows(sessionKey: number): Promise<OpenF1DriverRow[]> {
  return fetchOpenF1<OpenF1DriverRow>("drivers", { session_key: String(sessionKey) });
}
