"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { answersSchema } from "@/lib/schema";
import { LockMeter } from "./LockMeter";
import {
  LAST_STEP,
  STORAGE_KEY,
  UNLOCK_KEY,
  canAdvance,
  initialState,
  newSessionId,
  progressPercent,
  reducer,
  type FormState,
  type SubmitState,
} from "./state";
import { Blockers } from "./steps/Blockers";
import { Contact } from "./steps/Contact";
import { JobBoard } from "./steps/JobBoard";
import { JobDescription } from "./steps/JobDescription";
import { Ladder } from "./steps/Ladder";
import { Permission } from "./steps/Permission";
import { StatementCards } from "./steps/StatementCards";
import { StoryText } from "./steps/StoryText";
import { Unlock } from "./steps/Unlock";
import { Welcome } from "./steps/Welcome";
import type { StepProps } from "./steps/ui";

const ADVANCE_DELAY_MS = 400;

function toAnswers(s: FormState) {
  return {
    name: s.name,
    email: s.email,
    business_name: s.business,
    q1_prior_ai_use: s.q1,
    q2_focus_area: s.q2,
    q2_other_text: s.q2 === "other" ? s.q2Other : null,
    q3_experience: s.q3,
    q4_blocker: s.q4,
    q5_experience_text: s.q5,
    q6_job_title: s.q6Title || null,
    q6_dream_system: s.q6,
    testimonial_permission: s.permission,
  };
}

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 48 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -48 }),
};

export function FormShell() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [hydrated, setHydrated] = useState(false);
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTracked = useRef(-1);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  const set = useCallback((patch: Partial<FormState>) => dispatch({ type: "set", patch }), []);

  // Restore progress after mount so server and client markup match.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const src = params.get("src") ?? params.get("utm_source") ?? "";
    let saved: Partial<FormState> = {};
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) saved = JSON.parse(raw) as Partial<FormState>;
      // Already submitted in this session and the in-form state is gone: use the fallback page.
      if (sessionStorage.getItem(UNLOCK_KEY) && !raw) {
        window.location.replace("/thank-you");
        return;
      }
    } catch {
      /* storage can be blocked, start fresh */
    }
    dispatch({
      type: "hydrate",
      state: {
        ...saved,
        dir: 1,
        sessionId: saved.sessionId || newSessionId(),
        startedAt: saved.startedAt || Date.now(),
        src: (saved.src || src).slice(0, 120),
      },
    });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, dir: 1 }));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  // Drop-off tracking: report the furthest step reached, once per step.
  useEffect(() => {
    if (!hydrated || !state.sessionId || state.step <= maxTracked.current) return;
    maxTracked.current = state.step;
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: state.sessionId, step: state.step, src: state.src || null }),
      keepalive: true,
    }).catch(() => {});
  }, [hydrated, state.step, state.sessionId, state.src]);

  useEffect(() => () => clearTimeout(timer.current ?? undefined), []);

  const go = useCallback((step: number) => {
    clearTimeout(timer.current ?? undefined);
    dispatch({ type: "go", step: Math.min(Math.max(step, 0), LAST_STEP) });
    window.scrollTo({ top: 0 });
  }, []);

  const next = useCallback(() => go(state.step + 1), [go, state.step]);
  const back = useCallback(() => go(state.step - 1), [go, state.step]);
  const advanceSoon = useCallback(() => {
    clearTimeout(timer.current ?? undefined);
    const from = state.step;
    timer.current = setTimeout(() => go(from + 1), ADVANCE_DELAY_MS);
  }, [go, state.step]);

  const onSubmit = useCallback(async () => {
    const parsed = answersSchema.safeParse(toAnswers(state));
    if (!parsed.success) {
      setSubmit({ status: "error", message: `${parsed.error.issues[0]?.message ?? "Something is missing"}. Go back and check your answers.` });
      return;
    }
    setSubmit({ status: "submitting" });
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: parsed.data,
          src: state.src || null,
          elapsedMs: Math.max(0, Date.now() - state.startedAt),
          sessionId: state.sessionId,
          website: (document.getElementById("website") as HTMLInputElement | null)?.value ?? "",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 429) {
        setSubmit({ status: "error", message: "Too many attempts from this network. Try again in a little while." });
        return;
      }
      if (!res.ok) {
        setSubmit({ status: "error", message: "That did not go through. Nothing is lost, tap the button to try again." });
        return;
      }
      const result: SubmitState = {
        status: json.status === "duplicate" ? "duplicate" : "success",
        accessUrl: json.accessUrl ?? null,
      };
      setSubmit(result);
      try {
        sessionStorage.setItem(UNLOCK_KEY, JSON.stringify(result));
        localStorage.setItem(UNLOCK_KEY, JSON.stringify({ accessUrl: result.accessUrl }));
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    } catch {
      setSubmit({ status: "error", message: "Connection problem. Check your signal and tap the button again." });
    }
  }, [state]);

  // Swipe left to continue (when the step is answered), swipe right to go back.
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const target = e.target as HTMLElement;
    if (target.closest("input, textarea")) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 80 || Math.abs(dy) > 50) return;
    if (dx > 0 && state.step > 0 && submit.status !== "success" && submit.status !== "duplicate") back();
    if (dx < 0 && state.step > 0 && state.step < LAST_STEP && canAdvance(state, state.step)) next();
  };

  const percent = progressPercent(state);
  const unlocked = submit.status === "success" || submit.status === "duplicate";
  const props: StepProps = { state, set, next, advanceSoon };

  const renderStep = () => {
    switch (state.step) {
      case 0:
        return <Welcome {...props} />;
      case 1:
        return <Contact {...props} />;
      case 2:
        return <Ladder {...props} />;
      case 3:
        return <JobBoard {...props} />;
      case 4:
        return <StatementCards {...props} />;
      case 5:
        return <Blockers {...props} />;
      case 6:
        return <StoryText {...props} />;
      case 7:
        return <JobDescription {...props} />;
      case 8:
        return <Permission {...props} />;
      default:
        return <Unlock state={state} submit={submit} onSubmit={onSubmit} />;
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex min-h-dvh flex-col overflow-x-hidden">
        {/* brand orbs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(202,87,148,0.35)_0%,rgba(255,136,116,0.2)_30%,rgba(255,178,133,0.08)_56%,transparent_74%)]" />
          <div className="absolute -bottom-40 -left-40 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(244,122,125,0.22)_0%,rgba(255,166,130,0.1)_46%,transparent_70%)]" />
        </div>

        <header className="relative z-10 flex h-20 items-center justify-between px-5 sm:px-8">
          <button
            type="button"
            onClick={back}
            aria-label="Go back"
            disabled={state.step === 0 || unlocked}
            className="grid h-11 w-11 place-items-center rounded-full border border-cream/20 text-cream transition-opacity hover:border-cream/50 disabled:pointer-events-none disabled:opacity-0"
          >
            &#8592;
          </button>
          {state.step > 0 && hydrated && !unlocked && <LockMeter percent={percent} />}
          <span className="w-11" aria-hidden />
        </header>

        <main
          ref={mainRef}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="relative z-10 flex flex-1 items-start px-5 pb-16 pt-4 sm:items-center sm:px-8"
        >
          {/* Honeypot. Hidden from people and assistive tech, bots fill it. */}
          <div className="sr-only-fields" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
          </div>

          {hydrated && (
            <AnimatePresence mode="wait" custom={state.dir} initial={false}>
              <motion.div
                key={state.step}
                custom={state.dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full"
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>
    </MotionConfig>
  );
}
