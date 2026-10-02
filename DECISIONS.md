# Decisions

Every assumption and design or technical decision, with one line of reasoning. Newest sections at the bottom.

## Stack and repo

- **Next.js 15 App Router, React 19, TypeScript strict, Tailwind 3.** Same stack as fpga-simulator, so its patterns and primitives port without translation. Tailwind 3 over 4 for the same reason.
- **npm workspaces monorepo: `apps/web`, `packages/shared`, `packages/tamm-mcp`, `packages/rasikh-guard`.** Matches INTEGRATION.md section 1. npm workspaces need no extra tooling.
- **Only `apps/web` and `packages/shared` are listed as workspaces.** `rasikh-guard` is Rust and `tamm-mcp` is built by another agent; listing a half-built package would let it break `npm install` for everyone. Both join in Session 11.
- **`@rasikh/shared` is consumed as TypeScript source** (`exports` points at `src/index.ts`, `transpilePackages` in `next.config.ts`). No build step to forget before running the app.
- **Closed enums are `as const` arrays with derived types.** The derived unions equal INTEGRATION.md section 2 exactly and the arrays give the UI runtime lists (for example the trust passport toggles).
- **Node 22.** Already installed, and `engines` pins it.
- **Fonts are self-hosted through `@fontsource` packages.** The demo must not depend on a font CDN.
- **`.reference/` is gitignored.** 662 screenshots (about 250 MB) are inputs, not source. Text findings are committed under `docs/reference-audit/`.
- **Line endings pinned to LF** with `.gitattributes`. This machine has `core.autocrlf=true`, which would otherwise rewrite files and fail Prettier's default `lf` check.
- **Repo-local git identity set to `maalh <sometimes7799s@gmail.com>`.** No identity was configured here and the other repo on this machine uses a different one; change with `git config user.name/email` if wrong.
- **Logical CSS properties only (`ms-*`, `pe-*`, `start-*`, `text-start`, `border-s`).** Arabic must be proper RTL; physical left/right utilities are banned in `apps/web/src`.

## Reference packs

- **Every reference screenshot has a 120 px Mobbin footer bar that is not design.** All measurement crops it out (viewport is 1920x1205 for Platform and 1920x1200 for ChatGPT).
- **Platform values drive the desktop dashboards (employer, landlord, bank); ChatGPT values drive the newcomer app and agent feed.** The Platform pack is dense and sidebar-driven; the ChatGPT pack is the conversational model.
- **Rasikh keeps its own brand.** Same design language (layout, spacing, type, restraint), original name, mark and copy. No OpenAI logos or product names in the UI.
- **fpga-simulator's purple accent is not carried over.** The brief bans purple and blue accents; Rasikh gets one restrained accent of its own (recorded in DESIGN.md).

## Scope update: Abu Dhabi and company expansion

- **Abu Dhabi context is applied from the first seed file, not retrofitted.** Session 8 becomes an audit of that, not a rewrite. Retrofitting names, areas and flows across finished screens is more expensive and error-prone.
- **Government and free-zone names appear as plain text only.** No TAMM, UAE PASS, ICP, ADGM or Hub71 logos, and no wording that implies an official integration.
- **No invented fees, durations or legal requirements.** Any number needed for a screen is illustrative: carried in code as `illustrative: true` (matching INTEGRATION.md) and worded "est." in the UI.
- **The UI never shows the word "mock".** Code, docs and wire payloads always state `mock: true`, per the contract.
- **Expansion shares the hire pipeline.** A company's team move creates `Hire` records in the existing pipeline once the entity step "visa quota" completes, so company landing and people settling are one journey with one data model.
- **Hub71 is offered as a setup option for tech companies in the intake recommendation.** Wording stays neutral and labelled as guidance, not legal advice.

## Integrations

- **Integration clients live in `apps/web/src/integrations/{guard,tamm}` with a stub and a live implementation behind one interface.** Stubs return realistic responses so the app works before the real packages land (Session 10).
- **The Guard client fails closed.** Unreachable or erroring Guard is treated as `deny`, as INTEGRATION.md 3.1 requires.
- **The trust passport is the source of Guard consent.** Each (label, destination) toggle maps to one `POST /consent` or `DELETE /consent/{id}`.

### Contract coordination (action needed from the project owner)

- **Two versions of INTEGRATION.md existed.** The owner's complete text (sections 0 to 8) and a version written by Devin from a copy that was truncated inside section 4.4, with sections 5 and 6 drafted. They diverge on `check_trade_name` (input `name` vs `proposed_name` plus `licensing_authority`), `register_tenancy_tawtheeq` (input `lease_ref` vs a full lease payload), error codes (`unknown_service`, `unknown_application`, `consent_not_found`, `demo_mode_only` vs `unknown_consent`, `not_found`, `invalid_uaepass_session`, `audience_mismatch`), the demo fixtures table, `/dev/advance`, and the changelog.
- **The owner's complete text is what is committed.** The owner instructed that the contract be written exactly as supplied. Devin's version is kept at `docs/INTEGRATION.devin-draft.md` so nothing is lost. Devin needs to rebuild `tamm-mcp` against the committed version; rule 0 of the contract says changes go through a PR to that file only.
- **Open questions, proposed as patch-level clarifications (not applied):**
  1. `POST /session` `case_type`: only `"hire"` is shown. Proposed values: `"hire"` and `"company"`.
  2. `POST /observe` `source`: example is `"newcomer"`. Proposed: any `Destination` value.
  3. `POST /check` for an `allow` decision: assumed `reason` and `policy_rule` are still present and `blocked_labels` is `[]`.
  4. `POST /consent` `granted_by`: only `"newcomer"` is shown; typed as that literal.
  5. How the app learns a TAMM application changed state: assumed polling `get_application_status`.
