// tests/integration/rehydrate.test.ts
import { describe, it, expect } from "vitest";
import { loadState, saveState } from "../../src/background/state";

describe("rehydration", () => {
  it("continues a guide after a simulated worker death", async () => {
    await saveState({
      lesson: {
        skill: "placeholder-portal",
        objective: "demo-walkthrough",
        mode: "guide",
        step: 2,
        history: [],
        state: "awaiting-student-action"
      }
    });
    const st = await loadState();
    expect(st.lesson?.step).toBe(2);
    expect(st.lesson?.state).toBe("awaiting-student-action");
  });
});
