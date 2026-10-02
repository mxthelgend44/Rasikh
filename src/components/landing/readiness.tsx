'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useState } from 'react';

/** The Tawtheeq tenancy requirements, as in Rasikh's service catalogue (illustrative). */
const required = [
  { id: 'passport', label: 'Tenant passport copy' },
  { id: 'emirates_id', label: 'Emirates ID or application' },
  { id: 'address', label: 'Signed tenancy contract' },
];
const prerequisite = { id: 'visa', label: 'Residence visa approved' };

/** Tick what you have; the readiness ring and the missing list update as you go. */
export function Readiness() {
  const [held, setHeld] = useState<Set<string>>(new Set(['passport']));
  const toggle = (id: string) =>
    setHeld((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const items = [prerequisite, ...required];
  const done = items.filter((item) => held.has(item.id)).length;
  const share = done / items.length;
  const missing = items.filter((item) => !held.has(item.id));
  const circumference = 2 * Math.PI * 52;

  return (
    <div className="lp-ready glass">
      <div className="lp-ready-ring" aria-hidden="true">
        <svg viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" className="lp-ring-track" />
          <motion.circle
            cx="60"
            cy="60"
            r="52"
            className="lp-ring-fill"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: circumference * (1 - share) }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <span>
          <strong>{done}</strong>/{items.length}
        </span>
      </div>
      <div className="lp-ready-body">
        <p className="lp-ready-title">Register a tenancy contract (Tawtheeq)</p>
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                aria-pressed={held.has(item.id)}
                onClick={() => toggle(item.id)}
              >
                <span className="lp-check">
                  {held.has(item.id) && <Check size={13} strokeWidth={3} />}
                </span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
        <motion.p
          key={missing.length}
          className="lp-ready-status"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {missing.length === 0 ? (
            <strong>Ready to apply.</strong>
          ) : (
            <>
              Still needed:{' '}
              <strong>{missing.map((item) => item.label.toLowerCase()).join(', ')}</strong>
            </>
          )}
        </motion.p>
      </div>
    </div>
  );
}
