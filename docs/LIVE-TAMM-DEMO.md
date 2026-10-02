# Live TAMM demo: presenter runbook

One page. The extension on show: **TAMM MCP + Rasikh Guard**, run against the **mock** TAMM. Details: `packages/tamm-live/README.md`.

## Before you go on (T minus 30 minutes)

1. Start everything and record fresh replays:
   `powershell -ExecutionPolicy Bypass -File packages\tamm-live\scripts\start.ps1 -Record`
   (macOS/Linux/git-bash: `packages/tamm-live/scripts/start.sh --record`). Wait for **Ready.** and **PASSED** in the smoke table. If it says FAILED, do not go on with this state.
2. Open **http://127.0.0.1:8791** in the browser you will use on stage. Full screen (F11). Light theme on a bright projector.
3. Put it on the projector and read the smallest text from the back row.
4. Press **Reset** once so the first run starts clean. Leave the start window open (Ctrl+C there stops everything it started).

## 90-second talk track

| Time | Click | Say | Audience should notice |
| --- | --- | --- | --- |
| 0:00 | (nothing) | "The agent talks to TAMM through an MCP server. TAMM here is a mock and UAE PASS is simulated. Before any call that sends personal data, Guard decides." | The Mock label and the three services showing green |
| 0:10 | **Tawtheeq**, Run | "Register the tenancy contract." | Guard check shows allow **before** the TAMM call; the application moves submitted, under review, approved; only labels and refs appear, never document contents |
| 0:40 | **Bank statement**, Run | "Now the agent tries to attach a bank statement to a residency visa." | The deny, its rule name (`bank_statement.tamm.denied`), and the TAMM result `denied` with **no application id**: nothing was created |
| 1:05 | **Health routing**, Run | "Same health document, two destinations." | Refused for the visa (`health.tamm.insurance_only`), accepted for health insurance: the rule is about purpose |
| 1:25 | (nothing) | "That is three scripted paths on a mock. It is not a safety proof." | |

**Say about the mock:** "TAMM is a mock: no real TAMM request is made, fees and durations are illustrative, UAE PASS is simulated."
**Say about enforcement:** "Guard enforcement is unverified. An earlier evaluation let 12 of 25 forbidden synthetic flows through; we pinned those as tests, but this demo does not re-run that evaluation, and the policy matrix is a product default, not a legal statement."
**Never say:** "proves it is safe", "real TAMM", "production", "verified".

## If something goes wrong

| Problem | Do this |
| --- | --- |
| A service is down (the console names it) | Press **Replay** on the scenario. Say it is a recording of an earlier run. Fix after the talk. |
| Console will not open | `node packages\tamm-live\src\server.mjs` in a new window; Replay needs only the console. |
| Port 8787, 8790 or 8791 taken | The start script names the owner and starts nothing. Close that program yourself (never touch ports 3000, 3100, 3300). A leftover of this script: `start.ps1 -Stop`. |
| Guard slow or a step hangs | Wait 5 s. TAMM fails closed after 2 s and shows `guard_unavailable`: say "no Guard answer means no call", then Reset and run again. If it repeats, use Replay. |
| State looks dirty (an old application, odd result) | Press **Reset** (or `POST /api/reset`). Manual order: TAMM `curl -X POST http://127.0.0.1:8790/dev/reset`, then Guard `curl -X POST http://127.0.0.1:8787/dev/reset`. Then run again. |
| Everything is odd | `start.ps1 -Stop`, start again (the services are up in about 5 s when Guard is already built; the smoke test adds a few seconds), wait for PASSED. |

## Pre-flight checklist

- [ ] Laptop on power, sleep off, notifications off, display mirrored, resolution set
- [ ] Guard binary built (`rasikh-guard-target\release\rasikh-guard.exe` exists; first cargo build takes 2 to 6 minutes)
- [ ] `start.ps1 -Record` finished with PASSED, and the console shows replays for all three scenarios
- [ ] Console open at http://127.0.0.1:8791, full screen, text readable from the back row
- [ ] Light and dark both checked on the projector; the right one chosen
- [ ] Pressed Reset; no old application on screen
- [ ] Browser has no other tabs that could pop up; the start window is not on the projector
- [ ] You can say the mock line and the unverified-enforcement line from memory
- [ ] Offline fallback ready: Replay works without Guard or TAMM running
