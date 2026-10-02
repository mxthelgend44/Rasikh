# Rasikh Guide (browser extension)

> **Status: hackathon prototype. DRAFT and UNVERIFIED against real websites.**
> The live demo runs on three local **MOCK** portals (`packages/rasikh-portals`). No real government,
> utility or bank site is ever contacted, and no real submission is ever made. Guidance for real
> websites is draft only: those sites sit behind logins and change without notice.

Rasikh Guide is a Chrome / Edge (Manifest V3) side-panel extension that walks a newcomer through a
website that is **not TAMM** and has **no API**: federal immigration and ID services, utilities,
banks, insurers, landlord portals. It reads the page structure, points at the right control,
explains it in plain English or Arabic, and hands the action back to the person.

## Why it exists

Rasikh is an Abu Dhabi relocation platform: an AI agent helps a newcomer through the steps of moving
(documents, visa, Emirates ID, home, bank, insurance). The TAMM steps are handled by the TAMM MCP and
Rasikh Guard. Many other sites a newcomer must submit to are not TAMM. They expose no API, so no agent
can (or should) act on them. A browser extension is the one place that can see the page the person is
actually looking at, so it can coach them through it without any integration from the site.

## What it does, and what it never does

It does:

- read the page **structure**: role, accessible name, label text, placeholder, heading text, field type,
  and whether a field is required;
- match that structure against an authored **skillpack** for the site and find the current step;
- **highlight** the control for the current step, scroll it into view, and explain it in the side panel
  in English or Arabic;
- wait for the person to act, notice the page changed, and move to the next step;
- work **offline**: with no model key and no internet it still walks through a skillpack step by step.

It never:

- types into a field, selects an option, clicks, or submits;
- presses a final action button (submit, pay, confirm, approve, send, agree);
- reads or sends a field **value**. Password, one-time-code, card, Emirates ID, passport and IBAN fields
  are not described beyond their label;
- sends anything off your computer in the default mode (the page structure goes to a local backend on
  `127.0.0.1`, which makes no further network call; see "How it works");
- runs code fetched from the network, or uses `eval`.

These are product rules, not aspirations. `docs/SECURITY.md` lists what is enforced in code, which test
covers each rule, and what is **not** covered yet.

## How it works

```
page (any granted site)
  |  structure only
  v
content script -- perception pipeline --> PageModel (no values)
  |                                        |
  | highlight / scrollTo / clear only      | message
  v                                        v
coach-mark overlay (shadow DOM)       service worker -- teaching loop --> side panel (EN / AR)
                                           |
                                           | POST structure-only model to http://localhost:8796 (loopback)
                                           v
                                      local guide backend
                                           | default: deterministic demo planner, no further network call
                                           | optional: model provider over HTTPS, only if you set ANTHROPIC_KEY
```

- **Perception** (`src/content/perception/`): walks the DOM (open shadow roots and same-origin frames),
  builds an accessible name for each interactive element, and emits a `PageModel`. It records structure
  only. Sensitive fields are reduced to their label.
- **Skillpacks** (`skillpacks/`): authored, versioned knowledge of a site: how to recognise each view,
  the ordered steps of a task, the control for each step (matched by role and name, never by position
  alone), plain-language explanations in English and Arabic, and which controls are final actions the
  person must press themselves.
- **Teaching loop** (`src/background/`): perceive, find the view, pick the step, show the guidance,
  highlight the control, wait for the person. The loop has no action that changes the page.
- **Offline demo provider** (`backend/modelDemo.ts`): a deterministic planner that needs no key and no
  internet. It is the default. The same input always gives the same guidance, which is what makes the
  demo repeatable. It runs inside the local backend, so **the backend must be running** even for the
  offline demo; the panel's guide list and every step come from it.
- **Optional LLM path** (`backend/model.ts`): the backend can call a hosted model to word the guidance.
  It is off unless `ANTHROPIC_KEY` is set in the backend's environment, and `MODEL_PROVIDER=demo` forces
  it off even if a key is set. The panel shows a "Demo guide" or "AI" badge. A key exported in your shell
  for other work will turn it on, so unset it before a demo. In that mode the structure-only page model
  goes on to the model provider; `docs/SECURITY.md` lists exactly what crosses each boundary. The model
  can only choose among non-mutating actions, because the extension has no mutating action to give it.

## Install (unpacked)

Requires Node 20 or newer (developed on Node 22) and Chrome or Edge 116 or newer.

```bash
cd packages/rasikh-extension
npm run build            # two vite builds: the extension, then the self-contained dist/content.js
```

Then open `chrome://extensions` (or `edge://extensions`), turn on **Developer mode**, choose
**Load unpacked**, and select the `dist/` folder.

