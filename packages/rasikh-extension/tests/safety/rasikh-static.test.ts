// Static safety checks that complement the real-browser suite (tests/e2e). They read the manifest and the
// source, not a running page: nothing here needs a browser. Product rules proven: coach, do not do;
// no broad default host access; no debugger or identity; strict extension CSP; no eval; no remote code.
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..", "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|mjs)$/.test(e.name) && !/\.(test|spec)\./.test(e.name)) out.push(p);
  }
  return out;
}
const srcFiles = walk(path.join(root, "src"));
const contentFiles = srcFiles.filter((f) => f.replace(/\\/g, "/").includes("/src/content/"));
// strip comments so a sentence like "never calls .click()" in a comment is not a violation
const code = (f: string) =>
  fs.readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

describe("manifest permissions", () => {
  const perms: string[] = manifest.permissions ?? [];
  it("has no debugger permission (it was only needed for synthetic input, which Rasikh does not do)", () => {
    expect(perms).not.toContain("debugger");
  });
  it("has no identity permission (there is no sign-in)", () => {
    expect(perms).not.toContain("identity");
  });
  it("asks for nothing beyond the small allowlist", () => {
    const allowed = new Set(["activeTab", "scripting", "storage", "sidePanel", "alarms", "offscreen"]);
    expect(perms.filter((p) => !allowed.has(p))).toEqual([]);
  });
  it("has no broad default host access: host_permissions is only the local backend", () => {
    const hosts: string[] = manifest.host_permissions ?? [];
    for (const h of hosts) expect(h).toMatch(/^http:\/\/(localhost|127\.0\.0\.1):8796\/\*$/);
    expect(hosts).not.toContain("<all_urls>");
  });
  it("content scripts only match origins that sit behind an optional grant, so nothing injects without one", () => {
    const optional = new Set<string>(manifest.optional_host_permissions ?? []);
    for (const cs of manifest.content_scripts ?? []) {
      for (const m of cs.matches) expect(optional.has(m), `${m} must be an optional host permission`).toBe(true);
    }
  });
  it("never uses <all_urls> or a wildcard-scheme wildcard-host pattern anywhere", () => {
    const all = JSON.stringify([manifest.host_permissions, manifest.optional_host_permissions, manifest.content_scripts]);
    expect(all).not.toMatch(/<all_urls>/);
    expect(all).not.toMatch(/\*:\/\/\*\/\*/);
  });
  it("declares no web_accessible_resources open to every site", () => {
    for (const w of manifest.web_accessible_resources ?? []) {
      expect(JSON.stringify(w.matches ?? [])).not.toMatch(/<all_urls>|\*:\/\/\*\/\*/);
    }
  });
});

describe("extension page CSP", () => {
  const csp: string = manifest.content_security_policy?.extension_pages ?? "";
  it("is strict: script from self only, no eval, no inline script, no remote script", () => {
    expect(csp).toMatch(/script-src 'self'(;|$)/);
    expect(csp).not.toMatch(/unsafe-eval|unsafe-inline|wasm-unsafe-eval/);
    const scriptSrc = csp.split(";").find((d) => d.trim().startsWith("script-src")) ?? "";
    expect(scriptSrc).not.toMatch(/https?:/);
    expect(csp).toMatch(/object-src 'self'|object-src 'none'/);
  });
  it("limits connections to itself and the local backend", () => {
    const connect = csp.split(";").find((d) => d.trim().startsWith("connect-src"));
    if (connect) expect(connect).not.toMatch(/\*|https:\/\/(?!localhost)/);
  });
});

