# Rasikh Engine

Deterministic TypeScript planning. Algorithms return decisions and structured reasons;
the app can render or explain them. There are no LLM calls, network calls, file reads,
clock reads, or other IO in exported engine functions.

Requires Node 22+, plus `packages/shared` from the integration owner.

```sh
npm --prefix packages/rasikh-engine install --workspaces=false
npm --prefix packages/rasikh-engine test
npm --prefix packages/rasikh-engine run typecheck
```

The root workspace list is owned elsewhere; these commands work without editing it.

```ts
import { planRoadmap, getBlockers, getUnlocks, getCriticalPath } from '@rasikh/engine';
const input = { case_id: 'hire_demo_001', journey: 'individual_relocation' } as const;
const roadmap = planRoadmap(input);
const blockers = getBlockers({ input, completed_step_ids: [], documents: [] });
const unlocks = getUnlocks('collect_documents', input);
const criticalPath = getCriticalPath({ input, completed_step_ids: [], documents: [] });
```

`planRoadmap(CaseInput): RoadmapResult` returns a stable topological order for
individual relocation, family relocation, company setup and team transfer. Company
setup uses the selected licensing authority. Every employee's residency depends on
`entity_can_sponsor`; the default employee ids are the three shared demo hires.
`sponsoring_entity_ready: true` means the caller has verified an existing sponsor:
the graph contains a satisfied external gate and employee journeys only.

`getBlockers(CaseState): BlockersResult` returns every unfinished step with its exact
direct unmet dependency and missing `DataLabel`. Documents use shared `PayloadRef`;
derived signals never count as original documents. `documents_by_subject` can override
case documents per employee. Without an override, `documents` is the caller's assertion
that those documents apply to the case; this is not identity verification.

`getUnlocks(stepId, input?): UnlocksResult` distinguishes direct and transitive
dependants. Without input it infers a template family/company context. Supply input
for exact individual or team context. Satisfying one dependency does not prove a step
is ready: use `getBlockers` for that.

`getCriticalPath(CaseState): CriticalPathResult` returns the longest remaining
dependency chain, weighted by illustrative days. Completed joins cut off their
predecessors. Ties preserve catalog order. This is an estimate, not a promised date.

All results carry the current shared `CONTRACT_VERSION` (1.0.0 until the additive
engine contract proposal is merged), `illustrative: true`, and reasons containing
exactly `{ criterion, value, effect, explanation_key }`. Reason values are JSON data;
stable explanation keys are for the app/LLM. Unknown inputs fail with stable errors.

## Data and limits

`data/steps.json` contains all step definitions and entity source links. Official
sources establish entity identity only. Every dependency, document requirement and
duration is a synthetic demo assumption, marked illustrative, and must be verified
with the relevant authority. No fees are modeled. Company document labels are empty
because shared 1.0.0 has no company-document taxonomy; no personal label is repurposed.
The family demo assumes school-age children. Team members use individual journeys.
The engine trusts supplied completion statuses and external sponsor verification;
it neither verifies submitted documents nor grants legal eligibility.
