// tests/unit/predicates.test.ts
import { describe, it, expect } from "vitest";
import { isInteractive } from "../../src/content/perception/predicates";
import { effectiveRole } from "../../src/content/perception/role";

describe("interactivity", () => {
  it("treats a native button as interactive", () => {
    document.body.innerHTML = `<button>Go</button>`;
    const el = document.querySelector("button")!;
    expect(isInteractive(el, effectiveRole(el))).toBe(true);
  });
  it("treats a div with role button as interactive", () => {
    document.body.innerHTML = `<div role="button">Go</div>`;
    const el = document.querySelector("div")!;
    expect(isInteractive(el, effectiveRole(el))).toBe(true);
  });
  it("treats a plain div as not interactive", () => {
    document.body.innerHTML = `<div>text</div>`;
    const el = document.querySelector("div")!;
    expect(isInteractive(el, effectiveRole(el))).toBe(false);
  });
  it("treats a hidden input as not interactive", () => {
    document.body.innerHTML = `<input type="hidden">`;
    const el = document.querySelector("input")!;
    expect(isInteractive(el, effectiveRole(el))).toBe(false);
  });
});

describe("role mapping", () => {
  it("maps a text input to textbox", () => {
    document.body.innerHTML = `<input type="text">`;
    expect(effectiveRole(document.querySelector("input")!)).toBe("textbox");
  });
  it("maps a checkbox input to checkbox", () => {
    document.body.innerHTML = `<input type="checkbox">`;
    expect(effectiveRole(document.querySelector("input")!)).toBe("checkbox");
  });
  it("honors an explicit role over the tag", () => {
    document.body.innerHTML = `<a role="tab">Tab</a>`;
    expect(effectiveRole(document.querySelector("a")!)).toBe("tab");
  });
});
