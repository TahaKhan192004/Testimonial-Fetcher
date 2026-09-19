"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import type { FormState } from "../state";
import { cn } from "@/lib/utils";

export type StepProps = {
  state: FormState;
  set: (patch: Partial<FormState>) => void;
  /** Go to the next step now. */
  next: () => void;
  /** Go to the next step after the short "it registered" pause. */
  advanceSoon: () => void;
};

export function StepFrame({
  eyebrow,
  title,
  hint,
  children,
  wide,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={cn("mx-auto w-full", wide ? "max-w-4xl" : "max-w-xl")}>
      {eyebrow && (
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-ring">{eyebrow}</p>
      )}
      <h2 className="font-display text-[2rem] leading-[1.08] text-cream sm:text-5xl">{title}</h2>
      {hint && <p className="mt-3 text-base leading-relaxed text-cream/65">{hint}</p>}
      <div className="mt-8">{children}</div>
    </div>
  );
}

/** Radio-group container. Arrow keys move focus, Enter or Space picks. */
export function OptionGroup({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onKeyDown = (e: React.KeyboardEvent) => {
    const keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"];
    if (!keys.includes(e.key) || !ref.current) return;
    const items = Array.from(ref.current.querySelectorAll<HTMLElement>("[role=radio]"));
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (i === -1) return;
    e.preventDefault();
    const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1;
    items[(i + step + items.length) % items.length]?.focus();
  };
  return (
    <div ref={ref} role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className={className}>
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={cn(
        "inline-flex min-h-14 items-center justify-center gap-2 rounded-full px-8 text-base font-semibold transition-colors",
        "bg-terracotta text-cream hover:bg-[#8f2533] disabled:cursor-not-allowed disabled:bg-cream/10 disabled:text-cream/40",
        className,
      )}
    >
      {children}
    </motion.button>
  );
}
