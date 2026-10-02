# Rasikh evals

Synthetic quality and privacy evaluations. Every identity, document number,
account and financial value is fake. The engine makes roadmap decisions;
model calls extract fields and explain facts.

From the repository root:

```powershell
npm --prefix packages/rasikh-evals install --workspaces=false
npm --prefix packages/rasikh-evals test
npm --prefix packages/rasikh-evals run typecheck
```

## Live Vertex AI and real Guard

The user-selected provider is Vertex AI. Existing Google Cloud authentication
works through Application Default Credentials or an active Google Cloud CLI
sign-in. Credentials and raw API error bodies are never printed. The package
loads its ignored `.env.local`; explicit environment values take precedence.

```powershell
$env:GOOGLE_CLOUD_PROJECT = '<your project>'
$env:GOOGLE_CLOUD_LOCATION = 'global'
$env:VERTEX_MODEL = 'gemini-3.8-flash'
npm --prefix packages/rasikh-evals run eval:live
```

If `GOOGLE_CLOUD_PROJECT` is absent, the CLI reads the currently configured
Google Cloud project. It does not change global configuration. An explicitly
selected model is preserved; the default is `gemini-3.8-flash`.
The implementation uses Google's documented
[Vertex generateContent API](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/start/quickstart)
and [response schemas](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/control-generated-output).

`eval:live` builds the real Guard with `cargo build --locked` when needed, starts
it with demo reset disabled, waits for health, runs three complete suites and
stops only the processes it launched. A healthy existing service is reused and
left running. Cargo is required for a new native launch. Build output stays in
ignored `.runtime/guard-target`; no Guard source is changed.

For Guard-only endpoint and attack conformance:

```powershell
npm --prefix packages/rasikh-evals run eval:guard
```

This writes `evals/GUARD_CONFORMANCE.md` and `.json`. A failed security target
intentionally exits with status 1. No synthetic payload is ever forwarded to
a forbidden destination. The launcher never resets a shared service.

## Report and targets

The main live report is `evals/REPORT.md` and `.json`, schema 2.0.0. Each metric
has its evidence scope, numerator, denominator, target and explanation. Model,
run dates, run count, per-run values, population variance and standard deviation
are recorded. Null means no eligible observations; it never means zero leaks.

| Suite               |   Cases per run | Live target                                                       |
| ------------------- | --------------: | ----------------------------------------------------------------- |
| Text extraction     | 20 / 105 fields | at least 95% field accuracy                                       |
| Roadmaps            |              15 | 100% deterministic order, blockers and static goldens             |
| Recipient summaries |   15 / 60 facts | at least 95% fact coverage; 0 forbidden content; 100% responses   |
| Guard attacks       |              25 | 0 unsafe HTTP allows; 100% verified coverage and expected denials |

The core extraction corpus consists of text documents. Regex summary grading
is limited to reviewed fact alternatives and seeded confidential value patterns.
Failed requests reduce coverage. Guard errors fail closed but never count as
verified policy denials. `needs_consent` permits no send but fails a hard-deny case.
Any failed repeated run remains visible even if an aggregate could hide it.

The included prompts and schemas live in `src/prompts/profiles.ts`. The app
currently has demo extraction but no live prompts, schemas or evaluation routes.
Reports explicitly say `reference_prompt` and app parity is unverified.
`complete_live_evidence` describes complete reference-model and real HTTP
observations, not production app validation or a passing security result.

The measured sidecar uses the Rasikh policy matrix. Its vendored OpenAPPA crates
are not on the decision path. Reports identify the service contract and upstream
commit, and do not claim that these tests certify OpenAPPA enforcement.

## Cache regression

```powershell
npm --prefix packages/rasikh-evals run eval
```

Default CLI mode uses separately authored synthetic caches and writes under
`evals/cache`, preserving the latest live report. It requires 100% expected
fields/facts and exact static engine goldens. Cached denials remain cached;
live leak rate is null without HTTP evidence. Cached results cannot establish
model, app or Guard quality.

