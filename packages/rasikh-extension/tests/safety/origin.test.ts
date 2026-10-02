// tests/safety/origin.test.ts
import { describe, it, expect } from "vitest";
import { isContentScriptSender, senderIsTrusted } from "../../src/shared/validateSender";

describe("sender trust", () => {
  it("rejects a message from another extension id", () => {
    expect(senderIsTrusted({ id: "some-other-extension" } as any)).toBe(false);
  });
  it("accepts a message from our own extension id", () => {
    (globalThis as any).chrome = { runtime: { id: "self-id" } };
    expect(senderIsTrusted({ id: "self-id" } as any)).toBe(true);
  });
  it("treats a web page's content script as needing a grant, but not our own page opened in a tab", () => {
    (globalThis as any).chrome = { runtime: { id: "self-id", getURL: (p: string) => `chrome-extension://self-id/${p}` } };
    const web = { id: "self-id", tab: { id: 1, url: "http://127.0.0.1:8793/bank/" }, url: "http://127.0.0.1:8793/bank/" };
    const panelTab = { id: "self-id", tab: { id: 2, url: "chrome-extension://self-id/src/panel/index.html" }, url: "chrome-extension://self-id/src/panel/index.html" };
    const sidePanel = { id: "self-id", url: "chrome-extension://self-id/src/panel/index.html" };
    expect(isContentScriptSender(web as any)).toBe(true);
    expect(isContentScriptSender(panelTab as any)).toBe(false);
    expect(isContentScriptSender(sidePanel as any)).toBe(false);
  });
});
