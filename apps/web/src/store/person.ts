'use client';

import { useMemo, useSyncExternalStore } from 'react';
import type { AppState, Hire } from '@/domain/types';
import { useAppState } from './provider';

const KEY = 'rasikh-person';
const EVENT = 'rasikh-person-change';

function read(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function subscribe(listener: () => void): () => void {
  window.addEventListener('storage', listener);
  window.addEventListener(EVENT, listener);
  return () => {
    window.removeEventListener('storage', listener);
    window.removeEventListener(EVENT, listener);
  };
}

function write(id: string | null): void {
  try {
    if (id) window.localStorage.setItem(KEY, id);
    else window.localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: the choice lasts until reload */
  }
  window.dispatchEvent(new Event(EVENT));
}

export interface Newcomer {
  state: AppState;
  /** The person the app is showing. Undefined only if there are no hires at all. */
  hire: Hire | undefined;
  hires: Hire[];
  /** True once someone chose a person; until then the app follows the newest hire. */
  pinned: boolean;
  choose: (hireId: string) => void;
  follow: () => void;
}

/**
 * Which hire this phone belongs to. Until a person is chosen explicitly the app shows the newest
 * hire, so a hire an employer just created appears on the newcomer's screen without any step.
 */
export function useNewcomer(): Newcomer {
  const state = useAppState();
  const stored = useSyncExternalStore(subscribe, read, () => null);

  const hires = useMemo(
    () => Object.values(state.hires).sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    [state.hires],
  );
  const chosen = stored ? state.hires[stored] : undefined;

  return {
    state,
    hire: chosen ?? hires[0],
    hires,
    pinned: Boolean(chosen),
    choose: write,
    follow: () => write(null),
  };
}
