// tests/unit/i18n.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { en } from "../../src/panel/i18n/en";
import { ar } from "../../src/panel/i18n/ar";
import { t, dirOf } from "../../src/panel/i18n";

describe("i18n parity", () => {
  it("en and ar have exactly the same keys", () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
  });
  it("no ar value is empty", () => {
    for (const k of Object.keys(en) as (keyof typeof en)[]) expect(ar[k].length, k).toBeGreaterThan(0);
  });
  it("ar is right to left, en left to right, with key fallback", () => {
    expect(dirOf("ar")).toBe("rtl");
    expect(dirOf("en")).toBe("ltr");
    expect(t("ar", "app.title")).toBe(ar["app.title"]);
    expect(t("en", "no.such.key" as any)).toBe("no.such.key");
  });
});

describe("RTL correctness and look: panel stylesheet", () => {
  const css = readFileSync("src/panel/index.css", "utf8");
  it("uses logical CSS properties only (no physical left/right)", () => {
    expect(css).not.toMatch(/(^|[\s;{])(margin|padding)-(left|right)\s*:/);
    expect(css).not.toMatch(/(^|[\s;{])(left|right)\s*:/);
    expect(css).not.toMatch(/text-align\s*:\s*(left|right)/);
    expect(css).not.toMatch(/border-(left|right)/);
  });
  it("has no gradient, blur or glass effects and gates motion on prefers-reduced-motion", () => {
    expect(css).not.toMatch(/gradient|backdrop-filter|blur\(/);
    expect((css.match(/transition\s*:/g) ?? []).length).toBeGreaterThan(0);
    const outside = css.replace(/@media \(prefers-reduced-motion: no-preference\)\s*\{[\s\S]*?\}\s*\}/g, "");
    expect(outside).not.toMatch(/transition\s*:/);
  });
  it("uses the Rasikh palette", () => {
    for (const c of ["#0b6b78", "#f6e7cd", "#a5d9d0", "#e98565", "#e4ad42", "#173c47"]) expect(css.toLowerCase()).toContain(c);
  });
  it("no emoji in panel strings", () => {
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    for (const v of [...Object.values(en), ...Object.values(ar)]) expect(emoji.test(v)).toBe(false);
  });
});
