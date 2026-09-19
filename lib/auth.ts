import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export const supabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/** Returns the signed-in user when they are in admin_users, otherwise null. */
export async function getAdminUser() {
  if (!supabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: isAdmin } = await supabase.rpc("is_feedback_admin");
  return isAdmin === true ? data.user : null;
}

/** Page-level guard. The proxy checks first, this is the second lock. */
export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}
