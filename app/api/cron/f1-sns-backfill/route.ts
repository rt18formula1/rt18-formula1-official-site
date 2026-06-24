import { NextResponse } from "next/server";
import { generateSnsTemplate } from "@/lib/f1-sns-service";
import { upsertSnsCache } from "@/lib/f1-sns-queries";
import { F1_2026_CALENDAR } from "@/lib/f1-data-constants";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Round 1-9 (Australia to Barcelona) の終了済みセッション一覧
const BACKFILL_SESSIONS: Array<{
  round: number;
  raceName: string;
  templateTypes: string[];
}> = [
  { round: 1, raceName: "Australian Grand Prix", templateTypes: ["qualifying", "race"] },
  { round: 2, raceName: "Chinese Grand Prix",    templateTypes: ["sprint-qualifying", "sprint", "qualifying", "race"] },
  { round: 3, raceName: "Japanese Grand Prix",   templateTypes: ["qualifying", "race"] },
  { round: 6, raceName: "Miami Grand Prix",      templateTypes: ["sprint-qualifying", "sprint", "qualifying", "race"] },
  { round: 7, raceName: "Canadian Grand Prix",   templateTypes: ["sprint-qualifying", "sprint", "qualifying", "race"] },
  { round: 8, raceName: "Monaco Grand Prix",     templateTypes: ["qualifying", "race"] },
  { round: 9, raceName: "Barcelona-Catalunya Grand Prix", templateTypes: ["qualifying", "race"] },
];

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const year = 2026;
  const results: Array<{ round: number; templateType: string; status: string; provider?: string }> = [];

  for (const session of BACKFILL_SESSIONS) {
    for (const templateType of session.templateTypes) {
      try {
        const generated = await generateSnsTemplate(
          year,
          session.round,
          templateType as any,
          session.raceName
        );
        if (generated) {
          await upsertSnsCache(generated, year, session.round);
          results.push({
            round: session.round,
            templateType,
            status: "fetched",
            provider: generated.provider,
          });
        } else {
          results.push({ round: session.round, templateType, status: "unavailable" });
        }
      } catch (e) {
        results.push({ round: session.round, templateType, status: `error: ${e}` });
      }
    }
  }

  return NextResponse.json({ success: true, year, results });
}
