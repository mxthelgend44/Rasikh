// skillpacks/packs.verify.ts  (run: npx tsx skillpacks/packs.verify.ts  with the mock portals running on 127.0.0.1:8793)
// A pack verifier. It opens every state of the three MOCK portals in a headless browser, runs the extension's OWN
// perception code (src/content/perception/build.ts, bundled with esbuild) on the page, and then checks, with the
// extension's own control finder and view resolver, that every control selector of the mock packs resolves and that
// each view resolves to the intended view. It also checks every pack's structure: English and Arabic text on every
// step, every step's control exists, the draft packs are flagged unverified, and the last step needs confirmation.
// It reads page STRUCTURE only (roles and names); it never types, clicks a final button, or reads a field value.
// Its page-state set-up (going to a wizard step, ticking a radio to reveal a section) acts on the MOCK page only.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import type { PageModel, SkillPack } from "../src/shared/types";
import { findControl } from "../src/shared/findControl";
import { resolveView } from "../backend/resolve";
import { mockIcp } from "./mock-icp";
import { mockUtilities } from "./mock-utilities";
import { mockBank } from "./mock-bank";
import { draftIcp, draftAddc, draftBank, draftInsurance } from "./draft-real-sites";

const BASE = process.env.PORTALS_BASE ?? "http://127.0.0.1:8793";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------- scenes: where each view lives on the mock portals, and how to reach it ----------
const go = (n: number) => `PortalWizard.go(${n});`;
const click = (id: string) => `document.getElementById('${id}').click();`;
type Scene = { path: string; js?: string };
const SCENES: Record<string, Record<string, Scene>> = {
  "mock-icp": {
    landing: { path: "/icp/" },
    signin: { path: "/icp/signin.html" },
    applicant: { path: "/icp/apply.html", js: go(1) },
    documents: { path: "/icp/apply.html", js: go(2) },
    visa: { path: "/icp/apply.html", js: go(3) + click("sp-employer") },
    "address-dialog": { path: "/icp/apply.html", js: go(4) + "for (const [i,v] of [['emirate','AD'],['area','x'],['street','x']]) document.getElementById(i).value=v;" + click("next") },
    address: { path: "/icp/apply.html", js: go(4) },
    declaration: { path: "/icp/apply.html", js: go(5) },
    payment: { path: "/icp/apply.html", js: go(6) }
  },
  "mock-utilities": {
    landing: { path: "/utilities/" },
    "premise-help": { path: "/utilities/apply.html", js: go(1) + click("premise-help") },
    premise: { path: "/utilities/apply.html", js: go(1) },
    holder: { path: "/utilities/apply.html", js: go(2) },
    meter: { path: "/utilities/apply.html", js: go(3) + click("m-yes") },
    payment: { path: "/utilities/apply.html", js: go(4) + click("pm-dd") },
    submit: { path: "/utilities/apply.html", js: go(5) }
  },
  "mock-bank": {
    landing: { path: "/bank/" },
    personal: { path: "/bank/apply.html", js: go(1) },
    employer: { path: "/bank/apply.html", js: go(2) },
    income: { path: "/bank/apply.html", js: go(3) + "const s=document.getElementById('b-source'); s.value='other'; s.dispatchEvent(new Event('change',{bubbles:true}));" },
    tax: { path: "/bank/apply.html", js: go(4) + click("tx-yes") },
    review: { path: "/bank/apply.html", js: go(5) }
  }
};

