import { toAbuDhabiIso } from '../clock';
import type { IsoDateTime } from '../types';

/** All seed dates are relative to this anchor. It matches the timestamps in INTEGRATION.md. */
export const SEED_ANCHOR: IsoDateTime = '2026-10-10T09:30:00+04:00';

export const ANCHOR_MS = Date.parse(SEED_ANCHOR);
export const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

/** An ISO timestamp `days` and `hours` before the anchor. */
export function ago(days: number, hours = 0): IsoDateTime {
  return toAbuDhabiIso(ANCHOR_MS - days * DAY_MS - hours * HOUR_MS);
}
