"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { PrimaryButton, StepFrame, type StepProps } from "./ui";

const MIN_CHARS = 10;

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => SpeechRecognitionLike) | null;
}

/** Q5. A big textarea, with optional voice input where the browser supports it. */
export function StoryText({ state, set, next }: StepProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const valueRef = useRef(state.q5);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);

  valueRef.current = state.q5;
  const len = state.q5.trim().length;
  const ok = len >= MIN_CHARS;

  useEffect(() => {
    setSupported(getRecognition() !== null);
    ref.current?.focus();
    return () => recRef.current?.stop();
  }, []);

  const toggleVoice = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const Rec = getRecognition();
    if (!Rec) return;
    const rec = new Rec();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = navigator.language || "en-US";
    rec.onresult = (e) => {
      let heard = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) heard += e.results[i][0].transcript;
      }
      if (heard) {
        const sep = valueRef.current && !/\s$/.test(valueRef.current) ? " " : "";
        set({ q5: valueRef.current + sep + heard.trim() });
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  return (
    <StepFrame eyebrow="Question 5" title="Your experience, in your words." hint="What was it like? Good, bad or somewhere in between.">
      <div className="relative">
        <textarea
          ref={ref}
          value={state.q5}
          onChange={(e) => set({ q5: e.target.value })}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && ok) next();
          }}
          rows={7}
          maxLength={3000}
          placeholder="Say it like you would to another business owner."
          aria-label="Your experience in your words"
          className="min-h-56 w-full resize-y rounded-2xl border border-cream/20 bg-cream/5 p-5 font-display text-2xl leading-relaxed text-cream placeholder:text-cream/30 focus:border-peach focus:outline-none"
        />
        {supported && (
          <button
            type="button"
            onClick={toggleVoice}
            aria-pressed={listening}
            aria-label={listening ? "Stop voice input" : "Speak your answer"}
            className={cn(
              "absolute bottom-4 right-4 flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors",
              listening ? "border-peach bg-peach text-ink" : "border-cream/25 bg-ink/70 text-cream hover:border-cream/50",
            )}
          >
            <span aria-hidden className={cn("h-2.5 w-2.5 rounded-full", listening ? "animate-pulse bg-terracotta" : "bg-ring")} />
            {listening ? "Listening" : "Speak it"}
          </button>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-cream/55">
        <span aria-live="polite">{ok ? "Thanks, that is plenty. Keep going if you like." : `A sentence or two is enough (${len}/${MIN_CHARS})`}</span>
        <span className="tabular-nums">{state.q5.length}</span>
      </div>
      <PrimaryButton className="mt-7" onClick={next} disabled={!ok}>
        Continue
      </PrimaryButton>
    </StepFrame>
  );
}
