# tamm-live: the live TAMM demo console

A small console for showing, live and on a projector, what happens when the Rasikh agent talks to TAMM through the
TAMM MCP server and Rasikh Guard checks every call that would send personal data.

It runs three scenarios against the **mock** TAMM and shows each step as it happens: the Guard session, what the agent
has read, the simulated UAE PASS login, the TAMM tool call, the Guard decision and the policy rule behind it, and the
application status. It has no runtime npm dependencies (Node 22 and the standard library only).

## Honesty statement (read this before presenting)

- **TAMM is a mock.** There is no public TAMM API in use. Every tool response carries `mock: true`; fees and durations
  are illustrative. Nothing here is a request to a real government system.
- **UAE PASS is simulated.** The login is a dev endpoint on the mock (`POST /dev/uaepass/login`). No identity provider is involved.
- **The policy matrix is a product default, not a legal statement.** It is the default in `packages/rasikh-guard/policies/rasikh.toml`.
- **End-to-end safety is not proven.** An archived independent evaluation allowed 12 of 25 forbidden synthetic flows
  (INTEGRATION.md changelog 1.1.1). A newer measurement of the deployed release (contract 1.2.0, 2 October 2026) denied all 25
  in each of 3 runs, 75 of 75, over HTTP. That measures the policy decision only: model behaviour, end-to-end exfiltration
  and the whole app were not measured, and this demo does not re-run either evaluation. It shows three scripted paths and
  does **not** prove the agent is safe.
- Replays are recordings of earlier runs against the same mock. Every replayed step is flagged `replay: true` and the
  console labels it as a replay.

## Run it (one command)

Windows, PowerShell 5.1 or newer (from the repo root):

```powershell
powershell -ExecutionPolicy Bypass -File packages\tamm-live\scripts\start.ps1
```

macOS, Linux, git-bash:

```sh
packages/tamm-live/scripts/start.sh
```

The script:

1. refuses to start if port 8787, 8790 or 8791 is taken, and names the process that owns it;
2. starts Rasikh Guard (`RASIKH_DEMO_MODE=1`), builds it with cargo first if no binary exists;
3. starts the TAMM mock in demo mode (`npm run dev` in `packages/tamm-mcp`, `npm ci` only if `node_modules` is missing);
4. starts the console;
5. waits for all three `/health` endpoints, with a timeout and the log tail if one does not come up;
6. runs `scripts/smoke.mjs`;
7. prints the three URLs and stays in the foreground. **Ctrl+C** stops only what it started.

| Service | URL |
| --- | --- |
| Console (open this) | http://127.0.0.1:8791 |
| Rasikh Guard | http://127.0.0.1:8787/health |
| TAMM mock | http://127.0.0.1:8790/health (MCP at `/mcp`) |

Options: `-Stop` (`--stop`) stops what an earlier run started, even from another window; `-NoSmoke`; `-Detach`
(start, smoke, return, leave running); `-Record` (smoke test saves each scenario as a replay); `-RebuildGuard`.
The script never stops a process it did not start. Logs and the list of started processes are in
`%TEMP%\rasikh-tamm-live` (`$TMPDIR/rasikh-tamm-live` on macOS and Linux).

Environment overrides: `RASIKH_GUARD_BIN` (path to a built guard binary), `RASIKH_GUARD_TARGET` (cargo target dir; default
is a `rasikh-guard-target` folder next to the repo). For testing the scripts next to a running demo only:
`TAMM_LIVE_GUARD_PORT`, `TAMM_LIVE_TAMM_PORT`, `TAMM_LIVE_PORT` (the demo ports are 8787, 8790, 8791) and
`TAMM_LIVE_SERVER` (another console entry file). `smoke.mjs` reads `TAMM_LIVE_URL`, `RASIKH_GUARD_URL` and `TAMM_MCP_URL`.

### Guard binary and build time

If no binary is found, the script runs `cargo build --release -p rasikh-guard` with `CARGO_TARGET_DIR` set to the
`rasikh-guard-target` folder next to the repo, so it is not rebuilt for every checkout. A cold first build compiles the
vendored OpenAPPA engine and about 150 crates: plan 2 to 6 minutes. A warm rebuild on the dev machine took 49 s.
Build it the night before.

