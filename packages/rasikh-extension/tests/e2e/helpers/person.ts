// The harness acting as THE PERSON on the three mock portals. The extension never does any of this.
// Every action is tagged me=true in the page recorder, so anything the extension did would stand out.
import type { Page } from "@playwright/test";
import { asPerson, SENTINELS } from "./ext";

export interface PersonAction {
  /** short name for logs */
  id: string;
  /** CSS selector of the control the person is about to use: the guide's coach mark should be on it */
  target: string;
  /** values typed in this action, for the sensitive-data scan */
  typed?: string[];
  run: (p: Page) => Promise<void>;
}

const fakeFile = (name: string, mime: string) => ({ name, mimeType: mime, buffer: Buffer.from("%PDF-1.4 mock file, no personal data") });

const type = (sel: string, text: string): PersonAction["run"] => (p) =>
  asPerson(p, async () => {
    await p.click(sel); // a real click then real key presses: trusted events, the way a person types
    await p.keyboard.type(text, { delay: 5 });
  });
const fill = (sel: string, v: string): PersonAction["run"] => (p) => asPerson(p, () => p.fill(sel, v));
const click = (sel: string): PersonAction["run"] => (p) => asPerson(p, () => p.click(sel));
const select = (sel: string, v: string): PersonAction["run"] => (p) => asPerson(p, async () => void (await p.selectOption(sel, v)));
const upload = (sel: string, name: string, mime: string): PersonAction["run"] => (p) =>
  asPerson(p, () => p.setInputFiles(sel, fakeFile(name, mime)));
const listbox = (combo: string, option: string): PersonAction["run"] => (p) =>
  asPerson(p, async () => {
    await p.click(combo);
    await p.click(option);
  });

/** One guide step: the control the coach mark must wrap, then what the person does before pressing "I did this, next step". */
export interface Segment {
  step: string;
  expect: string;
  actions: string[];
  note?: string;
}

export interface PortalScript {
  segments: Segment[];
  packName: RegExp;
  key: "icp" | "utilities" | "bank";
  /** the page where the guide starts */
  start: string;
  /** the page the wizard is on */
  wizard: string;
  actions: PersonAction[];
  /** the final submit control: the guide must point at it and must never press it */
  submit: string;
  /** actions that make the Submit button ready, then the person presses it */
  doneUrl: string;
}

export const bank: PortalScript = {
  key: "bank",
  packName: /Open a current account .MOCK bank./,
  segments: [
    { step: "start", expect: "#start-link", actions: ["start-link"] },
    { step: "personal", expect: "#b-name", actions: ["name", "dob", "eid", "mobile", "email", "next-1"] },
    { step: "employer", expect: "#b-employer", actions: ["employer"] },
    { step: "letter", expect: "#b-letter", actions: ["letter", "next-2"] },
    { step: "income", expect: "#b-source", actions: ["source", "source-desc"], note: "dynamic section appears after choosing Something else" },
    { step: "range", expect: "#b-range", actions: ["range", "next-3"], note: "custom listbox" },
    { step: "tax", expect: "#tx-no", actions: ["tax-yes", "tax-country", "tin"], note: "dynamic section" },
    { step: "fatca-confirm", expect: "#b-fatca-ok", actions: ["fatca-ok", "next-4"] },
    { step: "terms", expect: "#b-terms-open", actions: ["terms-open", "terms-close"], note: "modal dialog" },
    { step: "agree", expect: "#b-agree", actions: ["agree"] },
    { step: "submit", expect: "#submit", actions: [], note: "final control: the guide points, the person presses" }
  ],
  start: "/bank/",
  wizard: "/bank/apply.html",
  submit: "#submit",
  doneUrl: "/bank/done.html",
  actions: [
    { id: "start-link", target: "#start-link", run: click("#start-link") },
    { id: "name", target: "#b-name", typed: [SENTINELS.fullName], run: type("#b-name", SENTINELS.fullName) },
    { id: "dob", target: "#b-dob", run: fill("#b-dob", "1990-05-17") },
    { id: "eid", target: "#b-eid", typed: [SENTINELS.emiratesId], run: type("#b-eid", SENTINELS.emiratesId) },
    { id: "mobile", target: "#b-mobile", typed: [SENTINELS.mobile], run: type("#b-mobile", SENTINELS.mobile) },
    { id: "email", target: "#b-email", typed: [SENTINELS.email], run: type("#b-email", SENTINELS.email) },
    { id: "next-1", target: "#next", run: click("#next") },
    { id: "employer", target: "#b-employer", typed: [SENTINELS.employer], run: type("#b-employer", SENTINELS.employer) },
    { id: "letter", target: "#b-letter", run: upload("#b-letter", "salary-certificate.pdf", "application/pdf") },
    { id: "next-2", target: "#next", run: click("#next") },
    { id: "source", target: "#b-source", run: select("#b-source", "other") },
    { id: "source-desc", target: "#b-source-desc", typed: ["Freelance work sentinel"], run: type("#b-source-desc", "Freelance work sentinel") },
    { id: "range", target: "#b-range", run: listbox("#b-range", "#r-2") },
    { id: "next-3", target: "#next", run: click("#next") },
    { id: "tax-yes", target: "#tx-yes", run: click("#tx-yes") },
    { id: "tax-country", target: "#b-tax-country", typed: ["Sentinelland"], run: type("#b-tax-country", "Sentinelland") },
    { id: "tin", target: "#b-tin", typed: ["TIN-5550142"], run: type("#b-tin", "TIN-5550142") },
    { id: "fatca-ok", target: "#b-fatca-ok", run: click("#b-fatca-ok") },
    { id: "next-4", target: "#next", run: click("#next") },
    { id: "terms-open", target: "#b-terms-open", run: click("#b-terms-open") },
    { id: "terms-close", target: "#dlg-terms [data-close]", run: click("#dlg-terms [data-close]") },
    { id: "agree", target: "#b-agree", run: click("#b-agree") }
  ]
};

