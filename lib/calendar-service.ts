import ical from "ical.js";
import type { DbEvent } from "./supabase-queries";
import { getCircuitTimezone } from "./circuit-timezones";

const GOOGLE_CALENDAR_ID = "6ec4dcc63fedfe01a93665b6015419e8acd97f23200bf3400ba916489e98df6b@group.calendar.google.com";
// Use the "public" iCal URL
const ICS_URL = `https://calendar.google.com/calendar/ical/${encodeURIComponent(GOOGLE_CALENDAR_ID)}/public/basic.ics`;

export async function fetchGoogleEvents(): Promise<DbEvent[]> {
  try {
    console.log("Fetching Google Calendar from:", ICS_URL);
    
    // Force dynamic fetch (no cache) during debugging
    const response = await fetch(ICS_URL, { cache: 'no-store' });
    
    if (!response.ok) {
      console.error("Google Calendar Response Not OK:", response.status, response.statusText);
      return [];
    }
    
    const icsData = await response.text();
    if (!icsData || !icsData.includes("BEGIN:VCALENDAR")) {
      console.error("Invalid ICS data received from Google");
      return [];
    }

    const jcalData = ical.parse(icsData);
    const vcalendar = new ical.Component(jcalData);
    const vevents = vcalendar.getAllSubcomponents("vevent");

    console.log(`Found ${vevents.length} events in Google Calendar`);

    const googleEvents: DbEvent[] = vevents.map((vevent) => {
      const event = new ical.Event(vevent);
      
      const start = event.startDate.toJSDate();
      const end = event.endDate?.toJSDate();
      
      return {
        id: `google-${event.uid}`,
        title: event.summary,
        description: event.description || "",
        location: event.location || "",
        start_time: start.toISOString(),
        end_time: end ? end.toISOString() : null,
        is_all_day: event.startDate.isDate,
        color: "#4285F4",
        source: "google",
        created_at: new Date().toISOString()
      };
    });

    return googleEvents;
  } catch (error) {
    console.error("Google Calendar Fetch Error:", error);
    return [];
  }
}

export interface F1CalendarSession {
  name: string;
  date: string;
  japanDate: string;
  trackTime: string;
  japanTime: string;
  trackTimezone: string;
  startTime: string;
  endTime: string | null;
}

export interface F1CalendarSchedule {
  grandPrix: string;
  isSprintWeekend: boolean;
  sessions: F1CalendarSession[];
  notes: string | null;
}

const SESSION_ORDER: Record<string, number> = {
  "Practice 1": 1,
  "Practice 2": 2,
  "Practice 3": 3,
  "Sprint Qualifying": 4,
  "Sprint": 5,
  "Qualifying": 6,
  "Race": 7,
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\b20\d{2}\b/g, " ")
    .replace(/\b(formula|1|grand|prix|gran|premio|grande|de|del|du|da|the|airways|aramco|aws|crypto|com|heineken|lenovo|louis|vuitton|msc|cruises|moet|chandon|pirelli|tag|heuer|etihad|airlines)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeSessionName(value: string) {
  const clean = value.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  if (clean.includes("sprint") && clean.includes("qual")) return "Sprint Qualifying";
  if (clean.includes("sprint")) return "Sprint";
  if (clean.includes("qual")) return "Qualifying";
  if (clean.includes("race")) return "Race";
  if (clean.includes("practice 1")) return "Practice 1";
  if (clean.includes("practice 2")) return "Practice 2";
  if (clean.includes("practice 3")) return "Practice 3";
  return value.trim();
}

function extractEventParts(summary: string) {
  const cleaned = summary.replace(/^[^\w]+/, "").trim();
  const separatorIndex = cleaned.lastIndexOf(" - ");
  if (separatorIndex === -1) return null;

  return {
    grandPrix: cleaned.slice(0, separatorIndex).trim(),
    session: normalizeSessionName(cleaned.slice(separatorIndex + 3)),
  };
}

function formatDateTimeRange(start: Date, end: Date | null, timeZone: string) {
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "2-digit",
    day: "2-digit",
  });
  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const date = dateFormatter.format(start);
  const startTime = timeFormatter.format(start);
  const endTime = end ? timeFormatter.format(end) : null;

  return {
    date,
    time: endTime ? `${startTime} - ${endTime}` : startTime,
  };
}

function getOffsetLabel(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  const offset = parts.find((part) => part.type === "timeZoneName")?.value;
  if (!offset || offset === "GMT") return "UTC+0";
  return offset.replace("GMT", "UTC");
}

function matchesGrandPrix(calendarGrandPrix: string, requestedGrandPrix: string) {
  const calendar = normalizeText(calendarGrandPrix);
  const requested = normalizeText(requestedGrandPrix);
  if (!calendar || !requested) return false;
  if (calendar.includes(requested) || requested.includes(calendar)) return true;

  const requestedTokens = requested.split(" ").filter((token) => token.length > 2);
  if (requestedTokens.length === 0) return false;

  const matchedTokens = requestedTokens.filter((token) => calendar.includes(token));
  return matchedTokens.length / requestedTokens.length >= 0.6;
}

export async function fetchF1CalendarSchedule(
  grandPrix: string,
  year: number
): Promise<F1CalendarSchedule | null> {
  const events = await fetchGoogleEvents();
  const yearEvents = events.filter((event) => {
    const start = new Date(event.start_time);
    return start.getUTCFullYear() === year && event.title.toLowerCase().includes("formula 1");
  });

  const matched = yearEvents
    .map((event) => {
      const parts = extractEventParts(event.title);
      if (!parts || !matchesGrandPrix(parts.grandPrix, grandPrix)) return null;
      return { event, ...parts };
    })
    .filter(Boolean) as Array<{ event: DbEvent; grandPrix: string; session: string }>;

  if (matched.length === 0) return null;

  const first = matched[0];
  const timezone = getCircuitTimezone(first.event.location || "", first.grandPrix);
  const trackTimezone = getOffsetLabel(new Date(first.event.start_time), timezone.ianaTimezone);
  const seen = new Set<string>();

  const sessions = matched
    .sort((a, b) => new Date(a.event.start_time).getTime() - new Date(b.event.start_time).getTime())
    .map(({ event, session }) => {
      const start = new Date(event.start_time);
      const end = event.end_time ? new Date(event.end_time) : null;
      const track = formatDateTimeRange(start, end, timezone.ianaTimezone);
      const japan = formatDateTimeRange(start, end, "Asia/Tokyo");

      return {
        name: session,
        date: track.date,
        japanDate: japan.date,
        trackTime: track.time,
        japanTime: japan.time,
        trackTimezone,
        startTime: event.start_time,
        endTime: event.end_time,
      };
    })
    .filter((session) => {
      if (seen.has(session.name)) return false;
      seen.add(session.name);
      return SESSION_ORDER[session.name] !== undefined;
    })
    .sort((a, b) => SESSION_ORDER[a.name] - SESSION_ORDER[b.name]);

  return {
    grandPrix: first.grandPrix,
    isSprintWeekend: sessions.some((session) => session.name === "Sprint" || session.name === "Sprint Qualifying"),
    sessions,
    notes: "Schedule sourced from the public Formula 1 Google Calendar iCal feed.",
  };
}

export function mergeAndSortEvents(manual: DbEvent[], google: DbEvent[]): DbEvent[] {
  const allEvents = [...manual, ...google];
  return allEvents.sort((a, b) => {
    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
  });
}
