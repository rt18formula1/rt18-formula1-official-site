"use client";

import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useLanguage } from "@/components/providers/language-provider";
import { jolpicaApi, type F1OfficialRace, type RaceResult } from "@/lib/jolpica-api";

export default function F1JolpicaClient() {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [raceSchedule, setRaceSchedule] = useState<F1OfficialRace[]>([]);
  const [selectedRace, setSelectedRace] = useState<F1OfficialRace | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'schedule' | 'details' | 'standings'>('schedule');
  const [apiStatus, setApiStatus] = useState<{ isAvailable: boolean; responseTime?: number; error?: string } | null>(null);
  const [driverStandings, setDriverStandings] = useState<any>(null);
  const [constructorStandings, setConstructorStandings] = useState<any>(null);
  const [standingsLoading, setStandingsLoading] = useState(false);

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

  // タブがstandingsに切り替わったときにスタンディングスを取得
  useEffect(() => {
    if (activeTab === 'standings') {
      fetchStandings();
    }
  }, [activeTab, selectedYear]);

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
              {selectedRace.name} - {language === 'ja' ? 'レース詳細' : 'Race Details'}
            </h2>
            
            {/* レース基本情報 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-black text-lg mb-4">{selectedRace.name}</h3>
                  <div className="space-y-2">
                    <p className="text-gray-600">
                      <span className="font-medium">{language === 'ja' ? 'ラウンド:' : 'Round:'}</span> {selectedRace.round}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">{language === 'ja' ? '場所:' : 'Location:'}</span> {selectedRace.location}, {selectedRace.country}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">{language === 'ja' ? '日付:' : 'Date:'}</span> {formatDate(selectedRace.date)}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">{language === 'ja' ? 'サーキット情報' : 'Circuit Info'}</h4>
                  <p className="text-gray-600">{selectedRace.location}</p>
                  <p className="text-gray-600">{selectedRace.country}</p>
                </div>
              </div>
              <div className="mt-6">
                <a
                  href={selectedRace.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  {language === 'ja' ? '詳細を見る' : 'View Details'} →
                </a>
              </div>
            </div>

            {/* レース結果 */}
            <h3 className="text-xl font-black mb-4">
              {language === 'ja' ? 'レース結果' : 'Race Results'}
            </h3>
            
            {selectedRace.results && selectedRace.results.length > 0 ? (
              <div className="space-y-4">
                {/* 表彰台 */}
                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 rounded-lg">
                  <h4 className="font-black text-lg mb-4">
                    {language === 'ja' ? '表彰台' : 'Podium'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedRace.results.slice(0, 3).map((result, index) => (
                      <div key={result.position} className="text-center">
                        <div className="text-4xl mb-2">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </div>
                        <div className="font-black text-lg">{result.name}</div>
                        <div className="text-sm text-gray-600">{result.code}</div>
                        <div className="text-sm font-medium">{result.time}</div>
                        <div className="text-xs text-gray-500">{result.team}</div>
                        <div className="text-xs font-medium text-gray-700">{result.points} pts</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 完全な結果リスト */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-black text-lg mb-4">
                    {language === 'ja' ? '完全な結果' : 'Full Results'}
                  </h4>
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
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">
                  {language === 'ja' ? 'このレースはまだ開催されていません' : 'This race has not been held yet'}
                </p>
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

            {standingsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">
                  {language === 'ja' ? 'シーズンリザルトを読み込み中...' : 'Loading season results...'}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* ドライバースタンディングス */}
                {driverStandings?.data?.MRData?.StandingsTable?.Standings && (
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-black text-lg mb-4">
                      {language === 'ja' ? 'ドライバーランキング' : 'Driver Championship'}
                    </h3>
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
                          {driverStandings.data.MRData.StandingsTable.Standings.map((standing: any, index: number) => (
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
                )}

                {/* コンストラクタースタンディングス */}
                {constructorStandings?.data?.MRData?.StandingsTable?.Standings && (
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-black text-lg mb-4">
                      {language === 'ja' ? 'チームランキング' : 'Constructor Championship'}
                    </h3>
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
                          {constructorStandings.data.MRData.StandingsTable.Standings.map((standing: any) => (
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
                )}

                {/* データがない場合 */}
                {(!driverStandings?.data?.MRData?.StandingsTable?.Standings || 
                  driverStandings?.data?.MRData?.StandingsTable?.Standings.length === 0) && 
                 (!constructorStandings?.data?.MRData?.StandingsTable?.Standings || 
                  constructorStandings?.data?.MRData?.StandingsTable?.Standings.length === 0) && (
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
      </main>
      <SiteFooter />
    </div>
  );
}
