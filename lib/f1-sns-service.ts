import { fetchF1CalendarSchedule, type F1CalendarSchedule } from "./calendar-service";
// openf1: low-level client, no fetchOpenF1ResultForRace
import {
  fetchResultFromOpenRouter as fetchOpenRouterResult,
  fetchScheduleFromOpenRouter,
} from "./openrouter-api";
import { scrapeF1Result, triggerToF1Page } from "./f1-official-scraper";
import { F1_2026_CALENDAR, type F1CalendarRace } from "./f1-data-constants";

const JOLPICA_API_BASE = "https://api.jolpi.ca/ergast/f1";

export type SnsTemplateType =
  | "schedule"
  | "sprint-qualifying"
  | "sprint"
  | "qualifying"
  | "race";

export interface SnsTemplateData {
  grandPrix: string;
  sessionLabel?: string;
  sessions?: Array<{
    name: string;
    date: string;
    japanDate?: string;
    trackTime: string;
    japanTime: string;
    trackTimezone?: string;
  }>;
  results?: string[];
  notes?: string | null;
}

export interface SnsTemplateResult {
  templateType: SnsTemplateType;
  grandPrix: string;
  sessionLabel?: string;
  data: SnsTemplateData;
  textOutput: string;
  provider: "google-calendar-ical" | "jolpica" | "openf1" | "openrouter" | "f1-official";
}

/** 中止レース（年 → ラウンド番号） */
export const CANCELLED_ROUNDS: Record<number, number[]> = {
  2026: [4, 5],
};

export const TEMPLATE_OPTIONS: Array<{
  type: SnsTemplateType;
  labelJa: string;
  labelEn: string;
  sessionLabel: string;
  sprintOnly?: boolean;
  nonSprintOnly?: boolean;
}> = [
  { type: "schedule", labelJa: "#インスタ定型文スケジュール", labelEn: "#Instagram Schedule", sessionLabel: "SCHEDULE" },
  { type: "sprint-qualifying", labelJa: "#インスタ定型文スプリント予選", labelEn: "#Instagram Sprint Qualifying", sessionLabel: "SPRINT QUALIFYING", sprintOnly: true },
  { type: "sprint", labelJa: "#インスタ定型文スプリント", labelEn: "#Instagram Sprint", sessionLabel: "SPRINT", sprintOnly: true },
  { type: "qualifying", labelJa: "#インスタ定型文予選", labelEn: "#Instagram Qualifying", sessionLabel: "QUALIFYING" },
  { type: "race", labelJa: "#インスタ定型文レース", labelEn: "#Instagram Race", sessionLabel: "RACE" },
];

const JOLPICA_RESULT_TYPES: SnsTemplateType[] = ["qualifying", "race", "sprint-qualifying", "sprint"];
const OPENF1_RESULT_TYPES: SnsTemplateType[] = ["sprint-qualifying", "sprint", "qualifying", "race"];
const SESSION_TO_JOLPICA: Partial<Record<SnsTemplateType, string>> = {
  qualifying: "qualifying",
  race: "race",
  sprint: "sprint",
  "sprint-qualifying": "sprint", // jolpica has no dedicated sprint-quali endpoint; quali grid comes from sprint qualifying results when available
};

const SESSION_DURATION_MS: Record<string, number> = {
  "Practice 1": 60 * 60 * 1000,
  "Practice 2": 60 * 60 * 1000,
  "Practice 3": 60 * 60 * 1000,
  "Sprint Qualifying": 60 * 60 * 1000,
  Sprint: 30 * 60 * 1000,
  Qualifying: 60 * 60 * 1000,
  Race: 2 * 60 * 60 * 1000,
};

const TEMPLATE_TO_CALENDAR_SESSION: Partial<Record<SnsTemplateType, string>> = {
  "sprint-qualifying": "Sprint Qualifying",
  sprint: "Sprint",
  qualifying: "Qualifying",
  race: "Race",
};

export function isRoundCancelled(year: number, round: number) {
  return CANCELLED_ROUNDS[year]?.includes(round) ?? false;
}

