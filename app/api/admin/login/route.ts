import { NextResponse } from "next/server";

const COOKIE = "rt18_admin";

function expectedPassword() {
  return process.env.RT18_ADMIN_PASSWORD;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  const password = body?.password ?? "";

  const expected = expectedPassword();
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "RT18_ADMIN_PASSWORD is not configured" },
      { status: 500 },
    );
  }

  if (password !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
