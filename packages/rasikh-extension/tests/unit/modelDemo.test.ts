// tests/unit/modelDemo.test.ts
import { describe, it, expect } from "vitest";
import { planStep, callModelStreaming } from "../../backend/modelDemo";
import * as demo from "../../backend/modelDemo";
import { providerName, selectProvider } from "../../backend/provider";
import { placeholderPack } from "../../backend/placeholderPack";

const el = (ref: string, role: string, name: string, extra: any = {}) => ({
  ref, role, name, rect: { x: 0, y: 0, w: 1, h: 1 }, fingerprint: "", ...extra
});
const model = (elements: any[]): any => ({
  url: "http://localhost:8793/", title: "", site: "", view: "", partial: false, viewport: {}, capturedAt: 0, salientText: "", elements
});
const ctx = (stepIndex: number, language: "en" | "ar", elements: any[]) => ({
  pack: placeholderPack, task: placeholderPack.tasks[0], stepIndex, model: model(elements), language
});

describe("offline demo planner", () => {
  it("points at the matched control and explains it, then waits (highlight, never an action)", () => {
    const p = planStep(ctx(0, "en", [el("e4", "button", "Start application")]));
    expect(p.tool.name).toBe("highlight");
    expect(p.tool.input.ref).toBe("e4");
    expect(p.message).toContain("Step 1 of 3");
    expect(p.message).toContain("I only point");
  });
  it("explains when the control is not on the page", () => {
    const p = planStep(ctx(0, "en", [el("e1", "link", "Home")]));
    expect(p.tool.name).toBe("explain");
    expect(p.message).toContain("cannot see that control");
  });
  it("answers in Arabic when asked", () => {
    const p = planStep(ctx(1, "ar", [el("e2", "textbox", "Your name")]));
    expect(p.message).toContain("الخطوة 2 من 3");
    expect(p.message).toContain("اكتبه بنفسك");
  });
  it("says personal fields are never read", () => {
    const p = planStep(ctx(1, "en", [el("e2", "textbox", "Your name", { sensitive: true })]));
    expect(p.message).toContain("I will not read it");
  });
  it("walks every step in order without a network call", async () => {
    const g = globalThis as any;
    const realFetch = g.fetch;
    g.fetch = () => {
      throw new Error("network call attempted");
    };
    try {
      const els = [el("e1", "button", "Start"), el("e2", "textbox", "Name"), el("e3", "button", "Submit")];
      const names: string[] = [];
      for (let i = 0; i < 3; i++) {
        let tool: any;
        await callModelStreaming({ system: "", messages: [], tools: [], context: ctx(i, "en", els) }, () => undefined, (t) => (tool = t));
        names.push(tool.name + ":" + tool.input.ref);
      }
      expect(names).toEqual(["highlight:e1", "highlight:e2", "highlight:e3"]);
    } finally {
      g.fetch = realFetch;
    }
  });
});

describe("provider selection (default demo)", () => {
  it("demo when ANTHROPIC_KEY is unset", () => {
    expect(providerName({})).toBe("demo");
    expect(selectProvider({}).callModelStreaming).toBe(demo.callModelStreaming);
  });
  it("demo when MODEL_PROVIDER=demo even if a key is set", () => {
    expect(providerName({ MODEL_PROVIDER: "demo", ANTHROPIC_KEY: "k" })).toBe("demo");
  });
  it("ai only when explicitly chosen AND a key is set; a key alone never turns it on", () => {
    expect(providerName({ ANTHROPIC_KEY: "k" })).toBe("demo");
    expect(providerName({ MODEL_PROVIDER: "ai", ANTHROPIC_KEY: "k" })).toBe("ai");
    expect(providerName({ MODEL_PROVIDER: "anthropic", ANTHROPIC_KEY: "k" })).toBe("ai");
    expect(providerName({ MODEL_PROVIDER: "anthropic" })).toBe("demo");
    expect(providerName({ MODEL_PROVIDER: "ai" })).toBe("demo");
  });
});
