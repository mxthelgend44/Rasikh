/** `Mei Lin Tan` becomes `mei.lin.tan`. Diacritics are stripped. */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '.')
    .replace(/^\.|\.$/g, '');
}

/** `2026-10-10T09:30:00+04:00` plus 21 days becomes `2026-10-31`. */
export function dateAfter(iso: string, days: number): string {
  const ms = Date.parse(iso) + days * 86_400_000 + 4 * 3_600_000;
  return new Date(ms).toISOString().slice(0, 10);
}
