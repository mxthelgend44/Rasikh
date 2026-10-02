// tests/unit/contentInject.test.ts
// A grant both registers the content script and injects it into open tabs, so the entry must be
// safe to run twice on one page: handlers and the lifecycle announcement install once.
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("content script entry is injected-once", () => {
  beforeEach(() => {
    delete (globalThis as any).__rasikhGuideInjected;
    vi.resetModules();
  });

  it("installs the perceive/doAction handlers and announces readiness exactly once across two runs", async () => {
    const addListener = vi.fn();
    const sendMessage = vi.fn();
    (globalThis as any).chrome = { runtime: { id: "self-id", sendMessage, onMessage: { addListener } } };
    await import("../../src/content/index");
    vi.resetModules(); // a second injection re-evaluates the module in the same page
    await import("../../src/content/index");
    expect(addListener).toHaveBeenCalledTimes(2); // perceive + doAction, once
    const ready = sendMessage.mock.calls.filter((c) => c[0]?.type === "contentReady");
    expect(ready).toHaveLength(1);
    expect((globalThis as any).__rasikhGuideInjected).toBe(true);
  });
});
