"use client";

import { useState } from "react";
import {
  LEAD_STATUS_OPTIONS,
  PERMISSION_OPTIONS,
  Q1_OPTIONS,
  Q2_OPTIONS,
  Q3_OPTIONS,
  Q4_OPTIONS,
  labelFor,
  type LeadStatus,
  type PermissionKey,
} from "@/lib/options";
import { testimonialText } from "@/lib/testimonial";
import { formatDate } from "@/lib/utils";
import type { ResponseRow } from "@/lib/admin/types";
import { patchResponses } from "./api";
import { CopyButton } from "./CopyButton";

function Answer({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-cream/45">{label}</dt>
      <dd className="mt-1 text-cream">{children}</dd>
    </div>
  );
}

/** Full answers plus the editable ops fields. Used in the drawer and on the detail page. */
export function DetailPanel({ row, onChange }: { row: ResponseRow; onChange?: (r: ResponseRow) => void }) {
  const [current, setCurrent] = useState(row);
  const [notes, setNotes] = useState(row.admin_notes ?? "");
  const [suggested, setSuggested] = useState(row.suggested_system ?? "");
  const [tagDraft, setTagDraft] = useState("");
  const [busy, setBusy] = useState<"" | "save">("");
  const [message, setMessage] = useState("");

  const apply = (r: ResponseRow) => {
    setCurrent(r);
    onChange?.(r);
  };

  const save = async (patch: Parameters<typeof patchResponses>[1], quiet = false) => {
    setBusy("save");
    setMessage("");
    try {
      const [updated] = await patchResponses([current.id], patch);
      if (updated) apply(updated);
      if (!quiet) setMessage("Saved");
    } catch {
      setMessage("Could not save. Try again.");
    } finally {
      setBusy("");
    }
  };

  const dirty = notes !== (current.admin_notes ?? "") || suggested !== (current.suggested_system ?? "");
  const quote = testimonialText(current);

  const addTag = () => {
    const t = tagDraft.trim().toLowerCase().slice(0, 40);
    setTagDraft("");
    if (t && !current.tags.includes(t)) void save({ tags: [...current.tags, t] }, true);
  };

  return (
    <div className="space-y-8">
      <header>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl text-cream">{current.name}</h2>
            <p className="mt-1 text-cream/65">{current.business_name}</p>
          </div>
          <button
            type="button"
            onClick={() => save({ starred: !current.starred }, true)}
            aria-pressed={current.starred}
            aria-label={current.starred ? "Remove star" : "Star this response"}
            className={`grid h-11 w-11 place-items-center rounded-full border text-xl ${current.starred ? "border-peach text-peach" : "border-cream/25 text-cream/60 hover:border-cream/50"}`}
          >
            {current.starred ? "★" : "☆"}
          </button>
        </div>
        <p className="mt-2 text-sm text-cream/50">
          {current.email} &middot; {formatDate(current.created_at, true)}
          {current.source ? ` · src: ${current.source}` : ""}
        </p>
        {current.flagged_reason && (
          <p className="mt-3 inline-block rounded-full border border-peach/40 bg-peach/10 px-3 py-1 text-xs text-peach">
            Flagged: {current.flagged_reason.replace(/_/g, " ")}
            {current.submission_ms != null ? ` (${Math.round(current.submission_ms / 1000)}s)` : ""}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <CopyButton text={current.email}>Copy email</CopyButton>
          <CopyButton
            text={quote}
            disabled={current.testimonial_permission === "no"}
            title={current.testimonial_permission === "no" ? "This person said no to sharing" : undefined}
          >
            Copy as testimonial
          </CopyButton>
        </div>
      </header>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-cream/45">Q5 In their words</h3>
        <blockquote className="mt-2 whitespace-pre-wrap break-words font-display text-2xl leading-relaxed text-cream">
          {current.q5_experience_text}
        </blockquote>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-cream/45">Q6 What they would tell others</h3>
        <p className="mt-2 whitespace-pre-wrap break-words font-display text-2xl leading-relaxed text-cream">
          {current.q6_recommendation ?? "Not answered"}
        </p>
      </section>

      <section>
        <label htmlFor={`sys-${current.id}`} className="block text-xs font-semibold uppercase tracking-[0.16em] text-ring">
          Suggested offer (internal note)
        </label>
        <textarea
          id={`sys-${current.id}`}
          value={suggested}
          onChange={(e) => setSuggested(e.target.value)}
          rows={3}
          maxLength={5000}
          placeholder="What should we offer this person? Service, price band, next step."
          className="mt-1 w-full rounded-xl border border-cream/20 bg-cream/5 p-3 text-sm text-cream placeholder:text-cream/30 focus:border-peach focus:outline-none"
        />
      </section>

      <dl className="grid gap-5 sm:grid-cols-2">
        <Answer label="Q1 Prior AI use">{labelFor(Q1_OPTIONS, current.q1_prior_ai_use)}</Answer>
        <Answer label="Q2 Focus area">
          {labelFor(Q2_OPTIONS, current.q2_focus_area)}
          {current.q2_other_text ? `: ${current.q2_other_text}` : ""}
        </Answer>
        <Answer label="Q3 Experience">{labelFor(Q3_OPTIONS, current.q3_experience)}</Answer>
        <Answer label="Q4 Blocker">{labelFor(Q4_OPTIONS, current.q4_blocker)}</Answer>
      </dl>

      <section className="space-y-4 rounded-2xl border border-cream/10 bg-cream/[0.04] p-5">
        <div>
          <label htmlFor={`lead-${current.id}`} className="text-xs font-semibold uppercase tracking-[0.16em] text-cream/45">
            Lead status
          </label>
          <select
            id={`lead-${current.id}`}
            value={current.lead_status}
            onChange={(e) => save({ lead_status: e.target.value as LeadStatus }, true)}
            className="mt-1 block min-h-11 w-full rounded-xl border border-cream/20 bg-ink px-3 text-cream focus:border-peach focus:outline-none sm:w-64"
          >
            {LEAD_STATUS_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`perm-${current.id}`} className="text-xs font-semibold uppercase tracking-[0.16em] text-cream/45">
            Permission to share their words
          </label>
          <select
            id={`perm-${current.id}`}
            value={current.testimonial_permission}
            onChange={(e) => save({ testimonial_permission: e.target.value as PermissionKey }, true)}
            className="mt-1 block min-h-11 w-full rounded-xl border border-cream/20 bg-ink px-3 text-cream focus:border-peach focus:outline-none sm:w-64"
          >
            {PERMISSION_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-cream/45">The form no longer asks. Everyone starts as private. Change it after you have asked them.</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cream/45">Tags</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {current.tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full bg-peach/15 py-1 pl-3 pr-1 text-xs text-peach">
                {t}
                <button
                  type="button"
                  aria-label={`Remove tag ${t}`}
                  onClick={() => save({ tags: current.tags.filter((x) => x !== t) }, true)}
                  className="grid h-6 w-6 place-items-center rounded-full hover:bg-peach/25"
                >
                  &times;
                </button>
              </span>
            ))}
            <input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Add tag"
              aria-label="Add tag"
              maxLength={40}
              className="min-h-9 w-28 rounded-full border border-cream/20 bg-transparent px-3 text-xs text-cream placeholder:text-cream/35 focus:border-peach focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor={`notes-${current.id}`} className="text-xs font-semibold uppercase tracking-[0.16em] text-cream/45">
            Admin notes
          </label>
          <textarea
            id={`notes-${current.id}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            maxLength={5000}
            className="mt-1 w-full rounded-xl border border-cream/20 bg-cream/5 p-3 text-sm text-cream focus:border-peach focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!dirty || busy !== ""}
            onClick={() => save({ admin_notes: notes.trim() || null, suggested_system: suggested.trim() || null })}
            className="min-h-11 rounded-full bg-terracotta px-6 text-sm font-semibold text-cream hover:bg-[#8f2533] disabled:bg-cream/10 disabled:text-cream/40"
          >
            {busy === "save" ? "Saving..." : "Save notes"}
          </button>
          <span role="status" className="text-sm text-cream/60">
            {message}
          </span>
        </div>
      </section>
    </div>
  );
}
