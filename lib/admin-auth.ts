import { createHmac, timingSafeEqual } from "node:crypto";

/** Name of the admin session cookie. */
export const ADMIN_COOKIE = "asf_admin";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export const adminPasswordSet = () => Boolean(process.env.ADMIN_PASSWORD);

/** Constant-time string compare (hashes first so lengths never leak). */
function safeEqual(a: string, b: string) {
  const x = createHmac("sha256", "cmp").update(a).digest();
  const y = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(x, y);
}

/** The cookie value. Derived from the password, so changing it signs everyone out. */
export function sessionToken() {
  return createHmac("sha256", process.env.ADMIN_PASSWORD ?? "").update("asf-admin-session-v1").digest("hex");
}

export function checkPassword(input: string) {
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected) && safeEqual(input, expected!);
}

export function isValidSession(cookieValue: string | undefined) {
  return Boolean(cookieValue) && adminPasswordSet() && safeEqual(cookieValue!, sessionToken());
}
