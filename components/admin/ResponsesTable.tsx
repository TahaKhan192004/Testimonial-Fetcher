"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  LEAD_STATUS_OPTIONS,
  PERMISSION_OPTIONS,
  Q2_OPTIONS,
  Q3_OPTIONS,
  Q4_OPTIONS,
  labelFor,
  type LeadStatus,
} from "@/lib/options";
import { formatDate, cn } from "@/lib/utils";
import type { ResponseRow } from "@/lib/admin/types";
import { patchResponses } from "./api";
import { DetailDrawer } from "./DetailDrawer";

type Props = {
  rows: ResponseRow[];
  total: number;
  page: number;
  pageSize: number;
  sort: string;
  dir: string;
};

const STATUS_STYLE: Record<string, string> = {
  new: "bg-peach/15 text-peach",
  contacted: "bg-cream/10 text-cream",
  call_booked: "bg-emerald-400/15 text-emerald-300",
  won: "bg-emerald-400/25 text-emerald-200",
  not_a_fit: "bg-cream/5 text-cream/45",
};

export function ResponsesTable({ rows: initial, total, page, pageSize, sort, dir }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [rows, setRows] = useState(initial);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setRows(initial);
    setSelected(new Set());
  }, [initial]);

  const upsert = useCallback((r: ResponseRow) => setRows((prev) => prev.map((x) => (x.id === r.id ? r : x))), []);
  const open = rows.find((r) => r.id === openId) ?? null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const href = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) (v === null ? p.delete(k) : p.set(k, v));
    return `/admin/responses?${p.toString()}`;
  };

  const exportParams = new URLSearchParams(sp.toString());
  exportParams.delete("page");

  const bulk = async (patch: { lead_status?: LeadStatus; starred?: boolean }) => {
    setBulkBusy(true);
    setError("");
    try {
      const updated = await patchResponses(Array.from(selected), patch);
      setRows((prev) => prev.map((r) => updated.find((u) => u.id === r.id) ?? r));
    } catch {
      setError("Bulk update failed.");
    } finally {
      setBulkBusy(false);
    }
  };

  const toggleStar = async (r: ResponseRow) => {
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, starred: !r.starred } : x)));
    try {
      const [u] = await patchResponses([r.id], { starred: !r.starred });
      if (u) upsert(u);
    } catch {
      upsert(r);
    }
  };

  const SortHead = ({ col, children }: { col: string; children: React.ReactNode }) => {
    const active = sort === col;
    const nextDir = active && dir === "desc" ? "asc" : "desc";
    return (
      <Link
        href={href({ sort: col, dir: nextDir, page: null })}
        aria-label={`Sort by ${col.replace("_", " ")}`}
        className="inline-flex items-center gap-1 hover:text-cream"
      >
        {children}
        <span aria-hidden className={active ? "text-peach" : "opacity-0"}>
          {dir === "asc" ? "↑" : "↓"}
        </span>
      </Link>
    );
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <p className="text-sm text-cream/60" aria-live="polite">
          {total} {total === 1 ? "response" : "responses"}
          {selected.size > 0 && ` · ${selected.size} selected`}
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {selected.size > 0 && (
            <>
              <select
                aria-label="Set lead status for selected"
                defaultValue=""
                disabled={bulkBusy}
                onChange={(e) => {
                  if (e.target.value) void bulk({ lead_status: e.target.value as LeadStatus });
                  e.target.value = "";
                }}
                className="min-h-10 rounded-full border border-cream/25 bg-ink px-3 text-sm text-cream"
              >
                <option value="">Set status...</option>
                {LEAD_STATUS_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button type="button" disabled={bulkBusy} onClick={() => bulk({ starred: true })} className="min-h-10 rounded-full border border-cream/25 px-4 text-sm hover:border-cream/50">
                Star
              </button>
              <button type="button" disabled={bulkBusy} onClick={() => bulk({ starred: false })} className="min-h-10 rounded-full border border-cream/25 px-4 text-sm hover:border-cream/50">
                Unstar
              </button>
              <a
                href={`/api/admin/export?ids=${Array.from(selected).join(",")}`}
                className="inline-flex min-h-10 items-center rounded-full border border-cream/25 px-4 text-sm hover:border-cream/50"
              >
                Export selected
              </a>
            </>
          )}
          <a
            href={`/api/admin/export?${exportParams.toString()}`}
            className="inline-flex min-h-10 items-center rounded-full bg-terracotta px-4 text-sm font-semibold text-cream hover:bg-[#8f2533]"
          >
            Export CSV
          </a>
        </div>
      </div>
      {error && (
        <p role="alert" className="mb-3 text-sm text-peach">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-cream/10">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-cream/[0.05] text-xs uppercase tracking-[0.12em] text-cream/55">
            <tr>
              <th className="w-10 p-3">
                <input
                  type="checkbox"
                  aria-label="Select all on this page"
                  checked={allSelected}
                  onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())}
                  className="h-4 w-4 accent-[#FFB285]"
                />
              </th>
              <th className="p-3"><SortHead col="created_at">Date</SortHead></th>
              <th className="p-3"><SortHead col="name">Name</SortHead></th>
              <th className="p-3"><SortHead col="business_name">Business</SortHead></th>
              <th className="p-3">Q2 Focus</th>
              <th className="p-3">Q4 Blocker</th>
              <th className="p-3">Q3 Experience</th>
              <th className="p-3">Permission</th>
              <th className="p-3">Status</th>
              <th className="w-10 p-3"><span className="sr-only">Star</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream/10">
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="p-10 text-center text-cream/50">
                  No responses match these filters.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className={cn("hover:bg-cream/[0.04]", selected.has(r.id) && "bg-peach/[0.06]")}>
                <td className="p-3">
                  <input
                    type="checkbox"
                    aria-label={`Select ${r.name}`}
                    checked={selected.has(r.id)}
                    onChange={(e) =>
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(r.id);
                        else next.delete(r.id);
                        return next;
                      })
                    }
                    className="h-4 w-4 accent-[#FFB285]"
                  />
                </td>
                <td className="whitespace-nowrap p-3 text-cream/60">{formatDate(r.created_at)}</td>
                <td className="p-3">
                  <button type="button" onClick={() => setOpenId(r.id)} className="text-left font-semibold text-cream underline-offset-4 hover:underline">
                    {r.name}
                  </button>
                  {r.flagged_reason && <span title={r.flagged_reason} className="ml-2 text-xs text-peach">flag</span>}
                </td>
                <td className="p-3 text-cream/75">{r.business_name}</td>
                <td className="p-3 text-cream/75">{labelFor(Q2_OPTIONS, r.q2_focus_area, "short")}</td>
                <td className="p-3 text-cream/75">{labelFor(Q4_OPTIONS, r.q4_blocker, "short")}</td>
                <td className="p-3 text-cream/75">{labelFor(Q3_OPTIONS, r.q3_experience, "short")}</td>
                <td className="p-3 text-cream/75">{labelFor(PERMISSION_OPTIONS, r.testimonial_permission, "short")}</td>
                <td className="p-3">
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_STYLE[r.lead_status])}>
                    {labelFor(LEAD_STATUS_OPTIONS, r.lead_status)}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => toggleStar(r)}
                    aria-pressed={r.starred}
                    aria-label={r.starred ? `Unstar ${r.name}` : `Star ${r.name}`}
                    className={cn("text-lg", r.starred ? "text-peach" : "text-cream/35 hover:text-cream/70")}
                  >
                    {r.starred ? "★" : "☆"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm text-cream/60">
        <span>
          Page {page} of {pages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => router.push(href({ page: String(page - 1) }))}
            className="min-h-10 rounded-full border border-cream/25 px-4 hover:border-cream/50 disabled:opacity-35"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => router.push(href({ page: String(page + 1) }))}
            className="min-h-10 rounded-full border border-cream/25 px-4 hover:border-cream/50 disabled:opacity-35"
          >
            Next
          </button>
        </div>
      </nav>

      {open && <DetailDrawer row={open} onClose={() => setOpenId(null)} onChange={upsert} />}
    </div>
  );
}
