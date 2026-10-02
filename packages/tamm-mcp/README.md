# TAMM MCP server (mock)

An [MCP](https://modelcontextprotocol.io) server that gives the Rasikh agent access to Abu Dhabi government services
in the style of TAMM. **There is no public TAMM API in use: everything is served from a mocked catalogue.** Every
tool response carries `"mock": true`, and every fee, duration and document carries `"illustrative": true`. None of it is
an official statement of fees, durations or legal requirements.

The contract is in the repo-root [`INTEGRATION.md`](../../INTEGRATION.md), section 4. This package implements v1.1.0.

## Tools

| Tool                        | What it does                                                      | Rasikh Guard |
| --------------------------- | ----------------------------------------------------------------- | ------------ |
| `search_services`           | Free-text search of the catalogue for one audience                | no           |
| `get_service_requirements`  | Documents, prerequisites, estimated fee and duration              | no           |
| `start_application`         | Submits an application with `documents`                           | **yes**      |
| `get_application_status`    | Status, history and `needs_info`                                  | no           |
| `check_trade_name`          | Availability check (illustrative naming rules)                    | no           |
| `register_tenancy_tawtheeq` | Demo shortcut: `start_application` on `svc_tawtheeq_register`     | **yes**      |

Every tool needs `uaepass_session`. The two data-sending tools also take `guard_session_id` (INTEGRATION.md 4.3).

## How a call runs

`src/tools/pipeline.ts` holds the only two paths a tool call can take:

- `withSession`: the `uaepass_session` must come from `POST /dev/uaepass/login`. **This is a simulated UAE PASS.** No
  real identity provider is involved. An unknown session returns `unknown_session`.
- `withGuard` (data-sending tools): after the session check and the service lookup, the server calls Guard `POST /check`
  with `destination: "tamm"`, the tool name, the labels of every document, the refs, and the service's tags. The backend is
  called **only on `allow`**:
  - `deny` or `needs_consent` returns `{ denied: true, guard: { decision, reason, policy_rule } }`, and nothing is created.
  - If Guard is unreachable, times out (2 s) or answers badly, the call fails closed with `guard_unavailable`.

`register_tenancy_tawtheeq` takes only `lease_ref` and `applicant_ref`. The documents it sends are derived from the
Tawtheeq requirements: the lease (`address`), plus `doc_<label>_<applicant_ref>` for the tenant's passport and Emirates
ID (the fixture convention from INTEGRATION.md 5, e.g. `doc_passport_hire_demo_001`).

All data access goes through the `TammBackend` interface (`src/backend/types.ts`). `MockTammBackend` is the only
implementation. A real backend can replace it in `src/index.ts` without touching tool code.

## Application lifecycle (INTEGRATION.md 4.5)

```
submitted -> under_review -> approved
                          -> needs_info -> under_review
                          -> rejected
```

Each service follows an illustrative `review_script` in `data/catalogue.json`. Scripts are validated on load.

- **Demo mode** (`RASIKH_DEMO_MODE=1`): applications move only when `POST /dev/advance {"application_id": ...}` is
  called, one scripted step at a time. `POST /dev/reset` clears applications and simulated sessions. Both return
  `404 demo_mode_only` when demo mode is off.
- **Normal mode**: each step comes due after `TAMM_STEP_SECONDS` plus a random delay of up to the same amount
  (default 20 s + 0-20 s), and is applied on the next read.

## Run

```sh
cd packages/tamm-mcp
npm install
npm run dev                          # Streamable HTTP on http://localhost:8790/mcp
RASIKH_DEMO_MODE=1 npm run dev       # deterministic demo mode
npm run dev:stdio                    # also serves MCP over stdio (HTTP dev endpoints stay up)
npm run build && npm start           # compiled
```

| Variable            | Default                     | Meaning                                       |
| ------------------- | --------------------------- | --------------------------------------------- |
| `TAMM_MCP_URL`      | `http://localhost:8790/mcp` | Port and path the server listens on           |
| `TAMM_MCP_HOST`     | `127.0.0.1`                 | Bind address (`0.0.0.0` in containers)        |
| `RASIKH_GUARD_URL`  | `http://localhost:8787`     | Rasikh Guard sidecar                          |
| `RASIKH_DEMO_MODE`  | `0`                         | `1` = deterministic demo mode + dev endpoints |
| `TAMM_STEP_SECONDS` | `20`                        | Normal-mode base delay per status step        |

```sh
curl -s localhost:8790/dev/uaepass/login -H 'content-type: application/json' \
  -d '{"subject_ref":"hire_demo_001","audience":"individual"}'
```

## Test

```sh
npm run typecheck
npm test
```

Tool tests drive the server through a real MCP client over an in-memory transport, with a recording fake Guard. The
HTTP tests run the Express app on a random port and use the SDK's Streamable HTTP client.

## Known limits

- Mock only. The catalogue, naming rules and review scripts are illustrative, and state is in memory, so a restart clears it.
- Free zone services (ADGM, KEZAD, Masdar City Free Zone, twofour54) are handled on those entities' own portals in reality.
  The mock lists them so the expansion demo can route to them.
- **Health to TAMM** passes Guard only with the service's `service_tags` (contract 1.1.0), which this server always sends.
- Read-only tools do not call Guard, because the contract gives them no `guard_session_id`. A personal detail typed into a
  `search_services` query is therefore not checked.
- No per-user ownership check on `get_application_status`: any valid simulated session can read any application id.
- Enums mirror `packages/shared` as zod schemas in `src/contract.ts`. This package is not an npm workspace yet (DECISIONS.md).
