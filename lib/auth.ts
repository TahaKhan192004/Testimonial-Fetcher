import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, isValidSession } from "./admin-auth";

/** True when the request carries a valid admin session cookie. */
export async function isAdmin() {
  const store = await cookies();
  return isValidSession(store.get(ADMIN_COOKIE)?.value);
}

/** Page-level guard. The proxy checks first, this is the second check. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
