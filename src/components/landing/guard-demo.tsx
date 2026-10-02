'use client';

import { useEffect, useState } from 'react';
import { Check, Lock, ShieldCheck, X } from 'lucide-react';

type ItemState = 'pending' | 'allowed' | 'blocked' | 'swapped';

/**
 * The Guard moment from the demo script, played as a loop: the agent drafts a rental
 * application, Guard stops the salary slip, and the yes/no affordability result goes instead.
 * Wording mirrors the real Guard responses. Pauses on hover and focus; static for reduced motion.
 */
const frames: { caption: string; items: [ItemState, ItemState, ItemState] }[] = [
  { caption: 'Rasikh drafts your rental application', items: ['pending', 'pending', 'pending'] },
  {
    caption: 'Checking each document against your settings',
    items: ['allowed', 'allowed', 'pending'],
  },
  { caption: 'Salary slip stopped before it leaves', items: ['allowed', 'allowed', 'blocked'] },
  {
    caption: 'Sending a yes / no affordability result instead',
    items: ['allowed', 'allowed', 'swapped'],
  },
];
const FRAME_MS = 2200;

const documents = [
  { name: 'Employment letter', note: 'Shared with landlords by default' },
  { name: 'Passport', note: 'You agreed to share it with landlords' },
  { name: 'Salary slip', note: 'Only a yes or no result can be shared, not the figures' },
];

const icons: Record<ItemState, typeof Check> = {
  pending: Lock,
  allowed: Check,
  blocked: X,
  swapped: ShieldCheck,
};

export function GuardDemo() {
  const [frame, setFrame] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setFrame(frames.length - 1);
      return;
    }
    if (paused) return;
    const timer = window.setInterval(
      () => setFrame((current) => (current + 1) % frames.length),
      FRAME_MS,
    );
    return () => window.clearInterval(timer);
  }, [paused]);

  const current = frames[frame] ?? frames[0];

  return (
    <div
      className="lp-guard glass"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      tabIndex={0}
      aria-label="Example of a privacy check on a rental application"
    >
      <div className="lp-guard-top">
        <span className="lp-guard-dest">
          To <strong>Al Reem landlord</strong>
        </span>
        <span className="lp-guard-progress" aria-hidden="true">
          {frames.map((_, index) => (
            <i key={index} className={index <= frame ? 'is-on' : ''} />
          ))}
        </span>
      </div>

      <p className="lp-guard-caption" aria-live="polite" key={frame}>
        {current.caption}
      </p>

      <ul className="lp-guard-list">
        {documents.map((document, index) => {
          const state = current.items[index] ?? 'pending';
          const Icon = icons[state];
          const swapped = state === 'swapped';
          return (
            <li key={document.name} className={`lp-guard-item is-${state}`}>
              <span className="lp-guard-icon" aria-hidden="true">
                <Icon size={15} strokeWidth={2.4} />
              </span>
              <span>
                <span className="lp-guard-name">
                  {swapped ? 'Affordability: yes' : document.name}
                </span>
                <span className="lp-guard-note">
                  {state === 'pending'
                    ? 'Waiting for the check'
                    : swapped
                      ? 'Derived from your salary slip'
                      : document.note}
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      <p className={`lp-guard-foot ${frame === frames.length - 1 ? 'is-done' : ''}`}>
        <ShieldCheck size={16} aria-hidden="true" /> Sent. The landlord never saw your salary
        figure.
      </p>
    </div>
  );
}
