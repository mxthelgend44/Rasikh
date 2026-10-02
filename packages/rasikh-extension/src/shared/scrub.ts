// src/shared/scrub.ts
// Defense in depth for personal-data patterns. Perception never reads field values, so these
// patterns should not appear in any outgoing text. If a page echoes one into a heading or label
// (for example "Welcome 784-1990-1234567-1"), this masks it before the text leaves the content script.
const PATTERNS: [RegExp, string][] = [
  [/\b784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d\b/g, "[id]"], // Emirates ID
  [/\b(?:\d[ -]?){13,19}\b/g, "[number]"], // card-like digit runs
  [/\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g, "[iban]"], // IBAN
  [/\b[A-Z]{1,2}\d{6,9}\b/g, "[doc]"], // passport-like
  [/\b\d{5,}\b/g, "[number]"] // one-time codes and other long numbers
];

export function scrubText(s: string): string {
  let out = s;
  for (const [re, rep] of PATTERNS) out = out.replace(re, rep);
  return out;
}
