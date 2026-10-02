# Rasikh independent release QA — 2 October 2026

**Release verdict: NO-GO for the requested integrated product.** Passing package tests do not establish a working newcomer-to-partner demo. No integrated release commit or judge URL has been identified. This report is an initial release checkpoint, with affected-flow rechecks required when the coordinator supplies them.

## Sources, commits and environment

| Source | Exact commit | Tested scope |
| --- | --- | --- |
| Latest web/AI stack, PR [#27](https://github.com/mxthelgend44/Rasikh/pull/27), based on `codex/trust-evidence` | `cd0470f1a0f67918f56872772302aaba9d472699` | Production build; browser UI; API; engine/evals/TAMM tests; original Guard |
| Main at first checkpoint | `63b5b8247b011578fa999d2700f938215780877f` | Clean root build/typecheck; data tests; actual repaired Guard, contract 1.2.0 |
| Main after PR [#29](https://github.com/mxthelgend44/Rasikh/pull/29) | `966a01d6d1c035c281f6276c502de13256638632` | Root build/typecheck/lint PASS; only tsconfig changed from the preceding checkpoint |
| Landing proposal, PR [#30](https://github.com/mxthelgend44/Rasikh/pull/30) | `29bb6b1479a7eeee881c9342c559d97088c53c4a` | Source inspection only; unmerged marketing page, not an integrated app |

Checked on 2 October 2026, approximately 12:24–12:48 **Asia/Dubai**. GitHub was repeatedly refreshed; main advanced during QA, and earlier failures remain attributed to their original commits. Main uses a root `src/app` scaffold; the functional API stack uses `apps/web`. Testing the app with a newer independently built Guard is an explicitly **mixed-source** compatibility check, not proof of one integrated release SHA.

Environment: macOS 27.0 arm64, Node 24.19.0, npm 10.8.2, Next 15.5.25, cargo/rustc 1.89.0. Synthetic data only. Isolated candidate checkout and QA report checkout; branch `codex/friend-release-qa`. No shared service, deployment or organizer was contacted. Owned local ports: app 3107, original Guard 18887, main Guard 18888. npm/crate downloads, builds and local sockets required scoped execution permissions. Next used its WASM SWC fallback successfully. No live OpenAI or Vertex calls were made.

Read candidate `README.md`, `INTEGRATION.md`, `ARCHITECTURE.md`, `DEMO.md`, progress/decision files and package instructions. No `AGENTS.md` was found. Main does not contain `ARCHITECTURE.md` or `DEMO.md` at these checkpoints; the candidate does. The candidate contract/shared package are 1.0.0; main Guard is 1.2.0. Do not silently resolve that divergence by reporting the older stack as current main.

## Release blockers and reproduction

### B1 — P0: the newcomer journey cannot start

At `cd0470f`, open `/newcomer`: HTTP 404, “This page could not be found.” No newcomer link or document upload/review, roadmap, approval, application or trust passport UI exists in the production route table. At main `966a01d`, the root app still contains only the Rasikh scaffold; it has no stakeholder routes.

Expected: documents → extraction review → roadmap → newcomer approval → application → trust passport. Actual: blocked before document upload. This prevents the complete three-minute product rehearsal. Screens/flow implementation belongs to the existing owners; QA has not rebuilt them.

Evidence: [newcomer 404](screenshots/candidate-newcomer-404.jpg), [Employer overview](screenshots/candidate-employer-desktop.jpg).

### B2 — P1: duplicate simultaneous approval executes twice

Candidate `AgentRuntime.decide` reads `awaiting_approval`, then awaits Guard before claiming the proposal. Two identical requests pass that state check and execute the same action. The existing serial replay test passes but misses this race.

1. Start the built `cd0470f` app in `RASIKH_AI_MODE=demo`, using a healthy actual main Guard.
2. Extract the synthetic passport, confirm review and capture the exact proposal id/digest.
3. Send two simultaneous `POST /api/agent/journey` requests with identical approved proposal data.
4. Observe two HTTP 200 `executed` responses, identical mock action reference and two `action_executed` audit entries.

Actual **5/5 API trials** and **5/5 instrumented runtime trials** executed twice. Expected: at most one downstream action. The downstream tool is an in-memory employer request; no email was sent.

Executable repro: `node docs/qa/repro/concurrent-approval.mjs http://127.0.0.1:3107 5`. Exit **1** intentionally means duplicate execution was detected. [Script](repro/concurrent-approval.mjs); [sanitized observed evidence](evidence/consent-guard-summary.json).

Proposed owner fix: atomically claim the proposal before awaiting Guard, reject simultaneous duplicates, restore retryability after a denied/unavailable check, and pass the proposal id as downstream idempotency key. Add a meaningful concurrent regression test. No runtime patch is included in this QA PR.

### B3 — P1: distinct roles are shells, not working experiences

Exact browser clicks at `cd0470f`:

| Click / route | Actual result | Missing action |
| --- | --- | --- |
| Employer → Hires | “No hires yet” | No add/back hire action despite copy saying to add one |
| Employer → Setup roadmap | “No expansion started” | No intake or setup action |
| Employer → Team move | “Nobody is moving yet” | No team workflow |
| Employer → Guard log | “No checks yet” | No integrated Guard evidence view |
| Landlord → Applications | “No applications yet” | No approve/request-info/terms action |
| Landlord → Properties | “No properties listed” | No property action |
| Bank → Applications | “No pending applications” | No account decision action |
| Bank → Employer partners | “No employer partners” | No partner workflow |

The three roles have different names, navigation and fixed avatars, but nine stakeholder pages use `EmptyPage`. Employer organization selection can change the header to Northwind Analytics using mouse or ArrowDown/Enter. It does not change business data, does not synchronize to another tab and returns to Gulf Meridian on remount/reload. Landlord/Bank each offer only one organization. Avatars are fixed; no persona selector is available.

Evidence: [organization selection](screenshots/candidate-org-selection.jpg), [Landlord dark theme](screenshots/candidate-landlord-dark.jpg).

### B4 — P1: business synchronization, reset and trust-passport consent are unavailable

Open two tabs on `/employer`. Select Northwind in tab A; tab B remains Gulf Meridian. Toggle theme in A; B does change theme, proving only theme storage synchronization in this test. There is no business store/subscription or “Reset demo” control in the candidate, and no UI/API for trust-passport consent grant/revoke. Reloading restores a shell, not a coherent seeded multi-party demo.

Direct Guard consent checks pass below, but those do not establish newcomer UI consent. Reset cannot be marked passing. Contract reset order remains app → TAMM → Guard; it must be implemented and checked on the integrated candidate. Do not reset another engineer’s shared sidecar.

### B5 — P1: shipping the old candidate Guard reintroduces verified permission failures

Original candidate Guard 1.0.0: **13/25 forbidden attacks denied, 12/25 forbidden actions allowed (48%)**. Fresh summary references shed previously observed labels. Example: observe a salary-labelled reference; check `send_redacted_summary` to landlord with no labels and a fresh unlabelled reference. Actual old response: `allow / no_labelled_data.allowed`.

**Fixed on main `63b5b82`:** the same 25 actual HTTP probes all return explicit deny, including that salary case (`salary.landlord.derived_only`). Main method errors also return versioned JSON. This is a stale-integration release blocker, not an outstanding failure of the repaired main Guard. Include the repaired sidecar in the final release and retest the deployed composition. Preserve the old failing evidence rather than overwriting it with new success.

### B6 — release gate: final judge URL/access mode unknown

The repository homepage is unset, releases/deployments are empty, and no supplied PR discussion identifies the final demo URL. Local tested role pages and the API do not require login; that says nothing about judge access to the final deployment.

Coordinator request: supply the exact release SHA, final URL and intended mode (public synthetic demo or authenticated access with a judge route). Then verify in a fresh browser session without existing credentials, including direct route loads, refresh, services and reset. Public API ownership is currently caller-asserted `confirmed_by`/`approved_by: newcomer`; it is not authenticated permission evidence. Real personal documents are outside this QA’s synthetic scope.

### B7 — P1 for requested Arabic scope; P2 phone/keyboard defects

- No language control or Arabic translations exist; HTML is `lang=en dir=ltr`. English labels remain throughout. Actual Arabic/RTL behavior is **unavailable**, not passing.
- At 320 px, document scroll widths are 344 px Employer/Bank and 337 px Landlord. Bank avatar extends to x=344. At 375 and 390 px the checked shells fit the viewport; populated workflow layouts remain untested. [320 px overflow](screenshots/candidate-bank-320-overflow.jpg), [375 px dark shell](screenshots/candidate-employer-phone-dark.jpg).
- At 375 px, opening navigation leaves focus on the trigger; pressing Tab moves to the background Rasikh link. No drawer focus transfer/trap. Escape does close it. Stakeholder view links disappear below 768 px without a mobile replacement.
- Organization menu ArrowDown/Enter works, and both light/dark theme controls work. Those small successes do not establish whole-product accessibility.

## Actual test results

Every pass below comes from this QA’s execution. Initial sandbox/network/socket failures were retried with scoped permissions; their logs remain preserved locally. Root scripts cover only web/shared on the candidate, so engine/evals/TAMM were checked separately after locked package installs.

| Source and exact command | Result |
| --- | --- |
| Candidate root `npm ci`; `npm run build`; `npm run typecheck`; `npm run lint` | PASS, production build generates 15 pages, no newcomer route |
| Candidate `npm run test:agent -w @rasikh/web` | 32 pass; real-Guard suite skipped in default run |
| Candidate `RASIKH_GUARD_E2E=1 RASIKH_GUARD_URL=http://127.0.0.1:18888 npm run test:agent -w @rasikh/web` | 33 pass, no skips; actual main Guard |
| `packages/rasikh-engine`: `npm test`; `npm run typecheck` | 84 pass; typecheck PASS |
| `packages/rasikh-evals`: `npm test`; `npm run typecheck` | 89 pass; typecheck PASS |
| `packages/tamm-mcp`: `npm test`; `npm run typecheck`; `npm run build` | 46 pass; typecheck/build PASS; mocked backend |
| Evals `npm run eval -- --mode demo --guard cached --runs 3 --output <owned-artifact-dir>` | 225/225 cached cases pass; **0/75 verified HTTP Guard checks** |
| Original Guard `cargo test --locked --manifest-path packages/rasikh-guard/Cargo.toml -p rasikh-guard` with owned target dir | 96 pass; independent adversarial HTTP suite still fails 12 attacks |
| Main Guard `63b5b82`, same locked cargo command from extracted source | 110 pass; independent HTTP attacks 25/25 explicit denies; consent/error cases 11/11 |
| Main `63b5b82`, clean root install/build/typecheck | Build FAIL (exit 1), typecheck FAIL (exit 2): root tsconfig includes standalone TAMM without root-installed `zod`; lint PASS |
| Main `966a01d`, `npm run build`; `npm run typecheck`; `npm run lint` after PR #29 | PASS; effective TypeScript inputs exclude packages; only `/` and `/_not-found` build |
| Main data package `npm run typecheck`; unit tests | Typecheck PASS; 9/9 unit tests pass |
| Firestore rules emulator test | NOT RUN: Firebase tools require JDK 21+, installed JDK is Corretto 11; command stops before any rule test |
| Production API concurrent approval probe | FAIL: double execution in 5/5 trials |

Raw local logs are retained under the isolated checkout’s ignored `artifacts/build-qa`, `artifacts/security-qa`, and report checkout’s `artifacts/build-qa-main`. Public sanitized security results and executable race reproduction are committed beside this report. No provider credentials or real documents are included.

### Consent and downstream boundary evidence

Using a freshly built actual main Guard: observed passport→landlord is `needs_consent`; newcomer grant makes it `allow`; bank remains `needs_consent`; DELETE immediately returns the landlord to `needs_consent`. Raw salary→landlord cannot be granted (400), employer cannot grant newcomer consent (400), and newest-first logs reflect those checks. Demo-off reset returns 404 without clearing state.

| Instrumented runtime scenario, candidate app + main Guard | Result | Model/extractor calls | Downstream mock calls |
| --- | --- | ---: | ---: |
| Guard explicitly denies employer action after observing health | `guard_denied` | 1 deterministic extraction | **0** |
| Guard unavailable before extraction | blocked, `guard_unavailable`, fail-closed | **0** | **0** |
| Guard unavailable after review, before action | `guard_unavailable`, remains awaiting approval | 1 deterministic extraction | **0** |
| Newcomer declines | rejected | 1 deterministic extraction | **0** |
| Identical concurrent approvals with healthy Guard | executed twice | 1 deterministic extraction | **2 (FAIL)** |

Unavailable Guard is a transport failure, not a verified policy denial. Unit tests also verify mocked `deny`, `needs_consent`, malformed replies and unavailable Guard stop extraction/actions. TAMM’s recording fake-Guard tests confirm denied/consent-required `start_application` and tenancy registration create no backend application. Actual HTTP Guard tests check decisions without forwarding payloads to any real destination.

## Working partial journey, rehearsal and reset

The working **API-only partial journey** is deterministic passport text extraction → human confirm/correct → grounded employer-document recommendation and illustrative estimate → approved in-memory employer request with Guard audit. Provider is `none`, `live_model_call=false`. It does not upload files, submit a TAMM application, reach landlord/bank decisions or produce a trust passport. OpenAI adapter tests use fake transports; historical Vertex evals are not evidence of an OpenAI or current app call.

Exact successful UI smoke sequence: open `/employer` → Hires → organization menu → Northwind Analytics → theme toggle → Landlord → Properties → Bank → Employer partners. Expected and actual: navigation and shell headings change; themes change. No business workflow is completed by these clicks.

**Three-minute complete product rehearsal: BLOCKED, not completed.** Attempted start: `/newcomer` returns 404; Employer → Hires offers no Add hire. There are no exact working document/review/approval/application/passport clicks to record. The coordinator must supply the integrated flow before QA can truthfully time it.

Acceptance timing for that future recheck (not a claimed rehearsal): 0:00–0:30 reset and select seeded hire; 0:30–1:00 upload synthetic passport and review/correct extraction; 1:00–1:30 inspect dependency roadmap and exact action approval; 1:30–2:00 deny raw salary sharing, grant only intended scope/derived affordability and submit; 2:00–2:30 partner decision and second-tab update; 2:30–3:00 trust passport, revoke and verify the next send stops. Record the **actual** final UI labels and clicks then.

Current local cleanup: restart only the owned app to clear its in-memory journey/mock requests; recreate only owned Guard sessions. This is an environment cleanup, not a coherent product “Reset demo” pass. Final reset must restore seeded app data, clear owned TAMM applications, then clear owned Guard sessions/consents/logs in the contract order, and update the other tab.

## Proposed fixes and next release check

1. Runtime owner fixes the concurrent approval race with an atomic claim/idempotency check.
2. Coordinator assembles one app entry point and the repaired Guard/TAMM/data versions, then supplies one release SHA. Main root build fix passed independent verification; the marketing landing animation must not be treated as live Guard evidence.
3. Screen/state owners complete the missing journey, role actions, consent UI, sync/reset and requested language mode. Small shell fixes can shrink the organization control at 320 px and add mobile drawer focus management/view switching after journey blockers.
4. Coordinator supplies judge URL and access mode. QA rechecks affected flows and records the exact timed three-minute script before 15:30 target submission. At 15:45 Dubai, hard code freeze applies; after final submission, do not alter judged code.

This PR changes QA documentation, synthetic evidence and a standalone reproducer only. It does not deploy, rewrite shared history or overwrite an engineer’s screens. Release remains unverified until the integration/access gates above are met.
