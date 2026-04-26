import { NextRequest, NextResponse } from "next/server";
import { buildR2ObjectKey, getPresignedUrl } from "@/lib/r2";

const COOKIE = "rt18_admin";

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get(COOKIE)?.value;
    if (sessionCookie !== "1") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as {
      bucket?: string;
      fileName?: string;
      contentType?: string;
    } | null;

    const bucket = body?.bucket;
    const fileName = body?.fileName;
    const contentType = body?.contentType;

    if (!bucket || !fileName || !contentType) {
      return NextResponse.json({ error: "Missing upload metadata" }, { status: 400 });
    }

    const key = buildR2ObjectKey(bucket, fileName);
    const { uploadUrl, publicUrl } = await getPresignedUrl(key, contentType);

    return NextResponse.json({ uploadUrl, url: publicUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown upload error";
    console.error("Upload API error (R2):", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
