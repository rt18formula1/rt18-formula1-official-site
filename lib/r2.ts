import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || `https://pub-${R2_ACCOUNT_ID}.r2.dev`;

function assertR2Config() {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
    throw new Error("R2 environment variables are not fully configured.");
  }
}

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function getPresignedUrl(key: string, contentType: string) {
  assertR2Config();
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    // CORS対応のための追加ヘッダー
    Metadata: {
      "Access-Control-Allow-Origin": "*",
    },
  });

  // 署名付きURLを生成（有効期限を15分に延長）
  const url = await getSignedUrl(r2Client, command, { expiresIn: 900 });
  const baseUrl = R2_PUBLIC_URL.endsWith("/") ? R2_PUBLIC_URL.slice(0, -1) : R2_PUBLIC_URL;
  const publicUrl = `${baseUrl}/${key}`;

  return { uploadUrl: url, publicUrl };
}

export function buildR2ObjectKey(folder: string, originalFileName: string) {
  const ext = originalFileName.includes(".") ? originalFileName.split(".").pop() : "bin";
  const safeExt = (ext || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const normalizedFolder = folder.replace(/[^a-z0-9-_]/gi, "").toLowerCase() || "uploads";
  return `${normalizedFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt || "bin"}`;
}
