"use client";

import { motion } from "framer-motion";
import { useId } from "react";

type Props = {
  /** 0 to 100 */
  percent: number;
  unlocked?: boolean;
  size?: number;
  showLabel?: boolean;
};

const BODY = { x: 8, y: 34, w: 48, h: 38 };

/** Padlock that fills from the bottom as answers come in and opens on success. */
export function LockMeter({ percent, unlocked = false, size = 44, showLabel = true }: Props) {
  const clipId = useId();
  const full = percent >= 100;
  const fillHeight = (BODY.h * Math.min(percent, 100)) / 100;
  const label = unlocked ? "Unlocked" : `${percent}% unlocked`;

  return (
    <div className="flex items-center gap-3" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={unlocked ? 100 : percent} aria-label="Unlock progress">
      <motion.svg
        width={size}
        height={(size * 80) / 64}
        viewBox="0 0 64 80"
        fill="none"
        aria-hidden="true"
        animate={full && !unlocked ? { rotate: [0, -6, 6, -4, 4, 0] } : { rotate: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={BODY.x} y={BODY.y} width={BODY.w} height={BODY.h} rx="9" />
          </clipPath>
        </defs>
        {/* Shackle */}
        <motion.g
          style={{ transformOrigin: "44px 34px", transformBox: "view-box" }}
          animate={unlocked ? { y: -9, rotate: -32 } : { y: 0, rotate: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 16 }}
        >
          <path
            d="M20 34V24a12 12 0 0 1 24 0v10"
            stroke={unlocked || full ? "#FFB285" : "#CA8E79"}
            strokeWidth="6"
            strokeLinecap="round"
          />
        </motion.g>
        {/* Body */}
        <rect x={BODY.x} y={BODY.y} width={BODY.w} height={BODY.h} rx="9" fill="rgba(255,249,241,0.08)" stroke="rgba(255,249,241,0.28)" strokeWidth="2" />
        <g clipPath={`url(#${clipId})`}>
          <motion.rect
            x={BODY.x}
            width={BODY.w}
            fill="#FFB285"
            initial={false}
            animate={{ y: BODY.y + BODY.h - fillHeight, height: fillHeight }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </g>
        <circle cx="32" cy="50" r="4" fill="#1C0E0B" />
        <rect x="30.5" y="52" width="3" height="9" rx="1.5" fill="#1C0E0B" />
      </motion.svg>
      {showLabel && (
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ring tabular-nums">{label}</span>
      )}
    </div>
  );
}
