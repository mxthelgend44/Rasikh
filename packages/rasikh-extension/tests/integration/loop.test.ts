// tests/integration/loop.test.ts
// The worker guide loop against the real backend app (ephemeral port) and a mocked chrome. Proves:
// no grant -> nothing is perceived; with a grant -> one highlight reaches the page and the panel gets
// the step labelled "demo"; and the ONLY messages the worker ever sends to a tab are perceive and
// non-mutating doAction types.
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import app from "../../backend/server";
import { originPattern, hasGrant } from "../../src/background/sites";

let server: Server;
let base = "";
let panelMsgs: any[] = [];
let tabMsgs: any[] = [];
let granted = true;
let onConnect: ((p: any) => void) | undefined;

const MODEL = {
  url: "http://localhost:8793/",
  title: "Mock",
  site: "",
  view: "",
  partial: false,
  viewport: { width: 1, height: 1, scrollX: 0, scrollY: 0, dpr: 1, zoom: 1 },
  salientText: "Mock portal",
  capturedAt: 0,
  elements: [{ ref: "e1", role: "button", name: "Start", rect: { x: 0, y: 0, w: 1, h: 1 }, fingerprint: "b" }]
};

beforeAll(async () => {
  delete process.env.ANTHROPIC_KEY;
  await new Promise<void>((res) => {
    server = app.listen(0, "127.0.0.1", () => res());
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const real = globalThis.fetch;
  vi.stubGlobal("fetch", (u: string, init: any) => real(String(u).replace("http://localhost:8796", base), init));
});
afterAll(() => {
  vi.unstubAllGlobals();
  return new Promise<void>((res) => server.close(() => res()));
});

beforeEach(async () => {
  panelMsgs = [];
  tabMsgs = [];
  granted = true;
  const c: any = (globalThis as any).chrome;
  c.runtime.onConnect = { addListener: (fn: any) => (onConnect = fn) };
  c.tabs = {
    query: async () => [{ id: 7, url: "http://localhost:8793/start?x=1" }],
    sendMessage: (_id: number, env: any, cb: (r: any) => void) => {
      tabMsgs.push(env);
      if (env.type === "perceive") cb({ payload: { model: MODEL } });
      else cb({ payload: { result: { action: env.payload.action.type, ok: true, newModel: MODEL } } });
    }
  };
  c.permissions = { contains: async () => granted };
  await c.storage.session.clear();
});

async function load() {
  vi.resetModules();
  const loop = await import("../../src/background/loop");
  await import("../../src/background/panelPort");
  onConnect?.({
    name: "panel",
    postMessage: (m: any) => panelMsgs.push(m),
    onDisconnect: { addListener() {} },
    onMessage: { addListener() {} }
  });
  return loop;
}

describe("sites", () => {
  it("originPattern keeps scheme and host only", () => {
    expect(originPattern("https://portal.example.ae/a/b?x=1#y")).toBe("https://portal.example.ae/*");
    expect(originPattern("http://localhost:8793/start")).toBe("http://localhost:8793/*");
    expect(originPattern("chrome://extensions")).toBeUndefined();
    expect(originPattern("not a url")).toBeUndefined();
  });
  it("hasGrant is false for non-web urls and when permissions.contains is false", async () => {
    granted = false;
    expect(await hasGrant("https://portal.example.ae/")).toBe(false);
    expect(await hasGrant(undefined)).toBe(false);
  });
});

describe("guide loop", () => {
  it("without a site grant it perceives nothing and tells the panel", async () => {
    granted = false;
    const loop = await load();
    await loop.onStartLesson({ skill: "placeholder-portal", objective: "demo-walkthrough" });
    expect(tabMsgs).toEqual([]);
    expect(panelMsgs.some((m) => m.type === "error" && m.payload.code === "NO_SITE_GRANT")).toBe(true);
  });

  it("with a grant: perceive, then exactly one non-mutating highlight; panel gets a demo-labelled step", async () => {
    const loop = await load();
    await loop.onStartLesson({ skill: "placeholder-portal", objective: "demo-walkthrough" });
    expect(tabMsgs.map((m) => m.type)).toEqual(["perceive", "doAction"]);
    expect(tabMsgs[1].payload.action).toMatchObject({ type: "highlight", ref: "e1" });
    const step = panelMsgs.find((m) => m.type === "guideStep");
    expect(step.payload.provider).toBe("demo");
    expect(step.payload.step).toMatchObject({ index: 0, total: 3, controlFound: true });
  });

  it("next step moves the index and stays coach-only; the person drives it", async () => {
    const loop = await load();
    await loop.onStartLesson({ skill: "placeholder-portal", objective: "demo-walkthrough" });
    await loop.onNextStep();
    const steps = panelMsgs.filter((m) => m.type === "guideStep");
    expect(steps.map((m) => m.payload.step.index)).toEqual([0, 1]);
    for (const m of tabMsgs) {
      expect(["perceive", "doAction"]).toContain(m.type);
      if (m.type === "doAction") expect(["highlight", "explain", "clearOverlays"]).toContain(m.payload.action.type);
    }
  });

  it("stop clears the overlay and the lesson", async () => {
    const loop = await load();
    await loop.onStartLesson({ skill: "placeholder-portal", objective: "demo-walkthrough" });
    await loop.onStopGuide();
    expect(tabMsgs[tabMsgs.length - 1].payload.action.type).toBe("clearOverlays");
    const { loadState } = await import("../../src/background/state");
    expect((await loadState()).lesson).toBeUndefined();
  });
});
