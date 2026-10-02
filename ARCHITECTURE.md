# Architecture

Status key: **built** exists and runs, **planned (Session N)** decided, not built yet.

Rasikh is "the landing OS for Abu Dhabi": it helps companies set up here and helps their people settle in, with one agent running every step across employer, newcomer, landlord and bank.

## Repo layout

```
apps/web                 Next.js app and the agent (built: shell, domain, live sync)
packages/shared          Contract types and closed enums (built)
packages/rasikh-guard    OpenAPPA fork, policy sidecar (Devin, in progress)
packages/tamm-mcp        MCP server over a mocked TAMM catalogue (Devin, in progress)
docs/reference-audit     Measured design findings from the reference packs
INTEGRATION.md           The contract between the three parts. Source of truth.
```

`apps/web/src` (planned layout, grows per session):

```
app/                     Routes, one folder per surface
components/ui/           Primitives (Button, Input, Badge, Table, Dialog...)
components/shell/        Sidebar, TopBar, AppShell
components/<surface>/    Surface-specific components
config/                  Nav definitions per surface
integrations/guard/      Guard client + stub (Session 10)
integrations/tamm/       TAMM MCP client + stub (Session 10)
agent/                   Agent loop, tools, prompts, demo cache (Session 6)
lib/                     cn, theme, formatting, i18n
store/                   Client live store and provider (built)
domain/                  Model, roadmap logic, reducers, Abu Dhabi seed (built)
server/                  In-memory store behind the API routes (built)
```

## Surfaces

| Surface                     | Audience                            | Form factor             | Route (planned)              |
| --------------------------- | ----------------------------------- | ----------------------- | ---------------------------- |
| Newcomer                    | Hire                                | Mobile-first web, EN/AR | `/newcomer`                  |
| Employer                    | HR and the paying customer          | Desktop                 | `/employer`                  |
| Expansion (inside employer) | Company opening an Abu Dhabi branch | Desktop                 | `/employer/expansion`        |
| Landlord                    | Property manager                    | Desktop                 | `/landlord`                  |
| Bank                        | Account officer                     | Desktop                 | `/bank`                      |
| Guard log                   | Newcomer and employer               | Both                    | inside newcomer and employer |

All surfaces read and write one data model and update live.

## Data model (built, Session 2)

Defined in `apps/web/src/domain/types.ts`; the seed is `domain/seed`. Ids follow INTEGRATION.md section 5 for fixtures.

- **Employer**, **Landlord**, **Bank**, **Property**: the parties. Properties carry a lease reference and the cheque schedules the landlord accepts.
- **Hire**: an international hire. Optional `companyId` when created by a team move. `backing` holds the employer guarantee.
- **Step**: one roadmap step for a hire, with `dependsOn`, `unlockAfter`, `owner`, `status`, `waitingOn` or `blockedReason`, plain-language `reasoning`, and a TAMM service id where one applies. A hire's stage and status are derived from its steps.
- **RelocationDocument**: file, extracted fields with confidence, verification status, labels, reasoning.
- **AgentAction**: one entry in the agent feed, with what happened, why, and what it waits on.
- **Approval**: a request the agent raises for the newcomer. Approving releases a draft **Application**.
- **Application** and **Decision**: rental or bank account application, with disclosed fields (raw or derived), employer backing, a written **RiskSummary** where every point has a reason, and the landlord's or bank's outcome and terms.
- **Grant**: one consent, label to destination. Mirrors Guard `/consent`. The trust passport is the UI over grants.
- **GuardCheck**: one logged check. Mirrors Guard `/log`.
- **Company**, **SetupStep**, **TeamMember**: company expansion. Completing the visa quota moves the team into the hire pipeline.

Money fields are `est*` illustrative values. All dates come from the demo clock, which starts at 2026-10-10 09:30 +04:00 and advances with real time.

```
domain/types.ts        entities and AppState
domain/roadmap.ts      step specs, buildRoadmap, unlockSteps (shared by hires and company setup)
domain/expansion.ts    company setup steps per jurisdiction
domain/selectors.ts    stage, status, days in relocation, blockers, employer metrics
domain/actions.ts      Action union and applyAction (pure, returns a new state, bumps rev)
domain/reducers/       hire, applications, company, records
domain/seed/           nine hires, parties, applications, consents, Guard history
```

## Live sync (built, Session 2)

```
browser tab  --POST /api/actions-->  Store.dispatch -> applyAction -> rev + 1
    ^                                       |
    |                                       v
    +<---- SSE /api/events (snapshot) <-- every subscriber
```

- `server/store.ts`: one in-memory `Store` per process on `globalThis`. `dispatch`, `reset`, `subscribe`, `snapshot`.
- `app/api/events`: Server-Sent Events. Sends the snapshot on connect and after every change, with a heartbeat.
- `app/api/actions`: validates the action type, applies it, answers with the new snapshot. A `DomainError` is a 400 with its message.
- `app/api/state` and `app/api/reset`: read and reset.
- `store/live-store.ts` and `store/provider.tsx`: the client copy. The root layout renders the current snapshot on the server so there is no empty flash, then the provider opens the stream. A snapshot replaces the copy only if its epoch is new or its revision is higher.

`/design-system/state` is a developer view of this: connection, revision, live hires, and buttons that change records. `node scripts/sync-check.mjs` opens it in two real browser tabs and measures propagation.

The store is in memory by design. Restarting the server, or Reset demo, returns to the seed.

## The agent loop (planned, Session 6)

A real loop with tools: the model proposes a tool call, the app runs it, the result goes back, until the agent has nothing left to do or is waiting on someone.

Tools: `submit_application`, `request_document`, `request_user_approval`, `update_step_status`, `notify_employer`, plus TAMM tools through the MCP client (`search_services`, `get_service_requirements`, `start_application`, `get_application_status`, `check_trade_name`, `register_tenancy_tawtheeq`).

Guard sits in the path of every step (INTEGRATION.md 3.2):

1. The agent reads labelled data: the app calls `POST /observe`.
2. Before anything leaves for any destination, including the LLM provider: `POST /check`.
3. Only `allow` proceeds. `needs_consent` raises a consent prompt in the newcomer app. `deny` shows the reason and stops that action.

Guard is fail-closed. Every AI output shown in the UI carries short plain-sentence reasoning.

### AI modes

- **demo**: cached, realistic responses through the same code path. No network. Default.
- **live**: OpenAI Responses API with structured outputs.

A toggle switches between them. `OPENAI_API_KEY` is read from the environment only.

## Integrations (planned, Session 10)

```
agent / UI  ->  integrations/guard   -> Guard sidecar   (or local stub)
            ->  integrations/tamm    -> TAMM MCP server (or local stub)
```

Each client is one interface with a `live` implementation (HTTP to `RASIKH_GUARD_URL`, MCP over Streamable HTTP to `TAMM_MCP_URL`) and a `stub` implementation that returns realistic responses and enforces the default policy table, so the app runs before the real packages land. Session 11 swaps stubs for the real packages and tests both demo paths end to end.

Clients log a warning when a response `contract_version` differs from `@rasikh/shared`.

## Demo reset (INTEGRATION.md section 5)

"Reset demo" does, in order: app reset, `POST /dev/reset` on TAMM MCP, `POST /dev/reset` on Guard.

## Theming and i18n (built: theme logic; planned: i18n in Session 3)

- Theme: `light | dark | system`, stored in `localStorage` key `rasikh-theme`, applied as the `dark` class on `<html>` by an inline boot script before first paint.
- Direction and language are attributes on `<html>`. All spacing and alignment use logical properties so Arabic RTL needs no overrides.
