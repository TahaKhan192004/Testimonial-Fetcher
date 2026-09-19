/** Responses per day as a plain SVG line chart. No client JS needed. */
export function TimeSeriesChart({ points }: { points: Array<{ date: string; count: number }> }) {
  const W = 640;
  const H = 180;
  const pad = { l: 28, r: 8, t: 10, b: 24 };
  const max = Math.max(1, ...points.map((p) => p.count));
  const total = points.reduce((s, p) => s + p.count, 0);
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, points.length - 1);
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(p.count).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)} ${H - pad.b} L${x(0).toFixed(1)} ${H - pad.b} Z`;
  const label = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Responses per day, ${total} in the last ${points.length} days`} className="h-auto w-full">
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(max * t)} y2={y(max * t)} stroke="rgba(255,249,241,0.1)" />
          <text x={pad.l - 6} y={y(max * t) + 4} textAnchor="end" fontSize="10" fill="rgba(255,249,241,0.45)">
            {Math.round(max * t)}
          </text>
        </g>
      ))}
      <path d={area} fill="rgba(255,178,133,0.14)" />
      <path d={line} fill="none" stroke="#FFB285" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) =>
        p.count > 0 ? (
          <circle key={p.date} cx={x(i)} cy={y(p.count)} r="2.5" fill="#FFB285">
            <title>{`${label(p.date)}: ${p.count}`}</title>
          </circle>
        ) : null,
      )}
      <text x={pad.l} y={H - 6} fontSize="10" fill="rgba(255,249,241,0.45)">
        {points[0] ? label(points[0].date) : ""}
      </text>
      <text x={W - pad.r} y={H - 6} textAnchor="end" fontSize="10" fill="rgba(255,249,241,0.45)">
        {points.at(-1) ? label(points.at(-1)!.date) : ""}
      </text>
    </svg>
  );
}
