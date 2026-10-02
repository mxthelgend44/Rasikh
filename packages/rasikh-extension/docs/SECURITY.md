# Rasikh Guide: threat model and permission review

Status: DRAFT for a hackathon prototype, written against the code in this package. Where a line says
**tested**, a named test covers it. Where it says **not covered**, nothing checks it yet. Nothing here
claims the extension "cannot fail or leak". It says what is enforced and what is tested.

## 1. Scope and stance

Rasikh Guide helps a person through a website that has no API. The design choice that matters most is
**coach, do not do**: the extension may highlight, scroll to and explain controls, and the person does
every action. Three rules follow from it:

1. The extension has **no mutating action**: no click, type, select, submit or navigate on the page.
2. The extension **never reads or sends a field value**, only structure.
3. Host access is **optional, per site, granted by the person, revocable**. (Section 9 records where
   the current build falls short of this rule.)

If rule 1 holds, an attacker who controls everything the guide "decides" (a hostile page, a tampered
skillpack, a manipulated model) can at worst show the person a misleading explanation or highlight the
wrong control. They cannot make the extension press anything. That caps the damage. It does not make
it zero: a misleading highlight on a real site could still lead a person to press the wrong button
(attack A9).

This document is not a penetration test or a third-party audit, and it says nothing about any real
government or bank site. Guidance for real sites is draft and unverified against the live sites. The
live demo runs on local MOCK portals only.

## 2. Assets and actors

| Asset | Why it matters |
| --- | --- |
| Field values the person types (names, IDs, passport, IBAN, card, passwords, one-time codes) | Personal and financial data. Must never be read by the extension. |
| Page structure (labels, headings, origin and path) | Shows which service the person is using. Stays in the browser, or on loopback, by default. |
| The person's logged-in session on a site | The extension must not be a way to act inside it. |
| Per-site grants | Define where the extension may run at all. |
| Skillpacks | Tell the person what to do on a site. Tampering misleads people. |

| Actor | Assumed capability |
| --- | --- |
| Hostile or compromised page on a site where the guide runs | Controls DOM text, attributes, hidden elements, frames, and script in the page's own world. |
| Lookalike or phishing page | Imitates a real portal; may embed a password prompt in a frame. |
| Hostile web page or process reaching the local backend | Can send requests to `127.0.0.1:8796` from the browser or the machine. |
| Network attacker, or hostile backend URL | Can observe or answer requests the extension makes. |
| Tampered skillpack or package | Controls skillpack data: selectors, text, domains. |
| Another extension or web page messaging this extension | Can try to send runtime messages. |
| Supply-chain attacker | Controls a dependency. |

Out of scope: a compromised browser or operating system, a malicious extension with broader
permissions, and a person who is socially engineered into disabling protections.

## 3. Permission review (manifest.json)

Every entry in `manifest.json` as of this writing, with its justification and what breaks without it.
The extension does not use `identity`, `debugger`, `alarms`, `offscreen`, `tabs`, `cookies`,
`webRequest`, `history`, `downloads` or `clipboard*`. Tested: `tests/unit/manifest.test.ts` (exact
permission list, host lists, CSP string, no `externally_connectable`) and
`tests/safety/rasikh-static.test.ts` ("has no debugger permission", "has no identity permission",
"asks for nothing beyond the small allowlist").

