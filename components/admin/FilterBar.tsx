"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LEAD_STATUS_OPTIONS,
  PERMISSION_OPTIONS,
  Q1_OPTIONS,
  Q2_OPTIONS,
  Q3_OPTIONS,
  Q4_OPTIONS,
  type Option,
} from "@/lib/options";
import { SAVED_VIEWS, filtersToParams, type ResponseFilters } from "@/lib/admin/query";
import { cn } from "@/lib/utils";

const selectCls =
  "min-h-11 w-full rounded-xl border border-cream/20 bg-ink px-3 text-sm text-cream focus:border-peach focus:outline-none";

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly Option[];
}) {
  const known = options.some((o) => o.key === value);
  return (
    <label className="block text-xs text-cream/55">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className={cn(selectCls, "mt-1")}>
        <option value="">Any</option>
        {value && !known && <option value={value}>Custom</option>}
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.short ?? o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterBar({ filters }: { filters: ResponseFilters }) {
  const router = useRouter();
  const [f, setF] = useState(filters);
  const patch = (p: Partial<ResponseFilters>) => setF((prev) => ({ ...prev, ...p }));

  const go = (next: ResponseFilters) => {
    const qs = filtersToParams({ ...next, page: 1 }).toString();
    router.push(`/admin/responses${qs ? `?${qs}` : ""}`);
  };

  return (
    <div className="space-y-4">
      <nav aria-label="Saved views" className="flex flex-wrap gap-2">
        {SAVED_VIEWS.map((v) => (
          <button
            key={v.id || "all"}
            type="button"
            onClick={() => {
              const cleared = { ...f, view: v.id, page: 1 } as ResponseFilters;
              setF(cleared);
              go(cleared);
            }}
            aria-pressed={filters.view === v.id}
            className={cn(
              "min-h-10 rounded-full border px-4 text-sm transition-colors",
              filters.view === v.id ? "border-peach bg-peach/15 text-peach" : "border-cream/20 text-cream/75 hover:border-cream/45",
            )}
          >
            {v.label}
          </button>
        ))}
      </nav>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(f);
        }}
        className="space-y-3 rounded-2xl border border-cream/10 bg-cream/[0.04] p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-xs text-cream/55 sm:col-span-2">
            Search name, email, business or text
            <input
              type="search"
              value={f.q}
              onChange={(e) => patch({ q: e.target.value })}
              className={cn(selectCls, "mt-1")}
              placeholder="Search"
            />
          </label>
          <label className="block text-xs text-cream/55">
            From
            <input type="date" value={f.from} onChange={(e) => patch({ from: e.target.value })} className={cn(selectCls, "mt-1")} />
          </label>
          <label className="block text-xs text-cream/55">
            To
            <input type="date" value={f.to} onChange={(e) => patch({ to: e.target.value })} className={cn(selectCls, "mt-1")} />
          </label>
          <Select label="Q1 Prior AI use" value={f.q1} onChange={(v) => patch({ q1: v })} options={Q1_OPTIONS} />
          <Select label="Q2 Focus area" value={f.q2} onChange={(v) => patch({ q2: v })} options={Q2_OPTIONS} />
          <Select label="Q3 Experience" value={f.q3} onChange={(v) => patch({ q3: v })} options={Q3_OPTIONS} />
          <Select label="Q4 Blocker" value={f.q4} onChange={(v) => patch({ q4: v })} options={Q4_OPTIONS} />
          <Select label="Permission" value={f.permission} onChange={(v) => patch({ permission: v })} options={PERMISSION_OPTIONS} />
          <Select label="Lead status" value={f.lead} onChange={(v) => patch({ lead: v })} options={LEAD_STATUS_OPTIONS} />
          <label className="block text-xs text-cream/55">
            Tag
            <input value={f.tag} onChange={(e) => patch({ tag: e.target.value })} className={cn(selectCls, "mt-1")} placeholder="Any" />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-cream/75">
          {(
            [
              ["starred", "Starred"],
              ["other", "Has \"Other\" text"],
              ["flagged", "Flagged"],
            ] as const
          ).map(([k, l]) => (
            <label key={k} className="flex min-h-10 items-center gap-2">
              <input
                type="checkbox"
                checked={f[k]}
                onChange={(e) => patch({ [k]: e.target.checked } as Partial<ResponseFilters>)}
                className="h-4 w-4 accent-[#FFB285]"
              />
              {l}
            </label>
          ))}
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => {
                const empty = { ...f, q: "", from: "", to: "", q1: "", q2: "", q3: "", q4: "", permission: "", lead: "", tag: "", view: "", starred: false, other: false, flagged: false } as ResponseFilters;
                setF(empty);
                go(empty);
              }}
              className="min-h-10 rounded-full border border-cream/20 px-4 text-sm hover:border-cream/45"
            >
              Clear
            </button>
            <button type="submit" className="min-h-10 rounded-full bg-terracotta px-5 text-sm font-semibold text-cream hover:bg-[#8f2533]">
              Apply
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
