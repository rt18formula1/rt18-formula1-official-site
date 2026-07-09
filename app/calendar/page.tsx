import { getEvents } from "@/lib/supabase-queries";
import { fetchGoogleEvents } from "@/lib/calendar-service";
import Link from "next/link";
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

  return (
    <div>
      <CalendarPageClient initialEvents={allEvents} />
      <div className="max-w-6xl mx-auto px-4 pb-8 text-right">
        <Link href="/f1-database?tab=schedule" className="text-xs font-bold text-blue-500 hover:underline">
          → F1 DB で詳細スケジュールを見る / View detailed schedule in F1 DB
        </Link>
      </div>
    </div>
  );
}
