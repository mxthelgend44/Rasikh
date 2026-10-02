# Rasikh Guide: live demo runbook (one page)

**The audience sees:** a bank website that is not TAMM and has no API. A side panel points at the right
control and explains it in English and Arabic. It never types and never presses Submit. The person stays
in control. **Everything is a local MOCK.** Presenter: Mohammad. Clicker and timer: Firas.

## Setup (15 minutes before)

| # | Do | Check |
| --- | --- | --- |
| 1 | Terminal A: `cd packages/rasikh-portals && npm start` | `http://127.0.0.1:8793/` lists three mock sites; yellow MOCK banner on every page |
| 2 | Terminal B: `cd packages/rasikh-extension && MODEL_PROVIDER=demo npm run start:backend` (unset `ANTHROPIC_KEY` first) | Log says "Model provider: demo guide"; `http://127.0.0.1:8796/health` shows `"provider":"demo"` |
| 3 | `npm run build` in `packages/rasikh-extension` (skip if `dist/` is fresh); `chrome://extensions` or `edge://extensions`, Developer mode, **Load unpacked**, pick `dist/`; pin it | "Rasikh Guide" listed, no errors |
| 4 | Open `http://127.0.0.1:8793/bank/`, click the toolbar icon, in the panel press **Allow this site**, approve the browser prompt | Panel says "Allowed for this site only"; badge reads "Demo guide" |
| 5 | Panel: **Choose a guide**, pick the bank guide, **Start**. Then **Stop guide** and reload `/bank/` | Ring appears on the first control; page form is empty again |
| 6 | Wi-Fi off, repeat step 5 once | Works with no internet (backend is on this laptop) |

Do not stop anything on ports 8787, 8790, 8791. If 8796 or 8793 is taken, say so and do not kill the process.

## 90-second talk track on /bank/

| Time | Say | Do |
| --- | --- | --- |
| 0:00 | "TAMM we handled with an agent and a guard. A bank, a utility, the Emirates ID site: no API, so no agent can act there. We built a guide that walks beside you." | Show `/bank/`. Point at the MOCK banner. Start the guide. |
| 0:15 | "It reads the page structure, never what you type. It points, it explains, you act." | Ring lands on the first control; panel shows step 1. Do not type yet. |
| 0:30 | "Same step in Arabic." | Language menu to العربية: panel flips right to left; ring stays on the same control. |
| 0:45 | "I do it. It never fills a field for me." | Type a **fake** name yourself. Press **I did this, next step**. Identity-card step: panel says "I never read it". |
| 1:10 | "At the end it points at Submit and says: you press it." | Press **I did this, next step** through to the last step (rehearse the count). Ring on **Submit**. Do **not** press it (or press it: the mock says nothing was sent). |
| 1:25 | "One site at a time, revocable, and in this mode nothing leaves this computer." | Panel: **Turn off for this site**. The ring disappears. |

## Say this about honesty, once, out loud

- "These are **mock** portals on this laptop. No real government or bank site was touched."
- "Guidance for real websites is **draft and unverified**: those sites sit behind logins and change."
- "Our Guard is not proven. An independent test once let 12 of 25 forbidden synthetic flows through. A fix
  exists but we have **not** re-verified it independently, so we do not claim it. This extension does not
  depend on Guard: it has no click, type or submit at all, and tests that fail if one is added."
- If asked about the cloud: "The default is a fixed planner on this laptop. An AI option exists, off
  unless a key is set, and the panel shows an AI badge when it is on."

## If it goes wrong

| Symptom | Do |
| --- | --- |
| Panel: "No guides found" or "backend is not reachable" | Terminal B is not running: restart `npm run start:backend`, then reload the panel. |
| Panel says to allow the site first | Press **Allow this site** again; the prompt needs your click. |
| No ring | Press **Show me the control again**; if still none, reload `/bank/` and **Start** again. |
| Badge reads "AI" | Stop. A key is set. Restart the backend with `MODEL_PROVIDER=demo` before continuing. |
| Anything else breaks | Play the recorded screen capture and say: "This is our offline recording." |

## Pre-flight checklist

- [ ] Portals on 8793, backend on 8796 in demo mode, ports 8787 / 8790 / 8791 untouched
- [ ] Extension loaded from a fresh `dist/`; granted to `127.0.0.1:8793` only; no other site granted
- [ ] Badge reads "Demo guide"; Wi-Fi off, walkthrough works; `ANTHROPIC_KEY` not set in either terminal
- [ ] Arabic toggle tested; zoom 100 percent; side panel wide enough to read
- [ ] Only fake data on screen; no real ID, passport, IBAN or card anywhere
- [ ] Recorded fallback opens offline
