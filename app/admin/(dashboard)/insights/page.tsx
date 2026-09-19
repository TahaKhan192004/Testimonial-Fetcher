import Link from "next/link";
import { AnalyzePanel } from "@/components/admin/AnalyzePanel";
import { ThemeList, type ThemeItem } from "@/components/admin/ThemeList";
import { fetchAll } from "@/lib/admin/query";
import type { InsightRow } from "@/lib/admin/types";
import { Q2_OPTIONS, Q4_OPTIONS } from "@/lib/options";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "Insights" };

const LIST_LIMIT = 50;

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ field?: string; tag?: string }>;
}) {
  const sp = await searchParams;
  const field = sp.field === "q6" ? "q6" : "q5";
  const tag = (sp.tag ?? "").trim().slice(0, 40);
  const supabase = await createClient();

  let list = supabase
    .from("feedback_responses")
    .select("id,name,business_name,created_at,q2_focus_area,q4_blocker,q5_experience_text,q6_job_title,q6_dream_system,tags")
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);
  if (tag) list = list.contains("tags", [tag]);

  const [{ data: items }, { data: latest }, pairs] = await Promise.all([
    list,
    supabase.from("feedback_insights").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    fetchAll<{ q2_focus_area: string; q4_blocker: string; tags: string[] }>((from, to) =>
      supabase.from("feedback_responses").select("q2_focus_area,q4_blocker,tags").range(from, to),
    ),
  ]);

  // Cross-tab: blocker (rows) by focus area (columns)
  const grid = new Map<string, number>();
  for (const p of pairs) grid.set(`${p.q4_blocker}|${p.q2_focus_area}`, (grid.get(`${p.q4_blocker}|${p.q2_focus_area}`) ?? 0) + 1);
  const max = Math.max(1, ...grid.values());

  const tagCounts = new Map<string, number>();
  for (const p of pairs) for (const t of p.tags ?? []) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const tags = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-4xl text-cream">Insights</h1>
        <p className="mt-1 text-cream/55">What people wrote, and what to offer next.</p>
      </div>

      <AnalyzePanel initial={(latest as InsightRow | null) ?? null} total={pairs.length} />

      <section className="rounded-2xl border border-cream/10 bg-cream/[0.04] p-5">
        <h2 className="text-sm font-semibold text-cream">Blocker by focus area</h2>
        <p className="mb-4 mt-1 text-xs text-cream/50">Darker cells are bigger groups. Click a cell to see those people.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-1 text-center text-xs">
            <thead>
              <tr>
                <th className="w-40" />
                {Q2_OPTIONS.map((c) => (
                  <th key={c.key} className="pb-1 font-semibold text-cream/60">
                    {c.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Q4_OPTIONS.map((r) => (
                <tr key={r.key}>
                  <th scope="row" className="pr-2 text-left font-semibold text-cream/75">
                    {r.short}
                  </th>
                  {Q2_OPTIONS.map((c) => {
                    const n = grid.get(`${r.key}|${c.key}`) ?? 0;
                    return (
                      <td key={c.key}>
                        {n > 0 ? (
                          <Link
                            href={`/admin/responses?q4=${r.key}&q2=${c.key}`}
                            aria-label={`${r.short} and ${c.short}: ${n}`}
                            className="block rounded-md py-2.5 font-semibold text-cream hover:ring-2 hover:ring-peach"
                            style={{ background: `rgba(255,178,133,${0.12 + (n / max) * 0.7})`, color: n / max > 0.5 ? "#1C0E0B" : undefined }}
                          >
                            {n}
                          </Link>
                        ) : (
                          <span className="block rounded-md bg-cream/[0.03] py-2.5 text-cream/25">0</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold text-cream">Free text</h2>
          <nav aria-label="Question" className="flex gap-2">
            {(
              [
                ["q5", "Q5 Experience"],
                ["q6", "Q6 Dream system"],
              ] as const
            ).map(([k, label]) => (
              <Link
                key={k}
                href={`/admin/insights?field=${k}${tag ? `&tag=${encodeURIComponent(tag)}` : ""}`}
                aria-current={field === k ? "page" : undefined}
                className={cn(
                  "min-h-10 rounded-full border px-4 py-2 text-sm",
                  field === k ? "border-peach bg-peach/15 text-peach" : "border-cream/20 text-cream/75 hover:border-cream/45",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-cream/50">Tags:</span>
            {tag && (
              <Link href={`/admin/insights?field=${field}`} className="rounded-full border border-cream/25 px-3 py-1 text-cream/75">
                Clear filter
              </Link>
            )}
            {tags.map(([t, n]) => (
              <Link
                key={t}
                href={`/admin/insights?field=${field}&tag=${encodeURIComponent(t)}`}
                className={cn("rounded-full px-3 py-1", t === tag ? "bg-peach text-ink" : "bg-peach/15 text-peach")}
              >
                {t} ({n})
              </Link>
            ))}
          </div>
        )}
        <div className="mt-5">
          <ThemeList key={`${field}-${tag}`} field={field} items={(items ?? []) as ThemeItem[]} />
        </div>
        {(items?.length ?? 0) === LIST_LIMIT && <p className="mt-3 text-xs text-cream/45">Showing the latest {LIST_LIMIT}. Use tags or the responses table for the rest.</p>}
      </section>
    </div>
  );
}
