"use client";

import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useLanguage } from "@/components/providers/language-provider";
import { openF1Api, type OpenF1Meeting, type OpenF1Session, type OpenF1Driver, type OpenF1SessionResult } from "@/lib/openf1-api";

export default function F1DatabaseClient() {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [seasonCalendar, setSeasonCalendar] = useState<OpenF1Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<OpenF1Meeting | null>(null);
  const [sessions, setSessions] = useState<OpenF1Session[]>([]);
  const [drivers, setDrivers] = useState<OpenF1Driver[]>([]);
  const [results, setResults] = useState<OpenF1SessionResult[]>([]);
  const [activeTab, setActiveTab] = useState<'calendar' | 'meeting' | 'drivers' | 'results'>('calendar');

  // 年間カレンダーを取得
  useEffect(() => {
    const fetchSeasonCalendar = async () => {
      try {
        setLoading(true);
        const calendar = await openF1Api.getSeasonCalendar(selectedYear);
        setSeasonCalendar(calendar);
      } catch (err) {
        setError(language === 'ja' ? 'データの取得に失敗しました' : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchSeasonCalendar();
  }, [selectedYear, language]);

  // 選択されたミーティングの詳細を取得
  useEffect(() => {
    if (selectedMeeting) {
      const fetchMeetingDetails = async () => {
        try {
          setLoading(true);
          const [meetingSessions, meetingDrivers, meetingResults] = await Promise.all([
            openF1Api.getSessions({ meeting_key: selectedMeeting.meeting_key }),
            openF1Api.getDrivers({ meeting_key: selectedMeeting.meeting_key }),
            openF1Api.getSessionResults({ meeting_key: selectedMeeting.meeting_key }),
          ]);
          setSessions(meetingSessions);
          setDrivers(meetingDrivers);
          setResults(meetingResults);
        } catch (err) {
          setError(language === 'ja' ? '詳細データの取得に失敗しました' : 'Failed to fetch meeting details');
        } finally {
          setLoading(false);
        }
      };

      fetchMeetingDetails();
    }
  }, [selectedMeeting, language]);

  const handleMeetingSelect = (meeting: OpenF1Meeting) => {
    setSelectedMeeting(meeting);
    setActiveTab('meeting');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString(language === 'ja' ? 'ja-JP' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && seasonCalendar.length === 0) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">
              {language === 'ja' ? '読み込み中...' : 'Loading...'}
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
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
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
              {language === 'ja' ? 'F1データベース' : 'F1 Database'}
            </h1>
            <p className="text-gray-600 text-base md:text-lg">
              {language === 'ja' 
                ? 'Formula 1の最新データ、ドライバー情報、レース結果を確認'
                : 'Check the latest Formula 1 data, driver information, and race results'
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
                { id: 'calendar', label: language === 'ja' ? 'カレンダー' : 'Calendar' },
                { id: 'meeting', label: language === 'ja' ? 'レース詳細' : 'Race Details' },
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
                  disabled={tab.id !== 'calendar' && !selectedMeeting}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* カレンダータブ */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black mb-4">
                {selectedYear} {language === 'ja' ? 'F1シーズンカレンダー' : 'F1 Season Calendar'}
              </h2>
              <div className="grid gap-4">
                {seasonCalendar.map((meeting) => (
                  <div
                    key={meeting.meeting_key}
                    onClick={() => handleMeetingSelect(meeting)}
                    className="border border-black/10 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-black text-lg mb-1">{meeting.meeting_name}</h3>
                        <p className="text-gray-600 text-sm">
                          {meeting.location} • {meeting.country_name}
                        </p>
                      </div>
                      <div className="mt-2 md:mt-0 text-right">
                        <p className="text-sm text-gray-500">
                          {formatDate(meeting.gmt_offset)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* レース詳細タブ */}
          {activeTab === 'meeting' && selectedMeeting && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black mb-2">{selectedMeeting.meeting_name}</h2>
                <p className="text-gray-600">
                  {selectedMeeting.location} • {selectedMeeting.country_name}
                </p>
              </div>

              <div>
                <h3 className="font-black text-lg mb-3">
                  {language === 'ja' ? 'セッション' : 'Sessions'}
                </h3>
                <div className="grid gap-3">
                  {sessions.map((session) => (
                    <div key={session.session_key} className="border border-black/5 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{session.session_name}</p>
                          <p className="text-sm text-gray-500">{session.session_type}</p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>{formatDate(session.date_start)}</p>
                          <p>{formatTime(session.date_start)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ドライバータブ */}
          {activeTab === 'drivers' && selectedMeeting && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black">
                {language === 'ja' ? '参加ドライバー' : 'Participating Drivers'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {drivers.map((driver) => (
                  <div key={`${driver.driver_number}-${driver.session_key}`} className="border border-black/10 rounded-lg p-4 bg-white">
                    <div className="flex items-center space-x-3">
                      {driver.headshot_url && (
                        <img
                          src={driver.headshot_url}
                          alt={driver.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="font-black">{driver.full_name}</p>
                        <p className="text-sm text-gray-600">{driver.team_name}</p>
                        <p className="text-xs text-gray-500">#{driver.driver_number}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 結果タブ */}
          {activeTab === 'results' && selectedMeeting && (
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
                      <th className="text-right py-3 px-4 font-black text-sm">PTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results
                      .sort((a, b) => a.position - b.position)
                      .map((result) => (
                        <tr key={`${result.session_key}-${result.driver_number}`} className="border-b border-black/5">
                          <td className="py-3 px-4 font-medium">{result.position}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{result.full_name}</span>
                              <span className="text-xs text-gray-500">#{result.driver_number}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{result.team_name}</td>
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
