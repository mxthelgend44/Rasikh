'use client';

import { useCallback, useRef, type KeyboardEvent } from 'react';

/**
 * Roving tabindex for a horizontal group: one Tab stop, arrows move and select.
 * Arrow direction follows the element's computed `dir`, so RTL works without callers caring.
 */
export function useRovingTabs(count: number, selected: number, select: (index: number) => void) {
  const items = useRef<(HTMLElement | null)[]>([]);

  const move = useCallback(
    (index: number) => {
      const next = (index + count) % count;
      select(next);
      items.current[next]?.focus();
    },
    [count, select],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>, index: number) => {
      const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
      const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
      const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
      if (event.key === forward) move(index + 1);
      else if (event.key === backward) move(index - 1);
      else if (event.key === 'Home') move(0);
      else if (event.key === 'End') move(count - 1);
      else return;
      event.preventDefault();
    },
    [count, move],
  );

  const itemProps = (index: number) => ({
    ref: (node: HTMLElement | null) => {
      items.current[index] = node;
    },
    tabIndex: index === selected ? 0 : -1,
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => onKeyDown(event, index),
  });

  return itemProps;
}
