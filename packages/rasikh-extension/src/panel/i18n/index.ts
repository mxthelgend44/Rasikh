// src/panel/i18n/index.ts
import { en } from "./en";
import { ar } from "./ar";
const tables = { en, ar } as const;
export type Lang = keyof typeof tables;
export type Key = keyof typeof en;
export const LANGS: Lang[] = ["en", "ar"];
export const dirOf = (lang: Lang): "ltr" | "rtl" => (lang === "ar" ? "rtl" : "ltr");
export function t(lang: Lang, key: Key): string {
  return (tables[lang] as Record<string, string>)[key] ?? (en as Record<string, string>)[key] ?? key;
}
export const tables_ = tables;