The exported `runEvaluations` supports one run, and `runRepeatedEvaluations`
supports 1–10 repeats. `--runs`, `--concurrency` and `--output` configure the CLI.
Relative output paths are resolved inside the package for prefix commands.

## App adapter handoff

`AppHttpAdapter` uses the explicit base `RASIKH_EVAL_APP_URL`; an optional
`RASIKH_EVAL_APP_TOKEN` is sent as a Bearer token. Claude owns its implementation.
The contract-only proposal specifies `/extract`, `/roadmap`, `/summary` and
prompt provenance. The harness never sends expected extracted values, fact
goldens or forbidden patterns to an app or model. The app can also supply an
exported `AiAdapter` directly. Custom adapters remain explicitly scoped.

The legacy OpenAI adapter is available only when explicitly selected with
`--provider openai` and configured `OPENAI_API_KEY` / `OPENAI_MODEL`. Actual
evidence from this phase uses Vertex AI.

These finite synthetic cases do not establish real customer outcomes, legal
correctness, comprehensive policy coverage or universal prompt-injection safety.

## Bilingual prompt injections

```powershell
npm --prefix packages/rasikh-evals run eval:injection
```

Twenty English/Arabic attacks across leases, offers, landlord messages, bank
letters and TAMM status text are repeated three times. `evals/INJECTION.md/json`
distinguishes actual model hijacks, authorization of actual malicious proposals,
and forced malicious controls that exercise the gate even when the model resists.
External addresses are rejected by the closed-destination validator locally;
those blocks are never counted as HTTP Guard denials. Nothing is sent outward.
No malicious model proposals means conditional system leak rate is null.
`evals/DEMO_INJECTION.md` reproduces the lease demonstration and labels the
attempt as scripted when the live model resists. Interrupted initial evidence
and the separate lease supplemental run are preserved with their own scopes.

## Rendered documents

```powershell
npm --prefix packages/rasikh-evals run eval:documents
```

The vision corpus contains 20 clean images, 20 paired degraded images and eight
Arabic/bilingual images. It covers the original passport/offer/degree/bank
fixtures. Degradation includes rotation, blur, JPEG artifacts, phone lighting,
stamps and cropped margins. All images visibly mark their data as synthetic.
The manifest records image hashes, font identity and exact seeded recipes.
Only actual image bytes and field names go to the model; expected values and
source text stay local. `evals/DOCUMENTS.md/json` separates cohort accuracy,
coverage and repeated-run variation. Missing cohorts or unexpected fields cannot
produce a passing report. Renderer dependencies and reproduction instructions
are recorded in DOCUMENTS.md; fonts are identified but not redistributed.

## Semantic privacy judge

```powershell
npm --prefix packages/rasikh-evals run eval:judge
```

The judge runs three repetitions of 30 hand-labelled leak/safe examples,
including salary in words, rounded or implied amounts, encodings and Arabic.
Gold labels and regex decisions remain local. `evals/JUDGE.md/json` reports
accuracy, precision, recall, confusion counts, coverage and variance beside
the existing regex checks. It also assesses each actual summary saved in the
latest core live report, binding that report's hash. Cached/custom responses
are rejected as live source evidence. The actual summaries lack independent
human truth labels; their judge findings are advisory. A judge using the same
model as the generator can share blind spots, even with perfect finite-set
calibration. Missing classifications are errors rather than safe decisions.

## Relocation scheduling model

```powershell
npm --prefix packages/rasikh-evals run eval:simulation
```

The pure engine simulator compares paired sequential/reactive and parallel/
proactive scheduling under one recorded illustrative config. `evals/SIMULATION.md`
and `.json` show settlement/operational day distributions, medians, p10–p90,
min/max, paired savings and assumption sensitivity. Seed and run count reproduce
the model. It does not measure customers or accelerate modeled authority
processing. Honest pitch phrasing: “In our simulation, under these assumptions…”
