"use client";

import { useState } from "react";
import type { InsightRow } from "@/lib/admin/types";
import { formatDate } from "@/lib/utils";

/** Claude analysis of Q5 and Q6. Cached in the insights table, re-run on demand. */
export function AnalyzePanel({ initial, total }: { initial: InsightRow | null; total: number }) {
  const [insight, setInsight] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const stale = insight ? insight.response_count !== total : false;

  const run = async (force: boolean) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const json = (await res.json()) as { insight?: InsightRow; message?: string };
      if (!res.ok || !json.insight) throw new Error(json.message ?? "Analysis failed");
      setInsight(json.insight);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setBusy(false);
    }
  };

  const r = insight?.result;

  return (
    <section className="rounded-2xl border border-cream/10 bg-cream/[0.04] p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-sm font-semibold text-cream">Claude analysis</h2>
          <p className="text-xs text-cream/50">
            {insight
              ? `Based on ${insight.response_count} responses, run ${formatDate(insight.created_at, true)}${stale ? `. ${total - insight.response_count} newer since.` : "."}`
              : "Themes, complaints and requested systems from Q5 and Q6."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => run(Boolean(insight))}
          disabled={busy || total === 0}
          className="ml-auto min-h-10 rounded-full bg-terracotta px-5 text-sm font-semibold text-cream hover:bg-[#8f2533] disabled:bg-cream/10 disabled:text-cream/40"
        >
          {busy ? "Analysing..." : insight ? "Re-run analysis" : "Analyze"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-peach">
          {error}
        </p>
      )}
      {r && (
        <div className="mt-6 space-y-6">
          <p className="font-display text-xl leading-relaxed text-cream">{r.summary}</p>
          <div className="grid gap-6 lg:grid-cols-3">
            <List title="Themes" items={r.themes.map((t) => ({ head: t.title, body: t.description, n: t.mentions, extra: t.quotes?.map((q) => `“${q}”`) }))} />
            <List title="Common complaints" items={r.complaints.map((t) => ({ head: t.title, body: t.description, n: t.mentions }))} />
            <List title="Requested systems" items={r.requested_systems.map((t) => ({ head: t.name, body: t.description, n: t.mentions }))} />
          </div>
          {r.offer_ideas.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-ring">What to offer next</h3>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-cream/85">
                {r.offer_ideas.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function List({ title, items }: { title: string; items: Array<{ head: string; body: string; n?: number; extra?: string[] }> }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-ring">{title}</h3>
      <ul className="mt-2 space-y-3">
        {items.map((i) => (
          <li key={i.head}>
            <p className="font-semibold text-cream">
              {i.head}
              {i.n != null && <span className="ml-2 text-xs font-normal text-cream/45">~{i.n}</span>}
            </p>
            <p className="text-sm text-cream/70">{i.body}</p>
            {i.extra?.map((q) => (
              <p key={q} className="mt-1 text-xs italic text-cream/50">
                {q}
              </p>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
