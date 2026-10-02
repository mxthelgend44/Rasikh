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

## 2026-10-02 — Milestone 3: blocker risk rules

Added `detectRisks` for individual snapshots or chronological histories. Explicit
caller timestamps drive illustrative overdue/stuck thresholds; ready missing-document
causes propagate through dependencies with exact actions. No clock or IO is consulted.
History validation prevents reopened completion and reset wait timers.
Verification: 26 risk tests and all 69 engine tests pass; strict TypeScript passes.

The contract-only proposal is on `gpt/engine-contract`, editing INTEGRATION.md only,
with the Rasikh Engine function signatures/type proposal and version 1.1.0. Active
shared/runtime responses remain 1.0.0 pending review/merge. Both branches share the
same repository history; no remote is available to open or merge real PRs.

## 2026-10-02 — Milestone 4: evaluation harness

Built `@rasikh/evals` with 20 synthetic text documents (105 expected fields), 15
static engine-grounded roadmap cases, 15 recipient summaries (60 required facts),
and 25 hard-deny Guard attacks (13 direct, 12 indirect). Demo responses are stored
independently; engine goldens do not regenerate from the engine during scoring.

One command writes Markdown and JSON reports, with evidence scope suitable for the
future Quality screen. Injectable app functions, a proposed app HTTP transport, direct
OpenAI Responses and Guard HTTP adapters support live mode. Raw credentials and API
error bodies are never logged. Unavailable services are errors, not policy denials.

Verification: 18 harness tests and strict TypeScript pass. Demo run: 75/75 passing,
105/105 fields, 15/15 ordered roadmaps/blockers, 60/60 summary facts, no forbidden
summary content, and 25 cached Guard denials. Live Guard probe: incomplete, 25 errors,
0 verified checks/denials, leak rate null. OpenAI key/model and app eval endpoint are
not configured, so no live AI result is claimed. Engine total: 69 tests passing.

Known limits: synthetic text fixtures do not measure OCR/Arabic/layout quality; summary
grading uses reviewed regexes, not a semantic judge; Guard attack coverage is finite.
Services and app integration remain owned by the other agents. The root workspace list
still excludes these packages; standalone prefix commands work without changing it.

All milestone descriptions are saved under each package's `review/MILESTONES.md`.
