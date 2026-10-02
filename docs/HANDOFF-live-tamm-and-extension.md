# Handoff: live TAMM request demo and the Rasikh Guide extension

Branch `qa/live-tamm-demo`, built on `devin/algo-hardening` (`9c51448`, which is `main` plus the Guard
hardening). Written 2 October 2026. Everything below was run, not assumed.

## What is on this branch

| Path | What | Run it |
| --- | --- | --- |
| `packages/tamm-live` | A presenter console for a **live TAMM request** against the mock TAMM MCP and Rasikh Guard: three scenarios, a live trace, replay fallback | `powershell -ExecutionPolicy Bypass -File packages/tamm-live/scripts/start.ps1` |
| `packages/rasikh-extension` | **Rasikh Guide**, a Chrome (MV3) extension that guides a person through websites that are not TAMM and never acts for them | `npm run build`, then **Load unpacked** on `dist/` |
| `packages/rasikh-portals` | Three local MOCK sites to practise on (Emirates ID, utilities, bank) | `node packages/rasikh-portals/server.mjs` (port 8793) |
| `packages/tamm-mcp/src/http.ts` | **Security fix:** malformed or oversized request bodies no longer return a stack trace with file paths | covered by a new test |
| `docs/LIVE-TAMM-DEMO.md`, `docs/RASIKH-EXTENSION-DEMO.md` | One-page presenter runbooks | |

## Ports

Guard 8787, TAMM mock 8790, TAMM console 8791, extension backend **8796**, mock portals 8793. The
extension's backend was moved off 8792 because another service on this machine already answers there.

## Evidence (real runs, 2 October 2026)

| Check | Result |
| --- | --- |
| TAMM MCP typecheck and tests | clean; **71 of 71** pass (70 plus the new regression test) |
| Guard `cargo test --release --locked --workspace` | **694 pass, 0 fail** (123 Rasikh Guard: policy 64, adversarial 27, laws 10, remedies 7, http 6, policy file 6, lib 3; 571 vendored OpenAPPA) |
| Black-box probes against the real services | 59 probes: **50 PASS, 1 FAIL, 8 GAP**. The FAIL (stack trace on a malformed body) is fixed. The GAPs are listed below. |
| Live TAMM console, cold start on the real ports | **77 of 77** smoke checks; replays re-recorded |
| TAMM console unit tests | 27 of 27 |
| Extension: typecheck, unit, integration and safety tests | clean; **140 of 140** pass; build passes |
| Extension in a real browser (Chromium 148) | **5 of 5** end-to-end tests: guided walkthrough on all three mock portals, no page changes by the extension, no typed secret in any message, request, storage or log |

## What this does not show

- It does **not** show the agent is safe. The latest HTTP measurement of the deployed Guard (contract
  1.2.0) denied all 25 synthetic attacks in each of 3 runs (75 of 75); an archived evaluation had
  allowed 12 of 25. That is the policy decision only: model behaviour, end-to-end exfiltration and the
  whole app were not measured.
- TAMM and UAE PASS are simulated. Guidance for real sites in the extension is a **draft, unverified**.
- The extension was tested in Playwright's Chromium and loads in Edge; it was not tested by hand in
  branded Chrome, in the real side panel, in Arabic in a real browser, or with the optional cloud model.
- The extension's backend receives the structure of the page (labels and roles, never values) even in
  the default mode. It is a local process on the same computer; nothing leaves the machine.

## Open design gaps found by the probes (not fixed)

1. `/observe` on Guard is unauthenticated, so a caller can declare labels that were never read (label laundering).
2. The agent supplies its own `guard_session_id` and labels.
3. Guard has no Host check and no authentication; `/dev/reset` can be triggered cross-site in demo mode (both services).
4. The simulated UAE PASS subject is not bound to the applicant.
5. Read-only TAMM tools are not checked by Guard.
6. Each scenario needs its own Guard session or a reset between scenarios.

See `packages/tamm-live/docs/TEST-RESULTS.md` and `packages/rasikh-extension/docs/SECURITY.md`.

## Provenance

`packages/rasikh-extension` is adapted from the author's earlier Eduverse Companion extension. See its
`NOTICE.md`. No licence has been chosen for it. The repository's `main` does not contain the web app
(`apps/web`); the newcomer app and dashboards are not on GitHub `main` yet.
