"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LockMeter } from "@/components/form/LockMeter";
import { UNLOCK_KEY } from "@/components/form/state";

type Stored = { accessUrl: string | null };

/** Fallback unlock page for when the in-form state was lost (refresh, new tab). */
export function ThankYou() {
  const [stored, setStored] = useState<Stored | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(UNLOCK_KEY);
      if (raw) setStored(JSON.parse(raw) as Stored);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const hasLink = Boolean(stored?.accessUrl);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-6 py-16">
      <LockMeter percent={100} unlocked size={72} showLabel={false} />
      <p className="mb-4 mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-ring">Thank you</p>
      <h1 className="font-display text-4xl leading-[1.08] text-cream sm:text-5xl">
        Your feedback is in. <em className="text-peach">Thank you.</em>
      </h1>
      <p className="mt-4 text-base leading-relaxed text-cream/70">
        Your answers are saved and the Google Maps Lead Scraper is yours.
      </p>
      {ready && hasLink && stored?.accessUrl && (
        <a
          href={stored.accessUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex min-h-14 w-fit items-center rounded-full bg-terracotta px-8 font-semibold text-cream hover:bg-[#8f2533]"
        >
          Open the Google Maps Lead Scraper &#8594;
        </a>
      )}
      {ready && !hasLink && (
        <p className="mt-6 text-sm text-cream/55">
          Need the link again? <Link href="/" className="text-peach underline underline-offset-4">Submit the form</Link>{" "}
          with the same email and it will show up.
        </p>
      )}
    </main>
  );
}
