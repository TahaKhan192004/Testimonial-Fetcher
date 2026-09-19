/** Step-by-step drop-off from the tracking beacon. */
export function FunnelChart({ steps }: { steps: Array<{ label: string; count: number }> }) {
  const top = Math.max(1, steps[0]?.count ?? 0);
  return (
    <ol className="space-y-2">
      {steps.map((s, i) => {
        const prev = i === 0 ? s.count : steps[i - 1].count;
        const lost = prev - s.count;
        return (
          <li key={s.label} className="text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-cream/85">{s.label}</span>
              <span className="tabular-nums text-cream/55">
                {s.count}
                {i > 0 && lost > 0 && <span className="ml-2 text-peach">-{lost}</span>}
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-cream/10">
              <div className="h-2 rounded-full bg-ring" style={{ width: `${(s.count / top) * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
