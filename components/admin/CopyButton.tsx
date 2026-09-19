"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { copyText } from "./api";

export function CopyButton({
  text,
  children,
  disabled,
  className,
  title,
}: {
  text: string | null;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      disabled={disabled || !text}
      title={title}
      onClick={async () => {
        if (text && (await copyText(text))) {
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        }
      }}
      className={cn(
        "rounded-full border border-cream/25 px-3 py-1.5 text-xs font-semibold text-cream transition-colors hover:border-cream/50 disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    >
      {done ? "Copied" : children}
    </button>
  );
}
