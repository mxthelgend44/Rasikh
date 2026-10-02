// tests/unit/sites.test.ts
// Per-site grants: the content script is registered dynamically for ONE origin on grant, and
// unregistered before the permission is removed on revoke. Nothing is registered without a grant.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  originPattern,
  scriptId,
  grantSite,
  revokeSite,
  registerForOrigin,
  injectIntoOpenTabs,
  reconcileSites,
  hasGrant,
  CONTENT_SCRIPT_FILE,
  SCRIPT_ID_PREFIX
} from "../../src/background/sites";

const PORTAL = "http://localhost:8793/*";
let calls: string[];
let granted: Set<string>;
let registered: Map<string, any>;
let tabs: { id?: number; url: string }[];
let savedChrome: any;

function installChrome(opts: { allow?: boolean; failExecute?: boolean } = {}) {
  const allow = opts.allow ?? true;
  (globalThis as any).chrome = {
    runtime: {
      id: "self-id",
      getManifest: () => ({ host_permissions: ["http://localhost:8796/*", "http://127.0.0.1:8796/*"] })
    },
    storage: savedChrome?.storage,
    permissions: {
      request: vi.fn(async ({ origins }: any) => {
        calls.push("request");
        if (!allow) return false;
        origins.forEach((o: string) => granted.add(o));
        return true;
      }),
      remove: vi.fn(async ({ origins }: any) => {
        calls.push("remove");
        origins.forEach((o: string) => granted.delete(o));
        return true;
      }),
      contains: vi.fn(async ({ origins }: any) => origins.every((o: string) => granted.has(o))),
      getAll: vi.fn(async () => ({ origins: ["http://localhost:8796/*", ...granted] }))
    },
    scripting: {
      registerContentScripts: vi.fn(async (list: any[]) => {
        calls.push("register");
        for (const s of list) {
          if (registered.has(s.id)) throw new Error("Duplicate script ID");
          registered.set(s.id, s);
        }
      }),
      unregisterContentScripts: vi.fn(async ({ ids }: any) => {
        calls.push("unregister");
        for (const id of ids) {
          if (!registered.has(id)) throw new Error("Nonexistent script ID");
          registered.delete(id);
        }
      }),
      getRegisteredContentScripts: vi.fn(async () => [...registered.values()]),
      executeScript: vi.fn(async ({ target }: any) => {
        calls.push("execute:" + target.tabId);
        if (opts.failExecute) throw new Error("cannot script");
        return [];
      })
    },
    tabs: {
      query: vi.fn(async ({ url }: any) => tabs.filter((t) => t.url.startsWith(url.replace(/\*$/, ""))))
    }
  };
}

beforeEach(() => {
  savedChrome = (globalThis as any).chrome;
  calls = [];
  granted = new Set();
  registered = new Map();
  tabs = [
    { id: 7, url: "http://localhost:8793/apply" },
    { id: 8, url: "https://other.example/" },
    { url: "http://localhost:8793/noid" }
  ];
  installChrome();
});
afterEach(() => {
  (globalThis as any).chrome = savedChrome;
});

describe("origin patterns and ids", () => {
  it("derives one origin pattern per site and drops path, query and non-http schemes", () => {
    expect(originPattern("https://portal.example.ae/a/b?x=1#y")).toBe("https://portal.example.ae/*");
    expect(originPattern("http://localhost:8793/apply")).toBe(PORTAL);
    expect(originPattern("chrome://extensions")).toBeUndefined();
    expect(originPattern("not a url")).toBeUndefined();
  });
  it("script ids are stable, prefixed and distinct per origin", () => {
    expect(scriptId(PORTAL)).toBe(scriptId(PORTAL));
    expect(scriptId(PORTAL)).not.toBe(scriptId("http://127.0.0.1:8793/*"));
    expect(scriptId(PORTAL).startsWith(SCRIPT_ID_PREFIX)).toBe(true);
    expect(scriptId(PORTAL).startsWith("_")).toBe(false);
  });
});

