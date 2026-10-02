# Rasikh

The landing OS for Abu Dhabi. Rasikh helps companies set up here and helps their people settle in, with one AI agent running every step across employer, newcomer, landlord and bank.

Hackathon prototype for Hub71 and OpenAI. External parties (TAMM, UAE PASS, landlords, banks) are mocked.

## Layout

| Path | What |
|---|---|
| `apps/web` | Next.js app: newcomer, employer, expansion, landlord and bank surfaces, and the agent |
| `packages/shared` | Contract types shared by every part |
| `packages/rasikh-guard` | Policy sidecar that checks every outbound agent action |
| `packages/tamm-mcp` | MCP server over a mocked TAMM service catalogue |

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

| Variable | Purpose | Default |
|---|---|---|
| `OPENAI_API_KEY` | Live AI mode. Server-side only, never prefixed with `NEXT_PUBLIC_`. | none |
| `RASIKH_AI_MODE` | `demo` for cached deterministic responses, `live` for the OpenAI API | `demo` |
| `RASIKH_GUARD_URL` | Rasikh Guard sidecar | `http://localhost:8787` |
| `TAMM_MCP_URL` | TAMM MCP server | `http://localhost:8790/mcp` |
| `RASIKH_DEMO_MODE` | `1` enables the dev reset and advance endpoints | `0` |

## Demo mode

Demo mode runs the same flows with cached, realistic responses, so the demo never depends on network or latency. It is the default (`RASIKH_AI_MODE=demo`) and needs no API key. The in-app toggle switches between demo and live. The demo script is in [DEMO.md](DEMO.md).

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the web app |
| `npm run build` | Production build |
| `npm run lint` | ESLint across workspaces |
| `npm run typecheck` | TypeScript across workspaces |
| `npm run format:check` | Prettier check |

## Status

See [PROGRESS.md](PROGRESS.md).