## The three scenarios

| id | What the audience sees | Expected |
| --- | --- | --- |
| `tawtheeq` | The agent registers a tenancy contract. Guard allows it, the application is created and moves submitted, under_review, approved. | allowed |
| `bank-statement` | The agent tries to attach a bank statement to a residency visa application. Guard denies it (`bank_statement.tamm.denied`); the TAMM backend is never called, so nothing is created. | blocked |
| `health-routing` | Health data is refused for a residency visa (`health.tamm.insurance_only`) and accepted for health insurance. | mixed |

All three use the fixtures `hire_demo_001`, `lease_reem_2207` and `doc_passport_hire_demo_001`
(INTEGRATION.md section 5). Fees and durations are illustrative.

## Smoke test

```sh
node packages/tamm-live/scripts/smoke.mjs            # once
node packages/tamm-live/scripts/smoke.mjs --repeat 3  # repeatability: reset and run everything three times
node packages/tamm-live/scripts/smoke.mjs --record    # also save each scenario run as a replay
```

It checks the three services, calls `POST /api/reset`, then asserts the exact outcomes (see the table above), reading
the same Server-Sent Events stream the browser reads. It also asks Guard and the TAMM MCP **directly** (not through
the console) for a bank-statement denial and a health routing pair, so a console that merely printed "denied" would
still be caught. It scans every trace step for raw document values, tokens and full session ids (a pattern-based
tripwire, not a proof), checks every recorded replay, resets at the end, prints a PASS/FAIL table and exits 0 only if
everything passed (1 on a failed assertion, 2 if a service is down).

## API of the console server

| Method and path | Result |
| --- | --- |
| `GET /api/status` | `{guard:{ok,url,detail?}, tamm:{ok,url,mock:true,demoMode?}, replays:[ids with a recorded run]}` |
| `GET /api/scenarios` | `[{id,title,blurb,expect:"allowed"\|"blocked"\|"mixed",labels:[...],service}]` |
| `GET /api/run/:id` | `text/event-stream`. Events: `step` (a TraceStep), `done` (`{outcome,ms,summary}`), `fail` (`{message,hint}`, plain language, no stack traces). `?record=1` also saves the run to `replay/<id>.json`. |
| `GET /api/replay/:id` | The same event stream from the recorded run, every step flagged `replay:true`. |
| `POST /api/reset` | Resets the TAMM mock (`/dev/reset`) and Guard (`/dev/reset`). Returns `{ok,tamm,guard}`. |

`TraceStep = {n, atMs, kind, title, actor, request, response, decision?, status?, ms, mock:true, replay?}` where
`kind` is one of `guard.session`, `guard.observe`, `tamm.login`, `tamm.tool`, `guard.check`, `tamm.advance`,
`tamm.status`, `note`. `request` and `response` hold only labels, refs, ids, service ids, decisions and statuses:
never a raw document value, a token, a UAE PASS session or a full Guard session id (session ids are cut to their
first 6 characters).

## Replay: what it is and when to use it

`GET /api/run/:id?record=1` (or `smoke.mjs --record`) saves a real run to `replay/<id>.json`. `GET /api/replay/:id`
streams it back with the original timing and every step flagged `replay:true`. Replay is the fallback for when a
service will not come up in the room (Guard not built, a port taken, a flaky machine): the audience still sees the real
trace of a real run, and the console says it is a replay. Do not present a replay as live. Record fresh replays on the
day (`-Record`), after a green smoke test, so they match the code on stage.

## Reset order

For a clean demo: console state, then `POST /dev/reset` on the TAMM mock, then `POST /dev/reset` on Guard
(INTEGRATION.md section 5). `POST /api/reset` and the console's Reset button do both service resets. Both reset
endpoints exist only with `RASIKH_DEMO_MODE=1`, which the start scripts set.

## Files

| Path | What |
| --- | --- |
| `src/server.mjs` and runner | The console server and the scenario runner |
| `public/` | The browser page (static) |
| `replay/` | Recorded runs |
| `scripts/start.ps1`, `scripts/start.sh` | One-command launcher |
| `scripts/smoke.mjs` | The smoke test |
| `docs/` | Notes and test results |
| `../../docs/LIVE-TAMM-DEMO.md` | One-page presenter runbook |
