'use client';

import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

/* Rasikh deck primitives. Paper, teal ink and terracotta, the same palette as the landing
   page. Motion is one ease, slow and without springs: things rise, draw and travel; nothing
   bounces into place. */

export const EASE = [0.22, 1, 0.36, 1] as const;

export const stagger = (delayChildren = 0.15, step = 0.08): Variants => ({
  hidden: {},
  visible: { transition: { delayChildren, staggerChildren: step } },
});

export const rise: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.7, ease: EASE } },
};

export { useCountUp, useLoop, useReducedMotion } from '@/lib/motion';

type SlideProps = {
  children: ReactNode;
  /** Section label in the top left, e.g. "The problem". */
  section?: string;
  number?: number;
  tone?: 'paper' | 'ink';
  className?: string;
};

/** The frame every slide sits in: a margin, a quiet running header and a stagger root. */
export function Slide({ children, section, number, tone = 'paper', className = '' }: SlideProps) {
  return (
    <motion.section
      className={`pd-slide is-${tone} ${className}`}
      variants={stagger()}
      initial="hidden"
      animate="visible"
    >
      {(section || number !== undefined) && (
        <motion.header className="pd-running" variants={fade}>
          {number !== undefined && <span>{String(number).padStart(2, '0')}</span>}
          {section && <span>{section}</span>}
        </motion.header>
      )}
      {children}
    </motion.section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <motion.p className="pd-eyebrow" variants={rise}>
      {children}
    </motion.p>
  );
}

export function Headline({
  children,
  size = 'l',
}: {
  children: ReactNode;
  size?: 'xl' | 'l' | 'm';
}) {
  return (
    <motion.h2 className={`pd-headline is-${size}`} variants={rise}>
      {children}
    </motion.h2>
  );
}

export function Lede({ children }: { children: ReactNode }) {
  return (
    <motion.p className="pd-lede" variants={rise}>
      {children}
    </motion.p>
  );
}

/** A small footnote on the bottom margin, for scope and evidence boundaries. */
export function Footnote({ children }: { children: ReactNode }) {
  return (
    <motion.p className="pd-footnote" variants={fade}>
      {children}
    </motion.p>
  );
}

/** The Rasikh mark: an ellipse inside a circle, rotated, with a terracotta point. */
export function Mark({ size = 32, spin = false }: { size?: number; spin?: boolean }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      initial={{ rotate: -25 }}
      animate={spin ? { rotate: [-25, 335] } : { rotate: -25 }}
      transition={spin ? { duration: 2.4, ease: EASE } : undefined}
    >
      <motion.circle
        cx="20"
        cy="20"
        r="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: EASE }}
      />
      <motion.ellipse
        cx="20"
        cy="20"
        rx="8.5"
        ry="13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, delay: 0.3, ease: EASE }}
      />
      <motion.circle
        cx="20"
        cy="20"
        r="2.6"
        fill="#a65b43"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 1.1, ease: EASE }}
      />
    </motion.svg>
  );
}
