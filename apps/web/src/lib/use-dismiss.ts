'use client';

import { useEffect, useRef, type RefObject } from 'react';

/** Calls `onDismiss` on Escape or a pointer press outside `region`. */
export function useDismiss(
  active: boolean,
  region: RefObject<HTMLElement | null>,
  onDismiss: () => void,
): void {
  const latest = useRef(onDismiss);
  latest.current = onDismiss;

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') latest.current();
    };
    const onPointer = (event: PointerEvent) => {
      if (region.current && !region.current.contains(event.target as Node)) latest.current();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [active, region]);
}
