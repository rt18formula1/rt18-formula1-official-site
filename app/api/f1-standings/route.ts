import { NextResponse } from "next/server";

const BASE = "https://www.formula1.com/en/results";

async function scrapeStandings(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const raw = await res.text();
    return raw.replace(/<script[\s\S]*?<\/script>/gi, "");
  } catch {
    return null;
  }
}

function parseTable(html: string): string[][] {
  const tableMatch = html.match(/<table[^>]*>[\s\S]*?<\/table>/i);
  if (!tableMatch) return [];
  const rowMatches = tableMatch[0].match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  const rows: string[][] = [];
  for (const rowHtml of rowMatches) {
    const cellMatches = rowHtml.match(/<td[^>]*>[\s\S]*?<\/td>/gi);
    if (!cellMatches || cellMatches.length < 3) continue;
    const cells = cellMatches.map((cell: string) =>
      cell.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim()
    );
    rows.push(cells);
  }
  return rows;
}

function cleanDriverName(raw: string): string {
  const m = raw.match(/^(.*?)([A-Z]{3})$/);
  if (m && m[1].trim().length > 0) return m[1].trim();
  return raw.trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year") ?? "2026";
  const type = searchParams.get("type") ?? "drivers";
  const path = type === "constructors" ? "team" : "drivers";
  const url = `${BASE}/${year}/${path}`;
  const html = await scrapeStandings(url);
  if (!html) return NextResponse.json({ standings: [] });
  const rows = parseTable(html);
  if (type === "constructors") {
    const standings = rows.map((cells: string[]) => ({
      position: cells[0] ?? "", team: cells[1] ?? "", points: cells[2] ?? "", wins: cells[3] ?? "",
    })).filter((s: { position: string }) => s.position && /^\d+$/.test(s.position));
    return NextResponse.json({ standings, url });
  }
  const standings = rows.map((cells: string[]) => ({
    position: cells[0] ?? "",
    driver: cleanDriverName(cells[1] ?? ""),
    nationality: cells[2] ?? "",
    team: cells[3] ?? "",
    points: cells[4] ?? "",
    wins: cells[6] ?? "",
  })).filter((s: { position: string }) => s.position && /^\d+$/.test(s.position));
  return NextResponse.json({ standings, url });
}
