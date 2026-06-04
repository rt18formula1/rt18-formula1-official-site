"use client";

import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useLanguage } from "@/components/providers/language-provider";
import { jolpicaApi, type F1OfficialRace, type RaceResult } from "@/lib/jolpica-api";

export default function F1JolpicaClient() {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [raceSchedule, setRaceSchedule] = useState<F1OfficialRace[]>([]);
  const [selectedRace, setSelectedRace] = useState<F1OfficialRace | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'schedule' | 'details' | 'standings' | 'alldata' | 'aifetch'>('schedule');
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
      setActiveTab('details');
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

        {/* タブナビゲーション */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => {
                setActiveTab('schedule');
                setSelectedRace(null);
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'schedule'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {language === 'ja' ? 'スケジュール' : 'Schedule'}
            </button>
            <button
              onClick={() => {
                setActiveTab('standings');
                setSelectedRace(null);
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'standings'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {language === 'ja' ? 'シーズンリザルト' : 'Season Results'}
            </button>
            <button
              onClick={() => {
                setActiveTab('alldata');
                setSelectedRace(null);
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'alldata'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {language === 'ja' ? '全データ' : 'All Data'}
            </button>
            <button
              onClick={() => { setActiveTab('aifetch'); setSelectedRace(null); }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'aifetch' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {language === 'ja' ? 'AI取得' : 'AI Fetch'}
            </button>
            {selectedRace && (
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {language === 'ja' ? 'レース詳細' : 'Race Details'}
              </button>
            )}
          </nav>
        </div>

        {/* スケジュールタブ */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black">
              {language === 'ja' ? 'レーススケジュール' : 'Race Schedule'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {raceSchedule.map((race) => {
                const raceStatus = getRaceStatus(race);
                return (
                  <div
                    key={`${race.round}-${race.name}`}
                    onClick={() => setSelectedRace(race)}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-lg ${raceStatus.color}`}>
                          {raceStatus.icon}
                        </span>
                        <h3 className="font-black text-lg">{race.name}</h3>
                      </div>
                      <span className={`text-sm font-medium ${raceStatus.color}`}>
                        {raceStatus.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-1">
                      {race.location} • {race.country}
                    </p>
                    {race.results && race.results.length > 0 && (
                      <p className="text-sm text-gray-500">
                        {language === 'ja' ? '優勝: ' : 'Winner: '}
                        {race.results[0].name} ({race.results[0].code})
                      </p>
                    )}
                    <div className="mt-2 text-right">
                      <p className="text-sm text-gray-500">
                        Round {race.round}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(race.date)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* レース詳細タブ */}
        {activeTab === 'details' && selectedRace && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black">
              {selectedRace.name} - {selectedYear}
            </h2>

            {/* セッション選択サブタブ（利用可能なセッションのみ） */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setRaceSessionTab('qualifying')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    raceSessionTab === 'qualifying'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {language === 'ja' ? '予選' : 'Qualifying'}
                </button>
                <button
                  onClick={() => setRaceSessionTab('sprint')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    raceSessionTab === 'sprint'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {language === 'ja' ? 'スプリント' : 'Sprint'}
                </button>
                <button
                  onClick={() => setRaceSessionTab('race')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    raceSessionTab === 'race'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {language === 'ja' ? 'レース' : 'Race'}
                </button>
              </nav>
            </div>

            {sessionLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">
                  {language === 'ja' ? 'セッションデータを読み込み中...' : 'Loading session data...'}
                </p>
              </div>
            ) : (
              <div>
                {/* セッションデータ表示 */}
                {(sessionData?.data?.MRData?.RaceTable?.Races?.[0] || sessionData?.data?.Results) && (
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-black text-lg mb-4">
                      {raceSessionTab === 'qualifying' && (language === 'ja' ? '予選結果' : 'Qualifying Results')}
                      {raceSessionTab === 'sprint' && (language === 'ja' ? 'スプリントレース結果' : 'Sprint Race Results')}
                      {raceSessionTab === 'race' && (language === 'ja' ? 'レース結果' : 'Race Results')}
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-3">{language === 'ja' ? '順位' : 'Pos'}</th>
                            <th className="text-left py-2 px-3">{language === 'ja' ? 'ドライバー' : 'Driver'}</th>
                            <th className="text-left py-2 px-3">{language === 'ja' ? 'チーム' : 'Team'}</th>
                            {raceSessionTab === 'qualifying' && (
                              <>
                                <th className="text-left py-2 px-3">Q1</th>
                                <th className="text-left py-2 px-3">Q2</th>
                                <th className="text-left py-2 px-3">Q3</th>
                              </>
                            )}
                            {(raceSessionTab === 'sprint' || raceSessionTab === 'race') && (
                              <>
                                <th className="text-left py-2 px-3">{language === 'ja' ? 'タイム/差' : 'Time/Gap'}</th>
                                <th className="text-left py-2 px-3">{language === 'ja' ? 'ラップ' : 'Laps'}</th>
                                <th className="text-left py-2 px-3">{language === 'ja' ? 'ステータス' : 'Status'}</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            // Alpha APIと従来APIの両方に対応
                            let results = [];
                            
                            if (sessionData.data?.MRData?.RaceTable?.Races?.[0]) {
                              // 従来APIのデータ構造
                              const race = sessionData.data.MRData.RaceTable.Races[0];
                              results = race.Results || race.QualifyingResults || [];
                            } else if (sessionData.data?.Results) {
                              // Alpha APIのデータ構造
                              results = sessionData.data.Results;
                            }
                            
                            return results.slice(0, 20).map((result: any, index: number) => (
                              <tr key={result.Driver?.driverId || result.DriverId || index} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-2 px-3 font-medium">{result.position || result.Position || index + 1}</td>
                                <td className="py-2 px-3">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">
                                      {result.Driver?.givenName || result.GivenName} {result.Driver?.familyName || result.FamilyName}
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                      ({result.Driver?.code || result.Code || result.DriverId})
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-gray-600">
                                  {result.Constructor?.name || result.ConstructorName || '-'}
                                </td>
                                
                                {raceSessionTab === 'qualifying' && (
                                  <>
                                    <td className="py-2 px-3">{result.Q1 || '-'}</td>
                                    <td className="py-2 px-3">{result.Q2 || '-'}</td>
                                    <td className="py-2 px-3">{result.Q3 || '-'}</td>
                                  </>
                                )}
                                
                                {(raceSessionTab === 'sprint' || raceSessionTab === 'race') && (
                                  <>
                                    <td className="py-2 px-3 text-gray-600">
                                      {result.Time?.time || result.Time || result.Status || '-'}
                                    </td>
                                    <td className="py-2 px-3 font-bold text-red-600">
                                      {result.points || result.Points || '0'}
                                    </td>
                                  </>
                                )}
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* API情報表示 */}
                    <div className="mt-4 text-xs text-gray-500">
                      {sessionData.data?.MRData ? 
                        (language === 'ja' ? 'データソース: Jolpica 従来API' : 'Data source: Jolpica Traditional API') :
                        (language === 'ja' ? 'データソース: Jolpica Alpha API' : 'Data source: Jolpica Alpha API')
                      }
                    </div>
                  </div>
                )}

                {/* データがない場合 */}
                {(!sessionData?.data?.MRData?.RaceTable?.Races?.[0] && !sessionData?.data?.Results) && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">
                      {language === 'ja' 
                        ? 'このセッションのデータはまだ利用できません' 
                        : 'Session data not yet available'}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {language === 'ja' 
                        ? 'セッションが開始されるとデータが表示されます' 
                        : 'Data will be displayed once session begins'}
                    </p>
                    
                    {/* デバッグ情報 */}
                    {sessionData && (
                      <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
                        <p className="text-xs text-gray-600 mb-2">
                          {language === 'ja' ? 'デバッグ情報:' : 'Debug Info:'}
                        </p>
                        <div className="text-xs font-mono text-gray-700">
                          <p>{language === 'ja' ? 'APIレスポンス構造:' : 'API Response Structure:'}</p>
                          <pre className="mt-2 p-2 bg-white rounded border text-xs overflow-auto max-h-40">
                            {JSON.stringify(sessionData, null, 2)}
                          </pre>
                        </div>
                        <div className="mt-2 text-xs text-gray-600">
                          <p>{language === 'ja' ? '確認するキー:' : 'Keys to check:'}</p>
                          <ul className="mt-1 ml-4">
                            <li>data.MRData.RaceTable.Races[0]</li>
                            <li>data.Results</li>
                            <li>data.MRData (従来API)</li>
                            <li>data.Results (Alpha API)</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* レース基本情報 */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="font-black text-lg mb-4">
                    {language === 'ja' ? 'レース情報' : 'Race Information'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">{language === 'ja' ? '場所' : 'Location'}</p>
                      <p className="font-medium">{selectedRace.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{language === 'ja' ? '日付' : 'Date'}</p>
                      <p className="font-medium">{formatDate(selectedRace.date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{language === 'ja' ? 'ラウンド' : 'Round'}</p>
                      <p className="font-medium">Round {selectedRace.round}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{language === 'ja' ? 'ステータス' : 'Status'}</p>
                      <p className="font-medium">
                        {selectedRace.results ? 
                          (language === 'ja' ? '完了' : 'Completed') : 
                          (language === 'ja' ? '未開催' : 'Not Held')
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* シーズンリザルトタブ */}
        {activeTab === 'standings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black">
              {selectedYear} {language === 'ja' ? 'シーズンリザルト' : 'Season Results'}
            </h2>

            {/* サブタブナビゲーション */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setStandingsTab('drivers')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    standingsTab === 'drivers'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {language === 'ja' ? 'ドライバーランキング' : 'Driver Championship'}
                </button>
                <button
                  onClick={() => setStandingsTab('constructors')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    standingsTab === 'constructors'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {language === 'ja' ? 'チームランキング' : 'Constructor Championship'}
                </button>
              </nav>
            </div>

            {standingsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">
                  {language === 'ja' ? 'シーズンリザルトを読み込み中...' : 'Loading season results...'}
                </p>
              </div>
            ) : (
              <div>
                {/* Driver Championshipタブ */}
                {standingsTab === 'drivers' && (
                  driverStandings?.data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings && 
                  driverStandings.data.MRData.StandingsTable.StandingsLists[0].DriverStandings.length > 0 ? (
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3">Pos</th>
                              <th className="text-left py-2 px-3">Driver</th>
                              <th className="text-left py-2 px-3">Nationality</th>
                              <th className="text-left py-2 px-3">Car</th>
                              <th className="text-left py-2 px-3">Points</th>
                              <th className="text-left py-2 px-3">Wins</th>
                            </tr>
                          </thead>
                          <tbody>
                            {driverStandings.data.MRData.StandingsTable.StandingsLists[0].DriverStandings.map((standing: any, index: number) => (
                              <tr key={standing.Driver.driverId} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-2 px-3 font-medium">{standing.position}</td>
                                <td className="py-2 px-3">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">
                                      {standing.Driver.givenName} {standing.Driver.familyName}
                                    </span>
                                    <span className="text-gray-500 text-xs">({standing.Driver.code})</span>
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-gray-600">{standing.Driver.nationality}</td>
                                <td className="py-2 px-3 text-gray-600">{standing.Constructors[0]?.name}</td>
                                <td className="py-2 px-3 font-bold text-red-600">{standing.points}</td>
                                <td className="py-2 px-3 text-gray-600">{standing.wins}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">
                        {language === 'ja' 
                          ? 'ドライバーランキングデータがありません' 
                          : 'No driver championship data available'}
                      </p>
                    </div>
                  )
                )}

                {/* Constructor Championshipタブ */}
                {standingsTab === 'constructors' && (
                  constructorStandings?.data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings && 
                  constructorStandings.data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings.length > 0 ? (
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3">Pos</th>
                              <th className="text-left py-2 px-3">Team</th>
                              <th className="text-left py-2 px-3">Nationality</th>
                              <th className="text-left py-2 px-3">Points</th>
                              <th className="text-left py-2 px-3">Wins</th>
                            </tr>
                          </thead>
                          <tbody>
                            {constructorStandings.data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings.map((standing: any) => (
                              <tr key={standing.Constructor.constructorId} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-2 px-3 font-medium">{standing.position}</td>
                                <td className="py-2 px-3 font-medium">{standing.Constructor.name}</td>
                                <td className="py-2 px-3 text-gray-600">{standing.Constructor.nationality}</td>
                                <td className="py-2 px-3 font-bold text-red-600">{standing.points}</td>
                                <td className="py-2 px-3 text-gray-600">{standing.wins}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">
                        {language === 'ja' 
                          ? 'チームランキングデータがありません' 
                          : 'No constructor championship data available'}
                      </p>
                    </div>
                  )
                )}

                {/* 両方のデータがない場合 */}
                {(!driverStandings?.data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || 
                  driverStandings?.data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings.length === 0) && 
                 (!constructorStandings?.data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || 
                  constructorStandings?.data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings.length === 0) && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">
                      {language === 'ja' 
                        ? 'このシーズンのリザルトデータはまだ利用できません' 
                        : 'Season results data not yet available for this season'}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {language === 'ja' 
                        ? 'レースが開始されるとデータが表示されます' 
                        : 'Data will be displayed once races begin'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 全データタブ */}
        {activeTab === 'alldata' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black">
              {selectedYear} {language === 'ja' ? 'Jolpica API 全データ' : 'Jolpica API All Data'}
            </h2>

            {/* サブタブナビゲーション */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setAllDataTab('qualifying')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    allDataTab === 'qualifying'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {language === 'ja' ? '予選結果' : 'Qualifying'}
                </button>
                <button
                  onClick={() => setAllDataTab('circuits')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    allDataTab === 'circuits'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {language === 'ja' ? 'サーキット' : 'Circuits'}
                </button>
                <button
                  onClick={() => setAllDataTab('drivers')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    allDataTab === 'drivers'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {language === 'ja' ? 'ドライバー' : 'Drivers'}
                </button>
                <button
                  onClick={() => setAllDataTab('constructors')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    allDataTab === 'constructors'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {language === 'ja' ? 'コンストラクター' : 'Constructors'}
                </button>
                {selectedRace && (
                  <>
                    <button
                      onClick={() => setAllDataTab('laps')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        allDataTab === 'laps'
                          ? 'border-red-500 text-red-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {language === 'ja' ? 'ラップタイム' : 'Lap Times'}
                    </button>
                    <button
                      onClick={() => setAllDataTab('pitstops')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        allDataTab === 'pitstops'
                          ? 'border-red-500 text-red-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {language === 'ja' ? 'ピットストップ' : 'Pit Stops'}
                    </button>
                  </>
                )}
              </nav>
            </div>

            {allDataLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">
                  {language === 'ja' ? '全データを読み込み中...' : 'Loading all data...'}
                </p>
              </div>
            ) : (
              <div>
                {/* 予選結果 */}
                {allDataTab === 'qualifying' && qualifyingData?.data?.MRData?.RaceTable?.Races && (
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-black text-lg mb-4">
                      {language === 'ja' ? '予選結果' : 'Qualifying Results'}
                    </h3>
                    <div className="space-y-6">
                      {qualifyingData.data.MRData.RaceTable.Races.map((race: any) => (
                        <div key={`${race.season}-${race.round}`} className="border-b border-gray-200 pb-4">
                          <h4 className="font-semibold mb-2">{race.raceName}</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left py-2 px-3">Pos</th>
                                  <th className="text-left py-2 px-3">Driver</th>
                                  <th className="text-left py-2 px-3">Team</th>
                                  <th className="text-left py-2 px-3">Q1</th>
                                  <th className="text-left py-2 px-3">Q2</th>
                                  <th className="text-left py-2 px-3">Q3</th>
                                </tr>
                              </thead>
                              <tbody>
                                {race.QualifyingResults?.slice(0, 10).map((result: any) => (
                                  <tr key={result.Driver.driverId} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-2 px-3 font-medium">{result.position}</td>
                                    <td className="py-2 px-3">
                                      {result.Driver.givenName} {result.Driver.familyName}
                                    </td>
                                    <td className="py-2 px-3">{result.Constructor.name}</td>
                                    <td className="py-2 px-3">{result.Q1 || '-'}</td>
                                    <td className="py-2 px-3">{result.Q2 || '-'}</td>
                                    <td className="py-2 px-3">{result.Q3 || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* サーキット情報 */}
                {allDataTab === 'circuits' && circuitsData?.data?.MRData?.CircuitTable?.Circuits && (
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-black text-lg mb-4">
                      {language === 'ja' ? 'サーキット情報' : 'Circuit Information'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {circuitsData.data.MRData.CircuitTable.Circuits.map((circuit: any) => (
                        <div key={circuit.circuitId} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                          <h4 className="font-semibold mb-2">{circuit.circuitName}</h4>
                          <p className="text-sm text-gray-600">
                            {circuit.Location?.locality}, {circuit.Location?.country}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ドライバー情報 */}
                {allDataTab === 'drivers' && driversData?.data?.MRData?.DriverTable?.Drivers && (
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-black text-lg mb-4">
                      {language === 'ja' ? 'ドライバー情報' : 'Driver Information'}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-3">Name</th>
                            <th className="text-left py-2 px-3">Code</th>
                            <th className="text-left py-2 px-3">Number</th>
                            <th className="text-left py-2 px-3">Nationality</th>
                            <th className="text-left py-2 px-3">DOB</th>
                          </tr>
                        </thead>
                        <tbody>
                          {driversData.data.MRData.DriverTable.Drivers.map((driver: any) => (
                            <tr key={driver.driverId} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-2 px-3">
                                {driver.givenName} {driver.familyName}
                              </td>
                              <td className="py-2 px-3">{driver.code || '-'}</td>
                              <td className="py-2 px-3">{driver.permanentNumber || '-'}</td>
                              <td className="py-2 px-3">{driver.nationality}</td>
                              <td className="py-2 px-3">{driver.dateOfBirth}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* コンストラクター情報 */}
                {allDataTab === 'constructors' && constructorsData?.data?.MRData?.ConstructorTable?.Constructors && (
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-black text-lg mb-4">
                      {language === 'ja' ? 'コンストラクター情報' : 'Constructor Information'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {constructorsData.data.MRData.ConstructorTable.Constructors.map((constructor: any) => (
                        <div key={constructor.constructorId} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                          <h4 className="font-semibold mb-2">{constructor.name}</h4>
                          <p className="text-sm text-gray-600">{constructor.nationality}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ラップタイム */}
                {allDataTab === 'laps' && lapsData?.data?.MRData?.RaceTable?.Races?.[0]?.Laps && (
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-black text-lg mb-4">
                      {language === 'ja' ? 'ラップタイム' : 'Lap Times'}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-3">Lap</th>
                            <th className="text-left py-2 px-3">Driver</th>
                            <th className="text-left py-2 px-3">Time</th>
                            <th className="text-left py-2 px-3">Position</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lapsData.data.MRData.RaceTable.Races[0].Laps.slice(0, 20).map((lap: any) => (
                            <tr key={lap.number} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-2 px-3">{lap.number}</td>
                              <td className="py-2 px-3">
                                {lap.Timings.map((timing: any) => (
                                  <div key={timing.driverId} className="text-xs">
                                    {timing.driverId}: {timing.time}
                                  </div>
                                ))}
                              </td>
                              <td className="py-2 px-3">-</td>
                              <td className="py-2 px-3">-</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ピットストップ */}
                {allDataTab === 'pitstops' && pitstopsData?.data?.MRData?.RaceTable?.Races?.[0]?.PitStops && (
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-black text-lg mb-4">
                      {language === 'ja' ? 'ピットストップ' : 'Pit Stops'}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-3">Driver</th>
                            <th className="text-left py-2 px-3">Lap</th>
                            <th className="text-left py-2 px-3">Time</th>
                            <th className="text-left py-2 px-3">Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pitstopsData.data.MRData.RaceTable.Races[0].PitStops.map((pitstop: any) => (
                            <tr key={`${pitstop.driverId}-${pitstop.lap}`} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-2 px-3">{pitstop.driverId}</td>
                              <td className="py-2 px-3">{pitstop.lap}</td>
                              <td className="py-2 px-3">{pitstop.time}</td>
                              <td className="py-2 px-3">{pitstop.duration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* データがない場合 */}
                {((allDataTab === 'qualifying' && !qualifyingData?.data?.MRData?.RaceTable?.Races) ||
                  (allDataTab === 'circuits' && !circuitsData?.data?.MRData?.CircuitTable?.Circuits) ||
                  (allDataTab === 'drivers' && !driversData?.data?.MRData?.DriverTable?.Drivers) ||
                  (allDataTab === 'constructors' && !constructorsData?.data?.MRData?.ConstructorTable?.Constructors) ||
                  (allDataTab === 'laps' && !lapsData?.data?.MRData?.RaceTable?.Races?.[0]?.Laps) ||
                  (allDataTab === 'pitstops' && !pitstopsData?.data?.MRData?.RaceTable?.Races?.[0]?.PitStops)) && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">
                      {language === 'ja' 
                        ? 'データがありません' 
                        : 'No data available'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {/* AI取得タブ */}
        {activeTab === 'aifetch' && (
          <div className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                {language === 'ja' ? 'AI データ取得' : 'AI Data Fetch'}
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                {language === 'ja' ? 'Gemini + Google検索でFormula1.com公式データを取得します' : 'Fetch official data from Formula1.com via Gemini + Google Search'}
              </p>
              <div className="flex gap-3 mb-5 flex-wrap">
                <button onClick={() => setAiFetchType('schedule')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${aiFetchType === 'schedule' ? 'bg-red-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  {language === 'ja' ? '週末スケジュール' : 'Weekend Schedule'}
                </button>
                <button onClick={() => setAiFetchType('result')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${aiFetchType === 'result' ? 'bg-red-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  {language === 'ja' ? 'セッション結果' : 'Session Result'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Grand Prix Name</label>
                  <input type="text" value={aiGrandPrix} onChange={(e) => setAiGrandPrix(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') fetchAIData(); }}
                    placeholder="e.g. FORMULA 1 LOUIS VUITTON GRAND PRIX DE MONACO 2026"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                  <input type="number" value={aiYear} onChange={(e) => setAiYear(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
              {aiFetchType === 'result' && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Session</label>
                  <select value={aiSession} onChange={(e) => setAiSession(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                    <option value="RACE">Race</option>
                    <option value="QUALIFYING">Qualifying</option>
                    <option value="SPRINT">Sprint</option>
                    <option value="SPRINT QUALIFYING">Sprint Qualifying</option>
                    <option value="PRACTICE 1">Practice 1</option>
                    <option value="PRACTICE 2">Practice 2</option>
                    <option value="PRACTICE 3">Practice 3</option>
                  </select>
                </div>
              )}
              <button onClick={fetchAIData} disabled={aiLoading || !aiGrandPrix.trim()}
                className="w-full md:w-auto px-6 py-2.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {aiLoading ? (language === 'ja' ? '取得中...' : 'Fetching...') : (language === 'ja' ? 'AIで取得' : 'Fetch with AI')}
              </button>
            </div>
            {aiError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                <strong>Error:</strong> {aiError}
              </div>
            )}
            {aiResult && !aiResult.raw && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">{language === 'ja' ? '出力結果' : 'Output'}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const el = document.getElementById('ai-output-text');
                        if (el) navigator.clipboard.writeText(el.innerText);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                      {language === 'ja' ? 'テキストコピー' : 'Copy Text'}
                    </button>
                    <button
                      onClick={async () => {
                        const el = document.getElementById('ai-output-card');
                        if (!el) return;
                        const html2canvas = (await import('html2canvas')).default;
                        const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
                        const link = document.createElement('a');
                        link.download = (aiGrandPrix.replace(/\s+/g, '_') + '_' + (aiSession || 'SCHEDULE') + '.jpg');
                        link.href = canvas.toDataURL('image/jpeg', 0.95);
                        link.click();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      JPEG保存
                    </button>
                  </div>
                </div>
                <div id="ai-output-card" className="p-8 bg-white">
                  <div id="ai-output-text" style={{fontFamily: 'monospace'}}>
                    {aiFetchType === 'schedule' && aiResult.sessions && (
                      <div>
                        <p className="text-sm font-bold mb-5 tracking-widest">{aiResult.grandPrix || aiGrandPrix}</p>
                        <p className="text-sm font-bold mb-4">{'【Schedule】'}</p>
                        {aiResult.sessions.map((s: any, i: number) => (
                          <div key={i} className="mb-5">
                            <p className="text-sm mb-1">{s.name}</p>
                            <p className="text-sm">{'TrackTime : '}{s.date}{' '}{s.trackTime}</p>
                            <p className="text-sm">{'JapanTime : '}{s.japanDate ? s.japanDate + ' ' : ''}{s.japanTime}</p>
                          </div>
                        ))}
                        <div className="mt-2">
                          <p className="text-sm">{'TrackTime : '}{aiResult.sessions[0]?.trackTimezone}</p>
                          <p className="text-sm">{'JapanTime : UTC+9'}</p>
                        </div>
                      </div>
                    )}
                    {aiFetchType === 'result' && aiResult.results && (
                      <div>
                        <p className="text-sm font-bold mb-1 tracking-widest">{aiResult.grandPrix || aiGrandPrix}</p>
                        <p className="text-sm font-bold mb-5">{aiSession}</p>
                        <p className="text-sm font-bold mb-4">{'【Result】'}</p>
                        {aiResult.results.map((r: string, i: number) => (
                          <p key={i} className="text-sm mb-1.5">{r}</p>
                        ))}
                        {aiResult.notes && (
                          <p className="text-xs text-gray-600 mt-5 leading-relaxed whitespace-pre-wrap">{aiResult.notes}</p>
                        )}
                      </div>
                    )}
                    <div className="mt-8 pt-4 border-t border-gray-200 flex items-center gap-2">
                      <span className="text-base">{'🏎'}</span>
                      <span className="text-sm font-bold tracking-wide">rt18_formula1</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {aiResult && aiResult.raw && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">{aiResult.raw}</pre>
              </div>
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
