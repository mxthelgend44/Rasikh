// tests/unit/machine.test.ts
import { describe, it, expect } from "vitest";
import { transition, IllegalTransition, canConfirm } from "../../src/background/machine";

describe("state machine", () => {
  it("moves from idle to starting on startLesson", () => {
    expect(transition("idle", "startLesson")).toBe("starting");
  });
  it("moves a risky plan to awaiting-confirmation", () => {
    expect(transition("awaiting-plan", "planRiskyAction")).toBe("awaiting-confirmation");
  });
  it("throws on an illegal transition", () => {
    expect(() => transition("idle", "actionDone")).toThrow(IllegalTransition);
  });
  it("allows pause from acting", () => {
    expect(transition("acting", "pause")).toBe("paused");
  });
  it("guards confirm on a valid token", () => {
    expect(canConfirm("awaiting-confirmation", true)).toBe(true);
    expect(canConfirm("awaiting-confirmation", false)).toBe(false);
    expect(canConfirm("acting", true)).toBe(false);
  });
});
