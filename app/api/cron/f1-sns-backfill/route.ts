import { NextResponse } from "next/server";
import { generateSnsTemplate } from "@/lib/f1-sns-service";
import { upsertSnsCache } from "@/lib/f1-sns-queries";
import { F1_2026_CALENDAR } from "@/lib/f1-data-constants";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BACKFILL_UP_TO_ROUND = 9;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const year = 2026;
  const results: Array<{
    round: number;
    country: string;
    templateType: string;
    status: string;
    provider?: string;
  }> = [];

  const races = F1_2026_CALENDAR.filter(
    (r) => r.round <= BACKFILL_UP_TO_ROUND && !r.cancelled
  );

  for (const race of races) {
    const sessions: Array<{
      id: "schedule" | "qualifying" | "race" | "sprint" | "sprint-qualifying";
      sprintOnly?: boolean;
    }> = [
      { id: "schedule" },
      { id: "qualifying" },
      { id: "race" },
      { id: "sprint", sprintOnly: true },
      { id: "sprint-qualifying", sprintOnly: true },
    ];

    for (const session of sessions) {
      if (session.sprintOnly && !race.hasSprint) continue;
      try {
        const generated = await generateSnsTemplate(
          year,
          race.round,
          session.id,
          race.officialName
        );
        if (generated) {
          await upsertSnsCache(generated, year, race.round);
          results.push({
            round: race.round,
            country: race.country,
            templateType: session.id,
            status: "fetched",
            provider: generated.provider,
          });
        } else {
          results.push({
            round: race.round,
            country: race.country,
            templateType: session.id,
            status: "unavailable",
          });
        }
      } catch (e) {
        results.push({
          round: race.round,
          country: race.country,
          templateType: session.id,
          status: `error: ${e instanceof Error ? e.message : String(e)}`,
        });
      }
    }
  }

  return NextResponse.json({ success: true, year, total: results.length, results });
}