export const utilities: PortalScript = {
  key: "utilities",
  packName: /Open a utilities account .MOCK portal./,
  segments: [
    { step: "start", expect: "#start-link", actions: ["start-link"] },
    { step: "tenancy", expect: "#tenancy-no", actions: ["tenancy"] },
    { step: "premise", expect: "#premise-no", actions: ["premise", "premise-help", "premise-close"], note: "modal dialog" },
    { step: "premise-type", expect: "#ptype", actions: ["ptype", "next-1"], note: "custom listbox" },
    { step: "holder", expect: "#holder-name", actions: ["holder", "holder-id", "holder-phone", "next-2"] },
    { step: "meter-type", expect: "#meter-type", actions: ["meter-type", "meter-yes", "meter-no", "next-3"], note: "dynamic section" },
    { step: "payment", expect: "#pm-dd", actions: ["pay-debit", "iban", "next-4"], note: "dynamic section" },
    { step: "terms", expect: "#terms-open", actions: ["terms-open", "terms-close"], note: "modal dialog" },
    { step: "agree", expect: "#agree-terms", actions: ["agree"] },
    { step: "submit", expect: "#submit", actions: [], note: "final control" }
  ],
  start: "/utilities/",
  wizard: "/utilities/apply.html",
  submit: "#submit",
  doneUrl: "/utilities/done.html",
  actions: [
    { id: "start-link", target: "#start-link", run: click("#start-link") },
    { id: "tenancy", target: "#tenancy-no", typed: ["TEN-2024-77123"], run: type("#tenancy-no", "TEN-2024-77123") },
    { id: "premise", target: "#premise-no", typed: ["1234567890"], run: type("#premise-no", "1234567890") },
    { id: "premise-help", target: "#premise-help", run: click("#premise-help") },
    { id: "premise-close", target: "#dlg-premise [data-close]", run: click("#dlg-premise [data-close]") },
    { id: "ptype", target: "#ptype", run: listbox("#ptype", "#pt-apt") },
    { id: "next-1", target: "#next", run: click("#next") },
    { id: "holder", target: "#holder-name", typed: [SENTINELS.fullName], run: type("#holder-name", SENTINELS.fullName) },
    { id: "holder-id", target: "#holder-id", typed: [SENTINELS.emiratesId], run: type("#holder-id", SENTINELS.emiratesId) },
    { id: "holder-phone", target: "#holder-phone", typed: [SENTINELS.mobile], run: type("#holder-phone", SENTINELS.mobile) },
    { id: "next-2", target: "#next", run: click("#next") },
    { id: "meter-type", target: "#meter-type", run: select("#meter-type", "both") },
    { id: "meter-yes", target: "#m-yes", run: click("#m-yes") },
    { id: "meter-no", target: "#meter-no", typed: ["MTR-0098123"], run: type("#meter-no", "MTR-0098123") },
    { id: "next-3", target: "#next", run: click("#next") },
    { id: "pay-debit", target: "#pm-dd", run: click("#pm-dd") },
    { id: "iban", target: "#iban", typed: [SENTINELS.iban], run: type("#iban", SENTINELS.iban) },
    { id: "next-4", target: "#next", run: click("#next") },
    { id: "terms-open", target: "#terms-open", run: click("#terms-open") },
    { id: "terms-close", target: "#dlg-terms [data-close]", run: click("#dlg-terms [data-close]") },
    { id: "agree", target: "#agree-terms", run: click("#agree-terms") }
  ]
};

