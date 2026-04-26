import ical from "ical.js";
import type { DbEvent } from "./supabase-queries";

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

export function mergeAndSortEvents(manual: DbEvent[], google: DbEvent[]): DbEvent[] {
  const allEvents = [...manual, ...google];
  return allEvents.sort((a, b) => {
    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
  });
}
