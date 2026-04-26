"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import type { DbEvent } from "@/lib/supabase-queries";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from "date-fns";

export default function CalendarPageClient({ initialEvents }: { initialEvents: DbEvent[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<DbEvent | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getEventsForDay = (day: Date) => {
    return initialEvents.filter(event => isSameDay(new Date(event.start_time), day));
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-20 max-w-6xl">
        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8">
            <div>
              <h1 className="text-5xl font-black tracking-tighter">Calendar</h1>
            </div>
            <div className="flex flex-wrap gap-4">
              <a
                href="/api/calendar/export"
                className="px-6 py-3 bg-black text-white rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
              >
                Sync to My Calendar (iCal)
              </a>
            </div>
          </div>
        </header>

        <div className="bg-white border border-black/10 rounded-[32px] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-black/10 flex items-center justify-between bg-gray-50/50">
            <h2 className="text-3xl font-black tracking-tighter uppercase">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-black/10 hover:bg-black hover:text-white transition-all font-bold">←</button>
              <button onClick={nextMonth} className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-black/10 hover:bg-black hover:text-white transition-all font-bold">→</button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-black/10 bg-white">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 bg-black/5 gap-[1px]">
            {days.map((day, idx) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={idx}
                  className={`min-h-[140px] p-4 bg-white transition-all hover:bg-gray-50/50 ${!isCurrentMonth ? "opacity-30" : ""}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-lg font-black tracking-tighter ${isToday ? "w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full" : ""}`}>
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={`w-full text-left text-[9px] font-black p-1.5 rounded-lg truncate border transition-all ${
                          event.source === 'google' 
                            ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' 
                            : 'bg-black text-white border-black hover:bg-gray-800'
                        }`}
                      >
                        {event.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div 
            className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`h-2 shrink-0 ${selectedEvent.source === 'google' ? 'bg-blue-600' : 'bg-black'}`} />
            
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <div className="p-8 md:p-12">
                <div className="flex justify-between items-start mb-8">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedEvent.source === 'google' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    {selectedEvent.source === 'google' ? 'Race Schedule' : 'Event'}
                  </span>
                  <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-black text-2xl p-2 -mr-2 -mt-2 transition-colors">✕</button>
                </div>
                
                <h3 className="text-3xl md:text-4xl font-black tracking-tighter mb-8 leading-tight">
                  {selectedEvent.title}
                </h3>
                
                <div className="space-y-8">
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-xl shrink-0">📅</div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Date & Time</p>
                      <p className="font-bold text-lg">
                        {format(new Date(selectedEvent.start_time), "MMMM d, yyyy @ HH:mm")}
                      </p>
                    </div>
                  </div>

                  {selectedEvent.location && (
                    <div className="flex items-start gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-xl shrink-0">📍</div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Location</p>
                        <p className="font-bold text-lg">{selectedEvent.location}</p>
                      </div>
                    </div>
                  )}

                  {selectedEvent.description && (
                    <div className="pt-8 border-t border-black/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Details</p>
                      <div className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-wrap break-words">
                        {selectedEvent.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-black/5 bg-gray-50/50">
              <button 
                onClick={() => setSelectedEvent(null)}
                className="w-full py-4 bg-black text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-gray-800 transition-all shadow-xl"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
