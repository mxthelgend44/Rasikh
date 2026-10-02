// Shared end-to-end harness for the Rasikh extension (real Chromium, unpacked build, mock portals).
// It never drives the extension on the person's behalf: the extension only coaches, and every click
// or keystroke on the portal comes from this harness acting as the person.
import { chromium, type BrowserContext, type Page, type Worker } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const BACKEND_PORT = process.env.E2E_BACKEND_PORT ?? "8796";
const BUILT_DIR = path.resolve(process.env.E2E_EXT_DIR ?? path.join(process.cwd(), "dist"));

/**
 * The extension is built for a backend on 8796. If something else owns 8796 on this machine, the suite tests a COPY of dist/
 * with only that port string rewritten (manifest host permission, CSP and the API constant). Same code, different port.
 */
function prepareExtDir(): string {
  if (BACKEND_PORT === "8796") return BUILT_DIR;
  const out = path.resolve(process.cwd(), "test-results", "dist-e2e-port" + BACKEND_PORT);
  fs.rmSync(out, { recursive: true, force: true });
  fs.cpSync(BUILT_DIR, out, { recursive: true });
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name);
      if (e.isDirectory()) walk(f);
      else if (/.(js|json|html|css)$/.test(e.name)) {
        const s = fs.readFileSync(f, "utf8");
        if (s.includes("8796")) fs.writeFileSync(f, s.split("8796").join(BACKEND_PORT));
      }
    }
  };
  walk(out);
  return out;
}
export const EXT_DIR = prepareExtDir();
export const PORTALS = process.env.E2E_PORTALS ?? "http://127.0.0.1:8793";
export const PORTALS_ORIGIN_PATTERN = "http://127.0.0.1:8793/*";
export const BACKEND = process.env.E2E_BACKEND ?? `http://127.0.0.1:${process.env.E2E_BACKEND_PORT ?? "8796"}`;
export const SHOT_DIR = path.resolve(
  process.env.E2E_SHOTS ?? path.join(process.cwd(), "test-results", "e2e-screenshots")
);

export interface SpyEntry {
  dir: string;
  m: unknown;
}
export interface ReqEntry {
  method: string;
  url: string;
  body: string | null;
  failed: boolean;
}

// Fake sensitive values. Each is unique so a substring search means something.
export const SENTINELS = {
  password: "S3ntinelPw!42xQ",
  otp: "905731",
  card: "4111111111111111",
  emiratesId: "784-1999-7654321-0",
  passport: "ZQ9087123",
  iban: "AE070331234567890123456",
  fullName: "Sentinel Testperson",
  mobile: "0501239876",
  email: "sentinel.person@example.test",
  employer: "Sentinel Employer LLC"
};

const SPY_SOURCE = `(() => {
  if (globalThis.__rasikhSpy) return; globalThis.__rasikhSpy = true;
  const log = (dir, m) => { try { console.log('__SPY__' + JSON.stringify({ dir, m })); } catch (e) {} };
  chrome.runtime.onMessage.addListener((m, s) => { log('in:' + (s && s.url ? new URL(s.url).origin : 'ext'), m); return false; });
  const ts = chrome.tabs.sendMessage; chrome.tabs.sendMessage = function (...a) { log('tabs.sendMessage', a[1]); return ts.apply(this, a); };
  const rs = chrome.runtime.sendMessage; chrome.runtime.sendMessage = function (...a) { log('runtime.sendMessage', a[0]); return rs.apply(this, a); };
  const f = globalThis.fetch; globalThis.fetch = function (...a) { try { log('fetch', { url: String((a[0] && a[0].url) || a[0]), body: a[1] && typeof a[1].body === 'string' ? a[1].body : null }); } catch (e) {} return f.apply(this, a); };
  const oc = chrome.runtime.onConnect; oc.addListener((port) => { const o = port.postMessage.bind(port); port.postMessage = (m) => { log('port.post:' + port.name, m); o(m); }; });
})()`;

export class Ext {
  ctx!: BrowserContext;
  sw!: Worker;
  id = "";
  userDataDir = "";
  spy: SpyEntry[] = [];
  requests: ReqEntry[] = [];
  consoleErrors: string[] = [];
  pageErrors: string[] = [];
  private spyInstalledOn = new WeakSet<Worker>();

