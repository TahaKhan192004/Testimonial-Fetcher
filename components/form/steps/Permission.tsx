"use client";

import { motion } from "framer-motion";
import { PERMISSION_OPTIONS } from "@/lib/options";
import { cn } from "@/lib/utils";
import { OptionGroup, StepFrame, type StepProps } from "./ui";

const DETAIL: Record<string, string> = {
  named: "We may quote you with your name and business.",
  anonymous: "We may quote you, with no name attached.",
  no: "Only our team reads it. Nothing is published.",
};

/** Step 8. Permission to use the feedback as a testimonial. */
export function Permission({ state, set, advanceSoon }: StepProps) {
  return (
    <StepFrame eyebrow="Last question" title="Can we share what you wrote?" hint="Your call. Your access does not depend on the answer.">
      <OptionGroup label="Permission to use your feedback" className="flex flex-col gap-3">
        {PERMISSION_OPTIONS.map((o) => {
          const picked = state.permission === o.key;
          return (
            <motion.button
              key={o.key}
              type="button"
              role="radio"
              aria-checked={picked}
              whileTap={{ scale: 0.98 }}
              animate={{ opacity: state.permission !== null && !picked ? 0.45 : 1, y: picked ? -3 : 0 }}
              onClick={() => {
                set({ permission: o.key });
                advanceSoon();
              }}
              className={cn(
                "min-h-20 rounded-2xl border p-5 text-left transition-colors",
                picked ? "border-peach bg-peach/10" : "border-cream/15 bg-cream/[0.04] hover:border-cream/40",
              )}
            >
              <span className="block font-display text-2xl text-cream">{o.label}</span>
              <span className="mt-1 block text-sm text-cream/60">{DETAIL[o.key]}</span>
            </motion.button>
          );
        })}
      </OptionGroup>
    </StepFrame>
  );
}
