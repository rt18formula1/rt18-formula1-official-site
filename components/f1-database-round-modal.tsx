"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { openf1Api, type OpenF1Meeting, type OpenF1Session, type OpenF1ResultRow, type OpenF1Driver } from "@/lib/openf1-api";

type SessionTab = "qualifying" | "sprint" | "race";

interface OpenF1RoundModalProps {
  year: number;
  round: number;
  raceName?: string | null;
  onClose: () => void;
}

const SESSION_TABS: { key: SessionTab; label: string }[] = [
  { key: "qualifying", label: "Qualifying" },
  { key: "sprint", label: "Sprint" },
  { key: "race", label: "Race" },
];

function toJapanTime(iso?: string | null, offset?: string | null) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("ja-JP", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: offset || undefined,
    });
  } catch {
    return iso || "-";
  }
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function OpenF1RoundModal({ year, round, raceName, onClose }: OpenF1RoundModalProps) {
  const { language } = useLanguage();
  const [meeting, setMeeting] = useState<OpenF1Meeting | null>(null);
  const [sessions, setSessions] = useState<OpenF1Session[]>([]);
  const [results, setResults] = useState<Record<SessionTab, OpenF1ResultRow[]>>({
    qualifying: [],
    sprint: [],
    race: [],
  });
  const [drivers, setDrivers] = useState<Record<SessionTab, OpenF1Driver[]>>({
    qualifying: [],
    sprint: [],
    race: [],
  });
  const [activeTab, setActiveTab] = useState<SessionTab>("race");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<null | "text" | "html">(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const resolvedMeeting = await openf1Api.getMeetingByRound(year, round);
        if (cancelled || !resolvedMeeting) return;
        setMeeting(resolvedMeeting);

        const sessionList = await openf1Api.getSessions(resolvedMeeting.meeting_key);
        if (cancelled) return;
        setSessions(sessionList);

        const keyByTab: Record<SessionTab, number | null> = { qualifying: null, sprint: null, race: null };
        sessionList.forEach((item) => {
          const name = item.session_name.toLowerCase();
          if (name.includes("qualifying") && name.includes("sprint")) keyByTab.sprint = item.session_key;
          else if (name.includes("qualifying")) keyByTab.qualifying = item.session_key;
          else if (name.includes("sprint")) keyByTab.sprint = item.session_key;
          else if (name.includes("race")) keyByTab.race = item.session_key;
        });

        const [qualifyingResults, sprintResults, raceResults, qualifyingDrivers, sprintDrivers, raceDrivers] = await Promise.all([
          keyByTab.qualifying ? openf1Api.getResults(keyByTab.qualifying).catch(() => []) : Promise.resolve([]),
          keyByTab.sprint ? openf1Api.getResults(keyByTab.sprint).catch(() => []) : Promise.resolve([]),
          keyByTab.race ? openf1Api.getResults(keyByTab.race).catch(() => []) : Promise.resolve([]),
          keyByTab.qualifying ? openf1Api.getDrivers(keyByTab.qualifying).catch(() => []) : Promise.resolve([]),
          keyByTab.sprint ? openf1Api.getDrivers(keyByTab.sprint).catch(() => []) : Promise.resolve([]),
          keyByTab.race ? openf1Api.getDrivers(keyByTab.race).catch(() => []) : Promise.resolve([]),
        ]);
        if (cancelled) return;
        setResults({ qualifying: qualifyingResults, sprint: sprintResults, race: raceResults });
        setDrivers({ qualifying: qualifyingDrivers, sprint: sprintDrivers, race: raceDrivers });
      } catch (error) {
        console.error("Failed to fetch OpenF1 data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [year, round]);

  const titleText = useMemo(() => {
    if (!meeting) return raceName || `${year} Round ${round}`;
    return `${meeting.meeting_name} (${meeting.date_start.split("-")[0]} Round ${meeting.meeting_code})`;
  }, [meeting, year, round, raceName]);

  const textPayload = useMemo(() => {
    const lines: string[] = [titleText, "Schedule"];
    sessions
      .filter((s) => ["Qualifying", "Sprint", "Race"].some((label) => s.session_name.toLowerCase().includes(label.toLowerCase())))
      .forEach((s) => {
        lines.push(`${s.session_name}: ${toJapanTime(s.date_start, s.gmt_offset || meeting?.gmt_offset)}`);
      });
    SESSION_TABS.forEach((tab) => {
      const sessionResults = results[tab];
      const sessionDrivers = drivers[tab];
      const driverMap = new Map(sessionDrivers.map((d) => [d.driver_number, d]));
      const heading = SESSION_TABS.find((item) => item.key === tab)?.label || tab;
      lines.push("", heading);
      sessionResults.forEach((r) => {
        const driver = driverMap.get(r.driver_number);
        const name = driver?.broadcast_name || r.full_name || `#${r.driver_number}`;
        lines.push(`${r.position}. ${name} (${driver?.name_acronym || "-"}) - ${r.team_name}`);
      });
    });
    return lines.join("\n");
  }, [titleText, meeting, sessions, results, drivers]);

  const htmlPayload = useMemo(() => {
    const esc = escapeHtml;
    const sessionRows = sessions
      .filter((s) => ["Qualifying", "Sprint", "Race"].some((label) => s.session_name.toLowerCase().includes(label.toLowerCase())))
      .map((s) => `<tr><td>${esc(s.session_name)}</td><td>${esc(toJapanTime(s.date_start, s.gmt_offset || meeting?.gmt_offset))}</td></tr>`)
      .join("");

    const resultTables = SESSION_TABS.map((tab) => {
      const tabResults = results[tab];
      const tabDrivers = drivers[tab];
      const driverMap = new Map(tabDrivers.map((d) => [d.driver_number, d]));
      const rows = tabResults
        .map((r) => {
          const driver = driverMap.get(r.driver_number);
          const name = driver?.broadcast_name || r.full_name || `#${r.driver_number}`;
          return `<tr><td>${r.position}</td><td>${esc(name)} (${esc(driver?.name_acronym || "-")})</td><td>${esc(r.team_name)}</td></tr>`;
        })
        .join("");
      const heading = SESSION_TABS.find((item) => item.key === tab)?.label || tab;
      return `<h2>${esc(heading)}</h2><table><thead><tr><th>Pos</th><th>Driver</th><th>Team</th></tr></thead><tbody>${rows}</tbody></table>`;
    });

    return `
      <html lang="ja" prefix="og: http://ogp.me/ns#">
        <head><meta charset="UTF-8"/></head>
        <body>
          <article>
            <h1>${esc(titleText)}</h1>
            <h2>Schedule</h2>
            <table><thead><tr><th>Session</th><th>Time</th></tr></thead><tbody>${sessionRows}</tbody></table>
            ${resultTables.join("")}
            <section id="openf1-notes">
              <h2>Notes</h2>
              <p>Source: OpenF1 / ${esc(String(year))} Round ${esc(String(round))}</p>
            </section>
          </article>
        </body>
      </html>
    `;
  }, [titleText, year, round, meeting, sessions, results, drivers]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${meeting || year ? "opacity-100" : "pointer-events-none opacity-0"}`}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl bg-white rounded-lg shadow-xl max-h-[85vh] overflow-hidden">
        <div className="flex items-start justify-between px-5 py-4 border-b">
          <div>
            <div className="text-sm text-gray-500">
              {meeting ? `Meeting ${meeting.meeting_key}` : `${year} Round ${round}`}
            </div>
            <div className="text-base font-semibold">
              {titleText}
            </div>
          </div>
          <button onClick={onClose} className="px-2 py-1 text-sm text-gray-500 hover:text-black bg-gray-100 rounded">
            Close
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[calc(85vh-64px)] overflow-auto">
          <section>
            <h3 className="font-semibold text-sm mb-2">Schedule</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {sessions
                    .filter((s) => ["Qualifying", "Sprint", "Race"].some((label) => s.session_name.toLowerCase().includes(label.toLowerCase())))
                    .map((session) => (
                      <tr key={session.session_key} className="border-b last:border-0">
                        <td className="py-2 pr-3">{session.session_name}</td>
                        <td className="py-2">{toJapanTime(session.date_start, session.gmt_offset || meeting?.gmt_offset)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-sm">Session Output</h3>
              <div className="inline-flex rounded border bg-white overflow-hidden">
                {SESSION_TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`px-3 py-1.5 text-xs ${activeTab === key ? "bg-black text-white" : "text-gray-700 hover:bg-gray-50"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-6 text-center text-sm text-gray-500">Loading...</div>
              ) : results[activeTab].length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-2 py-1">Pos</th>
                      <th className="text-left px-2 py-1">Driver</th>
                      <th className="text-left px-2 py-1">Team</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results[activeTab].map((r) => {
                      const driver = drivers[activeTab].find((d) => d.driver_number === r.driver_number);
                      return (
                        <tr key={`${r.driver_number}-${r.position}`} className="border-b last:border-0">
                          <td className="px-2 py-1">{r.position}</td>
                          <td className="px-2 py-1">
                            {driver?.broadcast_name || r.full_name} <span className="text-xs text-gray-500">({driver?.name_acronym || "-"})</span>
                          </td>
                          <td className="px-2 py-1">{r.team_name}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="py-6 text-center text-sm text-gray-500">結果なし</div>
              )}
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-sm mb-2">Copy</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(textPayload);
                  setCopied("text");
                }}
                className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
              >
                TEXT コピー
              </button>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(htmlPayload);
                  setCopied("html");
                }}
                className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
              >
                HTML コピー
              </button>
            </div>
            {copied && <p className="mt-1 text-xs text-gray-500">Copied: {copied}</p>}
          </section>

          <section className="pt-2">
            <h3 className="font-semibold text-sm mb-2">結果ノート</h3>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Source: OpenF1 v1 (no auth)</li>
              <li>{year} Round {round}</li>
              <li>将来的に OGP/JPEG 保存時は htmlPayload を headless 描画へ</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
