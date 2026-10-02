// Scenarios 1-5 and 8 on the three MOCK portals, in a real Chromium with the built unpacked extension.
// The harness is the PERSON: it types and clicks. The extension may only highlight, scroll and explain.
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import {
  Ext, SENTINELS, asPerson, foreignEvents, pageEvents, formSnapshot, pageMarkup, coachMark, rectOf, sleep, waitFor, PORTALS
} from "./helpers/ext";
import { Panel } from "./helpers/panel";
import { PORTAL_SCRIPTS, addSyntheticSensitiveFields, type PortalScript } from "./helpers/person";

test.describe.configure({ mode: "serial" });

let ext: Ext;
let panel: Panel;

test.beforeAll(async () => {
  ext = await Ext.launch();
  expect(await ext.grant()).toBe(true); // the person allows the mock portal origin, one site
  panel = await Panel.open(ext);
});
test.afterAll(async () => {
  await ext?.close();
});

/** True when the coach ring is on the target: the target's centre is inside the ring and the ring is not huge. */
async function ringOn(portal: import("@playwright/test").Page, selector: string) {
  const cm = await coachMark(portal);
  const r = await rectOf(portal, selector);
  if (!cm.ring || !r) return { ok: false, cm, r };
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  const inside = cx >= cm.ring.x && cx <= cm.ring.x + cm.ring.w && cy >= cm.ring.y && cy <= cm.ring.y + cm.ring.h;
  const small = cm.ring.w * cm.ring.h <= 4 * r.w * r.h + 60000;
  return { ok: inside && small, cm, r };
}

for (const script of PORTAL_SCRIPTS) {
  test(`walkthrough on the ${script.key} mock portal: guide advances, highlights the right control, never acts`, async () => {
    test.setTimeout(100_000);
    const byId = new Map(script.actions.map((a) => [a.id, a]));
    const portal = await ext.openPortal(script.start);
    await portal.bringToFront();
    await sleep(900);
    const typed: string[] = [];
    const trace: string[] = [];

    // the previous walkthrough leaves its guide on screen: the person stops it before choosing another
    if (await panel.step()) {
      await panel.stop();
      await sleep(600);
    }
    await panel.start(script.packName);
    let idleChecked = false;

    for (let i = 0; i < script.segments.length; i++) {
      const seg = script.segments[i];
      // the guide must be on step i and its coach mark must wrap the expected control
      const found = await waitFor(async () => {
        const s = await panel.step();
        if (!s || s.index !== i) return null;
        const on = await ringOn(portal, seg.expect);
        return on.ok ? { s, on } : null;
      }, 9000);
      const s = await panel.step();
      trace.push(`${i + 1}. ${seg.step}: panel "${s?.title}" idx=${s?.index} ring-on-${seg.expect}=${!!found}${seg.note ? " [" + seg.note + "]" : ""}`);
      await ext.shot(portal, `${script.key}-${String(i + 1).padStart(2, "0")}-${seg.step}`);
      expect(found, `step ${i + 1} (${seg.step}): coach mark should wrap ${seg.expect}; panel says ${JSON.stringify(s)}`).not.toBeNull();
      expect(found!.on.cm.tip, "the coach mark carries an explanation").toBeTruthy();

      // scenario 3: guidance alone changes nothing. Show the control again with no person action and compare.
      if (!idleChecked && i >= 1) {
        idleChecked = true;
        const before = await formSnapshot(portal);
        const markupBefore = await pageMarkup(portal);
        const eventsBefore = (await pageEvents(portal)).length;
        await sleep(1500);
        await panel.page.getByRole("button", { name: /Show me the control again/i }).click();
        await sleep(2000);
        expect(await formSnapshot(portal), "form values/state identical after guidance with no user action").toBe(before);
        expect(await pageMarkup(portal), "page markup identical after guidance with no user action").toBe(markupBefore);
        expect((await pageEvents(portal)).length, "guidance produced no page events at all").toBe(eventsBefore);
        trace.push("   idle check: formSnapshot, markup, event count identical after Show-me-again");
      }

      if (seg.step === "submit") {
        // scenario 4: the final control is highlighted and ready, the guide never presses it
        await sleep(2500);
        const ev = await pageEvents(portal);
        expect(ev.filter((e) => e.target === "#submit"), "no event reached #submit before the person acts").toEqual([]);
        expect(await portal.evaluate(() => location.pathname)).toContain("apply");
        expect(await portal.locator("#submit").isEnabled(), "Submit is enabled and ready").toBe(true);
        trace.push("   final Submit: highlighted, enabled, zero events on it after 2.5 s");
        // everything on this page so far was the person's: no script-made event before the final click
        const foreignBeforeSubmit = (await foreignEvents(portal)).filter((e) => e.type !== "change");
        expect(foreignBeforeSubmit, "no script-made click/keyboard/input/submit events before the person presses Submit").toEqual([]);
        await asPerson(portal, () => portal.click("#submit")); // the PERSON presses Submit
        // the page navigates to its "done" page, where the in-page event recorder starts empty, so the
        // person's click is proven by the navigation itself and the extension's by the checks above
        await portal.waitForURL(`**${script.doneUrl}`, { timeout: 5000 });
        break;
      }

      for (const aid of seg.actions) {
        const a = byId.get(aid)!;
        await a.run(portal);
        if (a.typed) typed.push(...a.typed);
      }
      await sleep(250);
      await panel.next(); // the person presses "I did this, next step" in the panel
    }

    // nothing the extension did was a script-made input or click on the page
    const foreign = (await foreignEvents(portal)).filter((e) => e.type !== "change");
    expect(foreign, "no script-made click/keyboard/input/submit events on the page during the whole walkthrough").toEqual([]);
    fs.mkdirSync("test-results", { recursive: true });
    fs.writeFileSync(`test-results/e2e-trace-${script.key}.txt`, trace.join("\n") + "\n");

    // scenario 5 (portal values): none of the values typed in this walkthrough left the page via the extension
    const all = await ext.everythingSent([panel.page]);
    for (const v of [...new Set([...typed, SENTINELS.password, SENTINELS.emiratesId, SENTINELS.passport, SENTINELS.iban])]) {
      if (typed.includes(v)) expect(all.includes(v), `typed value "${v}" must not appear in any message, request or storage`).toBe(false);
    }
    await portal.close();
    if (await panel.step()) await panel.stop().catch(() => undefined);
  });
}

