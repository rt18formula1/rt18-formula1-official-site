"use client";

import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useLanguage } from "@/components/providers/language-provider";
import { fastF1Api, type FastF1Race, type FastF1Driver, type FastF1Result } from "@/lib/fastf1-api";

export default function F1FastClient() {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [raceSchedule, setRaceSchedule] = useState<FastF1Race[]>([]);
  const [selectedRace, setSelectedRace] = useState<FastF1Race | null>(null);
  const [drivers, setDrivers] = useState<FastF1Driver[]>([]);
  const [results, setResults] = useState<FastF1Result[]>([]);
  const [activeTab, setActiveTab] = useState<'schedule' | 'race' | 'drivers' | 'results'>('schedule');

  // レーススケジュールを取得
  useEffect(() => {
    const fetchRaceSchedule = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching race schedule for year:', selectedYear);
        const schedule = await fastF1Api.getRaceSchedule(selectedYear);
        console.log('Race schedule received:', schedule.length);
        setRaceSchedule(schedule);
      } catch (err) {
        console.error('Error fetching race schedule:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`${language === 'ja' ? 'データの取得に失敗しました: ' : 'Failed to fetch data: '}${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchRaceSchedule();
  }, [selectedYear, language]);

  // 選択されたレースの詳細を取得
  useEffect(() => {
    if (selectedRace) {
      const fetchRaceDetails = async () => {
        try {
          setLoading(true);
          setError(null);
          console.log('Fetching race details for:', selectedRace.name);
          
          const [raceDrivers, raceResults] = await Promise.all([
            fastF1Api.getDrivers(selectedYear, selectedRace.round),
            fastF1Api.getRaceResults(selectedYear, selectedRace.round),
          ]);
          
          console.log('Drivers received:', raceDrivers.length);
          console.log('Results received:', raceResults.length);
          
          setDrivers(raceDrivers);
          setResults(raceResults);
        } catch (err) {
          console.error('Error fetching race details:', err);
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          setError(`${language === 'ja' ? '詳細データの取得に失敗しました: ' : 'Failed to fetch race details: '}${errorMessage}`);
        } finally {
          setLoading(false);
        }
      };

      fetchRaceDetails();
    }
  }, [selectedRace, selectedYear, language]);

  const handleRaceSelect = (race: FastF1Race) => {
    setSelectedRace(race);
    setActiveTab('race');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && raceSchedule.length === 0) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">
              {language === 'ja' ? 'FastF1データを読み込み中...' : 'Loading FastF1 data...'}
            </p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <p className="text-red-500 mb-4">{error}</p>
            <p className="text-sm text-gray-600 mb-4">
              {language === 'ja' 
                ? 'FastF1 Pythonライブラリが必要です。サーバー環境にPythonとFastF1がインストールされていることを確認してください。'
                : 'FastF1 Python library is required. Please ensure Python and FastF1 are installed on the server.'
              }
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
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
    <div className="min-h-screen bg-white text-black flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 md:py-8">
          {/* ヘッダー */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-5xl font-black mb-4">
              {language === 'ja' ? 'F1データベース (FastF1)' : 'F1 Database (FastF1)'}
            </h1>
            <p className="text-gray-600 text-base md:text-lg">
              {language === 'ja' 
                ? 'FastF1を使用したFormula 1の最新データ、ドライバー情報、レース結果'
                : 'Latest Formula 1 data, driver information, and race results powered by FastF1'
              }
            </p>
          </div>

          {/* 年選択 */}
          <div className="mb-6">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-black/10 rounded-lg bg-white text-black"
            >
              {[2024, 2023, 2025].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* タブナビゲーション */}
          <div className="border-b border-black/10 mb-6">
            <div className="flex space-x-8">
              {[
                { id: 'schedule', label: language === 'ja' ? 'スケジュール' : 'Schedule' },
                { id: 'race', label: language === 'ja' ? 'レース詳細' : 'Race Details' },
                { id: 'drivers', label: language === 'ja' ? 'ドライバー' : 'Drivers' },
                { id: 'results', label: language === 'ja' ? '結果' : 'Results' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-3 px-1 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-black text-black font-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  disabled={tab.id !== 'schedule' && !selectedRace}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* スケジュールタブ */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black mb-4">
                {selectedYear} {language === 'ja' ? 'F1シーズンスケジュール' : 'F1 Season Schedule'}
              </h2>
              <div className="grid gap-4">
                {raceSchedule.map((race) => (
                  <div
                    key={race.meeting_key}
                    onClick={() => handleRaceSelect(race)}
                    className="border border-black/10 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-black text-lg mb-1">{race.name}</h3>
                        <p className="text-gray-600 text-sm">
                          {race.location} • {race.country}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {race.circuit}
                        </p>
                      </div>
                      <div className="mt-2 md:mt-0 text-right">
                        <p className="text-sm text-gray-500">
                          Round {race.round}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(race.date)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* レース詳細タブ */}
          {activeTab === 'race' && selectedRace && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black mb-2">{selectedRace.name}</h2>
                <p className="text-gray-600">
                  {selectedRace.location} • {selectedRace.country}
                </p>
                <p className="text-gray-500 text-sm">
                  {selectedRace.circuit} • Round {selectedRace.round}
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-black text-lg mb-3">
                  {language === 'ja' ? 'レース情報' : 'Race Information'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">{language === 'ja' ? '開催日' : 'Date'}</p>
                    <p className="text-gray-600">{formatDate(selectedRace.date)}</p>
                  </div>
                  <div>
                    <p className="font-medium">{language === 'ja' ? 'サーキット' : 'Circuit'}</p>
                    <p className="text-gray-600">{selectedRace.circuit}</p>
                  </div>
                  <div>
                    <p className="font-medium">{language === 'ja' ? '場所' : 'Location'}</p>
                    <p className="text-gray-600">{selectedRace.location}</p>
                  </div>
                  <div>
                    <p className="font-medium">{language === 'ja' ? 'ラウンド' : 'Round'}</p>
                    <p className="text-gray-600">{selectedRace.round}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ドライバータブ */}
          {activeTab === 'drivers' && selectedRace && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black">
                {language === 'ja' ? '参加ドライバー' : 'Participating Drivers'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {drivers.map((driver) => (
                  <div key={driver.driver_number} className="border border-black/10 rounded-lg p-4 bg-white">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="font-black text-sm">#{driver.driver_number}</span>
                      </div>
                      <div>
                        <p className="font-black">{driver.full_name}</p>
                        <p className="text-sm text-gray-600">{driver.team_name}</p>
                        {driver.abbreviation && (
                          <p className="text-xs text-gray-500">{driver.abbreviation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 結果タブ */}
          {activeTab === 'results' && selectedRace && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black">
                {language === 'ja' ? 'レース結果' : 'Race Results'}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-black/10">
                      <th className="text-left py-3 px-4 font-black text-sm">POS</th>
                      <th className="text-left py-3 px-4 font-black text-sm">
                        {language === 'ja' ? 'ドライバー' : 'Driver'}
                      </th>
                      <th className="text-left py-3 px-4 font-black text-sm">
                        {language === 'ja' ? 'チーム' : 'Team'}
                      </th>
                      <th className="text-left py-3 px-4 font-black text-sm">GRID</th>
                      <th className="text-right py-3 px-4 font-black text-sm">PTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results
                      .sort((a, b) => a.position - b.position)
                      .map((result) => (
                        <tr key={result.driver_number} className="border-b border-black/5">
                          <td className="py-3 px-4 font-medium">{result.position}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{result.driver_name}</span>
                              <span className="text-xs text-gray-500">#{result.driver_number}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{result.team_name}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{result.grid_position}</td>
                          <td className="py-3 px-4 text-right font-medium">{result.points}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
