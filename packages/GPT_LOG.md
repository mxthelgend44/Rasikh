# GPT engine and evals log

## 2026-10-02 — Milestone 1: roadmap

Built `@rasikh/engine` with `planRoadmap`, `getBlockers`, `getUnlocks`, and
`getCriticalPath`. JSON DAG definitions cover individual, family, company and team
journeys. Employee residency explicitly depends on the company sponsorship gate.
Shared `DataLabel`, `PayloadRef`, `CONTRACT_VERSION` and demo ids are reused.
Every result uses structured reasons; all demo requirements/durations are illustrative.
Verification: 22 unit tests passed; TypeScript strict check passed.

Work is isolated in `C:/Users/maalh/Desktop/rasikh-engine-evals` on
`gpt/engine-evals`. The active checkout contains other owners' staged/untracked work.
The existing INTEGRATION and shared files were copied as an unchanged local baseline
for verification and are not part of package commits. No app, Guard or TAMM source
was edited. Additional recommendation and eval modules are developed independently.

### Decisions and open questions

- Algorithms decide; the engine has no LLM calls or IO.
- Keep response contract version 1.0.0 until the additive contract proposal is merged.
- Family demo assumes school-age children; team members currently use individual paths.
- Shared 1.0.0 has no company-document types: do not repurpose personal data labels.
- Missing prerequisite project docs: README, PROGRESS, DECISIONS, ARCHITECTURE.
- Git has no remote. Local milestones can be reviewed, but PRs and merges cannot run
  until a remote is configured. No remote repository is guessed or created.
- App AI functions and the Guard HTTP sidecar do not exist in the inspected baseline;
  cached eval evidence must be distinguished from live-service evidence.

## 2026-10-02 — Milestone 2: recommendations and document isolation

Added setup-path rankings for five routes and neighborhood rankings for nine areas.
JSON data and relative weight configs produce per-criterion contributions and reasons.
Hub71 technology candidates remain subject to programme review. Official entity/area
sources establish identity only; fit scores, commutes and planning checklists are illustrative.

Peer review found and fixed team document fallback: employee steps now use only their
own `documents_by_subject` entry. Global/inherited documents cannot satisfy an employee.
Sparse ids/labels and malformed states are rejected; default unlocks infer the correct
template context and include employee residency for the company sponsorship gate.
Verification: 43 roadmap/recommendation tests, including 100 seeded scoring scenarios,
passed. Strict TypeScript checks pass under both package and eval consumer settings.
