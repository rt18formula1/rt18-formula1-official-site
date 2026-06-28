// F1 official site (formula1.com) results scraper.
// formula1.com results pages are server-side rendered, so a plain fetch + HTML
// table parse works without running any JS. This is the primary, free, and most
// accurate source for session results (race / qualifying / sprint / sprint
// qualifying) and the weekend schedule.
//
// URL pattern:
//   https://www.formula1.com/en/results/{year}/races/{meetingId}/{f1Slug}/{page}
//
// page values we use:
//   race-result | qualifying | sprint-results | sprint-qualifying

import type { F1CalendarRace } from "./f1-data-constants";

const BASE = "https://www.formula1.com/en/results";

export type F1ScrapedSessionType =
  | "race-result"
  | "qualifying"
  | "sprint-results"
  | "sprint-qualifying";

export interface F1ScrapedResultRow {
  position: string; // "1", "NC", "DNF", "DNS" text in Pos. column kept as-is
  driverName: string;
  team: string;
  laps?: string;
  timeOrRetired?: string;
  points?: string;
}

export interface F1ScrapedResult {
  grandPrix: string;
  rows: F1ScrapedResultRow[];
  notes: string | null;
}

function buildUrl(race: F1CalendarRace, year: number, page: F1ScrapedSessionType): string | null {
  if (!race.meetingId) return null;
  const slug = race.f1Slug || race.slug;
  return `${BASE}/${year}/races/${race.meetingId}/${slug}/${page}`;
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      // results pages don't change after a race weekend; cache briefly to be a
      // good citizen and reduce load on formula1.com
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const raw = await res.text();
    // Remove <script> blocks to prevent JSON-LD / inline JS from polluting table parsing
    return raw.replace(/<script[\s\S]*?<\/script>/gi, "");
  } catch {
    return null;
  }
}

/**
 * Extract the results table from a formula1.com results page.
 * The table rows look like:
 *   <tr>
 *     <td>1</td>
 *     <td>63</td>
 *     <td>...driver image/name markup incl. "George RussellRUS"...</td>
 *     <td>...team image/name markup incl. "Mercedes"...</td>
 *     <td>58</td>
 *     <td>1:23:06.801</td>
 *     <td>25</td>
 *   </tr>
 * We strip tags conservatively and split driver display name from its 3-letter code.
 */
function parseResultsTable(html: string): F1ScrapedResultRow[] {
  const rows: F1ScrapedResultRow[] = [];

  // Isolate the results table body to avoid matching unrelated <tr> elements
  // (nav, footer, partner grids, etc).
  const tableMatch = html.match(/<table[^>]*>[\s\S]*?<\/table>/i);
  if (!tableMatch) return rows;
  const tableHtml = tableMatch[0];

  const rowMatches = tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];

  for (const rowHtml of rowMatches) {
    const cellMatches = rowHtml.match(/<td[^>]*>[\s\S]*?<\/td>/gi);
    if (!cellMatches || cellMatches.length < 5) continue; // skip header row

    const cellTexts = cellMatches.map((cell) =>
      cell
        .replace(/<[^>]+>/g, " ") // strip tags
        .replace(/&amp;/g, "&")
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim()
    );

    // Expected columns: Pos | No. | Driver | Team | Laps | Time/Retired | Pts.
    // Some session pages (qualifying, sprint-qualifying) have a different
    // column count (e.g. Q1/Q2/Q3 times instead of Laps/Time/Pts), so we stay
    // defensive and only require Pos/Driver/Team to exist.
    if (cellTexts.length < 4) continue;

    const position = cellTexts[0];
    if (!position) continue;

    const driverName = cellTexts[2] || "";
    const team = cellTexts[3] || "";
    if (!driverName) continue;

    const row: F1ScrapedResultRow = {
      position,
      driverName,
      team,
    };

    if (cellTexts.length >= 7) {
      row.laps = cellTexts[4];
      row.timeOrRetired = cellTexts[5];
      row.points = cellTexts[6];
    } else if (cellTexts.length >= 5) {
      row.timeOrRetired = cellTexts[cellTexts.length - 2];
      row.points = cellTexts[cellTexts.length - 1];
    }

    rows.push(row);
  }

  return rows;
}

/** Strip the trailing 3-letter driver code formula1.com appends, e.g. "George RussellRUS" -> "George Russell" */
function cleanDriverName(raw: string): string {
  const m = raw.match(/^(.*?)([A-Z]{3})$/);
  if (m && m[1].trim().length > 0) {
    return m[1].trim();
  }
  return raw.trim();
}

function extractNotes(html: string): string | null {
  // Match "Note - ..." blocks that start with a proper name (mixed-case first word).
  // Returns the raw text as-is from the official site, joined by newline if multiple blocks.
  const noteRegex = /Note\s*-\s*([A-Z][a-z][^<]{10,}?)(?=\s*(?:Note\s*-|<|$))/g;
  const notes: string[] = [];
  let m: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((m = noteRegex.exec(html)) !== null) {
    const raw = m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (/OUR PARTNERS|Download the|Cookie Preferences|Formula One World/i.test(raw)) break;
    const note = raw.replace(/\.?$/, ".");
    notes.push(note);
  }
  return notes.length > 0 ? "Notes - " + notes.join(" ") : null;
}

function extractGrandPrixTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i) || html.match(/# ([^\n]+)/);
  if (!m) return null;
  return m[1]
    .replace(/\s*-\s*(RACE RESULT|QUALIFYING|SPRINT|SPRINT QUALIFYING|SPRINT GRID|STARTING GRID).*$/i, "")
    .trim();
}

export async function scrapeF1Result(
  race: F1CalendarRace,
  year: number,
  page: F1ScrapedSessionType
): Promise<F1ScrapedResult | null> {
  const url = buildUrl(race, year, page);
  if (!url) return null;

  const html = await fetchHtml(url);
  if (!html) return null;

  // "No results available" / "Error" placeholder means the page exists but
  // the session hasn't happened yet or data isn't published.
  if (/No results available/i.test(html)) return null;

  const rawRows = parseResultsTable(html);
  if (rawRows.length === 0) return null;

  const rows = rawRows.map((r) => ({
    ...r,
    driverName: cleanDriverName(r.driverName),
  }));

  return {
    grandPrix: extractGrandPrixTitle(html) || race.officialName,
    rows,
    notes: extractNotes(html),
  };
}

/** Map our internal trigger id to the formula1.com results page slug. */
export function triggerToF1Page(triggerId: string): F1ScrapedSessionType | null {
  switch (triggerId) {
    case "race":
      return "race-result";
    case "qualifying":
      return "qualifying";
    case "sprint":
      return "sprint-results";
    case "sprint_qualifying":
    case "sprint-qualifying":
      return "sprint-qualifying";
    default:
      return null;
  }
}
