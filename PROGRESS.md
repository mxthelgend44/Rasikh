# Progress

Last updated: 2026-10-02, Session 3 partly done (usage limit reached).

## Where things stand

Sessions 1 and 2 are done.

- **Session 1.** The base shell matches the OpenAI Platform references within 1 to 2 px on every edge, in light and dark, and passes an axe-core WCAG 2.1 AA audit. The scope update (Abu Dhabi positioning, company expansion, TAMM MCP and Rasikh Guard integrations) is applied to the plan, the repo structure and the contract.
- **Session 2.** One domain model with an Abu Dhabi seed, pure reducers, and live sync over Server-Sent Events. A change made in one browser tab appears in another within about 15 to 40 ms (verified in two real browser tabs), and 55 tests pass.

Session 3 (newcomer app) is in progress: shell, roadmap and Arabic RTL foundation are built; documents, agent feed and trust passport views are next.

## Session plan

| #   | Session                                                                               | Status      |
| --- | ------------------------------------------------------------------------------------- | ----------- |
| 1   | Recon and design system, scaffold, base shell                                         | Done        |
| 2   | Data model and live sync (Abu Dhabi seed data, Expansion and Guard entities included) | Done        |
| 3   | Newcomer app                                                                          | In progress |
| 4   | Employer dashboard                                                                    | Planned     |
| 5   | Landlord and bank dashboards                                                          | Planned     |
| 6   | AI agent (extraction, roadmap, loop with tools, risk summaries, demo mode)            | Planned     |
| 7   | Demo polish, both paths scripted, reset button, QA                                    | Planned     |
| 8   | Abu Dhabi context pass across all existing screens and data                           | Planned     |
| 9   | Company expansion module                                                              | Planned     |
| 10  | Integration clients, stubs, Guard log, blocked-action demo moment                     | Planned     |
| 11  | Swap stubs for the real packages once they land, end-to-end test of both demo paths   | Planned     |

Note on Session 8: Abu Dhabi context is applied from the Session 2 seed onward, so Session 8 is an audit of names, areas, copy, currency and date formats, not a retrofit.

## Session 3 so far

Built and committed: mobile-first shell (bottom tabs on phones, top tabs on desktop), roadmap with a dependency rail and why-this-step disclosure, type-checked English and Arabic catalogs, cookie-scoped locale (lang and dir correct on first paint), Noto Sans Arabic, Intl formatters in Abu Dhabi time, the policy matrix mirroring INTEGRATION.md 3.4, demo-mode document extraction, and the reducer rule that completes the documents step once passport, offer letter and degree are verified. 88 tests pass.

Still to build for Session 3: documents view (upload with extraction and confidence), agent feed with approval cards, trust passport (switches over grants), then a phone-width and Arabic quality-gate pass with captures. The i18n keys for those views already exist. Known gaps: agent-written feed text and blocked reasons are English only; extracted values such as salary text are English.

## Reference recon workflow

The recon workflow was stopped at the usage limit. Reports written: dark colour, page layout, tables and feedback, icons and brand, chat and agent, controls, plus the dark-colour verification. Not written: typography, light colour, shell, and the other verifiers. The built shell already matches the references within 1 to 2 px, and the font and light tokens were measured directly, so DESIGN.md stands. Re-run only typography and light-colour measurement if exact values are wanted.

## Done in Session 2

- Domain model for every entity in the brief plus Company, SetupStep, TeamMember, Approval and GuardCheck (`apps/web/src/domain`).
- Roadmap logic: nine step types with dependencies, including "bank account unlocks once the Emirates ID application is in" and "family sponsorship depends on the registered tenancy". Hire stage and status are derived from the steps, so they cannot drift.
- Abu Dhabi seed: a technology employer with nine hires across seven profiles (blocked, waiting, on track, settled), three landlords and eight properties on Al Reem, Al Maryah, Khalifa City and Yas, a bank, nine applications with written risk reasoning, consents and Guard history. All money is `est*` illustrative data.
- Pure `applyAction` reducers for hire creation, backing, step progress with cascade, approvals, landlord and bank decisions, consents, Guard records, company creation and setup progress. Completing a company's visa quota moves its team into the hire pipeline under the contract fixture ids (`hire_demo_002` to `004`).
- Live sync: in-memory server store, `/api/events` Server-Sent Events, `/api/actions`, `/api/state`, `/api/reset`, and a client store that renders the server snapshot first and then streams.
- `/design-system/state`, a developer view of the live data, and `scripts/sync-check.mjs`, which proves cross-tab sync in real headless browsers.
- 55 tests: roadmap, reducers, seed referential integrity, route handlers with two concurrent subscribers, and snapshot ordering.

**Sync check result** (two headless Edge tabs): removing backing in tab A reached tab B in 478 ms on a cold dev route and 41 ms warm; completing a step moved the stage in the other tab in 34 ms; a reset in one tab restored the other in 13 ms.

**Honest gaps.**

