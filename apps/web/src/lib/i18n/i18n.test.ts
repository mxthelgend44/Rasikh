import { describe, expect, it } from 'vitest';
import { formatAed, formatAgo, formatDate } from '../format';
import { ar } from './ar';
import { en } from './en';
import { directionOf, parseLocale, translator } from './index';

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('catalogs', () => {
  it('have the same keys in English and Arabic', () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
  });

  it('keep every placeholder when translated', () => {
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(placeholders(ar[key]), key).toEqual(placeholders(en[key]));
    }
  });

  it('have no empty strings', () => {
    for (const catalog of [en, ar]) {
      for (const [key, value] of Object.entries(catalog)) expect(value.trim(), key).not.toBe('');
    }
  });

  it('use Arabic script in the Arabic catalog except for fixed names and numbers', () => {
    const arabic = /[؀-ۿ]/;
    for (const [key, value] of Object.entries(ar)) expect(value, key).toMatch(arabic);
  });
});

describe('translator', () => {
  it('replaces placeholders', () => {
    expect(translator('en')('roadmap.progress', { done: 3, total: 7 })).toBe('3 of 7 steps done');
    expect(translator('ar')('roadmap.progress', { done: 3, total: 7 })).toContain('3');
  });

  it('leaves an unknown placeholder visible instead of hiding it', () => {
    expect(translator('en')('step.waitingOn', {})).toBe('Waiting on {who}');
  });

  it('maps locale to direction, defaulting to English', () => {
    expect(directionOf('ar')).toBe('rtl');
    expect(directionOf('en')).toBe('ltr');
    expect(parseLocale('ar')).toBe('ar');
    expect(parseLocale('fr')).toBe('en');
    expect(parseLocale(undefined)).toBe('en');
  });
});

describe('formatting', () => {
  it('formats dirhams without decimals', () => {
    expect(formatAed(135_000, 'en')).toMatch(/AED\s?135,000/);
    expect(formatAed(135_000, 'ar')).toContain('135,000');
  });

  it('formats dates in Abu Dhabi time', () => {
    expect(formatDate('2026-10-10T23:30:00+04:00', 'en')).toBe('10 Oct 2026');
    expect(formatDate('2026-10-10', 'ar')).toContain('2026');
  });

  it('describes time relative to the demo clock', () => {
    const now = '2026-10-10T09:30:00+04:00';
    expect(formatAgo('2026-10-10T07:30:00+04:00', now, 'en')).toBe('2 hours ago');
    expect(formatAgo('2026-10-08T09:30:00+04:00', now, 'en')).toBe('2 days ago');
  });
});
