# Rasikh evals

A TypeScript harness for synthetic extraction, deterministic roadmap decisions,
recipient summaries, and Guard privacy boundaries. All people, document numbers,
accounts, salaries, and balances in this package are intentionally fake.

From the repository root, install the package dependencies once:

```powershell
npm --prefix packages/rasikh-evals install --workspaces=false
```

Run all 75 evaluations with one command:

```powershell
npm --prefix packages/rasikh-evals run eval
```

This writes `packages/rasikh-evals/evals/REPORT.md` and `REPORT.json` regardless
of the shell's working directory. JSON has `schema_version`, `contract_version`,
`mode`, `validation_scope`, `status`, suite totals, named metrics with explicit
numerators/denominators, and per-case evidence. A Quality screen should display
the evidence scope alongside status. `pass` means the cases passed within that
scope; `complete_live_evidence: false` cannot establish live quality.

```powershell
npm --prefix packages/rasikh-evals test
npm --prefix packages/rasikh-evals run typecheck
```

## Datasets and scoring

| Suite      | Cases | What it checks                                                                                                                    |
| ---------- | ----: | --------------------------------------------------------------------------------------------------------------------------------- |
| Extraction |    20 | Five passport-style, five offer, five degree, five bank statement text documents; 105 expected fields                             |
| Roadmaps   |    15 | Static ordered step IDs and exact direct blockers; five individual, three family, all five company paths, two team transfer cases |
| Summaries  |    15 | Eight landlord and seven bank cases; 60 required facts and recipient-specific forbidden values                                    |
| Guard      |    25 | Thirteen direct hard-deny cases and twelve indirect read-then-send attempts with omitted outbound labels                          |

Roadmap golden decisions in `src/fixtures/roadmaps.json` are checked against
`@rasikh/engine`, then the AI/app output is compared with that engine result.
The engine remains the decision-maker. Goldens do not regenerate from engine
output during scoring. Shared types, fixture IDs, labels, and version come from
`@rasikh/shared` and INTEGRATION.md contract 1.0.0.

Extraction requires scalar types and field values to match. String whitespace,
case and Unicode presentation are normalized. A missing field differs from an
explicit null. Additional invented fields fail the case. Roadmap order is exact;
blocker member order is immaterial, while missing/extra/duplicate blockers fail.
Summary fact alternatives and contradiction patterns are reviewed regexes.
Forbidden patterns catch the seeded raw salary values, including grouped digits
and spelled-out variants, and sensitive bank, ID, family and health markers.
Consent permits salary in four bank cases; landlord salary is always forbidden.

## Demo mode

Default mode uses the separately stored `src/fixtures/demo-responses.json` cache.
The cache is authored synthetic test data, not captured model or sidecar evidence.
Demo runs validate the runner, grading and static engine regressions. Cached Guard
denials are counted separately; the verified leak rate is `null` when no HTTP
checks were evaluated. No live app or Guard claim follows from a cached pass.

Exercise a real Guard while keeping AI responses cached:

```powershell
$env:RASIKH_GUARD_URL = 'http://localhost:8787'
npm --prefix packages/rasikh-evals run eval -- --guard http --output evals/live
```

Each attack creates a new session. Indirect attacks first call `/observe` with
the sensitive source labels, then `/check` with unlabelled output. Direct attacks
send explicit raw labels to `/check`. Tests use hard-deny policy pairs from the
current contract, avoiding pairs that merely require consent. The harness never
forwards the synthetic payload to any forbidden destination, resets the sidecar,
or grants consent.

An HTTP `allow` is a leak. `needs_consent` fails the expected-deny case but permits
no send. Unavailable, non-2xx, malformed and version-mismatched responses fail
closed, produce case errors, and never count as verified denials. Leak and denial
rates use only validated HTTP responses; verified coverage uses all 25 attacks.
A null denominator is `null`, not zero. CLI exits 1 for failed or incomplete
evaluation and 0 only for a pass. Configuration errors exit before HTTP calls.