export function formatScheduleText(data: SnsTemplateData): string {
  const lines: string[] = [data.grandPrix, "", "【Schedule】", ""];
  for (const s of data.sessions ?? []) {
    lines.push(s.name);
    lines.push(`TrackTime : ${s.date} ${s.trackTime}`);
    lines.push(`JapanTime : ${s.japanDate ? s.japanDate + " " : ""}${s.japanTime}`);
    lines.push("");
  }
  const tz = data.sessions?.[0]?.trackTimezone;
  if (tz) lines.push(`TrackTime : ${tz}`);
  lines.push("JapanTime : UTC+9");
  return lines.join("\n").trim();
}

export function formatResultText(data: SnsTemplateData): string {
  const lines: string[] = [data.grandPrix];
  if (data.sessionLabel) lines.push(data.sessionLabel);
  lines.push("", "【Result】", "");
  for (const r of data.results ?? []) {
    lines.push(r);
  }
  if (data.notes) {
    lines.push("", data.notes);
  }
  return lines.join("\n").trim();
}

function scheduleToTemplate(
  schedule: F1CalendarSchedule,
  provider: SnsTemplateResult["provider"] = "google-calendar-ical"
): SnsTemplateResult {
  const data: SnsTemplateData = {
    grandPrix: schedule.grandPrix,
    sessions: schedule.sessions.map((s) => ({
      name: s.name,
      date: s.date,
      japanDate: s.japanDate,
      trackTime: s.trackTime,
      japanTime: s.japanTime,
      trackTimezone: s.trackTimezone,
    })),
    notes: schedule.notes,
  };
  return {
    templateType: "schedule",
    grandPrix: schedule.grandPrix,
    data,
    textOutput: formatScheduleText(data),
    provider,
  };
}

function normalizeRaceText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export async function resolveRaceRound(year: number, raceName: string): Promise<number> {
  try {
    const data = await fetchJolpica(`/${year}/races.json?limit=100`);
    const races = data?.MRData?.RaceTable?.Races ?? [];
    const requested = normalizeRaceText(raceName);
    const race = races.find((r: { raceName: string; round: string }) => {
      const name = normalizeRaceText(r.raceName || "");
      return requested.includes(name) || name.includes(requested.slice(-12));
    });
    return race ? parseInt(race.round, 10) : 1;
  } catch {
    return 1;
  }
}

/** F1_2026_CALENDAR からラウンド番号で内部レース定義（meetingId など）を引く */
function findCalendarRace(round: number): F1CalendarRace | undefined {
  return F1_2026_CALENDAR.find((r) => r.round === round);
}

/** formula1.com の Pos. 列テキストを "P1" のような表記に正規化する */
function normalizePosition(pos: string): string {
  const trimmed = pos.trim();
  if (/^\d+$/.test(trimmed)) return `P${trimmed}`;
  return trimmed; // "NC", "DNF", "DNS" 等はそのまま
}

async function fetchResultFromF1Official(
  year: number,
  round: number,
  templateType: SnsTemplateType,
  sessionLabel: string
): Promise<SnsTemplateResult | null> {
  const race = findCalendarRace(round);
  if (!race || !race.meetingId) return null;

  const page = triggerToF1Page(
    templateType === "sprint-qualifying" ? "sprint_qualifying" : templateType
  );
  if (!page) return null;

  const scraped = await scrapeF1Result(race, year, page);
  if (!scraped || scraped.rows.length === 0) return null;

  const results = scraped.rows.map((row) => {
    const pos = normalizePosition(row.position);
    const statusNote =
      row.timeOrRetired && /DNF|DNS|DSQ|NC/i.test(row.timeOrRetired) ? ` (${row.timeOrRetired})` : "";
    return `${pos} ${row.driverName}${statusNote}`;
  });

  const data: SnsTemplateData = {
    grandPrix: scraped.grandPrix,
    sessionLabel,
    results,
    notes: scraped.notes,
  };

  return {
    templateType,
    grandPrix: scraped.grandPrix,
    sessionLabel,
    data,
    textOutput: formatResultText(data),
    provider: "f1-official",
  };
}

async function fetchResultFromOpenRouter(
  year: number,
  raceName: string,
  templateType: SnsTemplateType,
  sessionLabel: string
): Promise<SnsTemplateResult | null> {
  const schedule = await fetchF1CalendarSchedule(raceName, year);
  const parsed = await fetchOpenRouterResult(
    schedule?.grandPrix || raceName,
    year,
    sessionLabel
  );
  if (!parsed) return null;

  const data: SnsTemplateData = {
    grandPrix: parsed.grandPrix,
    sessionLabel: parsed.sessionLabel,
    results: parsed.results,
    notes: parsed.notes,
  };

  return {
    templateType,
    grandPrix: parsed.grandPrix,
    sessionLabel: parsed.sessionLabel,
    data,
    textOutput: formatResultText(data),
    provider: "openrouter",
  };
}