// ---------- headless browser (own minimal CDP client; kills only the process it started) ----------
function findBrowser(): string {
  const c = [process.env.BROWSER_PATH, "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Google/Chrome/Application/chrome.exe"].filter(Boolean) as string[];
  const p = c.find((x) => existsSync(x));
  if (!p) throw new Error("no Edge or Chrome found (set BROWSER_PATH)");
  return p;
}
async function launch() {
  const port = 9400 + Math.floor(Math.random() * 200);
  const child = spawn(findBrowser(), ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "rasikh-verify-"))}`, "about:blank"], { stdio: "ignore" });
  let targets: any[] = [];
  for (let i = 0; i < 60 && !targets.length; i++) {
    try { targets = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).filter((t: any) => t.type === "page"); } catch { await sleep(200); }
  }
  if (!targets.length) { child.kill(); throw new Error("browser debugging endpoint did not start"); }
  const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = () => res(null); ws.onerror = rej; });
  let id = 0; const pending = new Map<number, (m: any) => void>(); const loads: (() => void)[] = [];
  ws.onmessage = ({ data }) => { const m = JSON.parse(String(data)); if (m.id) pending.get(m.id)?.(m); else if (m.method === "Page.loadEventFired") loads.splice(0).forEach((f) => f()); };
  const send = (method: string, params: any = {}) => new Promise<any>((res, rej) => { const i = ++id; pending.set(i, (m) => (m.error ? rej(new Error(m.error.message)) : res(m.result))); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 1000, deviceScaleFactor: 1, mobile: false });
  return {
    async open(url: string) { await send("Page.navigate", { url: "about:blank" }); const l = new Promise<void>((r) => loads.push(r)); await send("Page.navigate", { url }); await l; },
    async eval(expression: string) {
      const { result, exceptionDetails } = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
      if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? "eval failed");
      return result.value;
    },
    close() { try { ws.close(); } catch { /* ignore */ } child.kill(); }
  };
}

// ---------- checks ----------
let failures = 0, checks = 0;
const fail = (msg: string) => { failures++; console.log("  FAIL " + msg); };
const ok = () => { checks++; };

function structural(pack: SkillPack) {
  const keys = new Set(Object.values(pack.views).flatMap((v) => v.controls.map((c) => c.key)));
  const mock = pack.status === "mock", draft = pack.status === "draft-unverified";
  if (!mock && !draft) fail(`${pack.id}: status must be "mock" or "draft-unverified", is ${pack.status}`); else ok();
  if (!pack.name || !pack.nameAr) fail(`${pack.id}: name and nameAr are required`); else ok();
  for (const t of pack.tasks) {
    if (!t.titleAr) fail(`${pack.id}/${t.id}: titleAr missing`); else ok();
    t.steps.forEach((s, i) => {
      const w = `${pack.id}/${t.id}/${s.id}`;
      for (const f of ["title", "titleAr", "instruction", "instructionAr", "tipAr"] as const) { if (!(s as any)[f]) fail(`${w}: ${f} missing`); else ok(); }
      if (!s.pitfalls?.length) fail(`${w}: pitfalls (what to double check) missing`); else ok();
      if (/[\u0600-\u06FF]/.test(s.instruction)) fail(`${w}: English instruction contains Arabic`); else ok();
      if (!/[\u0600-\u06FF]/.test(s.instructionAr ?? "")) fail(`${w}: Arabic instruction has no Arabic`); else ok();
      if (s.controlKey && !keys.has(s.controlKey)) fail(`${w}: controlKey "${s.controlKey}" is in no view`); else ok();
      if (draft && !/draft|not verified/i.test(s.instruction)) fail(`${w}: draft step lacks the visible caveat`); else ok();
      if (s.allowDemo) fail(`${w}: allowDemo must not be set (coach only)`); else ok();
      if (/\b(I will|I'll) (click|type|fill|press|submit)\b/i.test(s.instruction)) fail(`${w}: wording implies the guide acts`); else ok();
      if (i === t.steps.length - 1 && (s.risk !== "confirm" || !s.last)) fail(`${w}: last step must be risk confirm and last`); else ok();
    });
  }
  for (const [vk, v] of Object.entries(pack.views)) for (const c of [...v.controls, ...v.signature]) for (const l of c.selectors) {
    try { if (l.kind === "roleName") new RegExp(l.value.split("|").slice(1).join("|"), "i"); else if (l.kind === "textInRegion") new RegExp(l.value, "i"); ok(); } catch { fail(`${pack.id}/${vk}/${c.key}: invalid regex ${l.value}`); }
  }
}

async function liveCheck(pack: SkillPack, b: Awaited<ReturnType<typeof launch>>, bundle: string) {
  const scenes = SCENES[pack.id];
  let controls = 0, found = 0;
  for (const [viewKey, view] of Object.entries(pack.views)) {
    const sc = scenes[viewKey];
    if (!sc) { fail(`${pack.id}/${viewKey}: no scene defined in the verifier`); continue; }
    await b.open(BASE + sc.path + "?lang=en");
    await b.eval(bundle);
    if (sc.js) { await b.eval(`(()=>{${sc.js}})()`); await sleep(350); }
    const model: PageModel = await b.eval("JSON.parse(JSON.stringify(window.__perceive()))");
    const resolved = resolveView(model, pack);
    if (resolved !== viewKey) fail(`${pack.id}/${viewKey}: view resolved as "${resolved}" (expected "${viewKey}")`); else ok();
    for (const ctrl of view.controls) {
      controls++;
      const el = findControl(ctrl, model);
      if (!el) fail(`${pack.id}/${viewKey}/${ctrl.key}: no element found (${ctrl.selectors.map((s) => s.kind + ":" + s.value).join(" | ")})`);
      else { found++; ok(); }
    }
    // negative control: a selector that cannot exist must NOT resolve, or the checker proves nothing
    if (findControl({ key: "__bogus__", selectors: [{ kind: "roleName", value: "button|Nonexistent control zzq" }] }, model)) fail(`${pack.id}/${viewKey}: negative control resolved`); else ok();
    console.log(`  view ${viewKey.padEnd(15)} ${model.elements.length} elements perceived, ${view.controls.length} controls, resolved "${resolved}"`);
  }
  return { controls, found };
}

async function main() {
  const packs = [mockIcp, mockUtilities, mockBank, draftIcp, draftAddc, draftBank, draftInsurance];
  console.log("== structural checks ==");
  for (const p of packs) { const before = failures; structural(p); console.log(`  ${p.id}: ${failures === before ? "ok" : "FAILED"} (${p.status})`); }

  console.log("== live checks against the mock portals at " + BASE + " ==");
  const bundle = (await build({
    stdin: { contents: 'import { perceiveDom } from "./src/content/perception/build"; window.__perceive = perceiveDom;', resolveDir: ROOT, loader: "ts" },
    bundle: true, write: false, format: "iife", platform: "browser", target: "es2022"
  })).outputFiles[0].text;
  const b = await launch();
  let totalControls = 0, totalFound = 0;
  try {
    for (const p of [mockIcp, mockUtilities, mockBank]) {
      console.log(` ${p.id}`);
      const r = await liveCheck(p, b, bundle);
      totalControls += r.controls; totalFound += r.found;
    }
  } finally { b.close(); }
  console.log(`== result: ${checks} checks passed, ${failures} failed; ${totalFound}/${totalControls} mock-pack controls resolved on the live mock pages ==`);
  process.exit(failures ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
