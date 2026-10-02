import type { AppState, IsoDateTime } from './types';

const ABU_DHABI_OFFSET_MS = 4 * 60 * 60 * 1000;

/** ISO 8601 with the fixed +04:00 Abu Dhabi offset (the UAE has no daylight saving). */
export function toAbuDhabiIso(epochMs: number): IsoDateTime {
  return new Date(epochMs + ABU_DHABI_OFFSET_MS).toISOString().replace(/\.\d{3}Z$/, '+04:00');
}

/**
 * The demo clock: starts at the seed anchor on reset and advances with real time, so dates in the
 * seed stay plausible relative to anything created during a demo.
 */
export function demoNowMs(state: AppState, realNowMs: number = Date.now()): number {
  return Date.parse(state.clock.anchor) + (realNowMs - state.clock.resetAtMs);
}

export function demoNow(state: AppState, realNowMs: number = Date.now()): IsoDateTime {
  return toAbuDhabiIso(demoNowMs(state, realNowMs));
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysBetween(from: IsoDateTime, to: IsoDateTime): number {
  return Math.max(0, Math.floor((Date.parse(to) - Date.parse(from)) / DAY_MS));
}
