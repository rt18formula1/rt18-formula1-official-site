"use client";

import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useLanguage } from "@/components/providers/language-provider";
import { jolpicaApi, type F1OfficialRace, type RaceResult } from "@/lib/jolpica-api";
import OpenF1RoundModal from "@/components/f1-database-round-modal";
import F1ImageExportModal from "@/components/f1-image-export-modal";
import F1ScrapeTab from "@/components/f1-scrape-tab";
import { F1_2026_CALENDAR, TRIGGER_TYPES, F1CalendarRace, TriggerType } from "@/lib/f1-data-constants";

export default function F1JolpicaClient() {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [raceSchedule, setRaceSchedule] = useState<F1OfficialRace[]>([]);
  const [selectedRace, setSelectedRace] = useState<F1OfficialRace | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'schedule'|'races'|'drivers'|'teams'|'sns'>('schedule');  const [scrapeData, setScrapeData] = useState<any>(null);  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [selectedSnsRound, setSelectedSnsRound] = useState<number | null>(null);
  const [snsOutput, setSnsOutput] = useState<string | null>(null);
  const [loadingSnsTrigger, setLoadingSnsTrigger] = useState<string | null>(null);
  const [standingsTab, setStandingsTab] = useState<'drivers' | 'constructors'>('drivers');
  const [allDataTab, setAllDataTab] = useState<'qualifying' | 'circuits' | 'drivers' | 'constructors' | 'laps' | 'pitstops'>('qualifying');
  const [raceSessionTab, setRaceSessionTab] = useState<'sprint' | 'qualifying' | 'race'>('race');
  const [apiStatus, setApiStatus] = useState<{ isAvailable: boolean; responseTime?: number; error?: string } | null>(null);
  const [driverStandings, setDriverStandings] = useState<any>(null);
  const [constructorStandings, setConstructorStandings] = useState<any>(null);
  const [standingsLoading, setStandingsLoading] = useState(false);
  
  // 全データ表示用の状態
  const [qualifyingData, setQualifyingData] = useState<any>(null);
  const [circuitsData, setCircuitsData] = useState<any>(null);
  const [driversData, setDriversData] = useState<any>(null);
  const [constructorsData, setConstructorsData] = useState<any>(null);
  const [lapsData, setLapsData] = useState<any>(null);
  // AI取得機能の状態
  const [aiGrandPrix, setAiGrandPrix] = useState('');
  const [aiYear, setAiYear] = useState(new Date().getFullYear());
  const [aiSession, setAiSession] = useState('RACE');
  const [aiFetchType, setAiFetchType] = useState<'schedule' | 'result'>('schedule');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiSources, setAiSources] = useState<Array<{ title: string; uri: string }>>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [pitstopsData, setPitstopsData] = useState<any>(null);
  const [allDataLoading, setAllDataLoading] = useState(false);
  
  // セッションデータ用の状態
  const [sessionData, setSessionData] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  // Round modal
  const [modalRace, setModalRace] = useState<F1OfficialRace | null>(null);

  // 日付フォーマット関数
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // レース状態を取得
  const getRaceStatus = (race: F1OfficialRace) => {
    if (race.results && race.results.length > 0) {
      return {
        status: language === 'ja' ? '完了' : 'Completed',
        color: 'text-green-600',
        icon: '✓'
      };
    } else {
      return {
        status: language === 'ja' ? '予定' : 'Scheduled',
        color: 'text-blue-600',
        icon: '○'
      };
    }
  };

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 利用可能な年を取得
        const years = await jolpicaApi.getAvailableYears();
        setAvailableYears(years);

        // レーススケジュールを取得
        const data = await jolpicaApi.fetchRaceSchedule(selectedYear);
        setRaceSchedule(data.races);

        // APIステータスを確認
        const status = await jolpicaApi.getApiStatus();
        setApiStatus(status);

        console.log(`Jolpica API Status:`, status);
        console.log(`Fetched ${data.races.length} races for ${selectedYear}`);

      } catch (err) {
        console.error('Error fetching Jolpica data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear]);

  // 年が変更されたときに選択中のレースをリセット
  useEffect(() => {
    setSelectedRace(null);
    setActiveTab('schedule');
  }, [selectedYear]);

  // レースが選択されたときに詳細タブに切り替え
  useEffect(() => {
    if (selectedRace) {
      // details tab removed;
    }
  }, [selectedRace]);

  // シーズンスタンディングスを取得
  const fetchStandings = async () => {
    try {
      setStandingsLoading(true);
      
      // ドライバースタンディングスとコンストラクタースタンディングスを並列取得
      const [driversData, constructorsData] = await Promise.all([
        jolpicaApi.fetchDriverStandings(selectedYear),
        jolpicaApi.fetchConstructorStandings(selectedYear)
      ]);
      
      setDriverStandings(driversData);
      setConstructorStandings(constructorsData);
      
      console.log(`Fetched standings for ${selectedYear}:`, {
        drivers: driversData.data?.MRData?.StandingsTable?.Standings?.length || 0,
        constructors: constructorsData.data?.MRData?.StandingsTable?.Standings?.length || 0
      });
      
    } catch (error) {
      console.error('Error fetching standings:', error);
      // エラー時はnullのまま（UIで表示しない）
    } finally {
      setStandingsLoading(false);
    }
  };


  // AI取得関数
  const fetchAIData = async () => {
    if (!aiGrandPrix.trim()) return;
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    setAiSources([]);
    try {
      const res = await fetch('/api/f1-ai-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: aiFetchType, grandPrix: aiGrandPrix, year: aiYear, session: aiSession }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail || '');
        setAiError([data.error || 'Unknown error', detail].filter(Boolean).join(' - '));
      }
      else {
        setAiResult(data.data);
        setAiSources(Array.isArray(data.sources) ? data.sources : []);
      }
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Fetch failed');
    } finally { setAiLoading(false); }
  };

  // 時刻変換ユーティリティ
  const formatSnsSessionTime = (isoStr: string, offsetHours: number) => {
    const d = new Date(isoStr);
    const utcTime = d.getTime();
    
    // 現地時間
    const trackDate = new Date(utcTime + offsetHours * 3600 * 1000);
    // 日本時間 (UTC+9)
    const jpDate = new Date(utcTime + 9 * 3600 * 1000);

    const pad = (n: number) => String(n).padStart(2, '0');
    
    return {
      track: `${pad(trackDate.getUTCMonth() + 1)}/${pad(trackDate.getUTCDate())} ${pad(trackDate.getUTCHours())}:${pad(trackDate.getUTCMinutes())}`,
      japan: `${pad(jpDate.getUTCMonth() + 1)}/${pad(jpDate.getUTCDate())} ${pad(jpDate.getUTCHours())}:${pad(jpDate.getUTCMinutes())}`,
    };
  };

  const handleSnsTrigger = async (race: F1CalendarRace, trigger: TriggerType) => {
    setLoadingSnsTrigger(trigger.id);
    try {
      // すべてのトリガーを /api/f1-sns に統一 (Supabaseキャッシュ経由)
      const res = await fetch('/api/f1-sns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: 2026,
          round: race.round,
          templateType: trigger.id,
          raceName: race.officialName,
        }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSnsOutput(data.textOutput ?? '');
      setSelectedSnsRound(race.round);
    } catch (err) {
      console.error('Error generating SNS post:', err);
      alert(language === 'ja' ? 'データの取得に失敗しました。' : 'Failed to fetch session data.');
    } finally {
      setLoadingSnsTrigger(null);
    }
  };

    // タブがstandingsに切り替わったときにスタンディングスを取得
  useEffect(() => {
    if (activeTab === 'standings') {
      fetchStandings();
    }
  }, [activeTab, selectedYear]);

  // 全データを取得
  const fetchAllData = async () => {
    try {
      setAllDataLoading(true);
      
      // 並列で全データを取得
      const [
        qualifying,
        circuits,
        drivers,
        constructors
      ] = await Promise.all([
        jolpicaApi.fetchQualifyingResults(selectedYear),
        jolpicaApi.fetchCircuits(),
        jolpicaApi.fetchDrivers(),
        jolpicaApi.fetchConstructors()
      ]);
      
      setQualifyingData(qualifying);
      setCircuitsData(circuits);
      setDriversData(drivers);
      setConstructorsData(constructors);
      
      // ラップタイムとピットストップは選択されたレースがある場合のみ取得
      if (selectedRace) {
        try {
          const [laps, pitstops] = await Promise.all([
            jolpicaApi.fetchLapTimes(selectedYear, selectedRace.round),
            jolpicaApi.fetchPitStops(selectedYear, selectedRace.round)
          ]);
          setLapsData(laps);
          setPitstopsData(pitstops);
        } catch (error) {
          console.log('Lap times and pit stops not available for this race');
        }
      }
      
      console.log(`Fetched all Jolpica data for ${selectedYear}`);
      
    } catch (error) {
      console.error('Error fetching all data:', error);
    } finally {
      setAllDataLoading(false);
    }
  };

  // タブがalldataに切り替わったときに全データを取得
  useEffect(() => {
    if (activeTab === 'alldata') {
      fetchAllData();
    }
  }, [activeTab, selectedYear]);

  // レースが選択されたときにラップタイムとピットストップを再取得
  useEffect(() => {
    if (activeTab === 'alldata' && selectedRace) {
      const fetchRaceSpecificData = async () => {
        try {
          const [laps, pitstops] = await Promise.all([
            jolpicaApi.fetchLapTimes(selectedYear, selectedRace.round),
            jolpicaApi.fetchPitStops(selectedYear, selectedRace.round)
          ]);
          setLapsData(laps);
          setPitstopsData(pitstops);
        } catch (error) {
          console.log('Lap times and pit stops not available for this race');
        }
      };
      fetchRaceSpecificData();
    }
  }, [selectedRace, activeTab, selectedYear]);

  // セッションデータを取得
  const fetchSessionData = async () => {
    if (!selectedRace) return;
    
    try {
      setSessionLoading(true);
      
      const sessionResults = await jolpicaApi.fetchSessionResults(
        selectedYear, 
        selectedRace.round, 
        raceSessionTab
      );
      
      setSessionData(sessionResults);
      
      // デバッグ情報をコンソールに出力
      console.log(`Fetched ${raceSessionTab} data for ${selectedRace.name}:`, sessionResults);
      console.log('Data structure:', JSON.stringify(sessionResults, null, 2));
      
    } catch (error) {
      console.error(`Error fetching ${raceSessionTab} data:`, error);
      setSessionData(null);
    } finally {
      setSessionLoading(false);
    }
  };

  // レースが選択されたときにセッションデータを取得
  useEffect(() => {
    if (selectedRace && activeTab === 'details') {
      fetchSessionData();
    }
  }, [selectedRace, activeTab, selectedYear]);

  // セッションタブが切り替わったときにデータを再取得
  useEffect(() => {
    if (selectedRace && activeTab === 'details') {
      fetchSessionData();
    }
  }, [raceSessionTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SiteHeader />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              {language === 'ja' ? 'Jolpica APIからデータを読み込み中...' : 'Loading data from Jolpica API...'}
            </p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SiteHeader />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-bold text-lg mb-2">
              {language === 'ja' ? 'データ取得エラー' : 'Data Fetch Error'}
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              {language === 'ja' ? '再読み込み' : 'Reload'}
            </button>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 年選択 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'ja' ? 'シーズン選択:' : 'Select Season:'}
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="block w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>
                {year} {language === 'ja' ? '年' : 'Season'}
              </option>
            ))}
          </select>
        </div>

        {/* タブナビゲーション - Schedule / Races / Drivers / Teams / SNS Post */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {([
              { id: 'schedule', en: 'Schedule', ja: 'スケジュール' },
              { id: 'races',    en: 'Races',    ja: 'レース結果' },
              { id: 'drivers',  en: 'Drivers',  ja: 'ドライバー' },
              { id: 'teams',    en: 'Teams',    ja: 'チーム' },
              { id: 'sns',      en: 'SNS Post', ja: 'SNS投稿' },
            ] as { id: 'schedule'|'races'|'drivers'|'teams'|'sns'; en: string; ja: string }[]).map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSelectedRace(null); setScrapeData(null); }}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {language === 'ja' ? tab.ja : tab.en}
              </button>
            ))}
          </nav>
        </div>

        {/* Schedule / Races / Drivers / Teams - /api/f1-scrape から取得 */}
        {(['schedule','races','drivers','teams'] as const).includes(activeTab as any) && (
          <F1ScrapeTab
            tab={activeTab as 'schedule'|'races'|'drivers'|'teams'}
            year={selectedYear}
            data={scrapeData}
            loading={scrapeLoading}
            onLoad={async (tab: string, year: number) => {
              setScrapeLoading(true);
              setScrapeData(null);
              try {
                const res = await fetch(`/api/f1-scrape?page=${tab}&year=${year}`);
                const json = await res.json();
                setScrapeData(json);
              } catch { setScrapeData(null); }
              finally { setScrapeLoading(false); }
            }}
          />
        )}

        {activeTab === 'sns' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h2 className="text-2xl font-black text-gray-900">
                {language === 'ja' ? 'インスタ投稿定型文出力' : 'F1 SNS Post Automator'}
              </h2>
              <span className="text-xs text-gray-400 font-mono">Powered by F1 Official Scraper</span>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
              {F1_2026_CALENDAR.map((race) => (
                <div key={race.round}>
                  <button
                    onClick={() =>
                      !race.cancelled && setSelectedSnsRound(selectedSnsRound === race.round ? null : race.round)
                    }
                    className={`w-full flex items-center justify-between px-5 py-4 transition-colors text-left ${
                      race.cancelled
                        ? "cursor-not-allowed opacity-40 bg-gray-50/50"
                        : selectedSnsRound === race.round
                        ? "bg-gray-50 font-bold"
                        : "hover:bg-gray-50/60"
                    }`}
                  >
                    <span className="text-[15px] tracking-wide text-gray-900">
                      <span className="text-gray-400 font-light tabular-nums">
                        Round {String(race.round).padStart(2, "0")}
                      </span>
                      <span className={`ml-3 ${race.cancelled ? "line-through text-gray-400" : "text-gray-900"}`}>
                        {race.country}
                      </span>
                      {race.cancelled && (
                        <span className="ml-2 text-xs text-red-500 font-normal">中止 (Cancelled)</span>
                      )}
                    </span>
                    {!race.cancelled && (
                      <span className="text-gray-400 text-xs">
                        {selectedSnsRound === race.round ? "▲" : "▼"}
                      </span>
                    )}
                  </button>
                    {selectedSnsRound === race.round && (
                      <div
                        className="overflow-hidden bg-gray-50/30 px-5 py-3 border-t border-gray-100"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 py-2">
                          {TRIGGER_TYPES.map((trigger) => {
                            const isSprintTrigger = trigger.sprintOnly;
                            const isDisabled = isSprintTrigger && !race.hasSprint;
                            const isLoading = loadingSnsTrigger === trigger.id;

                            return (
                              <button
                                key={trigger.id}
                                onClick={() => !isDisabled && handleSnsTrigger(race, trigger)}
                                disabled={isDisabled || isLoading}
                                className={`text-left px-4 py-2.5 rounded-lg border text-xs font-semibold transition-all ${
                                  isDisabled
                                    ? "text-gray-300 border-gray-100 bg-gray-50 cursor-not-allowed"
                                    : isLoading
                                    ? "bg-gray-100 border-gray-300 text-gray-500"
                                    : "bg-white border-gray-200 text-gray-800 hover:bg-gray-50 active:bg-gray-100 hover:border-gray-300"
                                }`}
                              >
                                <span className="flex items-center justify-between">
                                  <span>{trigger.label}</span>
                                  {isLoading && (
                                    <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin inline-block" />
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
      {snsOutput && (
        <F1ImageExportModal
          output={snsOutput}
          onClose={() => setSnsOutput(null)}
        />
      )}
      {modalRace && (
        <OpenF1RoundModal
          year={selectedYear}
          round={modalRace.round}
          raceName={modalRace.name}
          onClose={() => setModalRace(null)}
        />
      )}
    </div>
  );
}
