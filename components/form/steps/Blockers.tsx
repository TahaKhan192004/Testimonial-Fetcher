"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Q4_OPTIONS } from "@/lib/options";
import { cn } from "@/lib/utils";
import { OptionGroup, StepFrame, type StepProps } from "./ui";

/** Q4. Blockers drawn as bricks in a wall. The one you pick cracks. */
export function Blockers({ state, set, advanceSoon }: StepProps) {
  return (
    <StepFrame eyebrow="Question 4" title="What is the wall between you and your AI Employee?" hint="Pick the one that stops you the most.">
      <OptionGroup label="What is stopping you" className="flex flex-col gap-3">
        {Q4_OPTIONS.map((o) => {
          const picked = state.q4 === o.key;
          return (
            <motion.button
              key={o.key}
              type="button"
              role="radio"
              aria-checked={picked}
              animate={{ opacity: state.q4 !== null && !picked ? 0.45 : 1, scale: picked ? 0.985 : 1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                set({ q4: o.key });
                advanceSoon();
              }}
              className={cn(
                "wall relative min-h-16 overflow-hidden rounded-xl border px-5 py-4 text-left text-lg text-cream transition-colors",
                picked ? "border-peach" : "border-cream/15 hover:border-cream/40",
              )}
            >
              <span className="relative z-10">{o.label}</span>
              <AnimatePresence>
                {picked && (
                  <>
                    <motion.span
                      aria-hidden
                      className="absolute inset-0 bg-ink"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.55 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: 0.15, duration: 0.3 }}
                    />
                    <svg aria-hidden viewBox="0 0 400 64" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                      <motion.path
                        d="M150 0 L165 14 L148 24 L170 38 L156 50 L172 64"
                        stroke="#FFB285"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.28 }}
                      />
                    </svg>
                    <motion.span
                      aria-hidden
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 text-xs sm:block font-bold uppercase tracking-[0.18em] text-peach"
                    >
                      Breaking through
                    </motion.span>
                  </>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </OptionGroup>
    </StepFrame>
  );
}