| Entry | Justification | Without it | Review note |
| --- | --- | --- | --- |
| `permissions: storage` | `chrome.storage.session` holds the current guide state (skill, step, last guidance lines); `chrome.storage.local` holds the language choice. | The service worker sleeps and forgets the step; language not remembered. | Nothing from the page is stored. Not covered by a test. |
| `permissions: sidePanel` | The side panel is the guide's UI. | No UI. | None. |
| `permissions: scripting` | `registerContentScripts`, `unregisterContentScripts` and `executeScript` in `src/background/sites.ts`: the content script is registered for one granted origin and injected into tabs already open on it. | The guide could not run on any site. | Used only with a file (`content.js`), never a code string. A source scan forbids `executeScript` with `func`. |
| `permissions: activeTab` | No code relies on it (a source search finds only a helper named `activeTab` in `loop.ts`). | Nothing breaks. | **Candidate for removal.** `tests/unit/manifest.test.ts` pins the exact permission list, so change it there too. |
| `host_permissions: http://localhost:8796/*`, `http://127.0.0.1:8796/*` | The worker's `fetch` to the local guide backend. | The guide cannot get its steps. | Granted at install, loopback only. Better as an optional permission requested when the backend is first needed (finding F2). |
| `optional_host_permissions: http://localhost:8793/*`, `http://127.0.0.1:8793/*` | The mock portals used in the demo. | Mock portals cannot be granted. | Requested at runtime for one origin. |
| `optional_host_permissions: https://*/*` | The ceiling that lets the person grant any real website later. | The person could not grant a site that is not pre-listed. | A ceiling, not a grant. Code requests one exact scheme-and-host pattern at a time (`originPattern` in `src/background/sites.ts`), from a click in the panel or settings page. |
| `content_scripts` | **None declared, on purpose.** | n/a | A static entry is injected with no grant even when its match is also optional (finding F1, now fixed). The built `content.js` is registered per granted origin by `sites.ts` and unregistered on revoke. |
| `content_security_policy.extension_pages` | `script-src 'self'; object-src 'self'; base-uri 'none'; connect-src 'self' http://localhost:8796 http://127.0.0.1:8796`. | n/a | No inline script, no `eval`, no remote script, connections only to itself and the local backend. Tested: `rasikh-static.test.ts` ("is strict", "limits connections"). |
| `side_panel`, `action`, `options_page`, `icons` | UI entry points. | No UI. | None. |
| `web_accessible_resources` | None declared, and none in the built `dist/manifest.json` (checked on the build present when this was written). | n/a | The Eduverse build had bundler-added entries that let a matched site detect the extension. Removing the static content script removed them. `rasikh-static.test.ts` reads the source manifest, not `dist/`, so re-read `dist/manifest.json` after each build. |

Removed from the Eduverse source: `identity` (sign-in), `debugger` (synthetic input and the accessibility
tree), `alarms` (token refresh), `offscreen` (screenshots), the hosted API host, and the three
hard-coded sites. Each removal also removes a capability: no screenshots, no synthetic input, no tokens.

## 4. What the extension can see, and what it can never see

Can see (structure only), for the tab where the guide is running and only when asked:

- for each visible interactive element: role, accessible name (from `aria-labelledby`, `aria-label`, a
  `<label>`, `title`, the visible text of non-form elements, or an image `alt`), state (disabled,
  checked for checkbox and radio, expanded, selected, focused), position, size, offscreen flag;
- for non-personal form fields: input type, whether required, and placeholder text (80 characters);
- headings (`h1` to `h3`, `role=heading`; up to 8, 400 characters), the page title, and the page
  **origin and path** (no query string, no fragment);
- all of the above text is passed through a pattern scrubber (`src/shared/scrub.ts`) that masks
  Emirates-ID-like, card-like, IBAN-like, passport-like and long digit runs.

Never read, by design: field values and typed text; password, one-time-code, card, Emirates ID,
passport, IBAN, phone, email and date-of-birth fields beyond their label (no type, no placeholder, no
required flag); file names or contents; cookies, local storage, history, network traffic, other tabs,
the clipboard; screenshots (no capture code); the contents of cross-origin frames (opaque to the content
script); closed shadow roots; any page where the guide has not been started.

Enforced and tested: `tests/safety/sanitizer.test.ts` mounts a synthetic page with fake password, OTP,
card, Emirates ID, passport and IBAN values and checks that none appears in the page model, in the
outgoing request body, in the backend prompt text, or in the turn log; that contenteditable text is not
used as a name; that an ID echoed into a heading is masked; that the URL has no query or fragment.
`tests/safety/rasikh-static.test.ts` fails if content code reads `.value`.

Honest limits:

- The scrubber is pattern-based. A value that does not look like one of the patterns is not masked.
- Names and headings are page-supplied text. A page can print personal data into a label or heading.
- The accessible name can include text a page chooses to render next to a control. **Finding F5**: for a
  custom combobox whose `aria-labelledby` points at the element that displays the current choice (the
  mock bank's income-range control does this), `src/content/perception/name.ts` includes that displayed
  choice in the name. That is a selected value, not typed text, but it is a value. Not covered by a test.
- The path part of the URL is not scrubbed (finding F6).

## 5. Data flow

```
 page DOM (a tab where the guide is active)
    |  [1] reads structure only; no values
    v
 content script (isolated world)  -- PageModel -->  [2] chrome.runtime message  -->  service worker
    ^                                                                                     |
    |  [6] highlight / scrollTo / clearOverlays                                           | [3] fetch POST http://localhost:8796/agent/turn
    |      (only non-mutating actions exist)                                              |     body: PageModel, step index, language,
    +-------------------------------<-------------------------------------------------- +     last 6 guidance lines
                                                                                          v
                                                                              local guide backend (127.0.0.1:8796)
                                                                                          |
                                      default: deterministic demo planner, NO further network call
                                      optional: ANTHROPIC_KEY set -> [4] HTTPS to the model provider
                                                                                          |
              guidance text + one validated non-mutating action  <------------------------+
                          |
                          v
        service worker -- [5] Port / runtime messages --> side panel (English or Arabic)
```

| # | Boundary | Default offline (demo) mode | Optional AI mode |
| --- | --- | --- | --- |
| 1 | page to content script | DOM structure read. No values. | Same. |
| 2 | content script to worker | The page model (section 4). Stays in the browser. | Same. |
| 3 | worker to local backend | **The page model is sent to the backend even in demo mode.** It leaves the browser process but not the machine (loopback). If the backend is not running the guide reports `NETWORK_ERROR`, and the panel launcher cannot list guides (it also calls `/skills`). The panel's own wording is "Offline and deterministic. Nothing leaves this computer.", which matches this, not "nothing leaves the browser". | Same. |
| 4 | backend to model provider | **Nothing.** The demo planner makes no network call. | The system prompt, the step text, and the serialised page (origin and path, headings, element roles and names, states) go to `https://api.anthropic.com`. Selected by the presence of `ANTHROPIC_KEY` in the backend's environment (`backend/provider.ts`). |
| 5 | worker to panel | Guidance text, step info, a provider label (`demo` or `AI`). | Same; the panel labels the AI path. |
| 6 | worker to content script | One validated action: `highlight`, `scrollTo`, `clearOverlays` and teaching-only types. | Same. A model cannot add a mutating action (section 6). |
| 7 | persistence | `chrome.storage.session`: skill id, step index, up to 40 guidance lines. `chrome.storage.local`: language. | Same. |

Two statements the product rules make, and what the current build actually does:

- "Nothing leaves the browser in the default mode": **not literally true.** In the current build the
  worker always posts the structure-only model to the loopback backend (boundary 3). The accurate
  statement is: in the default mode nothing leaves **your machine**. Moving the demo planner into the
  service worker would make the literal statement true. Recorded as finding F3.
- "Optional LLM path off by default": true only while `ANTHROPIC_KEY` is absent from the backend's
  environment. A key exported in the shell for other work turns it on silently apart from a console line
  and the panel label. Recorded as finding F4. For demos set `MODEL_PROVIDER=demo` or unset the key.

## 6. Prompt injection: page text is data, never instructions

- **The offline planner does not read page text as instructions.** `backend/modelDemo.ts` picks the
  current skillpack step, finds the matching control by role and name, and shows the skillpack's own
  authored text. A hostile page can change which control matches (for example by renaming a button). It
  cannot change what the guide says.
- **In the AI path** page text enters the prompt in a block marked untrusted, and the system prompt says
  to treat it as data. That is a mitigation, not a guarantee. The cap is structural: the only actions
  that exist are `explain`, `highlight`, `ask`, `checkUnderstanding`, `scrollTo`, `waitFor`. The backend
  validator (`ALLOWED_ACTIONS` in `backend/validate.ts`) rejects anything else and requires any `ref` to
  exist in the page model. The content script rejects anything outside `EXECUTABLE`
  (`src/content/actions/executor.ts`). Tested: `tests/safety/coachOnly.test.ts` sends a forged click,
  type, select, submit and navigate to the executor and the validator and asserts the page is unchanged.
- **What injection can still do.** A hijacked model can write misleading text (streamed model text is not
  content-checked; only action messages are scrubbed) or highlight the wrong control. The guide cannot
  act, so the person must still press the button. See A9 and section 9.
- Page-derived strings are shown with `textContent` in the overlay and as React text in the panel, never
  as markup. Tested: the overlay test in `coachOnly.test.ts` checks `textContent`; there is no
  `innerHTML` write anywhere (`coachOnly.test.ts` source scan).

## 7. Supply chain

- **No remote code.** Extension pages have `script-src 'self'`. The source scan in `coachOnly.test.ts`
  and `rasikh-static.test.ts` fails on `eval`, `new Function`, string timers, `importScripts` of a remote
  URL, remote dynamic `import()`, script-element injection and `executeScript` with code strings.
- **The built extension bundles** React, React DOM and Zustand (UI). Express belongs to the
  optional backend and is not in `dist/`; `jose` is still listed in `package.json` but nothing imports it
  any more. Build tools (Vite, the crx plugin, Vitest, Playwright,
  TypeScript) are build-time only.
- **Pinned dependencies.** The package shares the Eduverse lockfile. `package.json` uses caret ranges, so
  install with `npm ci`, not `npm install`, to get exactly the locked versions.
- **Known advisories (not fixed).** `npm audit --package-lock-only` reports 18 findings: 1 low, 7
  moderate, 9 high, 1 critical (the critical is in `vitest`, a test runner). With dev dependencies
  omitted it reports 3 moderate (`express`, `body-parser`, `qs`), all in the optional backend. They are
  not fixed because the lockfile is kept identical to the source. Upgrade before any real release. The
  inherited CI file runs `npm audit --audit-level=high` and would fail today.
- **Skillpacks** are TypeScript files bundled at build time and reviewed in git. In the current build the
  backend also serves them over loopback (`/skills`), so a process that can reach the backend could
  change what the person is told (A5).
- **Icons** are generated by `scripts/make-icons.mjs`; no remote assets are loaded.

## 8. Attacks considered

Status: **Tested** (a named test fails if it breaks), **Enforced** (code does it, no test), **Not covered**.

| # | Attack | Mitigation | Test | Status |
| --- | --- | --- | --- | --- |
| A1 | A malicious page tries to make the guide click or type (forged `doAction` message, `postMessage`, injected "action" markup) | There is no click, type, select, submit or navigate code. The content script handles only `chrome.runtime` messages from the extension (a web page cannot send these). The executor refuses any type outside `EXECUTABLE`. The files that did these things are deleted and a test keeps them deleted. | `tests/safety/coachOnly.test.ts` (source scan; forged actions leave page, inputs, select and location untouched) | **Tested** |
| A2 | Hidden-text instructions (white-on-white, zero-size, off-screen, `aria-label`) | Hidden and zero-size elements are skipped (`isVisible`). The demo planner never interprets page text. In AI mode text is fenced as untrusted and the action set is non-mutating. | `tests/unit/modelDemo.test.ts` (the demo planner emits a highlight and its own text, no network call). Nothing tests that hidden elements are skipped (`isVisible` has no test), and no test feeds an injection string to the AI path. | **Enforced** for the demo planner; hidden-text and AI path **Not covered** |
| A3 | A password prompt inside a lookalike frame, or a lookalike page | Password, OTP, card, ID, passport, IBAN, phone, email and DOB fields are described by label only and never read. Cross-origin frames are opaque. The guide cannot type. A lookalike page that matches a skillpack's role and name would still be guided: matching is by role and name, not by a verified origin. | `sanitizer.test.ts` (sensitive fields). No test for a lookalike origin. | **Partly tested**; lookalike origin **Not covered** |
| A4 | Exfiltration via the backend URL, or a rogue backend | The backend URL is fixed at build time (`VITE_API_BASE`), `connect-src` allows only `self` and loopback 8796, and `host_permissions` lists only loopback 8796. Nothing is sent to any other host from extension pages. The model API is called by the backend, not the extension. | `rasikh-static.test.ts` ("limits connections", host allowlist). `sanitizer.test.ts` checks the request body has no value. | **Tested** for the extension; backend behaviour **Enforced** |
| A5 | A tampered skillpack | Packs are bundled at build time. Invalid selector regexes are caught. A pack cannot add an action type: the executor and validator ignore it. A pack can still mislead (wrong text, wrong control) and can contain a catastrophic-backtracking regex (ReDoS, finding F9). The backend serves packs unauthenticated over loopback. | None for pack integrity or schema. | **Not covered** |
| A6 | Cross-site leakage of grants | Grants are exact scheme-and-host patterns (`originPattern`). The content script is registered only for a granted origin and unregistered on revoke. The worker refuses to perceive a tab unless `chrome.permissions.contains` is true for that tab's origin, and honours content-script messages only from a granted tab (`src/background/index.ts`). | `tests/unit/sitesGrant.test.ts` (denied request registers nothing; granted origin is requested, then registered for that one origin, then injected; revoke unregisters first; per-origin ids). `tests/integration/loop.test.ts` (`originPattern` keeps scheme and host; `hasGrant` false when not granted; no perception without a grant). All with a mocked `chrome`. | **Tested** with mocks. Real-browser check not yet asserted: `tests/e2e/rasikh-explore.spec.ts` only prints what it sees |
| A7 | Field values reaching the guide (via a name, placeholder, screenshot, status text) | No value is read; sensitive fields lose type, placeholder, required; no screenshot capture; text is scrubbed; URL has no query or fragment. | `sanitizer.test.ts`, `rasikh-static.test.ts` ("never reads a control value in perception"). The `aria-labelledby` case (F5) is **not** tested. | **Tested**, with F5 open |
| A8 | Another extension, or a web page, messages the worker; a content script asks for a panel-only action | `senderIsTrusted` accepts only messages carrying this extension's id. No `externally_connectable` (`tests/unit/manifest.test.ts`). A message from a content script is honoured only if its tab's origin is granted. **It still does not distinguish the content script from the panel**, so a compromised content-script realm on a granted site could send panel intents such as `startLesson`. The panel `Port` accepts any context that connects with the name `panel`. | `tests/safety/origin.test.ts` (other id rejected, own id accepted); `tests/integration/loop.test.ts` (no perception without a grant) | **Partly tested**; content-script vs panel **Not covered** |
| A9 | A misleading highlight on a hostile or compromised page (the person is steered to press the wrong button) | The guide never presses anything and says "you do this one". It cannot check that the page is honest. Skillpack text states which control is the final action. | None possible in unit tests. | **Residual risk, not mitigable here** |
| A10 | Markup or script injection into the overlay or panel via page text | `textContent` in the overlay; React text nodes in the panel; no `innerHTML` writes; CSP forbids inline script. | `coachOnly.test.ts` (no `innerHTML` write; tooltip `textContent`) | **Tested** (overlay); panel **Enforced** |
| A11 | Dynamic code: `eval`, remote script, the debugger, `Runtime.callFunctionOn` | Removed. CSP forbids `unsafe-eval` and remote script. | `coachOnly.test.ts`, `rasikh-static.test.ts` | **Tested** |
| A12 | The cloud path turns on by accident | Off unless `ANTHROPIC_KEY` is set; `MODEL_PROVIDER=demo` forces it off; the panel shows `demo` or `AI`. A key in the shell environment is enough to turn it on. | `tests/unit/modelDemo.test.ts` "provider selection (default demo)": demo with no key; `MODEL_PROVIDER=demo` wins over a key; AI only with a key. The test confirms that a key alone turns AI on (F4). | **Tested**, weak by design (F4) |
| A13 | A web page, or a process on the machine, calls the local backend | Bound to `127.0.0.1`; no CORS headers, so cross-origin JSON posts are blocked by the browser. No `Host` or `Origin` check, so DNS rebinding and other local processes are not blocked. In AI mode that could spend the person's model quota. | None | **Not covered** |
| A14 | A page detects or tampers with the overlay | The overlay lives in a shadow root with `pointer-events:none`. The root is `open` and the host has a `data-rasikh-guide` attribute, so a page can see and alter it. | `coachOnly.test.ts` checks it exists, not that it is hardened | **Not covered** |
| A15 | Dependency compromise | Lockfile, `npm ci`, no remote code, small shipped runtime set. | CI audit exists but fails today (section 7). | **Partly** |

## 9. Not covered yet, and known weaknesses

Findings from the adversarial review, in order of importance. File and line are as of this writing.

- **F1 (was high, FIXED in this build; confirm in a real browser). A static content script ran without a
  grant.** The first manifest had `content_scripts` with `https://*/*`. A probe I ran in Playwright's
  bundled Chromium (a small test extension whose static content-script match was also in
  `optional_host_permissions`) showed the script **injected with no grant**, `chrome.permissions.getAll()`
  listing the origin as granted, and `chrome.permissions.contains` returning false for it. The current
  `manifest.json` has no `content_scripts`; `src/background/sites.ts` registers `content.js` for one
  granted origin. Covered by `tests/unit/manifest.test.ts` ("no static content_scripts") and
  `tests/unit/sitesGrant.test.ts` with a mocked `chrome`. **Still to do:** a real-browser assertion that a
  page is not injected before a grant and is injected after (the e2e helper already has `grant`, `revoke`
  and `hasPermission`).
- **F2 (medium). Loopback backend host permission is install-time** (`manifest.json:13-16`).
  Request it when the guide is first started.
- **F3 (medium). The page model is posted to the backend in the default mode** (`src/background/loop.ts:42`
  `postTurn`, `src/background/orchestratorClient.ts:24`). Not "nothing leaves the browser". A demo planner
  in the service worker would fix it and also remove the need to run the backend for the demo.
- **F4 (medium). The AI path is switched on by `ANTHROPIC_KEY` alone** (`backend/provider.ts:11`). Require an
  explicit opt-in such as `MODEL_PROVIDER=anthropic`, and have the panel show a persistent banner.
- **F5 (medium, reproduced). A displayed selection enters an accessible name** (`src/content/perception/name.ts:9-17`,
  the `aria-labelledby` branch). Probe: with the mock bank's markup (`<button role="combobox"
  aria-labelledby="range-l range-v">` and `<span id="range-v">AED 5,000 to 15,000</span>`),
  `accessibleName` returned "Expected monthly income AED 5,000 to 15,000". The chosen range is a value
  the person picked, and it is in the page model sent to the backend. Fix: skip `aria-labelledby` ids
  that are the control or its descendant, and for editable hosts use only label elements. Add a test.
- **F6 (low). The URL path is not scrubbed** (`src/content/perception/build.ts:50`), and the content
  script's `contentReady` message carries the full `location.href` with query and fragment
  (`src/content/lifecycle.ts:13`; the worker ignores it, but it is sent).
- **F7 (low, partly fixed). `senderIsTrusted` checks only the extension id** (`src/shared/validateSender.ts`).
  Content-script messages are now limited to granted tabs (`src/background/index.ts`). Still allow a
  content script only `contentReady` and `pageEvent`, require `sender.url` to be an extension page for
  everything else, and check `port.sender` in `src/background/panelPort.ts`.
- **F8 (low). The overlay root is `open` and the host carries `data-rasikh-guide`**
  (`src/content/overlays/coachMark.ts:24,26`). Use a closed root and no marker attribute. Also,
  `lifecycle.ts:31-32` patches `history.pushState` in the isolated world, which does not see the
  page's own calls (a functional gap, not a security one).
- **F9 (low). Regexes come from skillpack data** (`src/shared/findControl.ts:16,20`, `src/shared/conditions.ts:30,32`).
  Invalid patterns are caught; catastrophic backtracking is not.
- **F10 (low). The local backend has no `Host` or `Origin` check** (`backend/server.ts`; it binds to
  `127.0.0.1` in `backend/server.local.ts:12`). Reject any `Host` other than `localhost:8796` or
  `127.0.0.1:8796`, and any `Origin` that is not an extension origin.
- **F11 (info). `rasikh-static.test.ts` still checks that any static content-script match is a subset of
  `optional_host_permissions`.** That checks manifest shape, not browser behaviour (F1); with no static
  content script it passes vacuously. `manifest.test.ts` now asserts there is none, which is the useful check.
- **F12 (info). The production build ships 11 `.map` source maps in `dist/assets`** (`vite.config.ts`
  `sourcemap: true`). No secrets are in them, but there is no reason to ship them.
- Not covered by any test: grant handling in the worker (`originPattern`, `hasGrant`); hidden-element
  skipping; the AI path against injection; skillpack integrity; lookalike origins; sender role checks;
  the panel. The real-browser suite is the place for the grant tests (`tests/e2e/helpers/ext.ts` already
  has `grant`, `revoke` and `hasPermission` helpers; check the specs exist before relying on them).
- Not verified at all: guidance for any real website; Rasikh Guard enforcement (a historical independent
  evaluation allowed 12 of 25 forbidden synthetic flows; a fix and re-measurement are recorded in
  `packages/DEVIN_LOG.md` but have not been independently re-verified here, and this extension does not
  depend on Guard).

## 10. How to re-check

From `packages/rasikh-extension`:

```bash
npm run typecheck                       # tsc over the extension and the backend
npm test                                # vitest: unit, integration, safety
npx vitest run tests/safety             # only the safety suites named above
npm audit --package-lock-only           # supply-chain advisories (section 7)
```

When this was written, `npx vitest run tests/safety` passed 5 files and 52 tests, and the full
`npx vitest run` passed 20 files and 137 tests. Counts will change; re-run rather than trust this line.

Real-browser suite (loads the built `dist/` into Chromium and walks the mock portals):
`node scripts/e2e-run.mjs` (see `README.md`). Re-run the manifest review after every build:
read `dist/manifest.json`, because the bundler can add `web_accessible_resources`.
