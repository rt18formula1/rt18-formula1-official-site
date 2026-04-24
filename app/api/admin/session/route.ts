import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE = "rt18_admin";

export async function GET() {
  const cookieStore = await cookies();
  const ok = cookieStore.get(COOKIE)?.value === "1";
  return NextResponse.json({ ok });
}
