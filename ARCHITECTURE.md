# Architecture

Status key: **built** exists and runs, **planned (Session N)** decided, not built yet.

Rasikh is "the landing OS for Abu Dhabi": it helps companies set up here and helps their people settle in, with one agent running every step across employer, newcomer, landlord and bank.

## Repo layout

```
apps/web                 Next.js app and the agent (built: shell only)
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
store/                   Shared state and sync (Session 2)
data/                    Seed data with Abu Dhabi context (Session 2)
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

## Data model (planned, Session 2)

Entities from the original brief plus the scope update. Ids follow INTEGRATION.md section 5 for fixtures.

- **Employer**: company that pays for Rasikh and sponsors hires.
- **Company** (expansion case): foreign company opening an Abu Dhabi branch. Has an `ExpansionIntake`, a `SetupRecommendation` and a list of `SetupStep`.
- **SetupStep**: trade name, licence, office lease, establishment card, visa quota, entity bank account. Each has `dependsOn`, `status`, and the TAMM service it maps to.
- **Hire**: international hire. Optional `companyId` when created by a team move.
- **Step**: one roadmap step for a hire, with `dependsOn`, `owner`, `status`, `waitingOn`, and short plain-language `reasoning`.
- **Document**: uploaded file with extracted fields, confidence per field and verification status.
- **AgentAction**: one entry in the agent feed (tool call, result, reasoning, what it waits on).
- **Approval**: a request the agent raises for the newcomer ("Approve submitting your rental application?").
- **Application**: rental or bank account application with disclosed fields and an explainable risk summary.
- **Decision**: landlord or bank outcome (approve, request info, offer terms).
- **TrustPassportShare**: per (DataLabel, Destination) switch set by the newcomer. Generates Guard consent.
- **GuardCheck**: one logged check (tool, destination, decision, reason, `policy_rule`). Mirrors Guard `/log` entries.

Money is AED. Any fee or duration shown is illustrative and carries `illustrative: true` in code.

## Live sync (planned, Session 2)

Direction: server-authoritative store in Next.js route handlers, changes pushed to every surface over Server-Sent Events, actions sent as POSTs. The agent loop must run server-side (the OpenAI key stays in env), and this also lets the newcomer app on a phone and the employer dashboard on a laptop update each other. Session 2 confirms this and records the final choice in DECISIONS.md.

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
