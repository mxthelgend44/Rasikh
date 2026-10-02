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
