// tests/fixtures/personal-data-page.ts
// A synthetic portal page full of personal-data VALUES. Every value is fake. The tests prove none of
// these strings ever appears in a page model, an outgoing request body or a log line.
export const SECRETS = {
  password: "Hunter2-Zebra!9",
  otp: "482913",
  card: "4111 1111 1111 1111",
  cardDigits: "4111111111111111",
  eid: "784-1990-1234567-1",
  passport: "P1234567",
  iban: "AE070331234567890123456",
  typedName: "Layla Al Mansoori",
  echoedHeadingId: "784-1985-7654321-0"
} as const;

export function mountPersonalDataPage(): void {
  document.title = "Mock portal: apply";
  document.body.innerHTML = `
    <h1>Application form (MOCK)</h1>
    <h2>Welcome ${SECRETS.echoedHeadingId}</h2>
    <form>
      <label for="nm">Full name</label>
      <input id="nm" type="text" value="${SECRETS.typedName}" required placeholder="As on passport" />
      <label for="pw">Password</label>
      <input id="pw" type="password" value="${SECRETS.password}" autocomplete="current-password" placeholder="${SECRETS.password}" />
      <label for="otp">One-time code</label>
      <input id="otp" type="text" inputmode="numeric" autocomplete="one-time-code" value="${SECRETS.otp}" />
      <label for="cc">Card number</label>
      <input id="cc" type="text" autocomplete="cc-number" value="${SECRETS.card}" />
      <label for="eid">Emirates ID number</label>
      <input id="eid" type="text" value="${SECRETS.eid}" placeholder="784-xxxx-xxxxxxx-x" />
      <label for="pp">Passport number</label>
      <input id="pp" type="text" value="${SECRETS.passport}" />
      <label for="ib">IBAN</label>
      <input id="ib" type="text" value="${SECRETS.iban}" />
      <div role="textbox" contenteditable="true" aria-label="Notes">${SECRETS.passport} typed note</div>
      <select id="emirate" aria-label="Emirate"><option>Abu Dhabi</option><option>Dubai</option></select>
      <button type="submit">Submit application</button>
    </form>`;
  // jsdom has no layout: give every element a size so perception treats it as visible
  (Element.prototype as any).getBoundingClientRect = function () {
    return { left: 0, top: 0, width: 120, height: 24, right: 120, bottom: 24, x: 0, y: 0, toJSON() {} };
  };
}