- State is in memory, so a server restart returns to the seed. That is intended for the demo, and noted in DECISIONS.md.
- The org switcher is still a label; Session 4 scopes the employer pages by it.
- Reducers trust the shape of the payload beyond the action type. They throw a `DomainError` for anything that does not resolve, but there is no schema validation yet. Add zod at the agent boundary in Session 6.
- Seeded landlord and bank applications exist, but no surface shows them yet (Session 5).

## Done in Session 1

- Studied all 662 reference screenshots (8 survey agents, one per slice) and inventoried fpga-simulator. Catalogues and findings are in `docs/reference-audit/`.
- Fixed the capture scale at 1.27x from two known ChatGPT constants. This corrects fpga-simulator's 1x readings, which ran about 25% too large.
- Monorepo: `apps/web`, `packages/shared`, with `packages/tamm-mcp` and `packages/rasikh-guard` owned by Devin. `INTEGRATION.md` v1.0.0 committed exactly as supplied; `packages/shared` implements its types and closed enums.
- Token layer (light and dark), Geist type scale, shell (top bar, collapsible sidebar, mobile drawer, floating sheet), primitives (Button, Badge, Segmented, Menu, Table, Avatar, Skeleton, EmptyState, PageHeader) and nine routed empty-state pages for employer, landlord and bank.
- `/design-system` tokens and components pages, rendered inside the real shell.
- `scripts/capture.mjs` for reference-sized captures in either theme or direction.
- DESIGN.md, DECISIONS.md, ARCHITECTURE.md, DEMO.md, README.md.

## Quality gate, Session 1

Compared 1:1 and side by side against Platform 95 and 101 (light) and 322 (dark), using `scripts/capture.mjs` at reference geometry.

**Matches.** Sheet left, top, right and bottom edges, the first nav row, group-label rhythm, nav plate size and radius, page-header divider, band table header, status tints, the dark ladder (canvas, sheet, selected, inverted primary), and the 20px icon boxes at 1.65 stroke.

**Fixed during the gate.**

- Theme boot script was missing from server HTML: it imported a constant from a `'use client'` module. Dark mode never applied on reload. Moved the key into a plain module.
- Top bar overflowed horizontally at 390px and pushed the theme toggle and avatar off screen. Wordmark and slash now collapse, the org label truncates.
- Nav icons were 16px boxes; the reference ink needs a 20px box. Stroke 1.75 to 1.65.
- Inter ran 3.5% wide against the reference; switched to Geist after rendering 14 candidates at matched size.
- Dark sheet outline was too visible; gave the sheet its own `edge` token.
- Status tints, page header and geometry recalibrated from 1.25x to 1.27x.
- Tertiary text and placeholders failed contrast (reference grey is 3.4:1 on the frame); darkened.
- Destructive button rendered invisible: stale Next/Tailwind cache. Documented.

**Honest gaps.**

- The typeface is a free stand-in. Letterforms are close but not identical, and Geist reads slightly lighter at weight 500.
- Icons are lucide, not the reference's custom set. Weight and size match; a few glyph shapes differ.
- The reference top-left slot is an avatar and project switcher. Rasikh's is mark, wordmark and organisation switcher, which is deliberate branding.
- Focus ring is a Rasikh choice (2px accent). The references show none.
- Placeholder pages are designed empty states. Real content, charts and dialogs arrive with their sessions.
- Dark hover and a few dark borders are estimated: the dark references contain no hover, focus or status elements.
- Not yet built: input, select, dialog, tooltip, toast, tabs, checkbox and switch primitives. They are built with the first screen that needs them (Session 3 and 4), measured against the controls findings.
- The newcomer mobile shell (bottom navigation, safe areas, Arabic font) is Session 3. The shell already collapses to a drawer and mirrors correctly in RTL.

**Verdict.** The shell is not a generic template and not a typical AI-made dashboard: no gradients, cards, shadows or accent colour in the chrome, and it is dense and left-aligned like the reference. No screen needed to be redone.

## In progress

The reference-recon workflow is still running its last stage (typography, light colour and controls measurement, and an independent verifier for every topic). When it lands, reconcile it into DESIGN.md: confirm the type scale and control geometry, and replace any value that a verifier corrected. Nothing in the built shell is expected to change.

## Known issues

- **Contract conflict.** Devin wrote a divergent INTEGRATION.md from a truncated copy. The owner's complete text is committed and Devin has since realigned `tamm-mcp` to it; the divergent draft is kept at `docs/INTEGRATION.devin-draft.md`. Open clarifications are in DECISIONS.md.
- **Shared working tree.** Devin switched this checkout to `devin/integrations`, so this session's commits are on that branch. Files are staged by explicit path.
- The organisation switcher and signed-in persona are static config until the Session 2 store; switching only changes the label.
- Devin's `tamm-mcp` README says every tool takes `guard_session_id` and that shared types do not exist yet. The contract requires it only on data-sending tools, and `packages/shared` exists on this branch.
