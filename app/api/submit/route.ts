import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { submitSchema } from "@/lib/schema";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { rewardUrl } from "@/lib/reward";

export const runtime = "nodejs";

const MIN_HUMAN_MS = 15_000;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Honeypot: pretend it worked so bots do not learn anything.
  const honeypot = body && typeof body === "object" ? (body as { website?: unknown }).website : undefined;
  if (typeof honeypot === "string" && honeypot.length > 0) {
    return NextResponse.json({ status: "success", accessUrl: rewardUrl() });
  }

  const { allowed } = await checkRateLimit(clientIp(req.headers));
  if (!allowed) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many attempts. Try again in a bit." },
      { status: 429 },
    );
  }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", fieldErrors: parsed.error.flatten().fieldErrors, issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { answers, src, elapsedMs, sessionId } = parsed.data;

  let db: ReturnType<typeof createAdminClient>;
  try {
    db = createAdminClient();
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "server_config" }, { status: 500 });
  }

  // Duplicate email: friendly path, show the link again instead of an error.
  const existing = await db.from("feedback_responses").select("id").eq("email", answers.email).maybeSingle();
  if (existing.data) return NextResponse.json({ status: "duplicate", accessUrl: rewardUrl() });

  const { error } = await db.from("feedback_responses").insert({
    ...answers,
    q2_other_text: answers.q2_focus_area === "other" ? (answers.q2_other_text?.trim() ?? null) : null,
    source: src?.trim() || null,
    user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
    submission_ms: elapsedMs ?? null,
    flagged_reason: typeof elapsedMs === "number" && elapsedMs < MIN_HUMAN_MS ? "fast_submission" : null,
  });

  if (error) {
    // Lost a race with a parallel submit from the same email.
    if (error.code === "23505") return NextResponse.json({ status: "duplicate", accessUrl: rewardUrl() });
    console.error("Insert failed", error);
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  if (sessionId) {
    await db.from("feedback_drafts").upsert(
      { session_id: sessionId, completed: true, last_step: 8, max_step: 8, updated_at: new Date().toISOString() },
      { onConflict: "session_id" },
    );
  }

  return NextResponse.json({ status: "success", accessUrl: rewardUrl() });
}