describe("source: no remote code, no eval", () => {
  it("has no eval, new Function, string-timers or remote script loading in src/", () => {
    const bad: string[] = [];
    for (const f of srcFiles) {
      const c = code(f);
      if (/\beval\s*\(/.test(c)) bad.push(`${f}: eval`);
      if (/new\s+Function\s*\(/.test(c)) bad.push(`${f}: new Function`);
      if (/set(Timeout|Interval)\s*\(\s*["'`]/.test(c)) bad.push(`${f}: string timer`);
      if (/importScripts\s*\(\s*["'`]https?:/.test(c)) bad.push(`${f}: importScripts remote`);
      if (/import\s*\(\s*["'`]https?:/.test(c)) bad.push(`${f}: remote dynamic import`);
      if (/createElement\(\s*["']script["']\s*\)/.test(c)) bad.push(`${f}: injects a script element`);
      if (/chrome\.debugger/.test(c)) bad.push(`${f}: chrome.debugger`);
      if (/chrome\.identity/.test(c)) bad.push(`${f}: chrome.identity`);
    }
    expect(bad).toEqual([]);
  });
  it("has no executeScript with a function body that reads field values", () => {
    for (const f of srcFiles) {
      const c = code(f);
      if (/chrome\.scripting\.executeScript/.test(c)) expect(c, f).not.toMatch(/\.value\b/);
    }
  });
});

describe("content script cannot mutate the page (coach, do not do)", () => {
  it("never calls click, submit, requestSubmit, dispatchEvent, execCommand or setRangeText", () => {
    const bad: string[] = [];
    for (const f of contentFiles) {
      const c = code(f);
      for (const pat of [/\.click\s*\(/, /\.submit\s*\(/, /requestSubmit/, /dispatchEvent/, /execCommand/, /setRangeText/, /\.stepUp\s*\(|\.stepDown\s*\(/, /new\s+(Mouse|Keyboard|Input|Pointer)Event/])
        if (pat.test(c)) bad.push(`${path.basename(f)}: ${pat}`);
    }
    expect(bad).toEqual([]);
  });
  it("never assigns to a control value, checked, selected or selectedIndex", () => {
    const bad: string[] = [];
    for (const f of contentFiles) {
      const c = code(f);
      // `s.` is the local ElementState accumulator that perception builds; `.style.x =` styles the overlay only
      const stripped = c.replace(/\.style\.[a-zA-Z]+\s*=/g, "").replace(/\bs\.(checked|selected)\s*=/g, "");
      if (/\.(value|checked|selected|selectedIndex|files|innerText\b)\s*=[^=>]/.test(stripped)) bad.push(path.basename(f));
    }
    expect(bad).toEqual([]);
  });
  it("never reads a control value in perception (structure only)", () => {
    const bad: string[] = [];
    for (const f of contentFiles) {
      // reading .value is the leak: the perception model must carry label, type and required, never the value
      // allowed: the label of a submit/button/reset input IS its value attribute (its visible name), never typed text
      const lines = code(f).split("\n");
      lines.forEach((ln, i) => {
        if (!/\.(value|defaultValue|valueAsNumber|valueAsDate)\b(?!\s*:)/.test(ln)) return;
        const ctx = (lines[i - 1] ?? "") + ln;
        if (/["']submit["']/.test(ctx) && /["']button["']/.test(ctx)) return;
        bad.push(`${path.basename(f)}:${i + 1}`);
      });
    }
    expect(bad, "content files that read .value").toEqual([]);
  });
  it("sets no value-bearing page attributes (the overlay lives in its own shadow root)", () => {
    for (const f of contentFiles) {
      const c = code(f);
      expect(c, f).not.toMatch(/setAttribute\(\s*["'](value|checked|selected|disabled|href|src|action|type)["']/);
    }
  });
});

describe("the final action is never an executable step", () => {
  it("the executor allowlist has no mutating verb", () => {
    const exec = fs.readFileSync(path.join(root, "src/content/actions/executor.ts"), "utf8");
    const set = exec.match(/EXECUTABLE[^=]*=\s*new Set\(\[([\s\S]*?)\]\)/)?.[1] ?? "";
    for (const verb of ["click", "type", "setValue", "select", "submit", "press", "navigate", "pay", "confirm"])
      expect(set, `executor must not allow ${verb}`).not.toMatch(new RegExp(`["']${verb}["']`));
  });
});
