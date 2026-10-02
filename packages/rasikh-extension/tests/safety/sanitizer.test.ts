// tests/safety/sanitizer.test.ts
// Product rule 2: NEVER read or transmit field VALUES. A fixture page holds a password, an OTP, a
// card, an Emirates ID and a passport number as values. None may appear in the page model, in the
// outgoing request body, in the backend prompt serialization, or in any log line.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { perceiveDom } from "../../src/content/perception/build";
import { mountPersonalDataPage, SECRETS } from "../fixtures/personal-data-page";
import { sanitizeServerSide, serializePageModel } from "../../backend/sanitize";
import { logTurn, TURN_LOGS } from "../../backend/log";
import { postTurn } from "../../src/background/orchestratorClient";
import { scrubText } from "../../src/shared/scrub";

const needles = Object.values(SECRETS).filter((v) => v.length > 4);
function expectClean(text: string) {
  for (const n of needles) expect(text, `leaked ${n}`).not.toContain(n);
}

beforeEach(() => mountPersonalDataPage());
afterEach(() => vi.restoreAllMocks());

describe("perception drops values", () => {
  it("the page model contains none of the secret values", () => {
    const model = perceiveDom();
    expect(model.elements.length).toBeGreaterThan(5);
    expectClean(JSON.stringify(model));
  });
  it("no element carries a value property", () => {
    const model = perceiveDom();
    for (const e of model.elements) expect("value" in e).toBe(false);
  });
  it("personal-data fields are flagged sensitive and described by label only", () => {
    const model = perceiveDom();
    const byName = (re: RegExp) => model.elements.find((e) => re.test(e.name))!;
    for (const re of [/password/i, /one-time/i, /card number/i, /emirates id/i, /passport number/i, /iban/i]) {
      const e = byName(re);
      expect(e, String(re)).toBeTruthy();
      expect(e.sensitive).toBe(true);
      expect(e.placeholder).toBeUndefined();
      expect(e.inputType).toBeUndefined();
      expect(e.required).toBeUndefined();
    }
  });
  it("non-sensitive fields keep structure: type, required, placeholder", () => {
    const model = perceiveDom();
    const sel = model.elements.find((e) => /emirate$/i.test(e.name))!;
    expect(sel.inputType).toBe("select");
  });
  it("a contenteditable's typed text is never used as its name", () => {
    const model = perceiveDom();
    const notes = model.elements.find((e) => e.name === "Notes")!;
    expect(notes).toBeTruthy();
    expectClean(JSON.stringify(notes));
  });
  it("a personal number echoed into a heading is masked", () => {
    const model = perceiveDom();
    expect(model.salientText).not.toContain(SECRETS.echoedHeadingId);
    expect(model.salientText).toContain("[id]");
  });
  it("the page url carries no query string or fragment", () => {
    expect(perceiveDom().url).not.toMatch(/[?#]/);
  });
});

describe("nothing leaves the browser with a value", () => {
  it("outgoing request body to the backend has no secret", async () => {
    const model = perceiveDom();
    let sent = "";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_u: string, init: any) => {
        sent = String(init.body);
        return { ok: false, body: null } as any;
      })
    );
    await postTurn({
      sessionId: "local",
      turnId: "t1",
      skill: "placeholder-portal",
      objective: "demo-walkthrough",
      mode: "guide",
      step: 0,
      pageModel: model,
      history: [],
      learnerSnapshot: { level: "beginner", taskMastery: {} }
    }).catch(() => undefined);
    expect(sent.length).toBeGreaterThan(100);
    expectClean(sent);
    vi.unstubAllGlobals();
  });

  it("the backend drops a value even if a tampered client sends one", () => {
    const model: any = perceiveDom();
    model.elements[0].value = SECRETS.password;
    model.elements[1].value = SECRETS.eid;
    model.elements[2].placeholder = SECRETS.card;
    const clean = sanitizeServerSide(model);
    expectClean(JSON.stringify(clean));
    expectClean(serializePageModel(clean));
  });

  it("logs and console output contain no secret", async () => {
    process.env.LOG_TURNS = "true";
    const spy = vi.spyOn(console, "debug").mockImplementation(() => undefined);
    const model = perceiveDom();
    await logTurn(
      { turnId: "t", skill: "s", objective: "o", step: 0, pageModel: model } as any,
      `Please enter ${SECRETS.eid} and ${SECRETS.card}`,
      { type: "explain", risk: "safe" }
    );
    expectClean(spy.mock.calls.flat().join(" "));
    expectClean(JSON.stringify(TURN_LOGS));
    delete process.env.LOG_TURNS;
  });

  it("scrubText masks Emirates ID, card, IBAN, passport and OTP-like numbers", () => {
    const s = scrubText(`${SECRETS.eid} ${SECRETS.card} ${SECRETS.iban} ${SECRETS.passport} ${SECRETS.otp}`);
    expectClean(s);
  });
});
