// tests/unit/validate.test.ts
import { describe, it, expect } from "vitest";
import { validateAction } from "../../backend/validate";

const model = {
  elements: [{ ref: "e1", role: "button", name: "Deploy", rect: { x: 0, y: 0, w: 10, h: 10 }, fingerprint: "" }]
} as any;

describe("validateAction (coach only)", () => {
  it("rejects an action outside the allowlist", () => {
    expect(() => validateAction({ name: "evalCode", input: {} }, model)).toThrow();
  });
  it("rejects a ref not in the model", () => {
    expect(() => validateAction({ name: "highlight", input: { ref: "e9", message: "x" } }, model)).toThrow();
  });
  it("rejects click even on a harmless control", () => {
    expect(() => validateAction({ name: "click", input: { ref: "e1" } }, model)).toThrow();
  });
  it("passes highlight and always marks it safe, with scrubbed text", () => {
    const a = validateAction({ name: "highlight", input: { ref: "e1", message: "Press it. 784-1990-1234567-1" } }, model);
    expect(a.type).toBe("highlight");
    expect(a.risk).toBe("safe");
    expect(a.message).not.toContain("784-1990");
  });
});
