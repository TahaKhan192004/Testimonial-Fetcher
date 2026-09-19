import Link from "next/link";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sub,
  href,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  tone?: "warn";
}) {
  const body = (
    <div
      className={cn(
        "h-full rounded-2xl border p-5 transition-colors",
        tone === "warn" ? "border-peach/40 bg-peach/[0.07]" : "border-cream/10 bg-cream/[0.04]",
        href && "hover:border-cream/30",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cream/55">{label}</p>
      <p className="mt-2 font-display text-4xl text-cream tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-sm text-cream/50">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
