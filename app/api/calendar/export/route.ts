import { NextResponse } from "next/server";
import { getEvents } from "@/lib/supabase-queries";
import { fetchGoogleEvents } from "@/lib/calendar-service";
import ical from "ical.js";

export async function GET() {
  try {
    const [manualEvents, googleEvents] = await Promise.all([
      getEvents(),
      fetchGoogleEvents()
    ]);

    const allEvents = [...manualEvents, ...googleEvents];
    
    // Create ICS structure
    const comp = new ical.Component(['vcalendar', [], []]);
    comp.updatePropertyWithValue('prodid', '-//rt18_formula1//Calendar//EN');
    comp.updatePropertyWithValue('version', '2.0');

    allEvents.forEach(event => {
      const vevent = new ical.Component('vevent');
      vevent.addPropertyWithValue('uid', event.id);
      vevent.addPropertyWithValue('summary', event.title);
      vevent.addPropertyWithValue('dtstart', ical.Time.fromJSDate(new Date(event.start_time)));
      
      if (event.end_time) {
        vevent.addPropertyWithValue('dtend', ical.Time.fromJSDate(new Date(event.end_time)));
      }
      
      if (event.description) {
        vevent.addPropertyWithValue('description', event.description);
      }
      
      if (event.location) {
        vevent.addPropertyWithValue('location', event.location);
      }
      
      comp.addSubcomponent(vevent);
    });

    const icsString = comp.toString();

    return new NextResponse(icsString, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="rt18-calendar.ics"',
      },
    });
  } catch (error) {
    console.error("ICS Export Error:", error);
    return NextResponse.json({ error: "Failed to export calendar" }, { status: 500 });
  }
}
