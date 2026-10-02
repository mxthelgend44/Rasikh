// tests/integration/server.test.ts
// A real HTTP round trip against the backend app on an ephemeral port: skills list, health, and an
// offline demo turn over SSE. Proves the default provider is the demo guide and no key is needed.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import app from "../../backend/server";
import { postTurn } from "../../src/background/orchestratorClient";

let server: Server;
let base = "";

beforeAll(async () => {
  delete process.env.ANTHROPIC_KEY;
  delete process.env.MODEL_PROVIDER;
  await new Promise<void>((res) => {
    server = app.listen(0, "127.0.0.1", () => res());
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((res) => server.close(() => res())));

const el = (ref: string, role: string, name: string) => ({ ref, role, name, rect: { x: 0, y: 0, w: 1, h: 1 }, fingerprint: "" });
const pageModel = (elements: any[]) => ({
  url: "http://localhost:8793/", title: "Mock", site: "", view: "", partial: false,
  viewport: { width: 1, height: 1, scrollX: 0, scrollY: 0, dpr: 1, zoom: 1 }, elements, salientText: "Mock portal", capturedAt: 0
});

describe("backend over HTTP", () => {
  it("health reports the demo provider", async () => {
    const r = await (await fetch(`${base}/health`)).json();
    expect(r).toEqual({ ok: true, provider: "demo" });
  });
  it("lists the packs with the active provider", async () => {
    const r: any = await (await fetch(`${base}/skills`)).json();
    expect(r.provider).toBe("demo");
    expect(r.packs.some((p: any) => p.id === "placeholder-portal")).toBe(true);
  });
  it("runs an offline turn: highlight + explanation + step info, labelled demo", async () => {
    const res = await fetch(`${base}/agent/turn`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId: "local", turnId: "t", skill: "placeholder-portal", objective: "demo-walkthrough", mode: "guide", step: 0,
        studentLanguage: "en", pageModel: pageModel([el("e1", "button", "Start application")]), history: [], learnerSnapshot: { level: "beginner", taskMastery: {} }
      })
    });
    const text = await res.text();
    expect(text).toContain("event: chunk");
    expect(text).toContain("event: action");
    const action = JSON.parse(text.split("event: action\ndata: ")[1].split("\n")[0]);
    expect(action.provider).toBe("demo");
    expect(action.action.type).toBe("highlight");
    expect(action.action.ref).toBe("e1");
    expect(action.step).toMatchObject({ index: 0, total: 3, controlFound: true });
  });
  it("client postTurn parses the stream (the same code the worker uses)", async () => {
    const g = globalThis as any;
    const real = g.fetch;
    g.fetch = (u: string, init: any) => real(u.replace("http://localhost:8796", base), init);
    try {
      const out = await postTurn({
        sessionId: "local", turnId: "t2", skill: "placeholder-portal", objective: "demo-walkthrough", mode: "guide", step: 1,
        studentLanguage: "ar", pageModel: pageModel([el("e5", "textbox", "Name")]), history: [], learnerSnapshot: { level: "beginner", taskMastery: {} }
      } as any);
      expect(out.provider).toBe("demo");
      expect(out.step.index).toBe(1);
      expect(out.message).toContain("الخطوة 2 من 3");
      expect(out.action.type).toBe("highlight");
    } finally {
      g.fetch = real;
    }
  });
  it("rejects a malformed body and an unknown pack", async () => {
    const bad = await fetch(`${base}/agent/turn`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    expect(bad.status).toBe(400);
    const none = await fetch(`${base}/agent/turn`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ skill: "nope", objective: "x", step: 0, pageModel: pageModel([]) })
    });
    expect(none.status).toBe(404);
  });
});
