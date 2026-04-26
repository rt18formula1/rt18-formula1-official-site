import { getEvents } from "@/lib/supabase-queries";
import { fetchGoogleEvents } from "@/lib/calendar-service";
import CalendarPageClient from "@/components/calendar-page-client";

export const revalidate = 3600;

export default async function CalendarPage() {
  const [manualEvents, googleEvents] = await Promise.all([
    getEvents(),
    fetchGoogleEvents()
  ]);

  const allEvents = [...manualEvents, ...googleEvents].sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  return <CalendarPageClient initialEvents={allEvents} />;
}
