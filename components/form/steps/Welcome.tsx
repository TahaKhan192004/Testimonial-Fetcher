"use client";

import { motion } from "framer-motion";
import { LockMeter } from "../LockMeter";
import { PrimaryButton, type StepProps } from "./ui";

/** The feedback is the point. The scraper is the thank-you, shown as a smaller reward card. */
export function Welcome({ next, set, state }: StepProps) {
  const start = () => {
    if (!state.startedAt || state.name === "") set({ startedAt: Date.now() });
    next();
  };
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-start">
      <h1 className="font-display text-[2.4rem] leading-[1.05] text-cream sm:text-6xl">
        Tell us how the AI Employee Challenge <em className="text-peach">really</em> went.
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-cream/70">
        It takes under 2 minutes. Your feedback does not need to be positive, honest is more useful.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="mt-8 flex w-full items-center gap-4 rounded-2xl border border-cream/15 bg-cream/[0.05] p-4 sm:p-5"
      >
        <LockMeter percent={0} size={36} showLabel={false} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ring">And it unlocks</p>
          <p className="mt-1 text-base leading-snug text-cream">
            The Google Maps Lead Scraper, worth $50,{" "}
            <em className="relative inline-block font-display text-lg text-peach">
              free
              <svg aria-hidden viewBox="0 0 100 12" preserveAspectRatio="none" className="absolute -bottom-1 left-0 h-2 w-full">
                <motion.path
                  d="M2 8 C 25 2, 55 11, 98 4"
                  stroke="#FFB285"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
                />
              </svg>
            </em>
            .
          </p>
        </div>
      </motion.div>

      <div className="mt-8">
        <PrimaryButton onClick={start} className="px-10">
          Give feedback
        </PrimaryButton>
      </div>
    </div>
  );
}