describe("grantSite", () => {
  it("requests the permission, THEN registers the built script for exactly that origin, then injects open tabs", async () => {
    expect(await grantSite(PORTAL)).toBe(true);
    expect(calls).toEqual(["request", "unregister", "register", "execute:7"]);
    const s = registered.get(scriptId(PORTAL));
    expect(s).toMatchObject({
      matches: [PORTAL],
      js: [CONTENT_SCRIPT_FILE],
      runAt: "document_idle",
      persistAcrossSessions: true
    });
    expect(CONTENT_SCRIPT_FILE).toBe("content.js");
    expect(s.matches).toHaveLength(1);
  });
  it("injects only into tabs of that origin and skips tabs without an id", async () => {
    await grantSite(PORTAL);
    const ex = (globalThis as any).chrome.scripting.executeScript;
    expect(ex).toHaveBeenCalledTimes(1);
    expect(ex.mock.calls[0][0]).toEqual({ target: { tabId: 7 }, files: ["content.js"] });
  });
  it("registers NOTHING when the person declines", async () => {
    installChrome({ allow: false });
    expect(await grantSite(PORTAL)).toBe(false);
    expect(calls).toEqual(["request"]);
    expect(registered.size).toBe(0);
  });
  it("is idempotent: granting twice replaces the registration instead of failing", async () => {
    await grantSite(PORTAL);
    await grantSite(PORTAL);
    expect(registered.size).toBe(1);
  });
  it("a tab that cannot be scripted does not fail the grant", async () => {
    installChrome({ failExecute: true });
    expect(await grantSite(PORTAL)).toBe(true);
    expect(registered.size).toBe(1);
  });
  it("injectIntoOpenTabs counts injected tabs", async () => {
    expect(await injectIntoOpenTabs(PORTAL)).toBe(1);
  });
});

describe("revokeSite", () => {
  it("unregisters the script FIRST, then removes the permission", async () => {
    await grantSite(PORTAL);
    calls.length = 0;
    expect(await revokeSite(PORTAL)).toBe(true);
    expect(calls).toEqual(["unregister", "remove"]);
    expect(registered.size).toBe(0);
    expect(granted.has(PORTAL)).toBe(false);
  });
  it("still removes the permission when no script was registered", async () => {
    granted.add(PORTAL);
    expect(await revokeSite(PORTAL)).toBe(true);
    expect(granted.has(PORTAL)).toBe(false);
  });
  it("hasGrant is false after revoke and for an ungranted origin", async () => {
    await grantSite(PORTAL);
    expect(await hasGrant("http://localhost:8793/apply")).toBe(true);
    await revokeSite(PORTAL);
    expect(await hasGrant("http://localhost:8793/apply")).toBe(false);
    expect(await hasGrant("https://never-granted.example/")).toBe(false);
    expect(await hasGrant(undefined)).toBe(false);
  });
});

describe("reconcileSites", () => {
  it("unregisters a script whose grant was removed elsewhere", async () => {
    await registerForOrigin(PORTAL); // registered, but never granted (or revoked from chrome://extensions)
    const r = await reconcileSites();
    expect(r.unregistered).toEqual([scriptId(PORTAL)]);
    expect(registered.size).toBe(0);
  });
  it("registers a granted origin that has no registration (profile restored)", async () => {
    granted.add(PORTAL);
    const r = await reconcileSites();
    expect(r.registered).toEqual([PORTAL]);
    expect(registered.has(scriptId(PORTAL))).toBe(true);
  });
  it("never registers the local backend origin", async () => {
    const r = await reconcileSites();
    expect(r.registered).toEqual([]);
    expect(registered.size).toBe(0);
  });
});

describe("nothing is registered or injected outside sites.ts (source guard)", () => {
  it("the only registerContentScripts / executeScript calls live in src/background/sites.ts", async () => {
    const { readdirSync, readFileSync, statSync } = await import("node:fs");
    const { join } = await import("node:path");
    const walk = (d: string, o: string[] = []): string[] => {
      for (const f of readdirSync(d)) {
        const p = join(d, f);
        if (statSync(p).isDirectory()) walk(p, o);
        else if (/\.tsx?$/.test(f)) o.push(p);
      }
      return o;
    };
    const hits = walk("src").filter((f) => /registerContentScripts\(|executeScript\(/.test(readFileSync(f, "utf8")));
    expect(hits.map((h) => h.replace(/\\/g, "/"))).toEqual(["src/background/sites.ts"]);
  });
});
