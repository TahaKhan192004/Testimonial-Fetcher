"use client";

import { useEffect, useRef } from "react";
import type { ResponseRow } from "@/lib/admin/types";
import { DetailPanel } from "./DetailPanel";

export function DetailDrawer({
  row,
  onClose,
  onChange,
}: {
  row: ResponseRow;
  onClose: () => void;
  onChange: (r: ResponseRow) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close details" onClick={onClose} className="absolute inset-0 bg-black/60" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Response from ${row.name}`}
        className="relative h-full w-full max-w-2xl overflow-y-auto border-l border-cream/10 bg-ink p-6 sm:p-8"
      >
        <div className="mb-6 flex items-center justify-between">
          <a href={`/admin/responses/${row.id}`} className="text-xs text-cream/50 underline underline-offset-4 hover:text-cream">
            Open full page
          </a>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-10 w-10 place-items-center rounded-full border border-cream/25 text-cream hover:border-cream/50"
          >
            &times;
          </button>
        </div>
        <DetailPanel key={row.id} row={row} onChange={onChange} />
      </aside>
    </div>
  );
}
