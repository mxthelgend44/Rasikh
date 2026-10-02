// tests/safety/coachOnly.test.ts
// Product rule 1: COACH, DO NOT DO. These tests FAIL if any mutating capability appears.
import { describe, it, expect, vi } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { execute, EXECUTABLE } from "../../src/content/actions/executor";
import { validateAction, ALLOWED_ACTIONS } from "../../backend/validate";
import { ALL_TOOLS } from "../../backend/tools";
import { COACH_ACTIONS } from "../../src/shared/types";
import { clearOverlays } from "../../src/content/overlays/coachMark";
import { setRefMap } from "../../src/content/refMap";

const FORBIDDEN_ACTIONS = ["click", "type", "setValue", "select", "submit", "navigate", "press", "evaluate", "eval", "pay", "confirm", "approve", "send", "agree", "fill"];

function walkFiles(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walkFiles(p, out);
    else if (/\.(ts|tsx)$/.test(f)) out.push(p);
  }
  return out;
}

describe("source scan: no mutating capability exists", () => {
  const files = [...walkFiles("src"), ...walkFiles("backend")];
  const patterns: [string, RegExp][] = [
    ["chrome.debugger", /chrome\.debugger/],
    ["chrome.identity", /chrome\.identity/],
    ["eval()", /\beval\s*\(/],
    ["new Function", /new Function\s*\(/],
    ["element .click()", /\.click\s*\(/],
    ["dispatchEvent", /dispatchEvent\s*\(/],
    ["form submit", /\.submit\s*\(|requestSubmit/],
    ["navigate on behalf", /location\.(assign|replace)\s*\(|location\.href\s*=|window\.open\s*\(/],
    ["value assignment", /\.value\s*=[^=]/],
    ["insertText / execCommand", /insertText|execCommand/],
    ["native value setter", /setNativeValue|getOwnPropertyDescriptor\([^)]*"value"/],
    ["innerHTML write", /\.innerHTML\s*=/],
    ["remote code", /importScripts\s*\(|<script[^>]*src=["']https?:/],
    ["executeScript of code strings", /executeScript\s*\(\s*\{[^}]*func/]
  ];
  for (const [name, re] of patterns) {
    it(`no ${name} anywhere in src/ or backend/`, () => {
      const hits = files.filter((f) => re.test(readFileSync(f, "utf8").replace(/\/\/.*$/gm, "")));
      expect(hits, `${name} found in ${hits.join(", ")}`).toEqual([]);
    });
  }
  it("the removed action files stay removed", () => {
    const names = files.map((f) => f.replace(/\\/g, "/"));
    for (const gone of ["click.ts", "type.ts", "setValue.ts", "cdp.ts", "cdpGround.ts", "cdpInput.ts"]) {
      expect(names.some((n) => n.endsWith("/" + gone)), gone).toBe(false);
    }
  });
});

describe("types and tool schemas", () => {
  it("no forbidden action type in COACH_ACTIONS, the executor allowlist, validator or tools", () => {
    for (const bad of FORBIDDEN_ACTIONS) {
      expect(COACH_ACTIONS as readonly string[]).not.toContain(bad);
      expect(EXECUTABLE.has(bad)).toBe(false);
      expect(ALLOWED_ACTIONS.has(bad)).toBe(false);
      expect(ALL_TOOLS.some((t) => t.name === bad)).toBe(false);
    }
  });
  it("validateAction refuses every forbidden action", () => {
    const model: any = { elements: [{ ref: "e1", role: "button", name: "Submit", rect: { x: 0, y: 0, w: 1, h: 1 }, fingerprint: "" }] };
    for (const bad of FORBIDDEN_ACTIONS) {
      expect(() => validateAction({ name: bad, input: { ref: "e1", text: "x", value: "y", url: "https://x.example/" } }, model), bad).toThrow();
    }
  });
});

describe("executor runtime: a forged mutating action does nothing", () => {
  it("refuses click/type/select/submit/navigate and leaves the page untouched", async () => {
    document.body.innerHTML = `<form id="f"><input id="a" value="keep" /><select id="s"><option>1</option><option>2</option></select><button id="b" type="submit">Pay</button></form>`;
    (Element.prototype as any).getBoundingClientRect = () => ({ left: 0, top: 0, width: 50, height: 20, right: 50, bottom: 20, x: 0, y: 0, toJSON() {} });
    const onClick = vi.fn();
    const onInput = vi.fn();
    const onSubmit = vi.fn((e: Event) => e.preventDefault());
    document.getElementById("b")!.addEventListener("click", onClick);
    document.getElementById("a")!.addEventListener("input", onInput);
    document.getElementById("f")!.addEventListener("submit", onSubmit);
    setRefMap(new Map([["e1", document.getElementById("b")!], ["e2", document.getElementById("a")!], ["e3", document.getElementById("s")!]]));
    for (const type of FORBIDDEN_ACTIONS) {
      for (const ref of ["e1", "e2", "e3"]) {
        const r = await execute({ type, ref, text: "hacked", value: "2", url: "https://evil.example/" } as any);
        expect(r.ok, `${type} on ${ref}`).toBe(false);
        expect(r.failureCode).toBe("ACTION_NOT_ALLOWED");
      }
    }
    expect(onClick).not.toHaveBeenCalled();
    expect(onInput).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
    expect((document.getElementById("a") as HTMLInputElement).value).toBe("keep");
    expect((document.getElementById("s") as HTMLSelectElement).value).toBe("1");
    expect(location.href).not.toContain("evil.example");
  });

  it("highlight and scrollTo work and still fire no page events", async () => {
    document.body.innerHTML = `<button id="b">Start</button>`;
    (Element.prototype as any).getBoundingClientRect = () => ({ left: 10, top: 10, width: 50, height: 20, right: 60, bottom: 30, x: 10, y: 10, toJSON() {} });
    (Element.prototype as any).scrollIntoView = vi.fn();
    const onClick = vi.fn();
    document.getElementById("b")!.addEventListener("click", onClick);
    setRefMap(new Map([["e1", document.getElementById("b")!]]));
    const h = await execute({ type: "highlight", ref: "e1", message: "Press Start yourself.", risk: "safe" });
    expect(h.ok).toBe(true);
    const host = document.querySelector("[data-rasikh-guide]") as HTMLElement;
    expect(host).toBeTruthy();
    expect(host.style.pointerEvents).toBe("none"); // clicks fall through to the real control
    expect(host.shadowRoot!.querySelector(".tip")!.textContent).toBe("Press Start yourself.");
    setRefMap(new Map([["e1", document.getElementById("b")!]]));
    const s = await execute({ type: "scrollTo", ref: "e1" });
    expect(s.ok).toBe(true);
    clearOverlays();
    expect(onClick).not.toHaveBeenCalled();
  });
});
