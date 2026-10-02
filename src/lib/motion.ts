'use client';

/** Animation hooks shared by the landing page and the pitch deck. */
import { useEffect, useState } from 'react';

/** True when the visitor asked for reduced motion; loops then hold their final frame. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/**
 * Steps through `count` frames every `ms`, looping, for scripted motion graphics.
 * Holds the last frame under reduced motion.
 */
export function useLoop(count: number, ms: number, startDelay = 600): number {
  const reduced = useReducedMotion();
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (reduced) {
      setFrame(count - 1);
      return;
    }
    let interval: number | undefined;
    const start = window.setTimeout(() => {
      setFrame(1 % count);
      interval = window.setInterval(() => setFrame((f) => (f + 1) % count), ms);
    }, startDelay);
    return () => {
      window.clearTimeout(start);
      if (interval) window.clearInterval(interval);
    };
  }, [count, ms, startDelay, reduced]);
  return frame;
}

/** Counts from 0 to `to` once, over `ms`, easing out. */
export function useCountUp(to: number, ms = 1400, delay = 300): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (reduced) {
      setValue(to);
      return;
    }
    let raf = 0;
    const begin = performance.now() + delay;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - begin) / ms));
      setValue(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms, delay, reduced]);
  return value;
}
