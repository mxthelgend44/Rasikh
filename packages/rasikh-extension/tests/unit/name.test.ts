// tests/unit/name.test.ts
import { describe, it, expect } from "vitest";
import { accessibleName } from "../../src/content/perception/name";

describe("accessibleName", () => {
  it("prefers aria-label over text content", () => {
    document.body.innerHTML = `<button aria-label="Start sketch">+</button>`;
    expect(accessibleName(document.querySelector("button")!)).toBe("Start sketch");
  });
  it("resolves aria-labelledby", () => {
    document.body.innerHTML = `<span id="t">Width</span><input aria-labelledby="t">`;
    expect(accessibleName(document.querySelector("input")!)).toBe("Width");
  });
  it("falls back to a wrapping label", () => {
    document.body.innerHTML = `<label>Email <input></label>`;
    expect(accessibleName(document.querySelector("input")!)).toContain("Email");
  });
  it("never puts a chosen value in the name: a combobox that labels itself is named by its label only", () => {
    document.body.innerHTML = `<span id="lbl">Expected monthly income</span><div id="rng" role="combobox" tabindex="0" aria-labelledby="lbl rng">AED 5,000 to 15,000</div>`;
    expect(accessibleName(document.querySelector("#rng")!)).toBe("Expected monthly income");
  });
  it("ignores a referenced element that sits inside the control", () => {
    document.body.innerHTML = `<div role="combobox" id="c" aria-labelledby="v"><span id="v">chosen value</span></div>`;
    expect(accessibleName(document.querySelector("#c")!)).not.toContain("chosen value");
  });
});
