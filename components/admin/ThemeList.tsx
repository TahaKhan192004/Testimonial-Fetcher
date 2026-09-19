"use client";

import Link from "next/link";
import { useState } from "react";
import { Q2_OPTIONS, Q4_OPTIONS, labelFor } from "@/lib/options";
import { formatDate } from "@/lib/utils";
import { patchResponses } from "./api";

export type ThemeItem = {
  id: string;
  name: string;
  business_name: string;
  created_at: string;
  q2_focus_area: string;
  q4_blocker: string;
  q5_experience_text: string;
  q6_recommendation: string | null;
  tags: string[];
};

/** Free-text answers with manual tag chips. Tags feed the tag filter across the dashboard. */
export function ThemeList({ items: initial, field }: { items: ThemeItem[]; field: "q5" | "q6" }) {
  const [items, setItems] = useState(initial);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const setTags = async (item: ThemeItem, tags: string[]) => {
    const before = item.tags;
    setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, tags } : x)));
    try {
      const [u] = await patchResponses([item.id], { tags });
      if (u) setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, tags: u.tags } : x)));
    } catch {
      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, tags: before } : x)));
    }
  };

  if (items.length === 0) return <p className="text-sm text-cream/50">Nothing here yet.</p>;

  return (
    <ul className="space-y-4">
      {items.map((it) => {
        const text = (field === "q5" ? it.q5_experience_text : it.q6_recommendation) || "Not answered";
        return (
          <li key={it.id} className="rounded-2xl border border-cream/10 bg-cream/[0.04] p-5">
            <p className="whitespace-pre-wrap break-words font-display text-xl leading-relaxed text-cream">{text}</p>
            <p className="mt-3 text-xs text-cream/50">
              <Link href={`/admin/responses/${it.id}`} className="text-cream/75 underline underline-offset-4">
                {it.name}
              </Link>
              , {it.business_name} &middot; {formatDate(it.created_at)} &middot; {labelFor(Q2_OPTIONS, it.q2_focus_area, "short")} &middot; {labelFor(Q4_OPTIONS, it.q4_blocker, "short")}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {it.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-peach/15 py-1 pl-3 pr-1 text-xs text-peach">
                  <Link href={`/admin/insights?field=${field}&tag=${encodeURIComponent(t)}`} className="hover:underline">
                    {t}
                  </Link>
                  <button
                    type="button"
                    aria-label={`Remove tag ${t}`}
                    onClick={() => setTags(it, it.tags.filter((x) => x !== t))}
                    className="grid h-6 w-6 place-items-center rounded-full hover:bg-peach/25"
                  >
                    &times;
                  </button>
                </span>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const t = (drafts[it.id] ?? "").trim().toLowerCase().slice(0, 40);
                  setDrafts((d) => ({ ...d, [it.id]: "" }));
                  if (t && !it.tags.includes(t)) void setTags(it, [...it.tags, t]);
                }}
              >
                <input
                  value={drafts[it.id] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [it.id]: e.target.value }))}
                  placeholder="Add tag"
                  aria-label={`Add tag for ${it.name}`}
                  maxLength={40}
                  className="min-h-9 w-28 rounded-full border border-cream/20 bg-transparent px-3 text-xs text-cream placeholder:text-cream/35 focus:border-peach focus:outline-none"
                />
              </form>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