  static async launch(): Promise<Ext> {
    if (!fs.existsSync(path.join(EXT_DIR, "manifest.json"))) {
      throw new Error(`No built extension at ${EXT_DIR}. Run "npm run build" first.`);
    }
    const e = new Ext();
    e.userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "rasikh-e2e-"));
    const browser = process.env.E2E_BROWSER ?? "chromium"; // "chromium" (Playwright Chrome for Testing) or "msedge"
    // Offline on purpose: every host except loopback fails to resolve. The demo must work with no internet.
    const args = [
      `--disable-extensions-except=${EXT_DIR}`,
      `--load-extension=${EXT_DIR}`,
      "--no-first-run",
      "--no-default-browser-check",
      '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1 , EXCLUDE localhost'
    ];
    e.ctx = await chromium.launchPersistentContext(e.userDataDir, {
      headless: false, // extensions need a headed (or new-headless) browser; the window is real
      channel: browser === "msedge" ? "msedge" : undefined,
      args,
      ignoreDefaultArgs: ["--disable-extensions"],
      viewport: { width: 1280, height: 900 },
      locale: "en-US"
    });
    e.ctx.on("request", (r) =>
      e.requests.push({ method: r.method(), url: r.url(), body: r.postData(), failed: false })
    );
    e.ctx.on("requestfailed", (r) =>
      e.requests.push({ method: r.method(), url: r.url(), body: r.postData(), failed: true })
    );
    e.ctx.on("console", (msg) => {
      const t = msg.text();
      if (t.startsWith("__SPY__")) {
        try {
          e.spy.push(JSON.parse(t.slice(7)));
        } catch {
          /* ignore */
        }
      } else if (msg.type() === "error") {
        e.consoleErrors.push(`${msg.location().url}: ${t}`);
      }
    });
    e.ctx.on("weberror", (w) => e.pageErrors.push(String(w.error())));
    e.ctx.setDefaultTimeout(10_000);
    e.sw = e.ctx.serviceWorkers()[0] ?? (await e.ctx.waitForEvent("serviceworker", { timeout: 15000 }));
    e.id = new URL(e.sw.url()).host;
    await e.installSpy();
    e.ctx.on("serviceworker", (w) => void e.installSpy(w));
    return e;
  }

  async installSpy(w: Worker = this.sw) {
    if (this.spyInstalledOn.has(w)) return;
    this.spyInstalledOn.add(w);
    try {
      await w.evaluate(SPY_SOURCE);
    } catch {
      /* worker may be gone */
    }
  }

  url(p: string) {
    return `chrome-extension://${this.id}/${p}`;
  }

  manifest(): any {
    return JSON.parse(fs.readFileSync(path.join(EXT_DIR, "manifest.json"), "utf8"));
  }

  sidePanelPath(): string {
    return this.manifest().side_panel.default_path;
  }

  /** The person's click on "Allow" for the 127.0.0.1:8793 practice portal in the settings page (a real click = a real user gesture). */
  async grant(_originPattern = PORTALS_ORIGIN_PATTERN): Promise<boolean> {
    // the first click on a fresh profile is occasionally ignored while the settings page is still settling
    for (let attempt = 0; attempt < 3; attempt++) {
      if (await this.grantOnce()) return true;
      await sleep(800);
    }
    return false;
  }

  private async grantOnce(): Promise<boolean> {
    const page = await this.ctx.newPage();
    try {
      await page.goto(this.url(this.manifest().options_page));
      const row = page.locator("li, div, tr").filter({ hasText: /^127.0.0.1:8793s*Allow$/ }).last();
      const cdp = await this.ctx.newCDPSession(page);
      // the click runs with a user gesture (CDP userGesture), which is what chrome.permissions.request requires
      await cdp.send("Runtime.evaluate", {
        expression: "[...document.querySelectorAll('button')].filter(b => /^Allow$/.test(b.textContent.trim()))[1].click()",
        userGesture: true
      });
      await page.waitForTimeout(2500);
      return await page.evaluate(() => chrome.permissions.contains({ origins: ["http://127.0.0.1:8793/*"] }));
    } finally {
      await page.close();
    }
  }

  async revoke(originPattern = PORTALS_ORIGIN_PATTERN): Promise<boolean> {
    const page = await this.ctx.newPage();
    try {
      await page.goto(this.url(this.manifest().options_page));
      return await page.evaluate((o) => chrome.permissions.remove({ origins: [o] }), originPattern);
    } finally {
      await page.close();
    }
  }

  async hasPermission(originPattern = PORTALS_ORIGIN_PATTERN): Promise<boolean> {
    const page = await this.ctx.newPage();
    try {
      await page.goto(this.url(this.manifest().options_page));
      return await page.evaluate((o) => chrome.permissions.contains({ origins: [o] }), originPattern);
    } finally {
      await page.close();
    }
  }

  /** Open the side panel page. The real side panel cannot be opened by a script, so its page is opened as a tab. */
  async openPanel(width = 420): Promise<Page> {
    const p = await this.ctx.newPage();
    p.on("pageerror", (e) => this.pageErrors.push(`panel: ${String(e)}`));
    await p.setViewportSize({ width, height: 800 });
    await p.addInitScript(() => {
      // record every message the panel sends or receives so the sensitive-data tests can scan them
      const w = window as any;
      w.__panelLog = [];
      try {
        const rc = chrome.runtime.connect.bind(chrome.runtime);
        (chrome.runtime as any).connect = (...a: any[]) => {
          const port = rc(...a);
          port.onMessage.addListener((m: unknown) => w.__panelLog.push({ dir: "port-in", m }));
          const post = port.postMessage.bind(port);
          port.postMessage = (m: unknown) => {
            w.__panelLog.push({ dir: "port-out", m });
            post(m);
          };
          return port;
        };
        const sm = chrome.runtime.sendMessage.bind(chrome.runtime);
        (chrome.runtime as any).sendMessage = (...a: any[]) => {
          w.__panelLog.push({ dir: "send", m: a[0] });
          return (sm as any)(...a);
        };
      } catch {
        /* not an extension page */
      }
    });
    await p.goto(this.url(this.sidePanelPath()));
    return p;
  }

  async openPortal(pathname: string): Promise<Page> {
    const p = await this.ctx.newPage();
    p.on("pageerror", (e) => this.pageErrors.push(`portal: ${String(e)}`));
    await installRecorder(p);
    await p.goto(PORTALS + pathname);
    return p;
  }

  async shot(page: Page, name: string) {
    fs.mkdirSync(SHOT_DIR, { recursive: true });
    await page.bringToFront().catch(() => {});
    await page.screenshot({ path: path.join(SHOT_DIR, name + ".png") });
  }

  /** Everything that could carry a value out: spy log, panel logs, network bodies, extension storage. */
  async everythingSent(panels: Page[] = []): Promise<string> {
    const parts: string[] = [JSON.stringify(this.spy), JSON.stringify(this.requests)];
    for (const p of panels) {
      try {
        parts.push(JSON.stringify(await p.evaluate(() => (window as any).__panelLog ?? [])));
      } catch {
        /* closed */
      }
    }
    parts.push(await this.storageDump());
    return parts.join("\n");
  }

  async storageDump(): Promise<string> {
    const page = await this.ctx.newPage();
    try {
      await page.goto(this.url(this.manifest().options_page));
      return await page.evaluate(async () => {
        const out: Record<string, unknown> = {};
        for (const area of ["local", "session", "sync"] as const) {
          try {
            out[area] = await (chrome.storage as any)[area].get(null);
          } catch {
            out[area] = null;
          }
        }
        try {
          out.localStorage = { ...localStorage };
        } catch {
          /* none */
        }
        try {
          const dbs = (await (indexedDB as any).databases?.()) ?? [];
          out.indexedDB = dbs.map((d: any) => d.name);
        } catch {
          /* none */
        }
        return JSON.stringify(out);
      });
    } finally {
      await page.close();
    }
  }

  async close() {
    await this.ctx.close().catch(() => {});
    try {
      fs.rmSync(this.userDataDir, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  }
}

// ---------------- page-side recorder: every event, and whether a person or a script made it ----------------

export async function installRecorder(page: Page) {
  await page.addInitScript(() => {
    const w = window as any;
    w.__events = [];
    w.__me = false;
    const types = [
      "click", "dblclick", "mousedown", "mouseup", "pointerdown", "pointerup",
      "keydown", "keypress", "keyup", "beforeinput", "input", "change", "submit", "paste", "cut", "drop"
    ];
    const rec = (e: Event) => {
      const t = e.target as HTMLElement | null;
      w.__events.push({
        type: e.type,
        trusted: e.isTrusted,
        me: !!w.__me,
        target: t && t.id ? "#" + t.id : t && (t as any).name ? "[name=" + (t as any).name + "]" : t?.tagName ?? ""
      });
    };
    for (const t of types) window.addEventListener(t, rec, true);
    // focus is allowed (the guide may focus a highlighted control); recorded separately
    w.__focus = [];
    window.addEventListener("focusin", (e) => w.__focus.push((e.target as HTMLElement)?.id ?? ""), true);
    // calls the page itself can see
    const origSubmit = HTMLFormElement.prototype.submit;
    HTMLFormElement.prototype.submit = function () {
      w.__events.push({ type: "form.submit()", trusted: false, me: !!w.__me, target: this.id });
      return origSubmit.call(this);
    };
    const origClick = HTMLElement.prototype.click;
    HTMLElement.prototype.click = function () {
      w.__events.push({ type: "el.click()", trusted: false, me: !!w.__me, target: this.id });
      return origClick.call(this);
    };
  });
}

/** Run something as the person: events recorded during it are tagged me=true. */
export async function asPerson<T>(page: Page, fn: () => Promise<T>): Promise<T> {
  await page.evaluate(() => ((window as any).__me = true));
  try {
    return await fn();
  } finally {
    await page.evaluate(() => ((window as any).__me = false)).catch(() => {});
  }
}

export interface PageEvent {
  type: string;
  trusted: boolean;
  me: boolean;
  target: string;
}
export async function pageEvents(page: Page): Promise<PageEvent[]> {
  return page.evaluate(() => (window as any).__events ?? []);
}
/** Events that did not come from the harness-as-person: script-made (isTrusted false) and not tagged me. */
export async function foreignEvents(page: Page): Promise<PageEvent[]> {
  return (await pageEvents(page)).filter((e) => !e.me && !e.trusted);
}

/** A snapshot of everything a guide could change: control values and states, open dialogs, the URL, the wizard step. */
export async function formSnapshot(page: Page): Promise<string> {
  return page.evaluate(() => {
    const controls = [...document.querySelectorAll("input,select,textarea")].map((el: any) => ({
      id: el.id,
      name: el.name,
      type: el.type,
      value: el.type === "file" ? [...(el.files ?? [])].map((f: File) => f.name).join(",") : el.value,
      checked: el.checked ?? null,
      disabled: el.disabled,
      selectedIndex: el.selectedIndex ?? null
    }));
    const dialogs = [...document.querySelectorAll("dialog")].map((d: any) => ({ id: d.id, open: d.open }));
    const expanded = [...document.querySelectorAll("[aria-expanded]")].map((e) => ({
      id: e.id,
      v: e.getAttribute("aria-expanded")
    }));
    return JSON.stringify({
      href: location.href,
      state: (window as any).PortalState ?? null,
      controls,
      dialogs,
      expanded
    });
  });
}

/** The page's own markup, excluding the extension overlay host: used to prove the guide did not rewrite the page. */
export async function pageMarkup(page: Page): Promise<string> {
  return page.evaluate(() => {
    const clone = document.documentElement.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("[data-rasikh-guide]").forEach((n) => n.remove());
    return clone.outerHTML;
  });
}

// ---------------- coach mark helpers ----------------

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The coach mark ring and tip text, read from the open shadow root of the overlay host. */
export async function coachMark(page: Page): Promise<{ ring: Rect | null; tip: string | null; host: boolean }> {
  return page.evaluate(() => {
    const host = document.querySelector("[data-rasikh-guide]") as HTMLElement | null;
    const root = host?.shadowRoot;
    const ring = root?.querySelector(".ring") as HTMLElement | null;
    const tip = root?.querySelector(".tip") as HTMLElement | null;
    const r = ring?.getBoundingClientRect();
    return {
      host: !!host,
      ring: r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null,
      tip: tip ? tip.textContent : null
    };
  });
}

export async function rectOf(page: Page, selector: string): Promise<Rect | null> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  }, selector);
}

/** True when the ring wraps the target (the ring is the target plus a small margin). */
export function ringWraps(ring: Rect | null, target: Rect | null, slack = 14): boolean {
  if (!ring || !target) return false;
  return (
    ring.x <= target.x + 1 &&
    ring.y <= target.y + 1 &&
    ring.x + ring.w >= target.x + target.w - 1 &&
    ring.y + ring.h >= target.y + target.h - 1 &&
    ring.w <= target.w + 2 * slack &&
    ring.h <= target.h + 2 * slack
  );
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function waitFor<T>(fn: () => Promise<T | null | false | undefined>, ms = 8000, step = 150): Promise<T | null> {
  const end = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) return null;
    await sleep(step);
  }
}
