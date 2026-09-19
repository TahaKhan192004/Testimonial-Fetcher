import Link from "next/link";
import { CopyButton } from "@/components/admin/CopyButton";
import { DistributionChart } from "@/components/admin/DistributionChart";
import { FunnelChart } from "@/components/admin/FunnelChart";
import { StatCard } from "@/components/admin/StatCard";
import { TimeSeriesChart } from "@/components/admin/TimeSeriesChart";
import { fetchAll } from "@/lib/admin/query";
import type { ResponseRow } from "@/lib/admin/types";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ANSWER_FIELDS,
  DONE_FOR_ME_BLOCKERS,
  HOT_BLOCKERS,
  Q2_OPTIONS,
  Q4_OPTIONS,
  STEP_NAMES,
  labelFor,
} from "@/lib/options";
import { testimonialText } from "@/lib/testimonial";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Overview" };

const DAYS = 30;

type Slim = { created_at: string; q1_prior_ai_use: string; q2_focus_area: string; q3_experience: string; q4_blocker: string };

const pct = (n: number, total: number) => (total ? `${Math.round((n / total) * 100)}%` : "0%");

export default async function OverviewPage() {
  const supabase = createAdminClient();
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const count = (build: (q: ReturnType<typeof base>) => ReturnType<typeof base>) => build(base()).then((r) => r.count ?? 0);
  const base = () => supabase.from("feedback_responses").select("id", { count: "exact", head: true });

  const [total, week, allowed, dfm, hot, bank, slim, drafts] = await Promise.all([
    count((q) => q),
    count((q) => q.gte("created_at", weekAgo)),
    count((q) => q.in("testimonial_permission", ["named", "anonymous"])),
    count((q) => q.in("q4_blocker", DONE_FOR_ME_BLOCKERS)),
    supabase
      .from("feedback_responses")
      .select("*")
      .in("q4_blocker", HOT_BLOCKERS)
      .eq("lead_status", "new")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("feedback_responses")
      .select("*")
      .in("testimonial_permission", ["named", "anonymous"])
      .order("created_at", { ascending: false })
      .limit(5),
    fetchAll<Slim>((from, to) =>
      supabase
        .from("feedback_responses")
        .select("created_at,q1_prior_ai_use,q2_focus_area,q3_experience,q4_blocker")
        .order("created_at")
        .range(from, to),
    ),
    fetchAll<{ max_step: number }>((from, to) => supabase.from("feedback_drafts").select("max_step").range(from, to)),
  ]);

  const tally = (col: keyof Slim) => {
    const out: Record<string, number> = {};
    for (const r of slim) out[r[col]] = (out[r[col]] ?? 0) + 1;
    return out;
  };

  const days: Array<{ date: string; count: number }> = [];
  const index = new Map<string, number>();
  for (let i = DAYS - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
    index.set(date, days.length);
    days.push({ date, count: 0 });
  }
  for (const r of slim) {
    const i = index.get(r.created_at.slice(0, 10));
    if (i !== undefined) days[i].count++;
  }

  const funnel = STEP_NAMES.map((label, step) => ({ label, count: drafts.filter((d) => d.max_step >= step).length }));
  const hotRows = (hot.data ?? []) as ResponseRow[];
  const bankRows = (bank.data ?? []) as ResponseRow[];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-4xl text-cream">Overview</h1>
        <p className="mt-1 text-cream/55">How the AI Employee Challenge feedback is landing.</p>
      </div>

      <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total responses" value={total} href="/admin/responses" />
        <StatCard label="Last 7 days" value={week} href={`/admin/responses?from=${weekAgo.slice(0, 10)}`} />
        <StatCard label="OK to share" value={pct(allowed, total)} sub={`${allowed} people`} href="/admin/responses?view=testimonials" />
        <StatCard label="Want done-for-me" value={pct(dfm, total)} sub={`${dfm} people`} href={`/admin/responses?q4=${DONE_FOR_ME_BLOCKERS.join(",")}`} />
      </section>

      <section className="rounded-2xl border border-cream/10 bg-cream/[0.04] p-5">
        <h2 className="text-sm font-semibold text-cream">Responses over time, last {DAYS} days</h2>
        <div className="mt-3">
          <TimeSeriesChart points={days} />
        </div>
      </section>

      <section aria-label="Answer distributions" className="grid gap-4 lg:grid-cols-2">
        {(Object.keys(ANSWER_FIELDS) as Array<keyof typeof ANSWER_FIELDS>).map((k) => {
          const f = ANSWER_FIELDS[k];
          return (
            <DistributionChart
              key={k}
              title={`${k.toUpperCase()} ${f.title}`}
              field={k}
              options={f.options}
              counts={tally(f.column)}
            />
          );
        })}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-peach/30 bg-peach/[0.05] p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-cream">Hot leads</h2>
            <Link href="/admin/responses?view=hot" className="text-xs text-peach underline underline-offset-4">
              See all
            </Link>
          </div>
          <p className="mt-1 text-xs text-cream/50">Blocked by time, tech or wanting it built for them, and still new.</p>
          {hotRows.length === 0 ? (
            <p className="mt-4 text-sm text-cream/50">No new hot leads.</p>
          ) : (
            <ul className="mt-3 divide-y divide-cream/10">
              {hotRows.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/responses/${r.id}`} className="block py-3 hover:bg-cream/[0.03]">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold text-cream">{r.name}</span>
                      <span className="text-xs text-cream/45">{formatDate(r.created_at)}</span>
                    </div>
                    <p className="text-sm text-cream/60">
                      {r.business_name} &middot; {labelFor(Q4_OPTIONS, r.q4_blocker, "short")} &middot; {labelFor(Q2_OPTIONS, r.q2_focus_area, "short")}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-cream/10 bg-cream/[0.04] p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-cream">Testimonial bank</h2>
            <Link href="/admin/responses?view=testimonials" className="text-xs text-peach underline underline-offset-4">
              See all
            </Link>
          </div>
          {bankRows.length === 0 ? (
            <p className="mt-4 text-sm text-cream/50">Nothing shareable yet.</p>
          ) : (
            <ul className="mt-3 space-y-4">
              {bankRows.map((r) => (
                <li key={r.id} className="border-b border-cream/10 pb-4 last:border-0 last:pb-0">
                  <p className="line-clamp-4 font-display text-lg leading-snug text-cream">&ldquo;{r.q5_experience_text}&rdquo;</p>
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-cream/50">
                    <span>
                      {r.testimonial_permission === "named" ? `${r.name}, ${r.business_name}` : "Anonymous"}
                    </span>
                    <span className="flex gap-2">
                      <CopyButton text={testimonialText(r)}>Copy</CopyButton>
                      <Link href={`/admin/responses/${r.id}`} className="rounded-full border border-cream/25 px-3 py-1.5 font-semibold text-cream hover:border-cream/50">
                        Open
                      </Link>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-cream/10 bg-cream/[0.04] p-5">
        <h2 className="text-sm font-semibold text-cream">Form drop-off</h2>
        <p className="mb-4 mt-1 text-xs text-cream/50">
          Furthest step reached per visitor. {drafts.length === 0 ? "No visits tracked yet." : `${drafts.length} tracked visits.`}
        </p>
        <FunnelChart steps={funnel} />
      </section>
    </div>
  );
}
