import type { TourStep, TourTrack } from '@/config/tour-types';

/** Pure logic behind the presenter guide. No DOM, so it is unit tested in node. */

export const TOUR_STORAGE_KEY = 'rasikh-tour';

/** The demo track has a fixed time budget the presenter is held to. */
export const DEMO_BUDGET_SECONDS = 180;

export const TRACKS: TourTrack[] = ['demo', 'features'];

export interface TourState {
  open: boolean;
  track: TourTrack;
  index: number;
  /** Panel shrunk to a compact bar. Progress is kept. */
  collapsed: boolean;
}

export const INITIAL_STATE: TourState = {
  open: false,
  track: 'demo',
  index: 0,
  collapsed: false,
};

export function isTrack(value: unknown): value is TourTrack {
  return value === 'demo' || value === 'features';
}

export function stepsForTrack(steps: readonly TourStep[], track: TourTrack): TourStep[] {
  return steps.filter((step) => step.tracks.includes(track));
}

/** Keeps an index inside 0..length-1. A non-finite index and an empty list both give 0. */
export function clampIndex(index: number, length: number): number {
  if (!Number.isFinite(index) || length <= 0) return 0;
  return Math.min(Math.max(Math.trunc(index), 0), length - 1);
}

export function totalSeconds(steps: readonly TourStep[]): number {
  return steps.reduce((sum, step) => sum + Math.max(0, step.seconds), 0);
}

/** Running total: seconds of every step up to and including `index`. */
export function elapsedSeconds(steps: readonly TourStep[], index: number): number {
  if (steps.length === 0) return 0;
  return totalSeconds(steps.slice(0, clampIndex(index, steps.length) + 1));
}

/** m:ss, e.g. 185 -> "3:05". */
export function formatClock(totalSecondsValue: number): string {
  const safe = Math.max(0, Math.round(totalSecondsValue));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * A comparable form of a route: path without a trailing slash, query parameters sorted,
 * the hash dropped, and the tour parameter ignored (it is a launcher, not a location).
 */
export function normalizeUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url, 'http://rasikh.local');
  } catch {
    return url;
  }
  const params = new URLSearchParams(parsed.search);
  params.delete('tour');
  params.sort();
  const query = params.toString();
  const path = parsed.pathname.length > 1 ? parsed.pathname.replace(/\/+$/, '') : parsed.pathname;
  return query ? `${path}?${query}` : path;
}

/** True when two routes are the same page, ignoring the hash. */
export function sameUrl(a: string, b: string): boolean {
  return normalizeUrl(a) === normalizeUrl(b);
}

/** Reads `?tour=demo|features` from a query string. Anything else is not a launch. */
export function trackFromSearch(search: string): TourTrack | null {
  const value = new URLSearchParams(search).get('tour');
  return isTrack(value) ? value : null;
}

/** The same query string without the tour parameter, so a reload resumes instead of restarting. */
export function stripTourParam(search: string): string {
  const params = new URLSearchParams(search);
  params.delete('tour');
  const query = params.toString();
  return query ? `?${query}` : '';
}

/** Parses what sessionStorage holds. Anything malformed falls back to a closed, fresh tour. */
export function parseStoredState(raw: string | null): TourState {
  if (!raw) return INITIAL_STATE;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return INITIAL_STATE;
    const record = value as Record<string, unknown>;
    return {
      open: record.open === true,
      track: isTrack(record.track) ? record.track : INITIAL_STATE.track,
      index:
        typeof record.index === 'number' && Number.isFinite(record.index)
          ? Math.max(0, Math.trunc(record.index))
          : 0,
      collapsed: record.collapsed === true,
    };
  } catch {
    return INITIAL_STATE;
  }
}

/** When the track changes, stay on the same stop if the new track has it, else start over. */
export function indexAfterTrackSwitch(
  from: readonly TourStep[],
  fromIndex: number,
  to: readonly TourStep[],
): number {
  const current = from[clampIndex(fromIndex, from.length)];
  if (!current) return 0;
  const found = to.findIndex((step) => step.id === current.id);
  return found >= 0 ? found : 0;
}

/** Which way a key moves through the steps. Arrow keys flip in right-to-left layouts. */
export function stepDeltaForKey(key: string, rtl: boolean): 1 | -1 | 0 {
  if (key === 'ArrowRight') return rtl ? -1 : 1;
  if (key === 'ArrowLeft') return rtl ? 1 : -1;
  return 0;
}
