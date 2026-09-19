"use client";

import { motion } from "framer-motion";
import { LockMeter } from "../LockMeter";
import { PrimaryButton, type StepProps } from "./ui";

export function Welcome({ next, set, state }: StepProps) {
  const start = () => {
    if (!state.startedAt || state.name === "") set({ startedAt: Date.now() });
    next();
  };
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-start">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 16 }}
        className="mb-8"
      >
        <LockMeter percent={0} size={84} showLabel={false} />
      </motion.div>
      <h1 className="font-display text-[2.4rem] leading-[1.05] text-cream sm:text-6xl">
        Unlock the Google Maps Lead Scraper worth $50 for{" "}
        <em className="relative inline-block text-peach">
          free
          <svg aria-hidden viewBox="0 0 100 12" preserveAspectRatio="none" className="absolute -bottom-1 left-0 h-3 w-full">
            <motion.path
              d="M2 8 C 25 2, 55 11, 98 4"
              stroke="#FFB285"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            />
          </svg>
        </em>
        .
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-cream/70">
        Your feedback does not need to be positive. Honest is more useful.
      </p>
      <div className="mt-9 flex flex-wrap items-center gap-4">
        <PrimaryButton onClick={start} className="px-10">
          Start
        </PrimaryButton>
        <span className="text-sm text-cream/50">Takes under 2 minutes</span>
      </div>
    </div>
  );
}
