"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Q2_OPTIONS, type Q2Key } from "@/lib/options";
import { cn } from "@/lib/utils";
import { OptionGroup, PrimaryButton, StepFrame, type StepProps } from "./ui";

const ROLE_TITLES: Record<Q2Key, string> = {
  lead_gen: "AI Lead Hunter",
  sales_followup: "AI Sales Rep",
  content_branding: "AI Content Producer",
  onboarding_delivery: "AI Onboarding Manager",
  operations_admin: "AI Operations Assistant",
  customer_support: "AI Support Agent",
  reporting_decisions: "AI Analyst",
  other: "AI Specialist",
};

/** Q2. Role cards with a "Hiring" stamp. "Other" opens an inline input. */
export function JobBoard({ state, set, next, advanceSoon }: StepProps) {
  const otherRef = useRef<HTMLInputElement>(null);
  const isOther = state.q2 === "other";

  useEffect(() => {
    if (isOther) otherRef.current?.focus();
  }, [isOther]);

  return (
    <StepFrame eyebrow="Question 2" title="Which role are you hiring for first?" hint="Where do you most want AI to help in your business?" wide>
      <OptionGroup label="Where AI should help first" className="grid grid-cols-2 gap-3">
        {Q2_OPTIONS.map((o) => {
          const picked = state.q2 === o.key;
          return (
            <motion.button
              key={o.key}
              type="button"
              role="radio"
              aria-checked={picked}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                set({ q2: o.key });
                if (o.key !== "other") advanceSoon();
              }}
              className={cn(
                "relative min-h-32 overflow-hidden rounded-2xl border p-4 pb-11 text-left transition-colors sm:min-h-28 sm:p-5 sm:pb-5",
                picked ? "border-peach bg-peach/10" : "border-cream/15 bg-cream/[0.04] hover:border-cream/40",
              )}
            >
              <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-ring">Open role</span>
              <span className="mt-1 block font-display text-xl leading-tight text-cream sm:text-2xl">{ROLE_TITLES[o.key]}</span>
              <span className="mt-1 block text-xs text-cream/60 sm:text-sm">{o.label}</span>
              <AnimatePresence>
                {picked && (
                  <motion.span
                    aria-hidden
                    initial={{ opacity: 0, scale: 2.2, rotate: -20 }}
                    animate={{ opacity: 1, scale: 1, rotate: -10 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 18 }}
                    className="absolute bottom-3 right-3 rounded-md sm:bottom-auto sm:right-4 sm:top-4 border-2 border-peach px-2 py-0.5 text-xs font-extrabold uppercase tracking-[0.2em] text-peach"
                  >
                    Hiring
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </OptionGroup>

      <AnimatePresence initial={false}>
        {isOther && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (state.q2Other.trim()) next();
            }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 pt-5 sm:flex-row">
              <input
                ref={otherRef}
                value={state.q2Other}
                onChange={(e) => set({ q2Other: e.target.value })}
                maxLength={200}
                placeholder="Which role would you hire for?"
                aria-label="Which role would you hire for?"
                className="min-h-14 w-full rounded-2xl border border-cream/20 bg-cream/5 px-5 text-lg text-cream placeholder:text-cream/35 focus:border-peach focus:outline-none"
              />
              <PrimaryButton type="submit" disabled={!state.q2Other.trim()}>
                Continue
              </PrimaryButton>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </StepFrame>
  );
}