export const icp: PortalScript = {
  key: "icp",
  packName: /Emirates ID application .MOCK portal./,
  segments: [
    { step: "signin", expect: "#signin-link", actions: ["start-link", "signin-user", "signin-pin", "signin-continue"] },
    { step: "applicant", expect: "#full-name", actions: ["full-name", "dob"] },
    { step: "nationality", expect: "#nat", actions: ["nat", "passport", "mobile"], note: "custom listbox" },
    { step: "next-1", expect: "#next", actions: ["next-1"] },
    { step: "photo", expect: "#photo-file", actions: ["photo"] },
    { step: "passport-copy", expect: "#passport-file", actions: ["passport-file", "next-2"] },
    { step: "visa", expect: "#visa-file-no", actions: ["visa-no", "visa-expiry"] },
    { step: "sponsor", expect: "#sp-employer", actions: ["sponsor", "est-no", "next-3"], note: "dynamic section" },
    { step: "address", expect: "#emirate", actions: ["emirate", "area", "street", "next-4"] },
    { step: "address-confirm", expect: "#dlg-address [data-close=confirm]", actions: ["address-confirm"], note: "modal dialog" },
    { step: "declaration", expect: "#declare", actions: ["declare", "next-5"] },
    { step: "payment", expect: "#pay-online", actions: ["pay"] },
    { step: "submit", expect: "#submit", actions: [], note: "final control" }
  ],
  start: "/icp/",
  wizard: "/icp/apply.html",
  submit: "#submit",
  doneUrl: "/icp/done.html",
  actions: [
    { id: "start-link", target: "#signin-link", run: click("#signin-link") },
    { id: "signin-user", target: "#uaepass-user", typed: ["sentinel.user"], run: type("#uaepass-user", "sentinel.user") },
    { id: "signin-pin", target: "#uaepass-pin", typed: [SENTINELS.password], run: type("#uaepass-pin", SENTINELS.password) },
    { id: "signin-continue", target: "#signin-continue", run: click("#signin-continue") },
    { id: "full-name", target: "#full-name", typed: [SENTINELS.fullName], run: type("#full-name", SENTINELS.fullName) },
    { id: "dob", target: "#dob", run: fill("#dob", "1990-05-17") },
    { id: "nat", target: "#nat", run: listbox("#nat", "#nat-in") },
    { id: "passport", target: "#passport-no", typed: [SENTINELS.passport], run: type("#passport-no", SENTINELS.passport) },
    { id: "mobile", target: "#mobile", typed: [SENTINELS.mobile], run: type("#mobile", SENTINELS.mobile) },
    { id: "next-1", target: "#next", run: click("#next") },
    { id: "photo", target: "#photo-file", run: upload("#photo-file", "photo.png", "image/png") },
    { id: "passport-file", target: "#passport-file", run: upload("#passport-file", "passport.pdf", "application/pdf") },
    { id: "next-2", target: "#next", run: click("#next") },
    { id: "visa-no", target: "#visa-file-no", typed: ["VF-2024-5550123"], run: type("#visa-file-no", "VF-2024-5550123") },
    { id: "visa-expiry", target: "#visa-expiry", run: fill("#visa-expiry", "2027-01-31") },
    { id: "sponsor", target: "#sp-employer", run: click("#sp-employer") },
    { id: "est-no", target: "#est-no", typed: ["EST-5550999"], run: type("#est-no", "EST-5550999") },
    { id: "next-3", target: "#next", run: click("#next") },
    { id: "emirate", target: "#emirate", run: select("#emirate", "AD") },
    { id: "area", target: "#area", typed: ["Sentinel Area"], run: type("#area", "Sentinel Area") },
    { id: "street", target: "#street", typed: ["Sentinel Street 12"], run: type("#street", "Sentinel Street 12") },
    { id: "next-4", target: "#next", run: click("#next") }, // opens the confirm-address modal
    { id: "address-confirm", target: "#dlg-address [data-close=confirm]", run: click("#dlg-address [data-close=confirm]") },
    { id: "declare", target: "#declare", run: click("#declare") },
    { id: "next-5", target: "#next", run: click("#next") },
    { id: "pay", target: "#pay-online", run: click("#pay-online") }
  ]
};

export const PORTAL_SCRIPTS = [icp, utilities, bank];

/** Add the sensitive fields the mock portals do not have (one-time code, card number) so the redaction is tested on them too. */
export async function addSyntheticSensitiveFields(page: Page): Promise<void> {
  await page.evaluate(() => {
    const host = document.querySelector("form") ?? document.body;
    const wrap = document.createElement("div");
    wrap.id = "synthetic-sensitive";
    wrap.className = "field";
    wrap.innerHTML =
      '<label for="syn-otp">One-time code (synthetic test field)</label>' +
      '<input id="syn-otp" name="otp" type="text" inputmode="numeric" autocomplete="one-time-code">' +
      '<label for="syn-card">Card number (synthetic test field)</label>' +
      '<input id="syn-card" name="cardNumber" type="text" inputmode="numeric" autocomplete="cc-number">';
    host.appendChild(wrap);
  });
}
