import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { simulateJourneys } from '@rasikh/engine';
import type { SimulationOptions, SimulationResult } from '@rasikh/engine';

export function renderSimulation(result: SimulationResult, generatedAt: string): string {
  const format = (value: number) => value.toFixed(2);
  const lines = [
    '# Rasikh relocation simulation',
    '',
    '**This is an illustrative scheduling model under stated assumptions. It is not measured real-world performance, a customer outcome, an authority service-level commitment, or a legal requirement.**',
    '',
    `Generated: ${generatedAt}. Seed: **${result.seed}**. Synthetic runs per case: **${result.runs}**. Contract: ${result.contract_version}.`,
    '',
    '| Journey / endpoint | Baseline median days | Baseline p10–p90 | Rasikh median days | Rasikh p10–p90 | Median paired days saved | Saved-days min–max |',
    '|---|---:|---:|---:|---:|---:|---:|',
    ...result.cases.map(
      (entry) =>
        `| ${entry.journey} / ${entry.target_step_id} | ${format(entry.baseline_days.median)} | ${format(entry.baseline_days.p10)}–${format(entry.baseline_days.p90)} | ${format(entry.orchestrated_days.median)} | ${format(entry.orchestrated_days.p10)}–${format(entry.orchestrated_days.p90)} | ${format(entry.days_saved.median)} | ${format(entry.days_saved.min)}–${format(entry.days_saved.max)} |`,
    ),
    '',
    'Every institutional processing time and disruption draw is shared between the paired policies. The modeled difference comes from sequential versus dependency-constrained parallel work, when original documents are prepared, and assumed noticing/handoff gaps. Rasikh does not accelerate authority or bank processing in this model.',
    '',
    'All timing assumptions, probabilities, default seed, run bounds, and sensitivity settings are in [simulation-assumptions.json](../../rasikh-engine/config/simulation-assumptions.json), with an illustrative marker and rationale. They are copied into the JSON report so the model can be reproduced after the defaults change.',
    '',
    'Baseline deliberately runs one step at a time and retrieves missing original documents reactively. Rasikh permits all independent steps and original-document preparations to run concurrently. This comparison can disadvantage the baseline; neither scheduling policy is a measured description of customers. Unlimited parallel resources are assumed, without capacity, appointment availability, worker contention or human multitasking limits.',
    '',
    'Produced documents are handled separately: modeled Emirates ID availability follows the Emirates ID milestone, and address availability follows the tenancy milestone. The simulator adds these availability dependencies without changing the public roadmap. Company sponsorship remains a dependency before employee residency; an explicitly ready sponsoring entity is treated as complete.',
    '',
    'Duration, preparation and gap values are sampled uniformly within the configured intervals. Independent positive-duration steps draw a shared disruption event and severity. Logical zero-duration joins add no processing or handoff delay. Quantiles use linear interpolation over the sorted synthetic samples; p10–p90 is a model distribution, not a confidence interval for measured performance.',
    '',
    'Sensitivity uses the same per-step and per-document random draws as the main run. Numeric drivers vary one at a time by the configured relative change; parallelism and proactive preparation are separate on/off ablations. Rows rank the change in median paired days saved, which identifies model assumptions that drive the modeled result.',
    '',
    'Ranks apply to the specified contrasts. An on/off policy ablation is a larger change than a twenty-percent numeric perturbation; the spans are not normalized elasticities or causal customer estimates.',
    '',
    '| Case | Assumption | Low setting | High setting | Low median days saved | High median days saved | Absolute span in days |',
    '|---|---|---:|---:|---:|---:|---:|',
    ...result.sensitivity.map(
      (entry) =>
        `| ${entry.case_id} | ${entry.parameter} | ${entry.low_setting} | ${entry.high_setting} | ${format(entry.low_median_saved_days)} | ${format(entry.high_median_saved_days)} | ${format(entry.median_saved_span_days)} |`,
    ),
    '',
    'A useful control is to make both policy configurations identical: every paired saving becomes zero, including when disruption probability is 100%. Slower assumed orchestration gaps can produce negative savings; benefits are not forced by the output code.',
    '',
    '> Suggested pitch wording: “In our simulation, under these assumptions, Rasikh reduced the modeled median time to settle or operate. These are synthetic scheduling results, not measured customer outcomes.”',
    '',
    'Reproduce from `packages/rasikh-evals`: `node --import tsx src/simulation.ts`. Optional `--seed` and `--runs` change the cohort while retaining the recorded assumptions. `SIMULATION.json` contains every sample, quantiles, paired savings and sensitivity results.',
    '',
  ];
  return lines.join('\n');
}

export async function writeSimulationEvidence(
  options: SimulationOptions = {},
): Promise<SimulationResult> {
  const result = simulateJourneys(options);
  const generatedAt = new Date().toISOString();
  const directory = fileURLToPath(new URL('../evals', import.meta.url));
  await mkdir(directory, { recursive: true });
  await writeFile(
    resolve(directory, 'SIMULATION.json'),
    `${JSON.stringify({ schema_version: '1.0.0', generated_at: generatedAt, ...result }, null, 2)}\n`,
  );
  await writeFile(resolve(directory, 'SIMULATION.md'), renderSimulation(result, generatedAt));
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options: SimulationOptions = {};
  for (let index = 2; index < process.argv.length; index += 2) {
    const flag = process.argv[index];
    const raw = process.argv[index + 1];
    if (!raw || !/^\d+$/.test(raw) || (flag !== '--runs' && flag !== '--seed'))
      throw new Error(
        'Usage: node --import tsx src/simulation.ts [--seed INTEGER] [--runs INTEGER]',
      );
    options[flag === '--seed' ? 'seed' : 'runs'] = Number(raw);
  }
  const result = await writeSimulationEvidence(options);
  process.stdout.write(
    `Illustrative simulation: seed ${result.seed}, ${result.runs} paired synthetic runs per case; ${result.cases.map((entry) => `${entry.target_step_id} median baseline ${entry.baseline_days.median.toFixed(2)} / Rasikh ${entry.orchestrated_days.median.toFixed(2)} days`).join('; ')}. Not measured customer outcomes.\n`,
  );
}
