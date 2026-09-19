import "server-only";
import { createHash } from "node:crypto";
import { createAdminClient } from "./supabase/admin";

const WINDOW_SECONDS = 60 * 60;
const LIMIT = 5;

export function hashIp(ip: string) {
  return createHash("sha256").update(`asf:${ip}`).digest("hex").slice(0, 32);
}

export function clientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}

/**
 * 5 submits per hour per IP. Uses Upstash when configured, otherwise a
 * Supabase table. Fails open on infrastructure errors so a rate limiter
 * outage never blocks a real submission.
 */
export async function checkRateLimit(ip: string, bucket = "submit"): Promise<{ allowed: boolean }> {
  const key = `${bucket}:${hashIp(ip)}`;
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) {
      const res = await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify([
          ["INCR", key],
          ["EXPIRE", key, WINDOW_SECONDS, "NX"],
        ]),
      });
      const json = (await res.json()) as Array<{ result: number }>;
      return { allowed: (json?.[0]?.result ?? 0) <= LIMIT };
    }

    const db = createAdminClient();
    const since = new Date(Date.now() - WINDOW_SECONDS * 1000).toISOString();
    const { count } = await db
      .from("feedback_rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("key", key)
      .gte("created_at", since);
    if ((count ?? 0) >= LIMIT) return { allowed: false };
    await db.from("feedback_rate_limits").insert({ key });
    return { allowed: true };
  } catch (err) {
    console.error("Rate limit check failed", err);
    return { allowed: true };
  }
}
