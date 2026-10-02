import type { Locale } from '@/domain/types';
import { ar } from './ar';
import { en, type MessageKey } from './en';

export type { MessageKey };

export const LOCALE_COOKIE = 'rasikh-locale';

export const CATALOGS: Record<Locale, Record<MessageKey, string>> = { en, ar };

export function directionOf(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function parseLocale(value: string | undefined): Locale {
  return value === 'ar' ? 'ar' : 'en';
}

export type Translate = (key: MessageKey, params?: Record<string, string | number>) => string;

/** Builds a translate function for a locale. `{name}` placeholders are replaced from `params`. */
export function translator(locale: Locale): Translate {
  const catalog = CATALOGS[locale];
  return (key, params) => {
    const template = catalog[key];
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in params ? String(params[name]) : match,
    );
  };
}

/** Intl locale tag. Arabic uses Latin digits, as is usual in UAE interfaces. */
export function intlTag(locale: Locale): string {
  return locale === 'ar' ? 'ar-AE-u-nu-latn' : 'en-GB';
}
