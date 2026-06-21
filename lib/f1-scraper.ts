import { JSDOM } from 'jsdom';
import { F1_2026_CALENDAR, F1CalendarRace } from './f1-data-constants';

// スクレイピング用の共通fetch関数
async function fetchHtml(url: string): Promise<string> {
  console.log(`[Scraper] Fetching URL: ${url}`);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    next: { revalidate: 3600 } // Next.js の機能で1時間キャッシュ
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return await res.text();
}

// 共通ヘルパー: 各レースのベース詳細URL (results上のURL) を取得
async function getRaceBaseUrl(year: number, round: number): Promise<string> {
  const url = `https://www.formula1.com/en/results.html/${year}/races.html`;
  const html = await fetchHtml(url);
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const rows = Array.from(doc.querySelectorAll('table tbody tr'));
  
  // ラウンド番号に対応する行を探す (テーブルの1列目がラウンドに相当する場合や、行のインデックス)
  // results.htmlのテーブル構造では、1行目が第1戦、2行目が第2戦...となっている
  const targetRow = rows[round - 1];
  if (!targetRow) {
    throw new Error(`Round ${round} not found in F1 results archive for year ${year}`);
  }

  const link = targetRow.querySelector('a');
  if (!link) {
    throw new Error(`No detail link found for Round ${round} in year ${year}`);
  }

  const href = link.getAttribute('href') || '';
  // 例: "/en/results.html/2026/races/1279/australia/race-result.html"
  // これをベース部分（最後のrace-result.htmlを除いたもの）に変換
  return href.replace('/race-result.html', '');
}

export class F1Scraper {
  // 年間スケジュール取得
  async scrapeSchedule(year: number) {
    try {
      // 2026年であれば、静的なスケジュール定義をベースに結果をマージする
      if (year === 2026) {
        const races = [...F1_2026_CALENDAR];
        
        // 終わったレースの結果をマージするため、results.htmlから勝者等の情報を取得する
        try {
          const url = `https://www.formula1.com/en/results.html/2026/races.html`;
          const html = await fetchHtml(url);
          const dom = new JSDOM(html);
          const doc = dom.window.document;
          const rows = Array.from(doc.querySelectorAll('table tbody tr'));

          rows.forEach((row, idx) => {
            const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim().replace(/\s+/g, ' '));
            if (cells.length >= 6) {
              const winnerName = cells[2]; // 例: "George RussellRUS"
              const winnerCode = winnerName.slice(-3);
              const winnerFullName = winnerName.slice(0, -3).trim();
              const team = cells[3];
              const time = cells[5];

              if (races[idx]) {
                races[idx] = {
                  ...races[idx],
                  results: [
                    {
                      position: 1,
                      name: winnerFullName,
                      code: winnerCode,
                      time: time,
                      points: 25, // 勝者の基本ポイント
                      team: team
                    }
                  ] as any
                };
              }
            }
          });
        } catch (e) {
          console.warn('[Scraper] Failed to merge race winners from results archive:', e);
        }

        return {
          season: year,
          races: races.map(r => ({
            round: r.round,
            name: r.officialName,
            location: r.city,
            country: r.country,
            date: r.cancelled ? 'CANCELLED' : r.raceDate, // 既存UI互換
            url: `https://www.formula1.com/en/racing/2026/${r.slug}.html`,
            results: r.results || []
          }))
        };
      }

      // 2026年以外の年（過去の年）のスケジュールを取得
      const url = `https://www.formula1.com/en/results.html/${year}/races.html`;
      const html = await fetchHtml(url);
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      const rows = Array.from(doc.querySelectorAll('table tbody tr'));
      const races = rows.map((row, idx) => {
        const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim().replace(/\s+/g, ' '));
        const link = row.querySelector('a');
        const href = link ? link.getAttribute('href') : '';
        const raceUrl = href ? `https://www.formula1.com${href}` : '';

        // 日付や開催地のパース
        // Cells: [ 'Bahrain', '02 Mar', 'Max VerstappenVER', 'Red Bull Racing...', '57', '1:31:44.742' ]
        const gpName = cells[0] || 'Grand Prix';
        const date = cells[1] || '';
        const winnerName = cells[2] || '';
        const team = cells[3] || '';
        const time = cells[5] || '';

        const winnerCode = winnerName.slice(-3);
        const winnerFullName = winnerName.slice(0, -3).trim();

        const results = winnerFullName ? [{
          position: 1,
          name: winnerFullName,
          code: winnerCode,
          time: time,
          points: 25,
          team: team
        }] : [];

        return {
          round: idx + 1,
          name: `FORMULA 1 ${gpName.toUpperCase()} GRAND PRIX ${year}`,
          location: gpName,
          country: gpName,
          date: date,
          url: raceUrl,
          results
        };
      });