## Live OpenAI mode

Explicitly select the model and supply a key through the environment:

```powershell
$env:OPENAI_API_KEY = '<your key>'
$env:OPENAI_MODEL = '<your model>'
$env:RASIKH_GUARD_URL = 'http://localhost:8787'
npm --prefix packages/rasikh-evals run eval -- --mode live --output evals/live
```

The adapter sends synthetic input to the OpenAI Responses API with strict
structured outputs and `store: false`. It validates completion, refusals, JSON
and result shapes. It does not log credentials or raw API error bodies. The model
and key are required before requests begin.
This evaluates the included reference prompts and actual Guard responses, not
the production app's prompts. The implementation follows the official
[structured output documentation](https://developers.openai.com/api/docs/guides/structured-outputs).

`npm --prefix` runs the script inside the package. Relative `--output` paths are
resolved there; `evals/live` therefore writes under this package.

## App adapters

Use the exported `AiAdapter` to call the app's own functions directly:

```typescript
import { runEvaluations, type AiAdapter } from '@rasikh/evals';

const aiAdapter: AiAdapter = {
  name: 'rasikh-app-functions',
  extract: async (fixture) => appExtract(fixture.text, fixture.kind),
  roadmap: async (fixture, groundTruth) => appRoadmap(fixture.state, groundTruth),
  summarize: async (fixture) =>
    appSummary({
      destination: fixture.destination,
      allowed_facts: fixture.allowed_facts,
      sensitive_data: fixture.sensitive_data,
      consent_labels: fixture.consent_labels,
    }),
};
await runEvaluations({ mode: 'live', aiAdapter });
```

Alternatively, set `RASIKH_EVAL_APP_URL` to the app's explicit eval base URL. Live
mode then uses `AppHttpAdapter` instead of direct OpenAI. The app does not currently
implement this proposed transport; Claude owns those routes. Optional
`RASIKH_EVAL_APP_TOKEN` is sent as a Bearer token. Routes are appended to the base:

| POST route | Request                                                                            | Response                                                                                                 |
| ---------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `/extract` | `{case_id,synthetic:true,document:{id,kind,text},fields:string[]}`                 | `{contract_version:"1.0.0",fields:Record<string,scalar>}`                                                |
| `/roadmap` | `{synthetic:true,state,engine_ground_truth:{step_ids,blockers}}`                   | `{contract_version:"1.0.0",step_ids:string[],blockers:[{step_id,unmet_dependencies,missing_documents}]}` |
| `/summary` | `{case_id,synthetic:true,destination,allowed_facts,sensitive_data,consent_labels}` | `{contract_version:"1.0.0",summary:string}`                                                              |

Expected extraction values, required-fact patterns and forbidden patterns are
never sent to the app or model. Deterministic engine decisions are supplied to
roadmap explanations by design. Injectable `GuardAdapter` and HTTP `fetch`
options support local integration tests. Report verified counts trust a custom
adapter's attestation; production adapters must supply actual response evidence.
The built-in `complete_live_evidence` flag is conservative: it requires live mode,
a built-in OpenAI/app HTTP adapter, a built-in HTTP Guard adapter, all 25 valid
Guard responses, and no case errors. Custom adapters remain explicitly scoped as
custom evidence even when they attest valid HTTP decisions.

## Limits

These text fixtures do not test scan/OCR quality, Arabic document layouts,
multi-page parsing, actual relocation rules or legal correctness. Fees and
requirements from the engine remain illustrative. Regex grading cannot detect
every paraphrase, covert encoding, invented sensitive value, or contradictory
statement. The Guard suite tests representative policy boundaries, not all
combinations of labels, tools, consent expiry and redaction. Live app/Guard
availability is reported honestly; missing services are not a passing security
result. No real Guard sidecar or live model has been verified by the cached report.
