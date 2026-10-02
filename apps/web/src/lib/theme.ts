'use client';

import { useSyncExternalStore } from 'react';

export type ThemeChoice = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'rasikh-theme';

const CHANGE_EVENT = 'rasikh-theme-change';
const DARK_QUERY = '(prefers-color-scheme: dark)';

let memoryChoice: ThemeChoice | null = null;

function isChoice(value: string | null): value is ThemeChoice {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function readChoice(): ThemeChoice {
  if (typeof window === 'undefined') return 'light';
  if (memoryChoice) return memoryChoice;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isChoice(stored) ? stored : 'light';
  } catch {
    return 'light';
  }
}

function resolve(choice: ThemeChoice): 'light' | 'dark' {
  if (choice !== 'system') return choice;
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

function paint(): void {
  document.documentElement.classList.toggle('dark', resolve(readChoice()) === 'dark');
}

export function applyTheme(choice: ThemeChoice): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, choice);
    memoryChoice = null;
  } catch {
    memoryChoice = choice;
  }
  paint();
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(listener: () => void): () => void {
  const media = window.matchMedia(DARK_QUERY);
  const onChange = () => {
    paint();
    listener();
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) {
      memoryChoice = null;
      onChange();
    }
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  media.addEventListener('change', onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
    media.removeEventListener('change', onChange);
  };
}

export function useThemeChoice(): [ThemeChoice, (choice: ThemeChoice) => void] {
  return [useSyncExternalStore(subscribe, readChoice, () => 'light'), applyTheme];
}

export function useResolvedTheme(): 'light' | 'dark' {
  return useSyncExternalStore(
    subscribe,
    () => resolve(readChoice()),
    () => 'light',
  );
}
