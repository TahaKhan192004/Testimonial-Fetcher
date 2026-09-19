import Link from "next/link";
import type { Option } from "@/lib/options";

/** Horizontal bars. Each bar links to the responses table filtered to that answer. */
export function DistributionChart({
  title,
  field,
  options,
  counts,
}: {
  title: string;
  field: "q1" | "q2" | "q3" | "q4";
  options: readonly Option[];
  counts: Record<string, number>;
}) {
  const total = options.reduce((sum, o) => sum + (counts[o.key] ?? 0), 0);
  const max = Math.max(1, ...options.map((o) => counts[o.key] ?? 0));
  return (
    <section className="rounded-2xl border border-cream/10 bg-cream/[0.04] p-5">
      <h3 className="text-sm font-semibold text-cream">{title}</h3>
      <ul className="mt-4 space-y-2">
        {options.map((o) => {
          const n = counts[o.key] ?? 0;
          const pct = total ? Math.round((n / total) * 100) : 0;
          return (
            <li key={o.key}>
              <Link
                href={`/admin/responses?${field}=${o.key}`}
                className="group block rounded-lg px-2 py-1.5 hover:bg-cream/5"
                aria-label={`${o.short ?? o.label}: ${n} responses, ${pct} percent. Open filtered table.`}
              >
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-cream/85">{o.short ?? o.label}</span>
                  <span className="tabular-nums text-cream/55">
                    {n} <span className="text-cream/35">({pct}%)</span>
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-cream/10">
                  <div
                    className="h-2 rounded-full bg-peach transition-opacity group-hover:opacity-80"
                    style={{ width: `${(n / max) * 100}%` }}
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
