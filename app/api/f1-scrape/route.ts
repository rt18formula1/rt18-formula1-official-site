import { NextResponse } from "next/server";
import { F1_2026_CALENDAR } from "@/lib/f1-data-constants";

const BASE = "https://www.formula1.com/en";

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const raw = await res.text();
    return raw.replace(/<script[\s\S]*?<\/script>/gi, "");
  } catch { return null; }
}

function parseTable(html: string): string[][] {
  const tableMatch = html.match(/<table[^>]*>[\s\S]*?<\/table>/i);
  if (!tableMatch) return [];
  const rowMatches = tableMatch[0].match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  const rows: string[][] = [];
  for (const rowHtml of rowMatches) {
    const cellMatches = rowHtml.match(/<td[^>]*>[\s\S]*?<\/td>/gi);
    if (!cellMatches || cellMatches.length < 3) continue;
    const cells = cellMatches.map((c: string) =>
      c.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()
    );
    rows.push(cells);
  }
  return rows;
}

function cleanName(raw: string): string {
  const m = raw.match(/^(.*?)([A-Z]{2,3}

function dedupeRepeatedWords(s) {
  for (let i = 1; i < s.length; i++) {
    const a = s.slice(0, i);
    const b = s.slice(i);
    if (a === b && a.length > 0) return a;
  }
  const words = s.trim().split(/s+/);
  const half = words.length / 2;
  if (Number.isInteger(half) && half > 0) {
    const first = words.slice(0, half).join(" ");
    const second = words.slice(half).join(" ");
    if (first === second) return first;
  }
  return s;
})$/);
  if (m && m[1].trim().length > 0 && m[2].length <= 3) return m[1].trim();
  return raw.trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year") ?? "2026";
  const page = searchParams.get("page") ?? "races";

  // Schedule: use local calendar data (F1 official schedule page is not table-based)
  if (page === "schedule") {
    const calendar = F1_2026_CALENDAR.filter(r => !r.cancelled);
    const rows = calendar.map(r => ({
      round: r.round,
      grandPrix: r.officialName,
      circuit: r.circuit,
      city: r.city,
      country: r.country,
      dates: r.dates,
      raceDate: r.raceDate,
      hasSprint: r.hasSprint,
    }));
    return NextResponse.json({ page: "schedule", year, rows });
  }

  // Races
  if (page === "races") {
    const url = `${BASE}/results/${year}/races`;
    const html = await fetchHtml(url);
    if (!html) return NextResponse.json({ page, year, rows: [] });
    const raw = parseTable(html);
    const rows = raw.map(cells => ({
      grandPrix: (() => { const raw=cells[0]??""; const idx=raw.lastIndexOf("Flag of "); return idx>=0 ? dedupeRepeatedWords(cleanName(raw.slice(idx+"Flag of ".length))) : dedupeRepeatedWords(cleanName(raw)); })(),
      date: cells[1] ?? "",
      winner: (()=>{ const v=cells[2]??""; const i=v.lastIndexOf("Flag of "); return i>=0?cleanName(v.slice(i+"Flag of ".length)):cleanName(v); })(),
      team: cleanName(cells[3] ?? ""),
      laps: cells[4] ?? "",
      time: cells[5] ?? "",
    })).filter(r => r.grandPrix && r.date && !/^\s*$/.test(r.date));
    return NextResponse.json({ page, year, rows });
  }

  // Drivers standings
  if (page === "drivers") {
    const url = `${BASE}/results/${year}/drivers`;
    const html = await fetchHtml(url);
    if (!html) return NextResponse.json({ page, year, rows: [] });
    const raw = parseTable(html);
    const rows = raw.map(cells => ({
      position: cells[0] ?? "",
      driver: (()=>{ const v=cells[1]??""; const i=v.lastIndexOf("Flag of "); return i>=0?cleanName(v.slice(i+"Flag of ".length)):cleanName(v); })(),
      nationality: cells[2] ?? "",
      team: cleanName(cells[3] ?? ""),
      points: cells[4] ?? "",
      wins: cells[5] ?? "",
    })).filter(r => /^\d+$/.test(r.position));
    return NextResponse.json({ page, year, rows });
  }

  // Teams standings
  if (page === "teams") {
    const url = `${BASE}/results/${year}/team`;
    const html = await fetchHtml(url);
    if (!html) return NextResponse.json({ page, year, rows: [] });
    const raw = parseTable(html);
    const rows = raw.map(cells => ({
      position: cells[0] ?? "",
      team: cleanName(cells[1] ?? ""),
      points: cells[2] ?? "",
      wins: cells[3] ?? "",
    })).filter(r => /^\d+$/.test(r.position));
    return NextResponse.json({ page, year, rows });
  }

  return NextResponse.json({ error: "Unknown page" }, { status: 400 });
}
