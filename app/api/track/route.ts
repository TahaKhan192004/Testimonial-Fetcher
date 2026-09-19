import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { trackSchema } from "@/lib/schema";

export const runtime = "nodejs";

/** Step-reached beacon for the drop-off funnel. Stores no answers or contact data. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) return new NextResponse(null, { status: 204 });

  try {
    const db = createAdminClient();
    const { sessionId, step, src } = parsed.data;
    const { data: existing } = await db
      .from("feedback_drafts")
      .select("max_step")
      .eq("session_id", sessionId)
      .maybeSingle();
    await db.from("feedback_drafts").upsert(
      {
        session_id: sessionId,
        last_step: step,
        max_step: Math.max(existing?.max_step ?? 0, step),
        // Only set the source when the beacon carries one, so later pings never wipe it.
        ...(src ? { source: src } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_id" },
    );
  } catch (err) {
    console.error("track failed", err);
  }
  return new NextResponse(null, { status: 204 });
}
