# rasikh-portals

Three MOCK websites for the Rasikh browser-extension demo. Zero dependencies, Node 22, plain HTML, CSS and a little JS.

Every page carries a persistent banner: "MOCK PORTAL for the Rasikh demo, not a real government or bank site". Nothing is sent
anywhere, nothing is stored, and the final Submit button of each flow only opens a page saying "This is a mock; nothing was sent".
The bank name ("Dunes Bank") is made up. The server listens on 127.0.0.1 only and serves GET and HEAD only.

```
node server.mjs          # http://127.0.0.1:8793/   (PORTALS_PORT overrides the port)
npm test                 # server tests: routing, no traversal, banner on every page, no external resources
```

| Path | Flow |
| --- | --- |
| `/` | list of the three portals |
| `/icp/` | Emirates ID application: landing, mock "UAE PASS" sign in (accepts nothing real), then a 6-step wizard (applicant, photo and passport files, residency visa, delivery address with a confirm modal, declaration, payment and Submit) |
| `/utilities/` | open a water and power account: 5-step wizard (tenancy and premise with a help modal, holder, meter, payment, terms and Submit) |
| `/bank/` | open a current account: 5-step wizard (personal, employer letter file, source of income, tax-residence declaration, review and Submit) |

Patterns an extension has to cope with, on purpose: a step wizard whose steps are real DOM replacements (each step is a template
cloned into the page), modal `<dialog>` windows, a custom listbox (select-only combobox with keyboard support), a Continue or
Submit button that is disabled until a checkbox is ticked, sections inserted into the page after a choice (sponsor type,
direct debit, meter number, tax residence), file inputs, and English/Arabic toggling with RTL (`?lang=ar` or the toggle button;
the toggle is remembered in localStorage and the `rasikh-locale` cookie is honoured).

Deep links for tests: `apply.html#step-3` opens a wizard step directly (mock only; no validation of earlier steps).
Fields marked as personal data in the UI are the ones the extension must never read; they are ordinary inputs here.

Verified by `packages/rasikh-extension/skillpacks/packs.verify.ts` (the extension's own perception code against every page state).