      return {
        season: year,
        races
      };
    } catch (error) {
      console.error('[Scraper] Error in scrapeSchedule:', error);
      throw error;
    }
  }

  // ドライバーズランキング取得
  async scrapeDriverStandings(year: number) {
    try {
      const url = `https://www.formula1.com/en/results.html/${year}/drivers.html`;
      const html = await fetchHtml(url);
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      const rows = Array.from(doc.querySelectorAll('table tbody tr'));
      const standings = rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim().replace(/\s+/g, ' '));
        // Cells: [ '1', 'Max VerstappenVER', 'NED', 'Red Bull Racing...', '156' ] (年によって列数は若干変動)
        const pos = cells[0] || '0';
        const driverNameRaw = cells[1] || '';
        const nationality = cells[2] || '';
        const car = cells[3] || '';
        const pts = cells[4] || '0';

        const code = driverNameRaw.slice(-3);
        const fullName = driverNameRaw.slice(0, -3).trim();
        const names = fullName.split(' ');
        const givenName = names[0] || '';
        const familyName = names.slice(1).join(' ') || '';

        return {
          position: pos,
          points: pts,
          wins: '0', // スクレイピングの表からは直接勝数が取れないため0でフォールバック
          Driver: {
            driverId: fullName.toLowerCase().replace(/\s+/g, '_'),
            permanentNumber: '',
            code: code,
            url: '',
            givenName,
            familyName,
            dateOfBirth: '',
            nationality
          },
          Constructors: [
            {
              constructorId: car.toLowerCase().replace(/\s+/g, '_'),
              url: '',
              name: car,
              nationality: ''
            }
          ]
        };
      });

      return {
        MRData: {
          xmlns: "",
          series: "f1",
          url: `http://api.jolpi.ca/ergast/f1/${year}/driverstandings`,
          limit: "100",
          offset: "0",
          total: String(standings.length),
          StandingsTable: {
            season: String(year),
            StandingsLists: [
              {
                season: String(year),
                round: "0",
                DriverStandings: standings
              }
            ]
          }
        }
      };
    } catch (error) {
      console.error('[Scraper] Error in scrapeDriverStandings:', error);
      throw error;
    }
  }

  // コンストラクターズランキング取得
  async scrapeConstructorStandings(year: number) {
    try {
      const url = `https://www.formula1.com/en/results.html/${year}/team.html`;
      const html = await fetchHtml(url);
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      const rows = Array.from(doc.querySelectorAll('table tbody tr'));
      const standings = rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim().replace(/\s+/g, ' '));
        // Cells: [ '1', 'Red Bull Racing...', '289' ]
        const pos = cells[0] || '0';
        const teamName = cells[1] || '';
        const pts = cells[2] || '0';

        return {
          position: pos,
          points: pts,
          wins: '0',
          Constructor: {
            constructorId: teamName.toLowerCase().replace(/\s+/g, '_'),
            url: '',
            name: teamName,
            nationality: ''
          }
        };
      });

      return {
        MRData: {
          xmlns: "",
          series: "f1",
          url: `http://api.jolpi.ca/ergast/f1/${year}/constructorstandings`,
          limit: "100",
          offset: "0",
          total: String(standings.length),
          StandingsTable: {
            season: String(year),
            StandingsLists: [
              {
                season: String(year),
                round: "0",
                ConstructorStandings: standings
              }
            ]
          }
        }
      };
    } catch (error) {
      console.error('[Scraper] Error in scrapeConstructorStandings:', error);
      throw error;
    }
  }

  // 決勝結果取得
  async scrapeRaceResults(year: number, round: number) {
    try {
      const baseHref = await getRaceBaseUrl(year, round);
      const url = `https://www.formula1.com${baseHref}/race-result.html`;
      const html = await fetchHtml(url);
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      const title = doc.title || '';
      const tables = doc.querySelectorAll('table');
      const table = tables[0];
      if (!table) {
        throw new Error(`No results table found for round ${round} in year ${year}`);
      }

      const rows = Array.from(table.querySelectorAll('tbody tr'));
      const results = rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim().replace(/\s+/g, ' '));
        // Cells: [ '1', '1', 'Max VerstappenVER', 'Red Bull Racing...', '57', '1:31:44.742', '26' ]
        const pos = cells[0] || '0';
        const num = cells[1] || '';
        const driverNameRaw = cells[2] || '';
        const teamName = cells[3] || '';
        const laps = cells[4] || '0';
        const time = cells[5] || '';
        const pts = cells[6] || '0';

        const code = driverNameRaw.slice(-3);
        const fullName = driverNameRaw.slice(0, -3).trim();
        const names = fullName.split(' ');
        const givenName = names[0] || '';
        const familyName = names.slice(1).join(' ') || '';

        return {
          number: num,
          position: pos,
          positionText: pos,
          points: pts,
          Driver: {
            driverId: fullName.toLowerCase().replace(/\s+/g, '_'),
            permanentNumber: num,
            code: code,
            url: '',
            givenName,
            familyName,
            dateOfBirth: '',
            nationality: ''
          },
          Constructor: {
            constructorId: teamName.toLowerCase().replace(/\s+/g, '_'),
            url: '',
            name: teamName,
            nationality: ''
          },
          grid: '0', // スターティンググリッドは別表のため省略または0で埋める
          laps: laps,
          status: time.includes(':') || time.includes('+') ? 'Finished' : time,
          Time: {
            time: time
          }
        };
      });

      return {
        MRData: {
          xmlns: "",
          series: "f1",
          url: `http://api.jolpi.ca/ergast/f1/${year}/${round}/results`,
          limit: "100",
          offset: "0",
          total: String(results.length),
          RaceTable: {
            season: String(year),
            round: String(round),
            Races: [
              {
                season: String(year),
                round: String(round),
                url: url,
                raceName: title.replace(' - RACE RESULT', '').trim(),
                Circuit: {
                  circuitId: 'unknown',
                  url: '',
                  circuitName: 'Unknown Circuit',
                  Location: { lat: '0', long: '0', locality: '', country: '' }
                },
                date: '',
                Results: results
              }
            ]
          }
        }
      };
    } catch (error) {
      console.error(`[Scraper] Error in scrapeRaceResults for round ${round}:`, error);
      throw error;
    }
  }

  // 予選結果取得
  async scrapeQualifyingResults(year: number, round: number) {
    try {
      const baseHref = await getRaceBaseUrl(year, round);
      const url = `https://www.formula1.com${baseHref}/qualifying.html`;
      const html = await fetchHtml(url);
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      const title = doc.title || '';
      const tables = doc.querySelectorAll('table');
      const table = tables[0];
      if (!table) {
        throw new Error(`No qualifying table found for round ${round} in year ${year}`);
      }

      const rows = Array.from(table.querySelectorAll('tbody tr'));
      const results = rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim().replace(/\s+/g, ' '));
        // Cells: [ '1', '1', 'Max VerstappenVER', 'Red Bull Racing...', '1:30.031', '1:29.374', '1:29.179', '17' ]
        const pos = cells[0] || '0';
        const num = cells[1] || '';
        const driverNameRaw = cells[2] || '';
        const teamName = cells[3] || '';
        const q1 = cells[4] || '';
        const q2 = cells[5] || '';
        const q3 = cells[6] || '';

        const code = driverNameRaw.slice(-3);
        const fullName = driverNameRaw.slice(0, -3).trim();
        const names = fullName.split(' ');
        const givenName = names[0] || '';
        const familyName = names.slice(1).join(' ') || '';

        return {
          number: num,
          position: pos,
          Driver: {
            driverId: fullName.toLowerCase().replace(/\s+/g, '_'),
            permanentNumber: num,
            code: code,
            url: '',
            givenName,
            familyName,
            dateOfBirth: '',
            nationality: ''
          },
          Constructor: {
            constructorId: teamName.toLowerCase().replace(/\s+/g, '_'),
            url: '',
            name: teamName,
            nationality: ''
          },
          Q1: q1,
          Q2: q2,
          Q3: q3
        };
      });

      return {
        MRData: {
          xmlns: "",
          series: "f1",
          url: `http://api.jolpi.ca/ergast/f1/${year}/${round}/qualifying`,
          limit: "100",
          offset: "0",
          total: String(results.length),
          RaceTable: {
            season: String(year),
            round: String(round),
            Races: [
              {
                season: String(year),
                round: String(round),
                url: url,
                raceName: title.replace(' - QUALIFYING', '').trim(),
                Circuit: {
                  circuitId: 'unknown',
                  url: '',
                  circuitName: 'Unknown Circuit',
                  Location: { lat: '0', long: '0', locality: '', country: '' }
                },
                date: '',
                QualifyingResults: results
              }
            ]
          }
        }
      };
    } catch (error) {
      console.error(`[Scraper] Error in scrapeQualifyingResults for round ${round}:`, error);
      throw error;
    }
  }

  // スプリント結果取得
  async scrapeSprintResults(year: number, round: number) {
    try {
      const baseHref = await getRaceBaseUrl(year, round);
      const url = `https://www.formula1.com${baseHref}/sprint-results.html`;
      const html = await fetchHtml(url);
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      const title = doc.title || '';
      const tables = doc.querySelectorAll('table');
      const table = tables[0];
      if (!table) {
        throw new Error(`No sprint table found for round ${round} in year ${year}`);
      }

      const rows = Array.from(table.querySelectorAll('tbody tr'));
      const results = rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim().replace(/\s+/g, ' '));
        // Cells: 同様にPos, No, Driver, Team, Laps, Time, Pts
        const pos = cells[0] || '0';
        const num = cells[1] || '';
        const driverNameRaw = cells[2] || '';
        const teamName = cells[3] || '';
        const laps = cells[4] || '0';
        const time = cells[5] || '';
        const pts = cells[6] || '0';

        const code = driverNameRaw.slice(-3);
        const fullName = driverNameRaw.slice(0, -3).trim();
        const names = fullName.split(' ');
        const givenName = names[0] || '';
        const familyName = names.slice(1).join(' ') || '';

        return {
          number: num,
          position: pos,
          points: pts,
          Driver: {
            driverId: fullName.toLowerCase().replace(/\s+/g, '_'),
            permanentNumber: num,
            code: code,
            url: '',
            givenName,
            familyName,
            dateOfBirth: '',
            nationality: ''
          },
          Constructor: {
            constructorId: teamName.toLowerCase().replace(/\s+/g, '_'),
            url: '',
            name: teamName,
            nationality: ''
          },
          laps: laps,
          status: time.includes(':') || time.includes('+') ? 'Finished' : time,
          Time: {
            time: time
          }
        };
      });

      return {
        MRData: {
          xmlns: "",
          series: "f1",
          url: `http://api.jolpi.ca/ergast/f1/${year}/${round}/sprint`,
          limit: "100",
          offset: "0",
          total: String(results.length),
          RaceTable: {
            season: String(year),
            round: String(round),
            Races: [
              {
                season: String(year),
                round: String(round),
                url: url,
                raceName: title.replace(' - SPRINT RESULT', '').trim(),
                Circuit: {
                  circuitId: 'unknown',
                  url: '',
                  circuitName: 'Unknown Circuit',
                  Location: { lat: '0', long: '0', locality: '', country: '' }
                },
                date: '',
                SprintResults: results
              }
            ]
          }
        }
      };
    } catch (error) {
      console.warn(`[Scraper] Sprint data not available for round ${round} in year ${year}:`, error instanceof Error ? error.message : String(error));
      // スプリントが開催されていない週末は、空のデータ構造を返して破綻を防ぐ
      return {
        MRData: {
          xmlns: "",
          series: "f1",
          url: `http://api.jolpi.ca/ergast/f1/${year}/${round}/sprint`,
          limit: "100",
          offset: "0",
          total: "0",
          RaceTable: {
            season: String(year),
            round: String(round),
            Races: []
          }
        }
      };
    }
  }

  // レースのセッション日程（UTC時刻）を取得 (JSON-LDから)
  async scrapeRaceSessions(year: number, round: number) {
    try {
      const race = F1_2026_CALENDAR.find(r => r.round === round);
      if (!race) {
        throw new Error(`Round ${round} is not defined in 2026 calendar constants`);
      }

      // 2026年バルセロナの例: https://www.formula1.com/en/racing/2026/barcelona-catalunya.html
      const url = `https://www.formula1.com/en/racing/${year}/${race.slug}.html`;
      const html = await fetchHtml(url);
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      const scripts = doc.querySelectorAll('script');
      let sessionData: any[] = [];
      
      scripts.forEach(script => {
        const text = script.textContent?.trim() || '';
        if (text.startsWith('{"@context":"http://schema.org"')) {
          try {
            const obj = JSON.parse(text);
            if (Array.isArray(obj.subEvent)) {
              sessionData = obj.subEvent.map((sub: any) => {
                const name = sub.name || '';
                // 例: "Practice 1 - Barcelona Grand Prix" からセッション基本名を取り出す
                let sessionName = 'Unknown';
                if (name.includes('Practice 1')) sessionName = 'Practice 1';
                else if (name.includes('Practice 2')) sessionName = 'Practice 2';
                else if (name.includes('Practice 3')) sessionName = 'Practice 3';
                else if (name.includes('Sprint Qualifying')) sessionName = 'Sprint Qualifying';
                else if (name.includes('Sprint')) sessionName = 'Sprint';
                else if (name.includes('Qualifying')) sessionName = 'Qualifying';
                else if (name.includes('Race')) sessionName = 'Race';

                return {
                  name: sessionName,
                  startDate: sub.startDate, // UTC ISO文字列
                  endDate: sub.endDate,
                };
              });
            }
          } catch (e) {
            console.error('[Scraper] Failed to parse JSON-LD script tag:', e);
          }
        }
      });

      if (sessionData.length === 0) {
        throw new Error(`No session timing data (JSON-LD) found on race detail page for ${race.country}`);
      }

      return {
        round,
        country: race.country,
        utcOffset: race.utcOffset,
        sessions: sessionData
      };
    } catch (error) {
      console.error(`[Scraper] Error in scrapeRaceSessions for round ${round}:`, error);
      throw error;
    }
  }
}

export const f1Scraper = new F1Scraper();
