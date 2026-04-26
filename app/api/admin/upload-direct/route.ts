import { NextRequest, NextResponse } from "next/server";
import { buildR2ObjectKey, uploadToR2 } from "@/lib/r2";

const COOKIE = "rt18_admin";

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get(COOKIE)?.value;
    if (sessionCookie !== "1") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucket = formData.get("bucket") as string | null;

    if (!file || !bucket) {
      return NextResponse.json({ error: "Missing file or bucket" }, { status: 400 });
    }

    const key = buildR2ObjectKey(bucket, file.name);
    const contentType = file.type || "application/octet-stream";
    const arrayBuffer = await file.arrayBuffer();
    const publicUrl = await uploadToR2(key, new Uint8Array(arrayBuffer), contentType);

    return NextResponse.json({ url: publicUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown upload error";
    console.error("Direct upload API error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
