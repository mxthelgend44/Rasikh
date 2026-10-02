# Devin log: rasikh-guard and tamm-mcp

Owner: Devin. Scope: `packages/rasikh-guard`, `packages/tamm-mcp`, and their CI (`.github/workflows/integrations.yml`).
Contract: `INTEGRATION.md` v1.1.0 (1.1.0 adds optional `service_tags` on `/check`, merged in PR #6).

## Built

| Milestone | Status | Notes |
| --- | --- | --- |
| Guard 1: vendor pinned OpenAPPA | done | `appa-runtime-api`, `appa-engine`, `appa-policy` at `5060566a`, byte-identical; 571 upstream tests pass unchanged |
| Guard 2: Rasikh TOML policy | done | `policies/rasikh.toml`, full 9x7 matrix, disclaimer in header, loader refuses gaps |
| Guard 3: consent | done | per session, one label + one destination, revocable, optional expiry, only on `consent` cells |
| Guard 4: sidecar | done | every endpoint in 3.3, `/check` p95 ~1 ms locally |
| Guard 5: tests | done | 63 rule tests + coverage check, 21 adversarial, 6 loader, 5 HTTP (96) |
| Guard 6: Docker | done | `docker compose up --build`; image built and verified (`/health`, `/check`, `/dev/reset`) |
| TAMM 1-7 | done | six tools, catalogue, state machine + demo mode, simulated UAE PASS, `TammBackend`, Guard gate, 46 tests |
| CI | written, not running on GitHub | every step passes locally; GitHub registered no workflow runs (see Open) |

End-to-end check (real binaries): a TAMM `start_application` carrying health was allowed for `svc_health_insurance`, and
denied for `svc_residency_visa` with `health.tamm.insurance_only`. The Guard log showed both, newest first.

## Decisions

- **Built to the owner's INTEGRATION.md, not my early draft.** My first contract and TAMM cut came from a truncated
  paste. Once the full text landed, tamm-mcp was rebuilt to it (ids, shapes, error codes, `/dev/advance`).
- **Guard decisions come from the Rasikh evaluator (`sidecar/src/decide.rs`), not from `appa-engine`.** Driving the
  engine means compiling the matrix into OpenAPPA's audience/trust dialect and replaying trajectories through the
  runtime, which is not vendored. The Rasikh layer follows the same approach (labels follow observed data into later
  calls and are checked where the data leaves), and the engine stays vendored and tested for that integration.
- **Taint model.** Observed refs keep their observed labels and `derived` flag, so they cannot be re-declared away.
  Unobserved refs carry what they declare (this is the path for redaction and derived signals). Calls with no refs
  inherit the whole session.
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

1. `packages/shared` `GuardCheckRequest` needs the optional `service_tags?: string[]` from contract 1.1.0 (owned by the web agent).
2. Route `/check` through `appa-engine` (see Decisions).
3. PRs #1 to #6 on mxthelgend44/Rasikh are stacked on `main` and contain only Devin-owned paths. `devin/integrations` also carries the web agent's commits; merging it into `main` conflicts on root README.md, package.json and package-lock.json, which the web agent owns.
4. CI runs on GitHub (it started once the workflow reached `main`).
5. tamm-mcp mirrors `packages/shared` enums locally until it joins the npm workspaces (DECISIONS.md, Session 11).
6. The web agent's open questions (DECISIONS.md) on `case_type` and `/observe` `source`: Guard accepts any non-empty
   `case_type` and any `Destination` as `source`, which matches their proposals.
7. No ownership check on `get_application_status` (any simulated session can read any id).
