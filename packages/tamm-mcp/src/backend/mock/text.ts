/**
 * Text normalisation for search: English and Arabic, so "Licence", "license" and "رخصة"
 * can all reach the same service.
 */

const LATIN_DIACRITICS = /[\u0300-\u036f]/g;
/** Arabic short vowels, shadda, sukun, superscript alef, and tatweel. */
const ARABIC_MARKS = /[\u064b-\u065f\u0670\u0640]/g;
const TOKEN = /[\p{L}\p{N}]+/gu;

/** Lowercases, strips diacritics and unifies Arabic letter variants (alef, ta marbuta, ya). */
export function normalise(text: string): string {
  return text
    .normalize("NFKD")
    .replace(LATIN_DIACRITICS, "")
    .replace(ARABIC_MARKS, "")
    .replace(/[\u0623\u0625\u0622\u0671]/g, "\u0627")
    .replace(/\u0629/g, "\u0647")
    .replace(/\u0649/g, "\u064a")
    .toLowerCase();
}

/** Removes the Arabic definite article from words long enough to keep a stem. */
function stripArticle(token: string): string {
  return token.startsWith("\u0627\u0644") && token.length > 4 ? token.slice(2) : token;
}

/** Normalised word tokens of `text`. */
export function tokenize(text: string): string[] {
  return (normalise(text).match(TOKEN) ?? []).map(stripArticle);
}

/**
 * Optimal string alignment distance (Damerau-Levenshtein without repeated edits), capped:
 * returns `max + 1` as soon as the distance must exceed `max`.
 */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) {
    return max + 1;
  }
  let beforePrevious: number[] = [];
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(
        (previous[j] as number) + 1,
        (current[j - 1] as number) + 1,
        (previous[j - 1] as number) + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, (beforePrevious[j - 2] as number) + 1);
      }
      current.push(value);
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > max) {
      return max + 1;
    }
    beforePrevious = previous;
    previous = current;
  }
  return previous[b.length] as number;
}
