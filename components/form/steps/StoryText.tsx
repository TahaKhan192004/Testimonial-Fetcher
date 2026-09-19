"use client";

import { useEffect, useRef } from "react";
import { PrimaryButton, StepFrame, type StepProps } from "./ui";

const MIN_CHARS = 10;

/** Q5. A big textarea for their experience in their own words. */
export function StoryText({ state, set, next }: StepProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const len = state.q5.trim().length;
  const ok = len >= MIN_CHARS;

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <StepFrame eyebrow="Question 5" title="Your experience, in your words." hint="What was it like? Good, bad or somewhere in between.">
      <textarea
        ref={ref}
        value={state.q5}
        onChange={(e) => set({ q5: e.target.value })}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && ok) next();
        }}
        rows={7}
        maxLength={3000}
        placeholder="Say it like you would to another business owner."
        aria-label="Your experience in your words"
        className="min-h-56 w-full resize-y rounded-2xl border border-cream/20 bg-cream/5 p-5 font-display text-2xl leading-relaxed text-cream placeholder:text-cream/30 focus:border-peach focus:outline-none"
      />
      <div className="mt-3 flex items-center justify-between text-sm text-cream/55">
        <span aria-live="polite">{ok ? "Thanks, that is plenty. Keep going if you like." : `A sentence or two is enough (${len}/${MIN_CHARS})`}</span>
        <span className="tabular-nums">{state.q5.length}</span>
      </div>
      <PrimaryButton className="mt-7" onClick={next} disabled={!ok}>
        Continue
      </PrimaryButton>
    </StepFrame>
  );
}
