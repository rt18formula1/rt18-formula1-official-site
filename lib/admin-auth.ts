import { createClient } from "./supabaseServer";
import { cookies } from "next/headers";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

export async function verifyAdmin() {
  if (!ADMIN_EMAIL) {
    throw new Error("ADMIN_EMAIL is not configured");
  }

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized: No user session");
  }

  if (user.email !== ADMIN_EMAIL) {
    throw new Error("Unauthorized: Not admin user");
  }

  return user;
}

export async function verifyAdminFromRequest(req: Request) {
  if (!ADMIN_EMAIL) {
    throw new Error("ADMIN_EMAIL is not configured");
  }

  // For API routes, use cookies from the request
  const cookieStore = await cookies();
  
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized: No user session");
  }

  if (user.email !== ADMIN_EMAIL) {
    throw new Error("Unauthorized: Not admin user");
  }

  return user;
}
