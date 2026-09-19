import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyFilters, fetchAll, parseFilters } from "@/lib/admin/query";
import { toCsv } from "@/lib/admin/csv";
import type { ResponseRow } from "@/lib/admin/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const supabase = createAdminClient();

  const idsParam = searchParams.get("ids");
  let rows: ResponseRow[];
  if (idsParam) {
    const ids = z.array(z.uuid()).max(500).safeParse(idsParam.split(","));
    if (!ids.success) return NextResponse.json({ error: "bad_ids" }, { status: 400 });
    const { data, error } = await supabase
      .from("feedback_responses")
      .select("*")
      .in("id", ids.data)
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: "query_failed" }, { status: 500 });
    rows = (data ?? []) as ResponseRow[];
  } else {
    const f = parseFilters(Object.fromEntries(searchParams));
    rows = await fetchAll<ResponseRow>((from, to) =>
      applyFilters(supabase.from("feedback_responses").select("*"), f)
        .order(f.sort, { ascending: f.dir === "asc" })
        .order("id")
        .range(from, to),
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="feedback-responses-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
