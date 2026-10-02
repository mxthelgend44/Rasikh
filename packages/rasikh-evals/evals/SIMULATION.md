# Rasikh relocation simulation

**This is an illustrative scheduling model under stated assumptions. It is not measured real-world performance, a customer outcome, an authority service-level commitment, or a legal requirement.**

Generated: 2026-10-02T07:31:28.138Z. Seed: **7102026**. Synthetic runs per case: **1000**. Contract: 1.0.0.

| Journey / endpoint | Baseline median days | Baseline p10–p90 | Rasikh median days | Rasikh p10–p90 | Median paired days saved | Saved-days min–max |
|---|---:|---:|---:|---:|---:|---:|
| individual_relocation / fully_settled | 38.96 | 34.69–43.78 | 18.00 | 15.08–21.55 | 20.76 | 15.63–27.50 |
| company_setup / fully_operational | 34.53 | 30.41–39.04 | 19.40 | 15.91–23.10 | 15.14 | 10.61–19.96 |

Every institutional processing time and disruption draw is shared between the paired policies. The modeled difference comes from sequential versus dependency-constrained parallel work, when original documents are prepared, and assumed noticing/handoff gaps. Rasikh does not accelerate authority or bank processing in this model.

All timing assumptions, probabilities, default seed, run bounds, and sensitivity settings are in [simulation-assumptions.json](../../rasikh-engine/config/simulation-assumptions.json), with an illustrative marker and rationale. They are copied into the JSON report so the model can be reproduced after the defaults change.

Baseline deliberately runs one step at a time and retrieves missing original documents reactively. Rasikh permits all independent steps and original-document preparations to run concurrently. This comparison can disadvantage the baseline; neither scheduling policy is a measured description of customers. Unlimited parallel resources are assumed, without capacity, appointment availability, worker contention or human multitasking limits.

Produced documents are handled separately: modeled Emirates ID availability follows the Emirates ID milestone, and address availability follows the tenancy milestone. The simulator adds these availability dependencies without changing the public roadmap. Company sponsorship remains a dependency before employee residency; an explicitly ready sponsoring entity is treated as complete.

Duration, preparation and gap values are sampled uniformly within the configured intervals. Independent positive-duration steps draw a shared disruption event and severity. Logical zero-duration joins add no processing or handoff delay. Quantiles use linear interpolation over the sorted synthetic samples; p10–p90 is a model distribution, not a confidence interval for measured performance.

Sensitivity uses the same per-step and per-document random draws as the main run. Numeric drivers vary one at a time by the configured relative change; parallelism and proactive preparation are separate on/off ablations. Rows rank the change in median paired days saved, which identifies model assumptions that drive the modeled result.

Ranks apply to the specified contrasts. An on/off policy ablation is a larger change than a twenty-percent numeric perturbation; the spans are not normalized elasticities or causal customer estimates.

| Case | Assumption | Low setting | High setting | Low median days saved | High median days saved | Absolute span in days |
|---|---|---:|---:|---:|---:|---:|
| hire_demo_001 | parallel_steps | false | true | 12.25 | 20.76 | 8.51 |
| company_demo_001 | parallel_steps | false | true | 9.72 | 15.14 | 5.41 |
| hire_demo_001 | baseline_notice | 0.8 | 1.2 | 19.04 | 22.49 | 3.45 |
| company_demo_001 | baseline_notice | 0.8 | 1.2 | 13.64 | 16.66 | 3.01 |
| hire_demo_001 | processing_duration | 0.8 | 1.2 | 19.35 | 22.21 | 2.86 |
| company_demo_001 | processing_duration | 0.8 | 1.2 | 14.18 | 16.15 | 1.97 |
| hire_demo_001 | baseline_handoff | 0.8 | 1.2 | 19.88 | 21.67 | 1.79 |
| company_demo_001 | baseline_handoff | 0.8 | 1.2 | 14.38 | 15.90 | 1.52 |
| hire_demo_001 | proactive_documents | false | true | 19.89 | 20.76 | 0.87 |
| hire_demo_001 | delay_probability | 0.8 | 1.2 | 20.54 | 21.00 | 0.46 |
| hire_demo_001 | document_preparation | 0.8 | 1.2 | 20.59 | 20.95 | 0.36 |
| company_demo_001 | orchestrated_notice | 0.8 | 1.2 | 15.29 | 14.99 | 0.30 |
| hire_demo_001 | orchestrated_notice | 0.8 | 1.2 | 20.88 | 20.63 | 0.25 |
| hire_demo_001 | delay_severity | 0.8 | 1.2 | 20.66 | 20.91 | 0.25 |
| company_demo_001 | orchestrated_handoff | 0.8 | 1.2 | 15.23 | 15.04 | 0.20 |
| hire_demo_001 | orchestrated_handoff | 0.8 | 1.2 | 20.84 | 20.68 | 0.16 |
| company_demo_001 | delay_probability | 0.8 | 1.2 | 15.05 | 15.19 | 0.13 |
| company_demo_001 | delay_severity | 0.8 | 1.2 | 15.11 | 15.16 | 0.05 |
| company_demo_001 | document_preparation | 0.8 | 1.2 | 15.14 | 15.14 | 0.00 |
| company_demo_001 | proactive_documents | false | true | 15.14 | 15.14 | 0.00 |

A useful control is to make both policy configurations identical: every paired saving becomes zero, including when disruption probability is 100%. Slower assumed orchestration gaps can produce negative savings; benefits are not forced by the output code.

> Suggested pitch wording: “In our simulation, under these assumptions, Rasikh reduced the modeled median time to settle or operate. These are synthetic scheduling results, not measured customer outcomes.”

Reproduce from `packages/rasikh-evals`: `node --import tsx src/simulation.ts`. Optional `--seed` and `--runs` change the cohort while retaining the recorded assumptions. `SIMULATION.json` contains every sample, quantiles, paired savings and sensitivity results.
