// tests/unit/panelRender.test.ts
// Renders the real side panel in jsdom with a mocked chrome and checks: it mounts, the provider badge
// says "Demo guide", Arabic flips the document to rtl with Arabic strings, and the panel offers no
// control that could act on the page (only guide navigation buttons).
import { describe, it, expect, beforeAll, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";

beforeAll(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const c: any = (globalThis as any).chrome;
  c.runtime.connect = () => ({ onMessage: { addListener() {} }, postMessage() {} });
  c.runtime.sendMessage = (_e: any, cb: any) => cb?.({ payload: {} });
  c.tabs = { query: async () => [{ id: 1, url: "http://localhost:8793/start" }], onActivated: { addListener() {} }, onUpdated: { addListener() {} } };
  c.permissions = { contains: async () => true };
  vi.stubGlobal(
    "fetch",
    async () =>
      ({
        ok: true,
        json: async () => ({
          provider: "demo",
          packs: [{ id: "p", name: "Practice portal", nameAr: "بوابة تدريب", status: "mock", tasks: [{ id: "t", title: "Walkthrough", titleAr: "جولة", steps: 3 }] }]
        })
      }) as any
  );
});

async function mount() {
  document.body.innerHTML = '<div id="root"></div>';
  const { App } = await import("../../src/panel/App");
  const root = createRoot(document.getElementById("root")!);
  await act(async () => {
    root.render(React.createElement(App));
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 30));
  });
  return root;
}

describe("side panel", () => {
  it("mounts in English with the demo-guide badge and the launcher", async () => {
    await mount();
    const text = document.body.textContent ?? "";
    expect(text).toContain("Rasikh Guide");
    expect(text).toContain("Demo guide");
    expect(text).toContain("Practice portal");
    expect(text).toContain("I point. You do every click.");
    expect(document.documentElement.dir).toBe("ltr");
  });
  it("switching to Arabic sets rtl and Arabic strings", async () => {
    const { useStore } = await import("../../src/panel/state/store");
    await act(async () => {
      useStore.getState().setLang("ar");
    });
    expect(document.documentElement.dir).toBe("rtl");
    expect(document.documentElement.lang).toBe("ar");
    const text = document.body.textContent ?? "";
    expect(text).toContain("مرشد راسخ");
    expect(text).toContain("بوابة تدريب");
  });
  it("offers only guide navigation buttons (start, grant, language), nothing that acts on the page", async () => {
    const labels = Array.from(document.querySelectorAll("button")).map((b) => b.textContent ?? "");
    for (const l of labels) expect(l).not.toMatch(/click|type|submit|fill|pay|approve|اضغط عنه|املأ/i);
  });
});
