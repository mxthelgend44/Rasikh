# Review-ready milestones

## 1. Deterministic roadmap and blockers

Suggested PR title: `Add deterministic roadmap planning and exact blocker detection`

The app needs ordered relocation/setup steps and precise blockers before it can explain
the journey. Add pure, typed DAG planning for four journeys, with company sponsorship
gating employee residency, direct/transitive unlocks and an illustrative critical path.
Step requirements and numeric assumptions are explicitly synthetic. No LLM calls.

Validation: 22 unit tests and strict TypeScript passed. Coverage includes all journeys,
five licensing authorities, demo ids, missing/derived/per-person documents, invalid
graphs, immutable outputs and remaining critical paths.

Git has no remote; this is the local PR description pending remote configuration.

## 2. Setup and neighborhood recommendations

Suggested PR title: `Add explained setup and neighborhood rankings with tunable weights`

Compare five setup routes and nine Abu Dhabi areas with deterministic criterion scores,
JSON data and configurable relative weights. Flag technology companies for Hub71 review.
Keep every numeric fit and planning checklist illustrative; unknown input tokens produce
neutral scores with explicit reasons. Fix team documents to require an own per-person
entry, preventing global or inherited documents satisfying another employee's requirements.

Validation: 43 roadmap/recommendation tests pass, including 100 seeded ranking/rounding
scenarios, sensitivity to meaningful inputs, weight rescaling, malformed inputs, immutable
outputs, prototype-safe document lookup and sparse-input regressions. TypeScript passes.

## 3. Explicit blocker risks and next actions

Suggested PR title: `Add deterministic blocker risk rules and validated case histories`

Return on-track, at-risk or stuck findings from actionable missing documents and
illustrative waiting windows, with structured reasons and exact next actions. Use
caller-supplied timestamps and validate chronological histories so wait timers cannot
be silently refreshed. Completed work and ordinary queues do not trigger risk alone.

Validation: 26 risk tests; all 69 engine tests and strict TypeScript pass. Covers exact
threshold boundaries, dependency cause propagation/deduplication, calendar/timezone
errors, conflicting/reopened history, sparse inputs and employee document isolation.

## Contract-only proposal

Branch: `gpt/engine-contract`. Suggested PR title: `Document Rasikh Engine API in contract 1.1.0`.
The commit changes only INTEGRATION.md. Adds function/type signatures, structured reason
schema, scoring/risk semantics and eval handoff. Existing closed enums remain unchanged.
The web/shared owners adopt the additive contract after merge. Runtime output continues
using the current shared version until that change is merged.
