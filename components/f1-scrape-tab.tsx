"use client";

import { useEffect } from "react";
import { F1_2026_CALENDAR } from "@/lib/f1-data-constants";

type ScrapeTab = "schedule" | "races" | "drivers" | "teams";

interface Props {
  tab: ScrapeTab;
  year: number;
  data: any;
  loading: boolean;
  onLoad: (tab: string, year: number) => void;
}

export default function F1ScrapeTab({ tab, year, data, loading, onLoad }: Props) {
  useEffect(() => {
    onLoad(tab, year);
  }, [tab, year]);

  const tabClass = "w-full text-sm";
  const thClass = "py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b-2 border-gray-200";
  const tdClass = "py-2 px-3 border-b border-gray-100";

  if (loading) return <div className="text-center py-16 text-gray-400">Loading...</div>;
  if (!data) return <div className="text-center py-16 text-gray-400">No data</div>;

  // Schedule: use local calendar
  if (tab === "schedule") {
    const rows = F1_2026_CALENDAR;
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">{year} Season Schedule</h2>
        <div className="overflow-x-auto">
          <table className={tabClass}>
            <thead>
              <tr>
                <th className={thClass}>Round</th>
                <th className={thClass}>Grand Prix</th>
                <th className={thClass}>Circuit</th>
                <th className={thClass}>Dates</th>
                <th className={thClass}>Sprint</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.round} className={r.cancelled ? "opacity-40" : "hover:bg-gray-50"}>
                  <td className={tdClass + " text-gray-500"}>{r.round}</td>
                  <td className={tdClass + " font-medium"}>{r.country}{r.cancelled ? " ✕" : ""}</td>
                  <td className={tdClass + " text-gray-600"}>{r.circuit}</td>
                  <td className={tdClass}>{r.dates}</td>
                  <td className={tdClass + " text-center"}>{r.hasSprint ? "🏎" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Races
  if (tab === "races") {
    const rows: any[] = data.rows ?? [];
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">{year} Race Results</h2>
        <div className="overflow-x-auto">
          <table className={tabClass}>
            <thead>
              <tr>
                <th className={thClass}>Grand Prix</th>
                <th className={thClass}>Date</th>
                <th className={thClass}>Winner</th>
                <th className={thClass}>Team</th>
                <th className={thClass}>Laps</th>
                <th className={thClass}>Time</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className={tdClass + " font-medium"}>{r.grandPrix}</td>
                  <td className={tdClass + " text-gray-500"}>{r.date}</td>
                  <td className={tdClass}>{r.winner}</td>
                  <td className={tdClass + " text-gray-600"}>{r.team}</td>
                  <td className={tdClass + " text-right text-gray-500"}>{r.laps}</td>
                  <td className={tdClass + " text-gray-500"}>{r.time}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No results yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Drivers
  if (tab === "drivers") {
    const rows: any[] = data.rows ?? [];
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">{year} Driver Standings</h2>
        <div className="overflow-x-auto">
          <table className={tabClass}>
            <thead>
              <tr>
                <th className={thClass + " w-12"}>Pos</th>
                <th className={thClass}>Driver</th>
                <th className={thClass}>Nationality</th>
                <th className={thClass}>Team</th>
                <th className={thClass + " text-right"}>Pts</th>
                <th className={thClass + " text-right"}>Wins</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className={tdClass + " text-gray-500"}>{r.position}</td>
                  <td className={tdClass + " font-medium"}>{r.driver}</td>
                  <td className={tdClass + " text-gray-500"}>{r.nationality}</td>
                  <td className={tdClass + " text-gray-600"}>{r.team}</td>
                  <td className={tdClass + " text-right font-bold"}>{r.points}</td>
                  <td className={tdClass + " text-right text-gray-600"}>{r.wins}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Teams
  if (tab === "teams") {
    const rows: any[] = data.rows ?? [];
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">{year} Constructor Standings</h2>
        <div className="overflow-x-auto">
          <table className={tabClass}>
            <thead>
              <tr>
                <th className={thClass + " w-12"}>Pos</th>
                <th className={thClass}>Team</th>
                <th className={thClass + " text-right"}>Pts</th>
                <th className={thClass + " text-right"}>Wins</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className={tdClass + " text-gray-500"}>{r.position}</td>
                  <td className={tdClass + " font-medium"}>{r.team}</td>
                  <td className={tdClass + " text-right font-bold"}>{r.points}</td>
                  <td className={tdClass + " text-right text-gray-600"}>{r.wins}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}
