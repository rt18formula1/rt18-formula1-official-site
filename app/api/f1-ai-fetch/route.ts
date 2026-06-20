import { NextResponse } from "next/server";
import {
  generateSnsTemplate,
  resolveRaceRound,
  type SnsTemplateType,
} from "@/lib/f1-sns-service";

const SESSION_TO_TEMPLATE: Record<string, SnsTemplateType> = {
  RACE: "race",
  QUALIFYING: "qualifying",
  SPRINT: "sprint",
  "SPRINT QUALIFYING": "sprint-qualifying",
};

const PROVIDER_SOURCES: Record<string, { title: string; uri: string }> = {
  "google-calendar-ical": {
    title: "Formula 1 public Google Calendar iCal",
    uri: "https://calendar.google.com/",
  },
  openf1: { title: "OpenF1 API", uri: "https://openf1.org/" },
  jolpica: { title: "Jolpica F1 API", uri: "https://api.jolpi.ca/" },
  openrouter: { title: "OpenRouter Free", uri: "https://openrouter.ai/" },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, grandPrix, session, year } = body;

    if (!type || !grandPrix || !year) {
      return NextResponse.json(
        { error: "Missing required fields: type, grandPrix, year" },
        { status: 400 }
      );
    }

    const targetYear = Number(year);
    const round = await resolveRaceRound(targetYear, grandPrix);

    if (type === "schedule") {
      const result = await generateSnsTemplate(targetYear, round, "schedule", grandPrix);
      if (!result) {
        return NextResponse.json(
          {
            error: "Schedule not available",
            hint: "Set OPENROUTER_API_KEY for OpenRouter fallback",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        type,
        provider: result.provider,
        data: result.data,
        sources: [PROVIDER_SOURCES[result.provider] || PROVIDER_SOURCES.openrouter],
      });
    }

    if (type === "result") {
      if (!session) {
        return NextResponse.json(
          { error: "Missing session field for result type" },
          { status: 400 }
        );
      }

      const templateType = SESSION_TO_TEMPLATE[session.toUpperCase()];
      if (!templateType) {
        return NextResponse.json({ error: `Unsupported session: ${session}` }, { status: 400 });
      }

      const result = await generateSnsTemplate(targetYear, round, templateType, grandPrix);
      if (!result) {
        return NextResponse.json(
          {
            error: "Result not available yet",
            hint: "Set OPENROUTER_API_KEY for OpenRouter fallback",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        type,
        provider: result.provider,
        data: result.data,
        sources: [PROVIDER_SOURCES[result.provider] || PROVIDER_SOURCES.openrouter],
      });
    }

    return NextResponse.json({ error: "Invalid type. Must be schedule or result" }, { status: 400 });
  } catch (error) {
    console.error("f1-ai-fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
