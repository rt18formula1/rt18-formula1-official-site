import { NextResponse } from "next/server";
import {
  generateSnsTemplate,
  type SnsTemplateType,
  isRoundCancelled,
} from "@/lib/f1-sns-service";
import {
  getSnsCache,
  getSnsCacheEntry,
  upsertSnsCache,
  cacheToResult,
} from "@/lib/f1-sns-queries";

const VALID_TYPES: SnsTemplateType[] = [
  "schedule",
  "sprint-qualifying",
  "sprint",
  "qualifying",
  "race",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);
  const roundParam = searchParams.get("round");
  const round = roundParam ? parseInt(roundParam, 10) : undefined;
  const raceName = searchParams.get("raceName");

  const cache = await getSnsCache(year, round);

  let weekendStatus = null;
  if (round && raceName) {
    const { fetchF1CalendarSchedule } = await import("@/lib/calendar-service");
    const { isTemplateAvailable } = await import("@/lib/f1-sns-service");
    const schedule = await fetchF1CalendarSchedule(raceName, year);
    if (schedule) {
      weekendStatus = {
        isSprintWeekend: schedule.isSprintWeekend,
        templates: (["schedule", "sprint-qualifying", "sprint", "qualifying", "race"] as const).map(
          (type) => ({
            type,
            available: isTemplateAvailable(type, schedule.isSprintWeekend, schedule.sessions),
          })
        ),
      };
    }
  }

  return NextResponse.json({
    success: true,
    year,
    round,
    weekendStatus,
    cache: cache.map((row) => ({
      round: row.round,
      templateType: row.template_type,
      grandPrix: row.grand_prix,
      provider: row.provider,
      fetchedAt: row.fetched_at,
      textOutput: row.text_output,
      data: row.data,
      sessionLabel: row.session_label,
    })),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { year, round, templateType, raceName, force } = body as {
      year: number;
      round: number;
      templateType: SnsTemplateType;
      raceName: string;
      force?: boolean;
    };

    if (!year || !round || !templateType || !raceName) {
      return NextResponse.json(
        { error: "Missing required fields: year, round, templateType, raceName" },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(templateType)) {
      return NextResponse.json({ error: "Invalid templateType" }, { status: 400 });
    }

    if (isRoundCancelled(year, round)) {
      return NextResponse.json({ error: "This round is cancelled" }, { status: 400 });
    }

    if (!force) {
      const cached = await getSnsCacheEntry(year, round, templateType);
      if (cached) {
        return NextResponse.json({
          success: true,
          cached: true,
          ...cacheToResult(cached),
          fetchedAt: cached.fetched_at,
        });
      }
    }

    const result = await generateSnsTemplate(year, round, templateType, raceName);
    if (!result) {
      return NextResponse.json(
        { error: "Data not available yet", templateType },
        { status: 404 }
      );
    }

    await upsertSnsCache(result, year, round);

    return NextResponse.json({
      success: true,
      cached: false,
      ...result,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("f1-sns POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