Dependencies are the same set and lockfile as the Eduverse source and are shared through a linked
`node_modules`. Do not run a fresh `npm install` of the heavy tree unless you mean to.

### Grant a site (one at a time)

The extension has no default access to any website and declares no static content script. Open the
website in the active tab, open the side panel, choose **Allow this site**, and approve the browser
prompt. The guide's content script is then registered for that one origin (scheme and host) and
injected into tabs already open on it. **Turn off for this site** (or **Revoke** on the options page)
unregisters it and removes the permission. For the demo, grant only the mock portal origin
`http://127.0.0.1:8793`.

## Run the mock portals and the backend

```bash
# mock portals: http://127.0.0.1:8793/bank/  /icp/  /utilities/   (zero dependencies)
cd packages/rasikh-portals && npm start

# guide backend on 127.0.0.1:8796 (needed for the demo; offline demo planner by default)
cd packages/rasikh-extension && npm run start:backend      # or: npm run dev:backend (watch mode)
```

The Eduverse default backend port 8787 is **not** used: it clashes with Rasikh Guard. The backend binds
to `127.0.0.1` only and has no accounts, no auth and no CORS: it is a demo backend, do not expose it.

To use the optional LLM path, export `ANTHROPIC_KEY` in the backend's environment before starting it.
Nothing does this for you and the demo does not need it. To be certain it stays off, start the backend
with `MODEL_PROVIDER=demo`.

## Quality gates and end-to-end

```bash
npm run typecheck   # tsc over the extension and the backend
npm test            # vitest: unit, integration and safety suites
npm run build       # production bundle into dist/
# the real-browser suite needs the portals (8793) and the backend (8796) running:
node ../rasikh-portals/server.mjs &            # mock portals
PORT=8796 npx tsx backend/server.local.ts &    # offline demo backend
npm run e2e                                    # loads dist/ into Chromium and walks the mock portals
```

Run them from `packages/rasikh-extension`. The safety suites (`tests/safety/`) are where the "coach, do
not do" and "no values" rules are checked; `docs/SECURITY.md` maps each attack to its test and says
which are not covered.

**Verified on 2 October 2026**

- `npm run typecheck` clean; `npm test`: 20 files, 140 tests pass; `npm run build` passes.
- Real browser (Playwright's Chromium 148, the built unpacked extension, the three mock portals): **5 of 5
  end-to-end tests pass.** On the ICP, utilities and bank portals the guide advances step by step,
  highlights the right control at every step, changes nothing on the page when left alone, and the person
  presses every Submit. Typed fake password, one-time code, card, Emirates ID and passport values never
  appear in any message, request, storage or backend log, and the backend is reached on loopback only.
- Microsoft Edge 154 also loaded the unpacked extension. We did **not** test it by hand in branded Chrome
  (its automation flag for loading unpacked extensions no longer works): load it with **Load unpacked**.
- Not covered: the real side panel (the suite opens the panel page in a tab), real government or bank
  sites, Arabic in the real browser, and the optional cloud model.

## Layout

```
src/background/   service worker: router, teaching loop, state, per-site grants and registration
src/content/      content script: perception, non-mutating executor, coach-mark overlay
src/panel/        React side panel and i18n (en, ar), logical CSS properties only
src/options/      per-site grants, language, preferences
src/shared/       types, message bus, failure codes
backend/          optional orchestration backend (port 8796), off by default
skillpacks/       authored per-site guidance (DRAFT, unverified against live sites)
tests/            unit, integration, safety (vitest) and e2e (playwright)
docs/SECURITY.md  threat model and permission review
```

## Provenance

This package is a fork of the author's own Chrome MV3 extension "Eduverse Companion" (a tutor that
points and explains and hands the work back to the student). The Rasikh fork changes it in four ways:
the action executor is reduced to non-mutating actions (every mutating action is removed or hard
blocked, with a test); values are never read; host access is optional and per site; the default
planner is offline and deterministic. The original source folder is read-only and was not modified.

## Honesty statement

- Guidance for real websites is **draft and unverified**. We did not test it against the live sites,
  which sit behind logins and change.
- The demo uses **local MOCK portals**, labelled MOCK on every page. Nothing is submitted anywhere real.
- This extension is independent of Rasikh Guard. Guard enforcement in the wider Rasikh platform is
  **unverified**: a historical independent evaluation allowed 12 of 25 forbidden synthetic flows. A fix
  and a re-measurement are recorded in `packages/DEVIN_LOG.md`, but we have not independently
  re-verified them and do not claim more.
- "Coach, do not do" is enforced by the extension having no mutating action and by tests that fail if
  one is added. It is not a promise that the extension is free of bugs. Read `docs/SECURITY.md` for what
  is tested and what is not.