test("sensitive fields: one-time code, card, password, EID, passport never appear in messages, requests, storage or the backend log", async () => {
  test.setTimeout(120_000);
  const portal = await ext.openPortal("/bank/apply.html");
  await portal.bringToFront();
  await panel.start(PORTAL_SCRIPTS[2].packName);
  await sleep(2500);
  await addSyntheticSensitiveFields(portal);
  await asPerson(portal, async () => {
    await portal.click("#syn-otp"); await portal.keyboard.type(SENTINELS.otp);
    await portal.click("#syn-card"); await portal.keyboard.type(SENTINELS.card);
    await portal.click("#b-eid"); await portal.keyboard.type(SENTINELS.emiratesId);
    await portal.click("#b-name"); await portal.keyboard.type(SENTINELS.fullName);
  });
  // make the extension perceive the page again with the sensitive values present
  await panel.page.getByRole("button", { name: /Show me the control again/i }).click();
  await sleep(2500);
  await panel.next();
  await sleep(2000);
  await ext.shot(portal, "sensitive-fields-typed");
  const all = await ext.everythingSent([panel.page]);
  const secrets = [SENTINELS.otp, SENTINELS.card, SENTINELS.emiratesId, SENTINELS.fullName, SENTINELS.password, SENTINELS.passport];
  for (const v of secrets) expect(all.includes(v), `"${v}" must not appear in spy log, network bodies, panel log or storage`).toBe(false);
  const log = process.env.E2E_BACKEND_LOG;
  if (log && fs.existsSync(log)) {
    const text = fs.readFileSync(log, "utf8");
    for (const v of secrets) expect(text.includes(v), `"${v}" must not appear in the backend log`).toBe(false);
  } else {
    test.info().annotations.push({ type: "note", description: "backend log not available (backend not started by this run): log scan skipped" });
  }
  // what the extension DID describe for the sensitive fields: label only
  const turnBodies = ext.requests.filter((r) => /\/agent\/turn/.test(r.url) && r.body).map((r) => r.body as string);
  expect(turnBodies.length, "the guide asked the local backend for turns").toBeGreaterThan(0);
  const model = turnBodies.at(-1)!;
  expect(model).not.toMatch(/"value"\s*:/);
  await portal.close();
});

test("default mode: nothing leaves the machine and there are no console errors", async () => {
  const hosts = new Set<string>();
  for (const r of ext.requests) {
    try {
      const u = new URL(r.url);
      if (u.protocol === "chrome-extension:" || u.protocol === "data:" || u.protocol === "blob:" || u.protocol === "about:") continue;
      hosts.add(u.host);
    } catch { /* ignore */ }
  }
  const allowed = new Set(["127.0.0.1:8793", "localhost:8793", `localhost:${process.env.E2E_BACKEND_PORT ?? "8796"}`, `127.0.0.1:${process.env.E2E_BACKEND_PORT ?? "8796"}`]);
  const outside = [...hosts].filter((h) => !allowed.has(h));
  expect(outside, "every request stayed on loopback (portals and the local guide backend)").toEqual([]);
  const errs = ext.consoleErrors.filter((e) => !/favicon/.test(e));
  expect(errs, "no console errors").toEqual([]);
  expect(ext.pageErrors, "no uncaught page errors").toEqual([]);
  expect(PORTALS).toContain("127.0.0.1");
});
