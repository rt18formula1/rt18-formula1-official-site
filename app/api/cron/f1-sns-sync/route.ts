import { NextResponse } from "next/server";
import { syncEndedSessionsForYear, generateSnsTemplate } from "@/lib/f1-sns-service";
import { getSnsCacheEntry, upsertSnsCache } from "@/lib/f1-sns-queries";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const year = new Date().getFullYear();
  const now = new Date();

  try {
    const pending = await syncEndedSessionsForYear(year, now);
    const results: Array<{ round: number; templateType: string; status: string }> = [];

    for (const item of pending) {
      const existing = await getSnsCacheEntry(item.year, item.round, item.templateType);
      if (existing) {
        results.push({ round: item.round, templateType: item.templateType, status: "cached" });
        continue;
      }

      const generated = await generateSnsTemplate(
        item.year,
        item.round,
        item.templateType,
        item.raceName
      );

      if (generated) {
        await upsertSnsCache(generated, item.year, item.round);
        results.push({ round: item.round, templateType: item.templateType, status: "fetched" });
      } else {
        results.push({ round: item.round, templateType: item.templateType, status: "unavailable" });
      }
    }

    return NextResponse.json({
      success: true,
      year,
      checkedAt: now.toISOString(),
      pending: pending.length,
      results,
    });
  } catch (error) {
    console.error("f1-sns-sync cron error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
