export const runtime = "nodejs";

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

async function openF1Fetch<T = Json>(pathname: string, params?: Record<string, string | number | boolean>): Promise<T> {
  const url = new URL("https://openf1.org/v1/" + pathname.replace(/^\/+/, ""));
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }
  }
  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 300 },
  });
  if (!response.ok) {
    throw new Error(`OpenF1 API error: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export interface OpenF1MeetingRow {
  meeting_key: number;
  meeting_name: string;
  meeting_code: string;
  year: number;
  date_start: string;
  country_name: string;
  location: string;
  gmt_offset: string;
}

export interface OpenF1SessionRow {
  session_key: number;
  session_name: string;
  date_start: string;
  gmt_offset: string;
  is_cancelled: boolean;
  meeting_key: number;
}

export interface OpenF1ResultRow {
  position: number;
  driver_number: number;
  full_name?: string;
  team_name?: string;
  dnf: boolean;
  dns: boolean;
  dsq: boolean;
}

export interface OpenF1DriverRow {
  driver_number: number;
  broadcast_name?: string;
  name_acronym?: string;
  full_name?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const year = Number(searchParams.get("year") || 0);
    const meeting_key = Number(searchParams.get("meeting_key") || 0);
    const session_key = Number(searchParams.get("session_key") || 0);

    if (action === "meetings" && year) {
      const data = await openF1Fetch<OpenF1MeetingRow[]>("meetings", { year: String(year) });
      return Response.json({ ok: true, data });
    }

    if (action === "sessions" && meeting_key) {
      const data = await openF1Fetch<OpenF1SessionRow[]>("sessions", { meeting_key: String(meeting_key) });
      return Response.json({ ok: true, data });
    }

    if (action === "results" && session_key) {
      const data = await openF1Fetch<OpenF1ResultRow[]>("session_result", { session_key: String(session_key) });
      return Response.json({ ok: true, data });
    }

    if (action === "drivers" && session_key) {
      const data = await openF1Fetch<OpenF1DriverRow[]>("drivers", { session_key: String(session_key) });
      return Response.json({ ok: true, data });
    }

    return Response.json({ ok: false, error: "invalid request" }, { status: 400 });
  } catch (error: any) {
    return Response.json({ ok: false, error: error?.message || "failed" }, { status: 500 });
  }
}
