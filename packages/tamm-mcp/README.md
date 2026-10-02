# TAMM MCP server (mock)

An [MCP](https://modelcontextprotocol.io) server that gives the Rasikh agent access to Abu Dhabi government services
in the style of TAMM. **There is no public TAMM API in use: everything is served from a mocked catalogue.** Every
tool response carries `"mock": true`, and every fee, processing time, requirement and review script carries
`"illustrative": true`. None of it is an official statement of fees, durations or legal requirements.

The contract is in the repo-root `INTEGRATION.md`, section 4.

## Tools

| Tool                        | What it does                                                    | Session audience |
| --------------------------- | --------------------------------------------------------------- | ---------------- |
| `search_services`           | Free-text search of the catalogue for one audience              | any              |
| `get_service_requirements`  | Documents, fee and processing time for a service (illustrative) | any              |
| `start_application`         | Submits an application with `payload_refs`                      | service's        |
| `get_application_status`    | Status and history of the caller's application                  | owner only       |
| `check_trade_name`          | Availability and naming-rule check (illustrative rules)         | business         |
| `register_tenancy_tawtheeq` | Registers a tenancy contract through Tawtheeq                   | individual       |

Every tool takes `uaepass_session` and `guard_session_id`.

## How a call runs

`src/tools/pipeline.ts` is the only path a tool call can take:

1. **Simulated UAE PASS.** The `uaepass_session` must come from `POST /dev/uaepass/login`. This is a simulation. No real
   identity provider is involved.
2. **Service lookup** (tools that target a service), so Guard can see the service's tags.
3. **Rasikh Guard `/check`** with `destination: "tamm"`, the tool name, the labels of every payload ref, and the service tags.
4. **Execute only on `allow`.** Anything else, including Guard being unreachable (fail closed), returns a structured
   denial with `isError: true`, and the backend is never called.

All data access goes through the `TammBackend` interface (`src/backend/types.ts`). `MockTammBackend` is the only
implementation. A real backend can replace it in `src/index.ts` without touching tool code.

## Application lifecycle

`submitted → under_review → (needs_info → under_review)* → approved | rejected`, following each service's illustrative
`review_script` in `data/catalogue.json`.

- **Demo mode** (`RASIKH_DEMO_MODE=1`): each `get_application_status` call advances exactly one step. Deterministic for scripted demos.
- **Clock mode** (default): one step per `TAMM_STEP_SECONDS` (default 30) after submission.

## Run

```sh
cd packages/tamm-mcp
npm install
npm run dev                 # Streamable HTTP on http://localhost:8790/mcp
npm run dev:stdio           # also serves MCP over stdio (HTTP dev endpoints stay up)
npm run build && npm start  # compiled
```

| Variable            | Default                     | Meaning                                    |
| ------------------- | --------------------------- | ------------------------------------------ |
| `TAMM_MCP_URL`      | `http://localhost:8790/mcp` | Port and path the server listens on        |
| `TAMM_MCP_HOST`     | `127.0.0.1`                 | Bind address (`0.0.0.0` in containers)     |
| `RASIKH_GUARD_URL`  | `http://localhost:8787`     | Rasikh Guard sidecar                       |
| `RASIKH_DEMO_MODE`  | unset                       | `1` = deterministic demo progression       |
| `TAMM_STEP_SECONDS` | `30`                        | Clock-mode seconds per status step         |

Get a simulated UAE PASS session:

```sh
curl -s localhost:8790/dev/uaepass/login -H 'content-type: application/json' \
  -d '{"subject_ref":"hire_demo_001","audience":"individual"}'
```

## Test

```sh
npm run typecheck
npm test
```

The tests drive the server through a real MCP client over an in-memory transport, with a recording fake Guard.

## Known limits

- Mock only: the catalogue, naming rules and review scripts are illustrative, and state is in memory, so a restart clears it.
- Free-zone services (ADGM, KEZAD, Masdar City Free Zone, twofour54) are run on those entities' own portals in reality
  (`channel: "entity_portal"`). The mock still lets you "apply" so the demo flow is continuous.
- `search_services` takes free text. Guard sees no payload refs for it, so anything personal the agent types into a query is not labelled.
- Types mirror INTEGRATION.md section 2 locally (`src/contract.ts`) until `packages/shared` exists.
