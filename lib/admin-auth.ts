import { createClient } from "./supabaseServer";

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

  // Extract authorization header
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized: Missing authorization header");
  }

  const token = authHeader.substring(7);
  
  // Create a client with the token
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error("Unauthorized: Invalid token");
  }

  if (user.email !== ADMIN_EMAIL) {
    throw new Error("Unauthorized: Not admin user");
  }

  return user;
}
