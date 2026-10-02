'use client';

import { useEffect, useState } from 'react';

export interface ProgressRingProps {
  done: number;
  total: number;
  /** Text inside the ring, already formatted for the locale. */
  center: string;
  label: string;
  size?: number;
}

/**
 * Journey progress as a ring. It fills from empty on first paint (450 ms, eased) so the audience
 * sees the number being earned; with reduced motion it simply appears at its value.
 */
export function ProgressRing({ done, total, center, label, size = 72 }: ProgressRingProps) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(done));
    return () => cancelAnimationFrame(frame);
  }, [done]);

  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = total > 0 ? Math.min(1, shown / total) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg aria-hidden width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-track"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="stroke-accent motion-safe:transition-[stroke-dashoffset] motion-safe:duration-[450ms] motion-safe:ease-out"
        />
      </svg>
      <span
        aria-hidden
        dir="ltr"
        className="absolute inset-0 flex items-center justify-center text-title font-medium tabular-nums text-fg"
      >
        {center}
      </span>
    </div>
  );
}
