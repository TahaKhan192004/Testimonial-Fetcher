"use client";

import { motion } from "framer-motion";
import { Q3_OPTIONS } from "@/lib/options";
import { cn } from "@/lib/utils";
import { OptionGroup, StepFrame, type StepProps } from "./ui";

/** Q3. Large statement cards. The picked one lifts, the rest dim. */
export function StatementCards({ state, set, advanceSoon }: StepProps) {
  return (
    <StepFrame eyebrow="Question 3" title="After the challenge, which of these sounds most like you?" wide>
      <OptionGroup label="Your experience after the challenge" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Q3_OPTIONS.map((o) => {
          const picked = state.q3 === o.key;
          const dim = state.q3 !== null && !picked;
          return (
            <motion.button
              key={o.key}
              type="button"
              role="radio"
              aria-checked={picked}
              animate={{ y: picked ? -6 : 0, scale: picked ? 1.02 : 1, opacity: dim ? 0.4 : 1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              onClick={() => {
                set({ q3: o.key });
                advanceSoon();
              }}
              className={cn(
                "min-h-28 rounded-2xl border p-6 text-left font-display text-2xl leading-snug transition-[border-color,background-color,box-shadow]",
                picked
                  ? "border-peach bg-peach/10 text-cream shadow-[0_18px_40px_-18px_rgba(255,178,133,0.5)]"
                  : "border-cream/15 bg-cream/[0.04] text-cream hover:border-cream/40",
              )}
            >
              {o.label}
            </motion.button>
          );
        })}
      </OptionGroup>
    </StepFrame>
  );
}
