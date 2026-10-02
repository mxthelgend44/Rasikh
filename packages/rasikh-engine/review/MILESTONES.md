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
