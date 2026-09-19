"use client";

import { useEffect, useRef } from "react";
import { PrimaryButton, StepFrame, type StepProps } from "./ui";

const MIN_CHARS = 10;

/** Q6. What they would tell someone thinking about joining the next challenge. */
export function Recommend({ state, set, next }: StepProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const len = state.q6.trim().length;
  const ok = len >= MIN_CHARS;

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <StepFrame
      eyebrow="Question 6"
      title="What would you tell someone thinking about joining the next one?"
      hint="Be honest. It helps the next person decide, and it helps us make the challenge better."
    >
      <textarea
        ref={ref}
        value={state.q6}
        onChange={(e) => set({ q6: e.target.value })}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && ok) next();
        }}
        rows={7}
        maxLength={3000}
        placeholder="Say it like you would to a friend who is on the fence."
        aria-label="What you would tell someone thinking about joining the next challenge"
        className="min-h-56 w-full resize-y rounded-2xl border border-cream/20 bg-cream/5 p-5 font-display text-2xl leading-relaxed text-cream placeholder:text-cream/30 focus:border-peach focus:outline-none"
      />
      <div className="mt-3 flex items-center justify-between text-sm text-cream/55">
        <span aria-live="polite">{ok ? "Thanks, that is plenty. Keep going if you like." : `A sentence or two is enough (${len}/${MIN_CHARS})`}</span>
        <span className="tabular-nums">{state.q6.length}</span>
      </div>
      <PrimaryButton className="mt-7" onClick={next} disabled={!ok}>
        Continue
      </PrimaryButton>
    </StepFrame>
  );
}
