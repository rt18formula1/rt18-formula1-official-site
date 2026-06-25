"use client";

import { useState, useEffect } from "react";
import { F1_2026_CALENDAR, TRIGGER_TYPES, type F1CalendarRace, type TriggerType } from "@/lib/f1-data-constants";

type TabType = "sns" | "standings";
type StandingsSubTab = "drivers" | "constructors";

interface DriverStanding { position: string; driver: string; nationality: string; team: string; points: string; wins: string; }
interface ConstructorStanding { position: string; team: string; points: string; wins: string; }

export default function F1DatabaseClient() {
  const year = 2026;
  const [activeTab, setActiveTab] = useState<TabType>("standings");
  const [snsOutput, setSnsOutput] = useState<string | null>(null);
  const [loadingSnsTrigger, setLoadingSnsTrigger] = useState<string | null>(null);
  const [selectedSnsRound, setSelectedSnsRound] = useState<number | null>(null);
  const [standingsSubTab, setStandingsSubTab] = useState<StandingsSubTab>("drivers");
  const [driverStandings, setDriverStandings] = useState<DriverStanding[]>([]);
  const [constructorStandings, setConstructorStandings] = useState<ConstructorStanding[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [standingsError, setStandingsError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== "standings") return;
    if (driverStandings.length > 0 || constructorStandings.length > 0) return;
    loadStandings();
  }, [activeTab]);

  const loadStandings = async () => {
    setStandingsLoading(true);
    setStandingsError(null);
    try {
      const [driversRes, constructorsRes] = await Promise.all([
        fetch(`/api/f1-standings?year=${year}&type=drivers`),
        fetch(`/api/f1-standings?year=${year}&type=constructors`),
      ]);
      const [driversData, constructorsData] = await Promise.all([driversRes.json(), constructorsRes.json()]);
      setDriverStandings(driversData.standings ?? []);
      setConstructorStandings(constructorsData.standings ?? []);
      if (!driversData.standings?.length && !constructorsData.standings?.length) {
        setStandingsError("データを取得できませんでした");
      }
    } catch { setStandingsError("取得エラーが発生しました"); }
    finally { setStandingsLoading(false); }
  };

  const handleSnsTrigger = async (race: F1CalendarRace, trigger: TriggerType) => {
    setLoadingSnsTrigger(trigger.id);
    try {
      const res = await fetch("/api/f1-sns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, round: race.round, templateType: trigger.id, raceName: race.officialName }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSnsOutput(data.textOutput ?? "");
      setSelectedSnsRound(race.round);
    } catch (err) { alert("データの取得に失敗しました。"); console.error(err); }
    finally { setLoadingSnsTrigger(null); }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {(["standings", "sns"] as TabType[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-red-500 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {tab === "standings" ? "Season Results" : "SNS Post"}
            </button>
          ))}
        </div>

        {activeTab === "standings" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">2026 Season Results</h2>
              <button onClick={loadStandings} disabled={standingsLoading}
                className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded">
                {standingsLoading ? "Loading..." : "更新"}
              </button>
            </div>
            <div className="flex gap-1 mb-4">
              {(["drivers", "constructors"] as StandingsSubTab[]).map(sub => (
                <button key={sub} onClick={() => setStandingsSubTab(sub)}
                  className={`px-3 py-1 text-sm rounded ${standingsSubTab === sub ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {sub === "drivers" ? "Drivers" : "Constructors"}
                </button>
              ))}
            </div>
            {standingsLoading && <div className="text-center py-12 text-gray-400">Loading...</div>}
            {standingsError && !standingsLoading && <div className="text-center py-12 text-red-400">{standingsError}</div>}
            {!standingsLoading && !standingsError && standingsSubTab === "drivers" && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b-2 border-gray-200 text-left text-gray-500 uppercase text-xs">
                    <th className="py-2 px-3 w-10">Pos</th><th className="py-2 px-3">Driver</th>
                    <th className="py-2 px-3">Team</th><th className="py-2 px-3 text-right">Pts</th><th className="py-2 px-3 text-right">Wins</th>
                  </tr></thead>
                  <tbody>
                    {driverStandings.map((s, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3 text-gray-500">{s.position}</td>
                        <td className="py-2 px-3 font-medium">{s.driver}</td>
                        <td className="py-2 px-3 text-gray-600">{s.team}</td>
                        <td className="py-2 px-3 text-right font-bold">{s.points}</td>
                        <td className="py-2 px-3 text-right text-gray-600">{s.wins}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {driverStandings.length === 0 && <div className="text-center py-8 text-gray-400">データなし</div>}
              </div>
            )}
            {!standingsLoading && !standingsError && standingsSubTab === "constructors" && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b-2 border-gray-200 text-left text-gray-500 uppercase text-xs">
                    <th className="py-2 px-3 w-10">Pos</th><th className="py-2 px-3">Team</th>
                    <th className="py-2 px-3 text-right">Pts</th><th className="py-2 px-3 text-right">Wins</th>
                  </tr></thead>
                  <tbody>
                    {constructorStandings.map((s, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3 text-gray-500">{s.position}</td>
                        <td className="py-2 px-3 font-medium">{s.team}</td>
                        <td className="py-2 px-3 text-right font-bold">{s.points}</td>
                        <td className="py-2 px-3 text-right text-gray-600">{s.wins}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {constructorStandings.length === 0 && <div className="text-center py-8 text-gray-400">データなし</div>}
              </div>
            )}
          </div>
        )}

        {activeTab === "sns" && (
          <div className="flex gap-4">
            <div className="w-48 flex-shrink-0">
              <div className="text-xs text-gray-500 uppercase mb-2 font-medium">Round</div>
              <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
                {F1_2026_CALENDAR.filter(r => !r.cancelled).map(race => (
                  <button key={race.round} onClick={() => { setSelectedSnsRound(race.round); setSnsOutput(null); }}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedSnsRound === race.round ? "bg-red-500 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>
                    <div className="font-medium">R{race.round} {race.country}</div>
                    <div className="text-xs opacity-70">{race.dates}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              {!selectedSnsRound ? (
                <div className="text-center py-12 text-gray-400 text-sm">左からラウンドを選択してください</div>
              ) : (() => {
                const race = F1_2026_CALENDAR.find(r => r.round === selectedSnsRound)!;
                const triggers = TRIGGER_TYPES.filter(t => !t.sprintOnly || race.hasSprint);
                return (
                  <div>
                    <div className="font-bold text-sm mb-1">{race.country}</div>
                    <div className="text-xs text-gray-500 mb-4">{race.officialName}</div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {triggers.map(trigger => (
                        <button key={trigger.id} onClick={() => handleSnsTrigger(race, trigger)}
                          disabled={loadingSnsTrigger !== null}
                          className={`px-3 py-1.5 text-xs rounded border transition-colors ${loadingSnsTrigger === trigger.id ? "bg-red-500 text-white border-red-500" : "border-gray-300 hover:bg-gray-50 text-gray-700"}`}>
                          {loadingSnsTrigger === trigger.id ? "取得中..." : trigger.label}
                        </button>
                      ))}
                    </div>
                    {snsOutput && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-gray-500">出力テキスト</div>
                          <button onClick={() => navigator.clipboard.writeText(snsOutput!)}
                            className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded">コピー</button>
                        </div>
                        <textarea readOnly value={snsOutput}
                          className="w-full h-64 p-3 text-sm font-mono bg-gray-50 border border-gray-200 rounded resize-none" />
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
