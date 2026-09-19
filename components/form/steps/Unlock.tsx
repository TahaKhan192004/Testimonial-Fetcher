"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { LockMeter } from "../LockMeter";
import type { FormState, SubmitState } from "../state";
import { PrimaryButton } from "./ui";

type Props = { state: FormState; submit: SubmitState; onSubmit: () => void };

async function fireConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const confetti = (await import("canvas-confetti")).default;
  const colors = ["#FFB285", "#CA8E79", "#FFF9F1", "#7A1F2B"];
  confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 }, colors });
  setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors }), 200);
  setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors }), 350);
}

/** Step 9. Submit button, then the unlocked reward. */
export function Unlock({ state, submit, onSubmit }: Props) {
  const done = submit.status === "success" || submit.status === "duplicate";

  useEffect(() => {
    if (submit.status === "success") void fireConfetti();
  }, [submit.status]);

  return (
    <div className="mx-auto w-full max-w-xl">
      <AnimatePresence mode="wait" initial={false}>
        {!done ? (
          <motion.div key="submit" exit={{ opacity: 0, y: -12 }}>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-ring">All done</p>
            <h2 className="font-display text-[2rem] leading-[1.08] text-cream sm:text-5xl">
              Ready to send it, {state.name.split(" ")[0]}?
            </h2>
            <p className="mt-3 text-base leading-relaxed text-cream/65">
              Submit your feedback and your free Google Maps Lead Scraper unlocks right here.
            </p>
            <PrimaryButton
              className="mt-8 w-full text-center leading-tight sm:w-auto sm:px-10"
              onClick={onSubmit}
              disabled={submit.status === "submitting"}
            >
              {submit.status === "submitting" ? "Unlocking..." : "Submit feedback & claim my free scraper"}
            </PrimaryButton>
            {submit.status === "error" && (
              <p role="alert" className="mt-4 text-sm text-peach">
                {submit.message}
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div key="unlocked" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="mb-6">
              <LockMeter percent={100} unlocked size={72} showLabel={false} />
            </div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-ring">
              {submit.status === "duplicate" ? "Already sent" : "Reward unlocked"}
            </p>
            <h2 className="font-display text-[2rem] leading-[1.08] text-cream sm:text-5xl">
              {submit.status === "duplicate" ? (
                <>You already sent your feedback. Here is your link again.</>
              ) : (
                <>
                  Thank you, {state.name.split(" ")[0]}. Your reward is <em className="text-peach">unlocked</em>.
                </>
              )}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-cream/65">
              Your feedback is saved. Here is your free Google Maps Lead Scraper.
            </p>
            {!submit.accessUrl && (
              <p className="mt-8 text-cream/70">Your feedback is in. We will share the scraper link with you shortly.</p>
            )}
            {submit.accessUrl && (
              <a
                href={submit.accessUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex min-h-14 items-center justify-center rounded-full bg-terracotta px-8 text-base font-semibold text-cream transition-colors hover:bg-[#8f2533]"
              >
                Open the Google Maps Lead Scraper &#8594;
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
