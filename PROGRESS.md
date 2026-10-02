# Progress

Last updated: 2026-10-02, end of Session 1.

## Where things stand

Session 1 is done: the base shell matches the OpenAI Platform references within 1 to 2 px on every edge, in light and dark, and passes an axe-core WCAG 2.1 AA audit. The scope update (Abu Dhabi positioning, company expansion, TAMM MCP and Rasikh Guard integrations) is applied to the plan, the repo structure and the contract. Session 2 (data model and live sync) is next.

## Session plan

| #   | Session                                                                               | Status  |
| --- | ------------------------------------------------------------------------------------- | ------- |
| 1   | Recon and design system, scaffold, base shell                                         | Done    |
| 2   | Data model and live sync (Abu Dhabi seed data, Expansion and Guard entities included) | Next    |
| 3   | Newcomer app                                                                          | Planned |
| 4   | Employer dashboard                                                                    | Planned |
| 5   | Landlord and bank dashboards                                                          | Planned |
| 6   | AI agent (extraction, roadmap, loop with tools, risk summaries, demo mode)            | Planned |
| 7   | Demo polish, both paths scripted, reset button, QA                                    | Planned |
| 8   | Abu Dhabi context pass across all existing screens and data                           | Planned |
| 9   | Company expansion module                                                              | Planned |
| 10  | Integration clients, stubs, Guard log, blocked-action demo moment                     | Planned |
| 11  | Swap stubs for the real packages once they land, end-to-end test of both demo paths   | Planned |

Note on Session 8: Abu Dhabi context is applied from the Session 2 seed onward, so Session 8 is an audit of names, areas, copy, currency and date formats, not a retrofit.

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
