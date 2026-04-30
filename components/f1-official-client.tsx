"use client";

import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useLanguage } from "@/components/providers/language-provider";
import { f1OfficialApi, type F1OfficialRace, type RaceResult } from "@/lib/f1-official-api";

export default function F1OfficialClient() {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [raceSchedule, setRaceSchedule] = useState<F1OfficialRace[]>([]);
  const [selectedRace, setSelectedRace] = useState<F1OfficialRace | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'schedule' | 'race' | 'results'>('schedule');

  // 利用可能な年を取得
  useEffect(() => {
    const fetchAvailableYears = async () => {
      try {
        const years = await f1OfficialApi.getAvailableYears();
        setAvailableYears(years);
      } catch (err) {
        console.error('Error setting available years:', err);
      }
    };

    fetchAvailableYears();
  }, []);

  // レーススケジュールを取得
  useEffect(() => {
    const fetchRaceSchedule = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching F1 Official race schedule for year:', selectedYear);
        const schedule = await f1OfficialApi.getRaceSchedule(selectedYear);
        console.log('F1 Official race schedule received:', schedule.length);
        setRaceSchedule(schedule);
      } catch (err) {
        console.error('Error fetching F1 Official race schedule:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`${language === 'ja' ? 'データの取得に失敗しました: ' : 'Failed to fetch data: '}${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchRaceSchedule();
  }, [selectedYear, language]);

  const handleRaceSelect = (race: F1OfficialRace) => {
    setSelectedRace(race);
    setActiveTab('race');
  };

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

  if (loading && raceSchedule.length === 0) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">
              {language === 'ja' ? 'F1公式サイトデータを読み込み中...' : 'Loading F1 Official data...'}
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
                ? 'F1公式サイトデータを表示しています。安定性のため静的データを使用しています。'
                : 'Displaying F1 Official website data. Using static data for stability.'
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
              {language === 'ja' ? 'F1 DB' : 'F1 DB'}
            </h1>
            <p className="text-gray-600 text-base md:text-lg">
              {language === 'ja' 
                ? 'Formula 1公式サイトから取得した最新データ、レース情報、結果'
                : 'Latest Formula 1 data, race information, and results from official F1 website'
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
              {availableYears.map(year => (
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
                {raceSchedule.map((race) => {
                  const raceStatus = getRaceStatus(race);
                  return (
                    <div
                      key={`${selectedYear}-${race.round}`}
                      onClick={() => handleRaceSelect(race)}
                      className="border border-black/10 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`text-lg font-black ${raceStatus.color}`}>
                              {raceStatus.icon}
                            </span>
                            <h3 className="font-black text-lg">{race.name}</h3>
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
                  );
                })}
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
                  Round {selectedRace.round} • {formatDate(selectedRace.date)}
                </p>
                <div className="mt-2">
                  <a 
                    href={selectedRace.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    {language === 'ja' ? '公式サイトで見る' : 'View on Official Site'}
                  </a>
                </div>
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
                    <p className="font-medium">{language === 'ja' ? '場所' : 'Location'}</p>
                    <p className="text-gray-600">{selectedRace.location}</p>
                  </div>
                  <div>
                    <p className="font-medium">{language === 'ja' ? '国' : 'Country'}</p>
                    <p className="text-gray-600">{selectedRace.country}</p>
                  </div>
                  <div>
                    <p className="font-medium">{language === 'ja' ? 'ラウンド' : 'Round'}</p>
                    <p className="text-gray-600">{selectedRace.round}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 結果タブ */}
          {activeTab === 'results' && selectedRace && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black">
                {language === 'ja' ? 'レース結果' : 'Race Results'}
              </h2>
              
              {selectedRace.results && selectedRace.results.length > 0 ? (
                <div className="space-y-4">
                  {/* 表彰台 */}
                  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 rounded-lg">
                    <h3 className="font-black text-lg mb-4">
                      {language === 'ja' ? '表彰台' : 'Podium'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* 1位 */}
                      <div className="text-center">
                        <div className="text-4xl mb-2">🥇</div>
                        <div className="font-black text-lg">{selectedRace.results[0].name}</div>
                        <div className="text-sm text-gray-600">{selectedRace.results[0].code}</div>
                        <div className="text-sm font-medium">{selectedRace.results[0].time}</div>
                        <div className="text-xs text-gray-500">{selectedRace.results[0].team}</div>
                        <div className="text-xs font-medium text-gray-700">{selectedRace.results[0].points} pts</div>
                      </div>
                      
                      {/* 2位 */}
                      {selectedRace.results[1] && (
                        <div className="text-center">
                          <div className="text-4xl mb-2">🥈</div>
                          <div className="font-black text-lg">{selectedRace.results[1].name}</div>
                          <div className="text-sm text-gray-600">{selectedRace.results[1].code}</div>
                          <div className="text-sm font-medium">{selectedRace.results[1].time}</div>
                          <div className="text-xs text-gray-500">{selectedRace.results[1].team}</div>
                          <div className="text-xs font-medium text-gray-700">{selectedRace.results[1].points} pts</div>
                        </div>
                      )}
                      
                      {/* 3位 */}
                      {selectedRace.results[2] && (
                        <div className="text-center">
                          <div className="text-4xl mb-2">🥉</div>
                          <div className="font-black text-lg">{selectedRace.results[2].name}</div>
                          <div className="text-sm text-gray-600">{selectedRace.results[2].code}</div>
                          <div className="text-sm font-medium">{selectedRace.results[2].time}</div>
                          <div className="text-xs text-gray-500">{selectedRace.results[2].team}</div>
                          <div className="text-xs font-medium text-gray-700">{selectedRace.results[2].points} pts</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 完全な結果リスト */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="font-black text-lg mb-4">
                      {language === 'ja' ? '完全な結果' : 'Full Results'}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-3">Pos</th>
                            <th className="text-left py-2 px-3">Driver</th>
                            <th className="text-left py-2 px-3">Team</th>
                            <th className="text-left py-2 px-3">Time</th>
                            <th className="text-left py-2 px-3">Points</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedRace.results.map((result) => (
                            <tr key={result.position} className="border-b border-gray-100 hover:bg-gray-100">
                              <td className="py-2 px-3 font-medium">{result.position}</td>
                              <td className="py-2 px-3">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{result.name}</span>
                                  <span className="text-gray-500 text-xs">({result.code})</span>
                                </div>
                              </td>
                              <td className="py-2 px-3 text-gray-600">{result.team}</td>
                              <td className="py-2 px-3 text-gray-600">{result.time}</td>
                              <td className="py-2 px-3 font-medium">{result.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {language === 'ja' ? 'このレースはまだ開催されていません' : 'This race has not been held yet'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
