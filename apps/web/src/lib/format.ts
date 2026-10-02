import type { IsoDate, IsoDateTime, Locale } from '@/domain/types';
import { intlTag } from '@/lib/i18n';

const TIME_ZONE = 'Asia/Dubai';

/** 10 Oct 2026 in English, 10 أكتوبر 2026 in Arabic. */
export function formatDate(value: IsoDate | IsoDateTime, locale: Locale): string {
  return new Intl.DateTimeFormat(intlTag(locale), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: TIME_ZONE,
  }).format(new Date(value));
}

/** AED 135,000 in English, 135,000 د.إ. in Arabic. Whole dirhams only. */
export function formatAed(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(intlTag(locale), {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(amount);
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "2 hours ago" relative to `now`, which is the demo clock, not the real one. */
export function formatAgo(at: IsoDateTime, now: IsoDateTime, locale: Locale): string {
  const diff = Date.parse(at) - Date.parse(now);
  const format = new Intl.RelativeTimeFormat(intlTag(locale), { numeric: 'auto' });
  const abs = Math.abs(diff);
  if (abs < HOUR) return format.format(Math.round(diff / MINUTE), 'minute');
  if (abs < DAY) return format.format(Math.round(diff / HOUR), 'hour');
  return format.format(Math.round(diff / DAY), 'day');
}
