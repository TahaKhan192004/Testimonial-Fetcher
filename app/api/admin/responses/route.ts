import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { LEAD_STATUS_KEYS, PERMISSION_KEYS } from "@/lib/options";

export const runtime = "nodejs";

const bodySchema = z.object({
  ids: z.array(z.uuid()).min(1).max(200),
  patch: z
    .object({
      lead_status: z.enum(LEAD_STATUS_KEYS),
      starred: z.boolean(),
      testimonial_permission: z.enum(PERMISSION_KEYS),
      admin_notes: z.string().max(5000).nullable(),
      suggested_system: z.string().max(5000).nullable(),
      tags: z.array(z.string().trim().min(1).max(40)).max(20),
    })
    .partial()
    .refine((p) => Object.keys(p).length > 0, "Empty patch"),
});

/** Bulk or single update of the operational columns. Only these columns can be changed, the schema below drops anything else. */
export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation", issues: parsed.error.issues }, { status: 400 });

  const { ids, patch } = parsed.data;
  if (patch.tags) patch.tags = Array.from(new Set(patch.tags.map((t) => t.toLowerCase())));

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("feedback_responses").update(patch).in("id", ids).select("*");
  if (error) {
    console.error("Update failed", error);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
  return NextResponse.json({ rows: data });
}
