# Rasikh

The landing OS for Abu Dhabi. Rasikh helps companies set up here and helps their people settle in, with one AI agent running every step across employer, newcomer, landlord and bank.

Hackathon prototype for Hub71 and OpenAI. External parties (TAMM, UAE PASS, landlords, banks) are mocked.

## Deployed app

- App: https://rasikh--rasikh-f0207.europe-west4.hosted.app
- Bank surface: https://rasikh--rasikh-f0207.europe-west4.hosted.app/bank

The deployment is run by the main coordinator. The AI journey below needs a reachable Rasikh Guard (`RASIKH_GUARD_URL`); it fails closed without one, so it only works on the deployment if Guard is deployed alongside it.

## Layout

| Path                             | What                                                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`                       | Next.js app: newcomer, employer, expansion, landlord and bank surfaces, and the agent                                        |
| `packages/shared`                | Contract types shared by every part                                                                                          |
| `packages/rasikh-guard`          | Policy sidecar that checks every outbound agent action                                                                       |
| `packages/tamm-mcp`              | MCP server over a mocked TAMM service catalogue                                                                              |
| `packages/rasikh-engine`         | Deterministic, illustrative roadmap, recommendation, risk and simulation engine. No IO, no LLM calls                         |
| `packages/rasikh-evals`          | Synthetic and live evaluation harness (extraction, injection, Guard conformance, document vision, privacy judge, simulation) |
| `apps/web/src/lib/agent-runtime` | App-side AI journey: Guard-gated extraction, review, grounded recommendation, approved action                                |

How the parts talk to each other is defined in [INTEGRATION.md](INTEGRATION.md). Design rules are in [DESIGN.md](DESIGN.md), the system in [ARCHITECTURE.md](ARCHITECTURE.md), the demo in [DEMO.md](DEMO.md), status in [PROGRESS.md](PROGRESS.md) and reasoning in [DECISIONS.md](DECISIONS.md).

## Requirements

- Node 22 or later
- npm 10 or later

## Install and run

```bash
npm install
cp apps/web/.env.example apps/web/.env.local
npm run dev
```

The app is at http://127.0.0.1:3000.

## Environment

Set in `apps/web/.env.local`. See also INTEGRATION.md section 7.

| Variable           | Purpose                                                              | Default                     |
| ------------------ | -------------------------------------------------------------------- | --------------------------- |
| `OPENAI_API_KEY`   | Live AI mode. Server-side only, never prefixed with `NEXT_PUBLIC_`.  | none                        |
| `OPENAI_MODEL`     | Model used in live mode (required with `OPENAI_API_KEY`)             | none                        |
| `RASIKH_AI_MODE`   | `demo` for cached deterministic responses, `live` for the OpenAI API | `demo`                      |
| `RASIKH_GUARD_URL` | Rasikh Guard sidecar                                                 | `http://localhost:8787`     |
| `TAMM_MCP_URL`     | TAMM MCP server                                                      | `http://localhost:8790/mcp` |
| `RASIKH_DEMO_MODE` | `1` enables the dev reset and advance endpoints                      | `0`                         |

## Demo mode

Demo mode runs the same flows with cached, realistic responses, so the demo never depends on network or latency. It is the default (`RASIKH_AI_MODE=demo`) and needs no API key. The in-app toggle switches between demo and live. The demo script is in [DEMO.md](DEMO.md).

## Scripts

| Command                             | Does                         |
| ----------------------------------- | ---------------------------- |
| `npm run dev`                       | Start the web app            |
| `npm run build`                     | Production build             |
| `npm run lint`                      | ESLint across workspaces     |
| `npm run typecheck`                 | TypeScript across workspaces |
| `npm run format:check`              | Prettier check               |
| `npm run test:agent -w @rasikh/web` | AI journey tests             |

## What has been built

- **App shell and surfaces** (`apps/web`): Next.js shell with employer, expansion, landlord and bank routes, a design system and light/dark theme.
- **Contract** (`INTEGRATION.md`, `packages/shared`): closed data labels and destinations, Guard and TAMM wire types, demo fixture ids.
- **Rasikh Guard** (`packages/rasikh-guard`): OpenAPPA-based policy sidecar enforcing the label x destination matrix, consent and indirect-leak tracking.
- **TAMM MCP** (`packages/tamm-mcp`): mocked TAMM catalogue served over MCP. Every response is marked `mock: true`; fees and durations are illustrative.
- **Engine** (`packages/rasikh-engine`): roadmap planning with exact blockers, setup-path and neighbourhood recommendations, risk detection and paired relocation schedule simulation.
- **Evals** (`packages/rasikh-evals`): harness with explicit evidence scope. Existing live runs use Vertex AI and synthetic data; they are not evidence for OpenAI.
- **AI journey** (`apps/web/src/lib/agent-runtime`, PR #27): see below.

## AI journey: document extraction to approved next step

Entry point: `POST /api/agent/journey` with `action` = `extract`, `confirm` or `decide`.

1. **extract**: the app reports the document to Guard (`session`, `observe`) and asks `check` for `extract_document` to `llm_provider`. Only an explicit `allow` lets the document reach the extractor. Output must match a strict schema; each value needs a quote found in the document, otherwise it is dropped. Low-confidence or dropped fields must be corrected by the newcomer.
2. **confirm**: the newcomer confirms or corrects every field (corrections are marked `user_corrected`). The engine then picks the next step. The response separates `extracted_fact`, `estimate` (illustrative) and `recommendation`.
3. **decide**: the newcomer approves the exact proposal (id and digest). Guard checks `request_document` to `employer`; only `allow` runs the action tool. Deny, needs-consent, errors, malformed answers and an unreachable Guard all stop before the tool call.

Audit records hold ids, labels, Guard decision, rule, check id, contract version and provider provenance. They never hold document text, values or evidence quotes.

Modes: `demo` (default) uses a deterministic extractor that makes **no model call** and says so in its provenance (`provider: "none"`, `live_model_call: false`). `live` uses the OpenAI Responses API server-side (`store: false`, strict JSON schema) and needs `OPENAI_API_KEY`, `OPENAI_MODEL` and `acknowledge_provider_disclosure: true` in the request. Live mode never falls back to demo.

Honest limits: no live OpenAI call has been made (no key or network access in the build environment), so the OpenAI adapter is tested only against a fake transport. Offer letters are out of scope (salary may only reach the model redacted). The action tool is an in-memory mock, there is no authentication yet, and journey and audit stores are in memory.

Tests: `npm run test:agent -w @rasikh/web` (32 tests). Add `RASIKH_GUARD_E2E=1` with a running Guard (`RASIKH_DEMO_MODE=1 cargo run --release -p rasikh-guard`) to include the real-sidecar test. More detail in `apps/web/src/lib/agent-runtime/README.md`.

## Status

See [PROGRESS.md](PROGRESS.md).
