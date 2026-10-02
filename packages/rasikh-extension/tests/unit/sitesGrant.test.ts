// tests/unit/sitesGrant.test.ts
// Per-site grant lifecycle: the content script exists for an origin only while the person's grant does.
import { describe, it, expect, beforeEach, vi } from "vitest";
import { grantSite, revokeSite, scriptId } from "../../src/background/sites";

const calls: string[] = [];
let allow = true;

beforeEach(() => {
  calls.length = 0;
  allow = true;
  const c: any = (globalThis as any).chrome;
  c.permissions = {
    request: vi.fn(async () => {
      calls.push("request");
      return allow;
    }),
    remove: vi.fn(async () => {
      calls.push("remove");
      return true;
    })
  };
  c.scripting = {
    unregisterContentScripts: vi.fn(async () => {
      calls.push("unregister");
    }),
    registerContentScripts: vi.fn(async (s: any[]) => {
      calls.push("register:" + s[0].matches.join(","));
      expect(s[0].persistAcrossSessions).toBe(true);
      expect(s[0].allFrames).toBe(false);
    }),
    executeScript: vi.fn(async () => {
      calls.push("inject");
    })
  };
  c.tabs = { ...(c.tabs ?? {}), query: vi.fn(async () => [{ id: 1 }]) };
});

describe("grant lifecycle", () => {
  it("a denied request registers nothing", async () => {
    allow = false;
    expect(await grantSite("https://portal.example.ae/*")).toBe(false);
    expect(calls).toEqual(["request"]);
  });
  it("a granted origin is requested first, then registered for that one origin, then injected", async () => {
    expect(await grantSite("https://portal.example.ae/*")).toBe(true);
    expect(calls[0]).toBe("request");
    expect(calls).toContain("register:https://portal.example.ae/*");
    expect(calls.indexOf("register:https://portal.example.ae/*")).toBeLessThan(calls.indexOf("inject"));
  });
  it("revoke unregisters the content script before removing the permission", async () => {
    await revokeSite("https://portal.example.ae/*");
    expect(calls).toEqual(["unregister", "remove"]);
  });
  it("script ids are per origin and stable", () => {
    expect(scriptId("https://a.example/*")).toBe(scriptId("https://a.example/*"));
    expect(scriptId("https://a.example/*")).not.toBe(scriptId("https://b.example/*"));
  });
});
