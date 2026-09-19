"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { emailSchema } from "@/lib/schema";
import { contactComplete, type FormState } from "../state";
import { PrimaryButton, type StepProps } from "./ui";

type Field = "name" | "email" | "business";

const FIELDS: Array<{
  key: Field;
  prompt: string;
  placeholder: string;
  type: string;
  autoComplete: string;
  inputMode?: "email" | "text";
}> = [
  { key: "name", prompt: "First things first. What should we call you?", placeholder: "Your name", type: "text", autoComplete: "name" },
  { key: "email", prompt: "Where should we send your access?", placeholder: "you@company.com", type: "email", autoComplete: "email", inputMode: "email" },
  { key: "business", prompt: "And what is your business called?", placeholder: "Business name", type: "text", autoComplete: "organization" },
];

const valueOf = (s: FormState, k: Field) => s[k];
const isValid = (k: Field, v: string) => (k === "email" ? emailSchema.safeParse(v).success : v.trim().length > 0);

/** Three fields, one at a time. Confirmed answers slide up into badges. */
export function Contact({ state, set, next, advanceSoon }: StepProps) {
  const firstInvalid = FIELDS.findIndex((f) => !isValid(f.key, valueOf(state, f.key)));
  const [phase, setPhase] = useState(firstInvalid === -1 ? 3 : firstInvalid);
  const [draft, setDraft] = useState("");
  const [touched, setTouched] = useState(false);
  const editing = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase < 3) inputRef.current?.focus();
  }, [phase]);

  const field = FIELDS[phase];
  const valid = field ? isValid(field.key, draft) : false;
  const showError = field?.key === "email" && touched && draft.length > 0 && !valid;

  const confirm = () => {
    if (!field) return;
    setTouched(true);
    if (!valid) return;
    const value = field.key === "email" ? draft.trim().toLowerCase() : draft.trim();
    const merged = { ...state, [field.key]: value } as FormState;
    set({ [field.key]: value } as Partial<FormState>);
    setDraft("");
    setTouched(false);
    const nextInvalid = FIELDS.findIndex((f) => !isValid(f.key, valueOf(merged, f.key)));
    if (nextInvalid === -1) {
      setPhase(3);
      if (!editing.current) advanceSoon();
      editing.current = false;
    } else {
      setPhase(nextInvalid);
    }
  };

  const edit = (index: number) => {
    editing.current = true;
    const key = FIELDS[index].key;
    setDraft(valueOf(state, key));
    setTouched(false);
    setPhase(index);
  };

  const badges = FIELDS.map((f, i) => ({ f, i })).filter(({ f, i }) => i !== phase && isValid(f.key, valueOf(state, f.key)));

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-6 flex min-h-10 flex-wrap gap-2">
        <AnimatePresence initial={false}>
          {badges.map(({ f, i }) => (
            <motion.button
              key={f.key}
              layout
              type="button"
              onClick={() => edit(i)}
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-full truncate rounded-full border border-peach/40 bg-peach/10 px-4 py-2 text-sm text-cream transition-colors hover:bg-peach/20"
              aria-label={`Edit ${f.key}: ${valueOf(state, f.key)}`}
            >
              <span className="mr-2 text-peach">&#10003;</span>
              {valueOf(state, f.key)}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {field ? (
          <motion.form
            key={field.key}
            onSubmit={(e) => {
              e.preventDefault();
              confirm();
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            noValidate
          >
            <label htmlFor="contact-input" className="block font-display text-[1.9rem] leading-[1.12] text-cream sm:text-4xl">
              {field.prompt}
            </label>
            <div className="mt-7 flex items-center gap-3">
              <input
                id="contact-input"
                ref={inputRef}
                type={field.type}
                inputMode={field.inputMode}
                autoComplete={field.autoComplete}
                autoCapitalize={field.key === "email" ? "none" : "words"}
                spellCheck={false}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder={field.placeholder}
                aria-invalid={showError}
                aria-describedby={showError ? "contact-error" : undefined}
                maxLength={field.key === "email" ? 254 : 160}
                className="min-h-14 w-full rounded-2xl border border-cream/20 bg-cream/5 px-5 text-lg text-cream placeholder:text-cream/35 focus:border-peach focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Confirm"
                disabled={!valid}
                className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-terracotta text-xl text-cream transition-colors hover:bg-[#8f2533] disabled:bg-cream/10 disabled:text-cream/35"
              >
                &#8594;
              </button>
            </div>
            <p id="contact-error" role="alert" className="mt-3 min-h-5 text-sm text-peach">
              {showError ? "That email does not look right yet." : ""}
            </p>
          </motion.form>
        ) : (
          <motion.div key="done" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
            <p className="font-display text-[1.9rem] leading-[1.12] text-cream sm:text-4xl">
              Good to meet you, {state.name.split(" ")[0]}.
            </p>
            <p className="mt-3 text-cream/65">Tap any badge above to change it.</p>
            <PrimaryButton className="mt-7" onClick={next} disabled={!contactComplete(state)}>
              Continue
            </PrimaryButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
