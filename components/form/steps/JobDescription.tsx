"use client";

import { useEffect, useRef } from "react";
import { PrimaryButton, StepFrame, type StepProps } from "./ui";

const MIN_CHARS = 10;

/** Q6. Written as a job description, with a live "AI Employee wanted" posting. */
export function JobDescription({ state, set, next }: StepProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const ok = state.q6.trim().length >= MIN_CHARS;
  const title = state.q6Title.trim() || "Your AI Employee";
  const business = state.business.trim();

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <StepFrame
      eyebrow="Question 6"
      title="Write the job description for the ONE AI system you want."
      hint="If you could have one system built for you, what would it do all day?"
      wide
    >
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-ring" htmlFor="job-title">
            Job title
          </label>
          <input
            id="job-title"
            ref={titleRef}
            value={state.q6Title}
            onChange={(e) => set({ q6Title: e.target.value })}
            maxLength={100}
            placeholder="e.g. Lead follow-up assistant"
            className="mt-2 min-h-14 w-full rounded-2xl border border-cream/20 bg-cream/5 px-5 font-display text-2xl text-cream placeholder:text-cream/30 focus:border-peach focus:outline-none"
          />
          <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.18em] text-ring" htmlFor="job-task">
            The task
          </label>
          <textarea
            id="job-task"
            value={state.q6}
            onChange={(e) => set({ q6: e.target.value })}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && ok) next();
            }}
            rows={6}
            maxLength={3000}
            placeholder="What should it do, and what should it hand back to you?"
            className="mt-2 min-h-40 w-full resize-y rounded-2xl border border-cream/20 bg-cream/5 p-5 text-lg leading-relaxed text-cream placeholder:text-cream/30 focus:border-peach focus:outline-none"
          />
          <PrimaryButton className="mt-6" onClick={next} disabled={!ok}>
            Continue
          </PrimaryButton>
        </div>

        <aside aria-label="Live preview of your job posting" className="md:sticky md:top-6 md:self-start">
          <div className="rotate-[0.6deg] rounded-2xl bg-cream p-6 text-ink shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-terracotta">AI Employee wanted</p>
            <p className="mt-3 font-display text-3xl leading-tight">{title}</p>
            {business && <p className="mt-1 text-sm text-ink/60">at {business}</p>}
            <div className="mt-5 border-t border-ink/15 pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">Responsibilities</p>
              <p className="mt-2 whitespace-pre-wrap break-words text-base leading-relaxed text-ink/85">
                {state.q6.trim() || "Your description will appear here as you type."}
              </p>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-ink/15 pt-4 text-sm">
              <div>
                <dt className="text-ink/50">Reports to</dt>
                <dd className="font-semibold">{state.name.split(" ")[0] || "You"}</dd>
              </div>
              <div>
                <dt className="text-ink/50">Hours</dt>
                <dd className="font-semibold">24/7, no breaks</dd>
              </div>
              <div>
                <dt className="text-ink/50">Start date</dt>
                <dd className="font-semibold">Immediately</dd>
              </div>
              <div>
                <dt className="text-ink/50">Sick days</dt>
                <dd className="font-semibold">Zero</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </StepFrame>
  );
}
