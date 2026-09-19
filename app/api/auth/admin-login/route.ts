import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE, adminPasswordSet, checkPassword, sessionToken } from "@/lib/admin-auth";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!adminPasswordSet()) {
    return NextResponse.json({ error: "not_configured", message: "ADMIN_PASSWORD is not set." }, { status: 503 });
  }

  // Slows down password guessing: 20 attempts per hour per IP.
  const { allowed } = await checkRateLimit(clientIp(req.headers), "admin-login", 20);
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited", message: "Too many attempts. Try again later." }, { status: 429 });
  }

  const parsed = z.object({ password: z.string().max(200) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success || !checkPassword(parsed.data.password)) {
    return NextResponse.json({ error: "invalid", message: "Wrong password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });
  return res;
}
