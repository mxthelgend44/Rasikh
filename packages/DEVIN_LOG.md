# Devin log: rasikh-guard, tamm-mcp and rasikh-data

Owner: Devin. Scope: `packages/rasikh-guard`, `packages/tamm-mcp`, `packages/rasikh-data`, and their CI
(`.github/workflows/integrations.yml`, `publish-integrations.yml`). Contract: `INTEGRATION.md` v1.2.0.

## Built

| Milestone | Status | Notes |
| --- | --- | --- |
| Guard 1: vendor pinned OpenAPPA | done | `appa-runtime-api`, `appa-engine`, `appa-policy` at `5060566a`, byte-identical; 571 upstream tests pass unchanged |
| Guard 2: Rasikh TOML policy | done | `policies/rasikh.toml`, full 9x7 matrix, disclaimer in header, loader refuses gaps |
| Guard 3: consent | done | per session, one label + one destination, revocable, optional expiry, only on `consent` cells |
| Guard 4: sidecar | done | every endpoint in 3.3, `/check` p95 ~1 ms locally |
| Guard 5: tests | done | 63 rule tests + coverage check, 25 adversarial, 6 loader, 6 HTTP, 3 OpenAPPA bridge (104) |
| Guard 6: Docker | done | `docker compose up --build`; image built and verified (`/health`, `/check`, `/dev/reset`) |
| TAMM 1-7 | done | six tools, catalogue, state machine + demo mode, simulated UAE PASS, `TammBackend`, Guard gate, owner-only status reads, 47 tests |
| Guard 7: remedies (1.2.0) | done | verified minimal fix per refusal + `allowed_destinations`; following the remedy reaches allow for all 37 refused cells (110 tests) |
| TAMM 8: search and planning (1.2.0) | done | BM25 with synonyms, Arabic normalisation, one-edit typo tolerance; topological prerequisite order and readiness gap (60 tests) |
| Data: `packages/rasikh-data` | done | Firestore schema, validating converters, typed refs and queries, rules, indexes, trust passport sync; 9 unit + 11 emulator rules tests |
| Guard 8: laws and exact remedy search | done | 10 property-based security laws (2,000 cases each in CI, 50,000 checked locally); they found and pinned two declared-label flaws; minimum-cost remedy search when steps interact (123 tests) |
| TAMM 9: single flight and prefix search | done | identical racing data-sending calls run once (release QA B2 pattern), prefix matching for half-typed words (70 tests) |
| CI | done | `integrations.yml` on every change; `publish-integrations.yml` pushes `ghcr.io/mxthelgend44/rasikh-guard` and `rasikh-tamm-mcp` after CI passes on main |

End-to-end check (real binaries): a TAMM `start_application` carrying health was allowed for `svc_health_insurance`, and
denied for `svc_residency_visa` with `health.tamm.insurance_only`. The Guard log showed both, newest first.

## Decisions

- **Built to the owner's INTEGRATION.md, not my early draft.** My first contract and TAMM cut came from a truncated
  paste. Once the full text landed, tamm-mcp was rebuilt to it (ids, shapes, error codes, `/dev/advance`).
- **OpenAPPA's label algebra is the allow gate.** Each flowing label becomes an `appa_engine::label::Label` whose
  audience is the destinations it may reach in this context, and the call's label is the engine's meet (`Label::combine`).
  Only an audience that admits the destination allows (`sidecar/src/appa.rs`). Making the gate refuse everything fails
  55 of 104 tests, so it is load-bearing. The engine's trajectory runtime (tool contracts, remedy plans) is not used:
  it needs the unvendored OpenAPPA runtime, and Guard's session store covers observations and consent.
- **Taint model (contract 1.1.1).** Observed refs keep their observed labels and `derived` flag, so they cannot be
  re-declared away. Unobserved refs and ref-less calls are agent content and inherit the whole session, so redacted refs
  and derived signals must be observed first. The first version trusted unobserved refs; the independent evaluation in
  `packages/rasikh-evals` (Codex PR #11) found that 12 of 25 attacks passed that way. Fixed, and those attacks are now regression tests.
- **Only the data-sending TAMM tools call Guard** (`start_application`, `register_tenancy_tawtheeq`). The brief said every
  tool call; the contract gives `guard_session_id` only to those two, and the contract wins.
- **`register_tenancy_tawtheeq` derives its documents**: the lease as `address`, plus `doc_<label>_<applicant_ref>` for the
  passport and Emirates ID, following the fixture `doc_passport_hire_demo_001`.
- **Guard unreachable on the TAMM side** returns `guard_unavailable` (section 6), not a denial body.
- **Consent cannot unlock `deny`, `derived_only` and similar cells.** `POST /consent` on those returns `invalid_request`.
- **Guard listens on both loopbacks.** On Windows, `localhost` tries `::1` first, which cost about 200 ms per `/check`.
- **No vitest.** vitest 5's optional peer deps crash npm's arborist (`edgesOut`). Tests use `node:test` + `tsx`.
- Dependencies are pinned to versions at least 7 days old; Rust crates reuse the versions in upstream's lockfile.

## Open

0. **Web app and engine wiring was deferred on purpose.** The root app (`src/`) gets frequent commits from firas256, and
   Codex has open PRs #20 to #25 on `packages/rasikh-engine` and `rasikh-evals`. The integration surface is ready for them:
   remedies, routing, ranked search, readiness and `@rasikh/data`. Codex PR #25 proposes a second "1.2"; I asked it to
   rebase as 1.3.0 (comment on #25).

1. `packages/shared` (web agent): `service_tags?: string[]` on `GuardCheckRequest` and `CONTRACT_VERSION = '1.1.1'`, proposed in a PR against `devin/integrations` (where `packages/shared` lives).
2. `devin/integrations` also carries the web agent's commits. Merging it into `main` conflicts on root README.md, package.json and package-lock.json, which the web agent owns.
3. The Codex evaluation harness (`packages/rasikh-evals`, PR #11) pins contract 1.0.0 in its health check and still reports the pre-fix numbers. On the fixed Guard it measures 0/25 forbidden allows once the version pin is relaxed.
4. tamm-mcp mirrors `packages/shared` enums locally until it joins the npm workspaces (DECISIONS.md, Session 11).
5. The web agent's open questions (DECISIONS.md) on `case_type` and `/observe` `source`: Guard accepts any non-empty
   `case_type` and any `Destination` as `source`, which matches their proposals.
