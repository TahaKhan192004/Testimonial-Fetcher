"use client";

import { motion } from "framer-motion";
import { Q1_OPTIONS } from "@/lib/options";
import { cn } from "@/lib/utils";
import { OptionGroup, StepFrame, type StepProps } from "./ui";

/** Q1. Five rungs, bottom to top. Picking one lights every rung up to it. */
export function Ladder({ state, set, advanceSoon }: StepProps) {
  const selectedIndex = Q1_OPTIONS.findIndex((o) => o.key === state.q1);
  // Rung 5 is at the top of the ladder, rung 1 at the bottom.
  const rungs = Q1_OPTIONS.map((o, i) => ({ ...o, index: i })).reverse();

  return (
    <StepFrame eyebrow="Question 1" title="Before the challenge, how were you using AI?" hint="Tap the rung that fits best. Climb from the bottom.">
      <OptionGroup label="How you used AI before" className="relative flex flex-col gap-3 px-4">
        {/* rails */}
        <span aria-hidden className="absolute bottom-2 left-1 top-2 w-1 rounded-full bg-cream/15" />
        <span aria-hidden className="absolute bottom-2 right-1 top-2 w-1 rounded-full bg-cream/15" />
        {rungs.map((r) => {
          const lit = selectedIndex >= r.index;
          const picked = selectedIndex === r.index;
          return (
            <button
              key={r.key}
              type="button"
              role="radio"
              aria-checked={picked}
              onClick={() => {
                set({ q1: r.key });
                advanceSoon();
              }}
              className={cn(
                "relative min-h-16 overflow-hidden rounded-xl border px-5 py-3 text-left transition-colors",
                lit ? "border-peach/70" : "border-cream/15 hover:border-cream/40",
              )}
            >
              <motion.span
                aria-hidden
                className="absolute inset-0 origin-left bg-peach"
                initial={false}
                animate={{ scaleX: lit ? 1 : 0, opacity: picked ? 1 : 0.22 }}
                transition={{ duration: 0.3, delay: lit ? r.index * 0.06 : 0 }}
              />
              <span className="relative flex items-center gap-4">
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold",
                    picked ? "bg-ink text-peach" : lit ? "bg-peach/30 text-cream" : "bg-cream/10 text-cream/60",
                  )}
                >
                  {r.index + 1}
                </span>
                <span className={cn("text-base leading-snug sm:text-lg", picked ? "font-semibold text-ink" : "text-cream")}>
                  {r.label}
                </span>
              </span>
            </button>
          );
        })}
      </OptionGroup>
    </StepFrame>
  );
}