async function fetchJolpica(endpoint: string) {
  const response = await fetch(`${JOLPICA_API_BASE}${endpoint}`, {
    headers: { "User-Agent": "F1-Official-Site/1.0" },
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`Jolpica API error: ${response.status}`);
  return response.json();
}

function extractResults(jolpicaData: any, sessionLabel: string): SnsTemplateData | null {
  const race = jolpicaData?.MRData?.RaceTable?.Races?.[0];
  if (!race) return null;

  const resultsKey =
    sessionLabel === "QUALIFYING"
      ? "QualifyingResults"
      : sessionLabel === "SPRINT" || sessionLabel === "SPRINT QUALIFYING"
      ? "SprintResults"
      : "Results";
  const raw = race[resultsKey];
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const results = raw.map((r: any) => {
    const name = `${r.Driver.givenName} ${r.Driver.familyName}`;
    return `P${r.position}: ${name}`;
  });

  const notes = raw
    .filter((r: any) => r.status && r.status !== "Finished" && !r.Q1)
    .map((r: any) => `${r.Driver.givenName} ${r.Driver.familyName}: ${r.status}`)
    .join("\n");

  return {
    grandPrix: race.raceName,
    sessionLabel,
    results,
    notes: notes || null,
  };
}

async function fetchResultFromOpenF1(
  year: number,
  raceName: string,
  templateType: SnsTemplateType,
  sessionLabel: string
): Promise<SnsTemplateResult | null> {
  // OpenF1 integration is a lower-level client; high-level result fetch not yet implemented.
  // F1 official scraper is the primary source; this stub keeps the fallback chain intact.
  void year; void raceName; void templateType; void sessionLabel;
  return null;
}

async function fetchResultFromJolpica(
  year: number,
  round: number,
  templateType: SnsTemplateType,
  grandPrix: string,
  sessionLabel: string
): Promise<SnsTemplateResult | null> {
  const jolpicaSession = SESSION_TO_JOLPICA[templateType];
  if (!jolpicaSession) return null;
  try {
    const data = await fetchJolpica(`/${year}/${round}/${jolpicaSession}.json?limit=100`);
    const parsed = extractResults(data, sessionLabel);
    if (!parsed) return null;
    return {
      templateType,
      grandPrix: parsed.grandPrix || grandPrix,
      sessionLabel,
      data: parsed,
      textOutput: formatResultText(parsed),
      provider: "jolpica",
    };
  } catch {
    return null;
  }
}

/**
 * メインのテンプレート生成ロジック。
 *
 * 結果（schedule 以外）の優先順位:
 *   1. F1公式サイト（formula1.com）スクレイピング — 一次情報そのもの、無料、JS実行不要
 *   2. Jolpica（Ergast後継、無料）— 公式サイトが取れない場合の構造化データソース
 *   3. OpenF1（無料・テレメトリベース）— 上記2つが失敗した場合
 *   4. OpenRouter LLM（無料モデル) — 実データが一切取れない時のみの最終手段
 */
export async function generateSnsTemplate(
  year: number,
  round: number,
  templateType: SnsTemplateType,
  raceName: string
): Promise<SnsTemplateResult | null> {
  if (templateType === "schedule") {
    const schedule = await fetchF1CalendarSchedule(raceName, year);
    if (schedule) return scheduleToTemplate(schedule);
    const llmSchedule = await fetchScheduleFromOpenRouter(raceName, year);
    if (llmSchedule) return scheduleToTemplate(llmSchedule, "openrouter");
    return null;
  }

  const option = TEMPLATE_OPTIONS.find((o) => o.type === templateType);
  if (!option) return null;

  // 1. F1公式サイト・スクレイピング（一次ソース）
  const officialResult = await fetchResultFromF1Official(year, round, templateType, option.sessionLabel);
  if (officialResult) return officialResult;

  // 2. Jolpica
  let result: SnsTemplateResult | null = null;
  if (JOLPICA_RESULT_TYPES.includes(templateType)) {
    result = await fetchResultFromJolpica(year, round, templateType, raceName, option.sessionLabel);
    if (result) return result;
  }

  // 3. OpenF1
  if (OPENF1_RESULT_TYPES.includes(templateType)) {
    result = await fetchResultFromOpenF1(year, raceName, templateType, option.sessionLabel);
    if (result) return result;
  }

  // 4. LLMフォールバック（最終手段）
  return fetchResultFromOpenRouter(year, raceName, templateType, option.sessionLabel);
}

export function getSessionEndTime(startIso: string, endIso: string | null, sessionName: string): Date {
  if (endIso) return new Date(endIso);
  const duration = SESSION_DURATION_MS[sessionName] ?? 60 * 60 * 1000;
  return new Date(new Date(startIso).getTime() + duration);
}

export function isSessionEnded(startIso: string, endIso: string | null, sessionName: string, now = new Date()): boolean {
  return getSessionEndTime(startIso, endIso, sessionName).getTime() <= now.getTime();
}

export interface EndedSession {
  templateType: SnsTemplateType;
  sessionName: string;
  endedAt: Date;
}

export async function getEndedSessionsForRace(
  year: number,
  round: number,
  raceName: string,
  now = new Date()
): Promise<EndedSession[]> {
  const schedule = await fetchF1CalendarSchedule(raceName, year);
  if (!schedule) return [];

  const ended: EndedSession[] = [];
  const isSprint = schedule.isSprintWeekend;

  for (const session of schedule.sessions) {
    if (!isSessionEnded(session.startTime, session.endTime, session.name, now)) continue;

    let templateType: SnsTemplateType | null = null;
    if (session.name === "Sprint Qualifying" && isSprint) templateType = "sprint-qualifying";
    else if (session.name === "Sprint" && isSprint) templateType = "sprint";
    else if (session.name === "Qualifying") templateType = "qualifying";
    else if (session.name === "Race") templateType = "race";

    if (templateType) {
      ended.push({
        templateType,
        sessionName: session.name,
        endedAt: getSessionEndTime(session.startTime, session.endTime, session.name),
      });
    }
  }

  return ended;
}

export function isTemplateAvailable(
  templateType: SnsTemplateType,
  isSprintWeekend: boolean,
  calendarSessions: F1CalendarSchedule["sessions"] | undefined,
  now = new Date()
): boolean {
  if (templateType === "schedule") return true;
  const option = TEMPLATE_OPTIONS.find((o) => o.type === templateType);
  if (!option) return false;
  if (option.sprintOnly && !isSprintWeekend) return false;
  if (option.nonSprintOnly && isSprintWeekend) return false;

  const sessionName = TEMPLATE_TO_CALENDAR_SESSION[templateType];
  if (!sessionName || !calendarSessions) return false;
  const session = calendarSessions.find((s) => s.name === sessionName);
  if (!session) return false;

  return isSessionEnded(session.startTime, session.endTime, session.name, now);
}

export async function syncEndedSessionsForYear(year: number, now = new Date()) {
  // Use local calendar data instead of Jolpica (which is unstable/beta)
  const calendarRaces = F1_2026_CALENDAR.filter((r) => !r.cancelled);

  const toFetch: Array<{ year: number; round: number; raceName: string; templateType: SnsTemplateType }> = [];

  for (const race of calendarRaces) {
    if (isRoundCancelled(year, race.round)) continue;

    // Also queue schedule for past races (use raceStartLocal + utcOffset to build a UTC date)
    // raceDate is like "Mar 8" - parse via calendar sessions instead; use a simple heuristic:
    // If any session startTime in the calendar is in the past, treat as past race.
    const endedSessions = await getEndedSessionsForRace(year, race.round, race.officialName, now);
    const isPastRace = endedSessions.some((s) => s.sessionName === "Race");
    if (isPastRace) {
      toFetch.push({ year, round: race.round, raceName: race.officialName, templateType: "schedule" });
    }

    const ended = endedSessions;
    for (const e of ended) {
      const bufferMs = 30 * 60 * 1000;
      if (now.getTime() - e.endedAt.getTime() > 7 * 24 * 60 * 60 * 1000) continue;
      if (now.getTime() - e.endedAt.getTime() < bufferMs) continue;

      toFetch.push({ year, round: race.round, raceName: race.officialName, templateType: e.templateType });
    }
  }

  return toFetch;
}
