// tests/unit/conditions.test.ts
import { describe, it, expect } from "vitest";
import { checkCondition } from "../../src/shared/conditions";
import { findControlByKey } from "../../src/shared/findControl";
import { placeholderPack } from "../../backend/placeholderPack";

const model = (names: string[]): any => ({
  url: "http://localhost:8793/apply/step2",
  title: "t",
  salientText: "Apply for a visa | Step 2",
  elements: names.map((n, i) => ({ ref: "e" + i, role: "button", name: n, rect: { x: 0, y: 0, w: 1, h: 1 }, fingerprint: "" }))
});

describe("structural conditions", () => {
  it("url, heading, text", () => {
    const m = model(["Continue"]);
    expect(checkCondition("url:/apply/step2", m)).toBe(true);
    expect(checkCondition("heading:step 2", m)).toBe(true);
    expect(checkCondition("text:continue", m)).toBe(true);
    expect(checkCondition("url:/nope", m)).toBe(false);
  });
  it("present and absent resolve pack controls", () => {
    expect(checkCondition("present:start", model(["Start"]), placeholderPack)).toBe(true);
    expect(checkCondition("absent:start", model(["Start"]), placeholderPack)).toBe(false);
    expect(checkCondition("absent:start", model(["Other"]), placeholderPack)).toBe(true);
  });
  it("&& needs both; unknown and empty fail closed; a bad regex does not throw", () => {
    const m = model(["Start"]);
    expect(checkCondition("url:apply && text:start", m)).toBe(true);
    expect(checkCondition("url:apply && text:zzz", m)).toBe(false);
    expect(checkCondition("sketch-fully-defined", m)).toBe(false);
    expect(checkCondition(undefined, m)).toBe(false);
    expect(checkCondition("text:(", m)).toBe(false);
  });
  it("findControlByKey finds by role and name", () => {
    expect(findControlByKey(placeholderPack, "submit", model(["Submit application"]))?.ref).toBe("e0");
    expect(findControlByKey(placeholderPack, "submit", model(["Cancel"]))).toBeUndefined();
  });
});
