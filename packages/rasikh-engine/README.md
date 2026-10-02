# Rasikh Engine

Deterministic TypeScript planning, recommendations and risk detection. Algorithms return decisions and structured reasons;
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
derived signals never count as original documents. Team employee steps require an own
`documents_by_subject[employee_id]` entry; absent entries mean no documents. Case-level
documents and inherited object properties never satisfy another employee's needs.
Document references remain the caller's assertions; this is not identity verification.

`getUnlocks(stepId, input?): UnlocksResult` distinguishes direct and transitive
dependants. Without input it infers an individual context, family for family-only ids,
company for company ids, and team for sponsorship/employee ids. Supply input
for exact individual or team context. Satisfying one dependency does not prove a step
is ready: use `getBlockers` for that.

`getCriticalPath(CaseState): CriticalPathResult` returns the longest remaining
dependency chain, weighted by illustrative days. Completed joins cut off their
predecessors. Equal durations prefer longer chains, then dependency order. This is an estimate, not a promised date.

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

## Setup paths and neighborhoods

`recommendSetupPaths(CompanySetupInput, Partial<SetupWeights>?): SetupRecommendationResult`
compares mainland, ADGM, KEZAD's free-zone route, Masdar City Free Zone and twofour54.
Inputs are activities, industry, team size, physical space, UAE/international/mixed
client base and regulatory profile. All routes remain in the result with a ranked score,
per-criterion fit/weight/contribution, structured reasons and source links. Hub71's
`candidate_for_review` indicates technology relevance only; `determination` remains
`not_assessed` because stage, traction and programme review are outside the input.

`matchNeighborhoods(NeighborhoodInput, Partial<NeighborhoodWeights>?): NeighborhoodMatchResult`
compares nine areas: Al Reem Island, Al Raha Beach, Khalifa City, Mohammed Bin Zayed
City, Saadiyat Island, Yas Island, Al Maryah Island, Al Khalidiyah and Masdar City.
Inputs are office location/name, low/medium/high budget, single/couple/family household,
car availability and preferences. There are no live rent, school or route feeds.
Unknown offices get neutral commute fit with null minutes and an explicit reason.
Known offices match exact aliases; ADGM/Hub71 resolve a broad zone, not an address.

Relative weights in `config/weights.json` are easy to tune:

| Setup criterion    | Weight | Neighborhood criterion | Weight |
| ------------------ | -----: | ---------------------- | -----: |
| Activities         |     25 | Commute                |     30 |
| Industry           |     20 | Budget                 |     25 |
| Team size          |     10 | Household              |     20 |
| Physical space     |     20 | Mobility               |     15 |
| Client base        |     15 | Preferences            |     10 |
| Regulatory profile |     10 |                        |        |

Contribution = `fit * weight / total_weight * 100`. Fits lie in [0,1] and scores in
[0,100]. Partial overrides merge with defaults. Weights must be finite and nonnegative
with a positive finite total; unknown keys are rejected. Scores have six decimal places
and ties use ASCII id order. Unknown activity/industry/preference tokens get 0.5;
duplicates/aliases count once. Team bands (micro <=5, small <=20, growing >20) are
illustrative. `data/setup-options.json` and `data/areas.json` mark data and checklists
illustrative. Entity/area source links do not validate scoring or legal requirements.

## Blocker risk rules

`detectRisks(CaseState | readonly CaseState[], Partial<RiskConfig>?): RiskResult`
returns `on_track`, `at_risk` or `stuck`, exact reasons, and structured next actions.
The caller must supply `as_of` and timezone-bearing `step_states.since` timestamps.
The engine never reads the current clock. A latest snapshot determines the result;
history validates case identity, chronological snapshots and status continuity.

`config/risk-rules.json` defines illustrative windows and explicit rule metadata:

- A ready step missing an original document is at risk; its exact document cause
  propagates through dependent steps. The action targets the root missing document.
- An in-progress/waiting step strictly beyond its illustrative window is at risk.
  Strictly beyond twice that window it is stuck. The multiplier can be overridden
  with a finite value greater than one; zero-day milestones use a one-day floor.
- An ordinary dependency queue and downstream documents that are not yet produced
  are not alone a risk. Completed steps do not produce findings.

Invalid calendar dates, missing timezones, future start times and backwards history
are rejected. Histories cannot reopen completed steps, remove unfinished statuses,
refresh an unchanged wait timer or report transitions predating the preceding snapshot.
This is deterministic rule detection, not prediction or an agency processing guarantee.
