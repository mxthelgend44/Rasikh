import { CONTRACT_VERSION, DATA_LABELS, DEMO_FIXTURES } from '@rasikh/shared';
import type { DataLabel } from '@rasikh/shared';
import config from '../config/simulation-assumptions.json' with { type: 'json' };
import { orderGraph } from './graph.js';
import { planRoadmap, reason } from './roadmap.js';
import type { CaseInput, StepDefinition } from './types.js';
import type {
  DaysDistribution,
  SensitivityParameter,
  SimulationAssumptions,
  SimulationCaseResult,
  SimulationOptions,
  SimulationPolicy,
  SimulationRange,
  SimulationResult,
  SimulationSensitivity,
} from './simulation-types.js';

/** Returns independent data; callers cannot alter the default model through a previous result. */
export function getSimulationAssumptions(): SimulationAssumptions {
  return structuredClone(config) as SimulationAssumptions;
}

function fields(value: unknown, allowed: readonly string[], context: string): void {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Reflect.ownKeys(value).some((key) => typeof key !== 'string' || !allowed.includes(key))
  )
    throw new TypeError(`invalid_simulation_${context}`);
}
function rationale(value: { illustrative?: unknown; rationale?: unknown }, context: string): void {
  if (value.illustrative !== true || typeof value.rationale !== 'string' || !value.rationale.trim())
    throw new TypeError(`unmarked_simulation_${context}`);
}
function range(value: unknown, context: string): void {
  fields(value, ['min', 'max', 'illustrative', 'rationale'], context);
  const window = value as SimulationRange;
  rationale(window, context);
  if (
    typeof window.min !== 'number' ||
    typeof window.max !== 'number' ||
    !Number.isFinite(window.min) ||
    !Number.isFinite(window.max) ||
    window.min < 0 ||
    window.max < window.min
  )
    throw new TypeError(`invalid_simulation_range:${context}`);
}
function validateAssumptions(value: SimulationAssumptions): void {
  fields(
    value,
    [
      'illustrative',
      'rationale',
      'default_seed',
      'default_runs',
      'maximum_runs',
      'sensitivity_relative_change',
      'step_duration_days',
      'document_preparation_days',
      'document_producers',
      'delay_probability',
      'unexpected_delay_days',
      'baseline',
      'orchestration',
    ],
    'assumptions',
  );
  rationale(value, 'assumptions');
  for (const key of [
    'default_seed',
    'default_runs',
    'maximum_runs',
    'sensitivity_relative_change',
    'delay_probability',
  ] as const) {
    const number = value[key];
    fields(number, ['value', 'illustrative', 'rationale'], key);
    rationale(number, key);
    if (typeof number.value !== 'number' || !Number.isFinite(number.value) || number.value < 0)
      throw new TypeError(`invalid_simulation_number:${key}`);
  }
  if (
    value.delay_probability.value > 1 ||
    value.sensitivity_relative_change.value <= 0 ||
    value.sensitivity_relative_change.value >= 1
  )
    throw new TypeError('invalid_simulation_probability_or_sensitivity');
  if (
    !Number.isSafeInteger(value.default_seed.value) ||
    value.default_seed.value > 0xffffffff ||
    !Number.isSafeInteger(value.default_runs.value) ||
    !Number.isSafeInteger(value.maximum_runs.value) ||
    value.default_runs.value < 1 ||
    value.maximum_runs.value < value.default_runs.value
  )
    throw new TypeError('invalid_simulation_defaults');
  const allSteps = new Set(
    ['individual_relocation', 'family_relocation', 'company_setup'].flatMap((journey) =>
      planRoadmap({ case_id: 'fake_simulation_validation', journey } as CaseInput).steps.map(
        (step) => step.id,
      ),
    ),
  );
  fields(value.step_duration_days, [...allSteps], 'durations');
  for (const step of allSteps) range(value.step_duration_days[step], step);
  fields(value.document_preparation_days, DATA_LABELS, 'documents');
  for (const [label, duration] of Object.entries(value.document_preparation_days))
    range(duration, label);
  fields(value.document_producers, DATA_LABELS, 'producers');
  for (const producer of Object.values(value.document_producers))
    if (typeof producer !== 'string' || !allSteps.has(producer))
      throw new TypeError('invalid_simulation_document_producer');
  range(value.unexpected_delay_days, 'unexpected_delay');
  for (const key of ['baseline', 'orchestration'] as const) {
    const policy = value[key];
    fields(
      policy,
      [
        'parallel_steps',
        'proactive_documents',
        'notice_days',
        'handoff_days',
        'illustrative',
        'rationale',
      ],
      key,
    );
    rationale(policy, key);
    if (
      typeof policy.parallel_steps !== 'boolean' ||
      typeof policy.proactive_documents !== 'boolean'
    )
      throw new TypeError(`invalid_simulation_policy:${key}`);
    range(policy.notice_days, `${key}_notice`);
    range(policy.handoff_days, `${key}_handoff`);
  }
}

function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
  };
}
function sample(window: SimulationRange, unit: number): number {
  return window.min + unit * (window.max - window.min);
}
function baseId(step: StepDefinition): string {
  return step.id.split(':').at(-1)!;
}
function documentId(step: StepDefinition, label: DataLabel): string {
  return `${step.subject_ref ?? 'case'}:${label}`;
}
function producerId(step: StepDefinition, producer: string): string {
  return step.subject_ref ? `${step.subject_ref}:${producer}` : producer;
}

/** Document availability adds modeled producer dependencies without changing the public roadmap. */
function graph(input: CaseInput, assumptions: SimulationAssumptions): StepDefinition[] {
  const steps = planRoadmap(input).steps;
  const ids = new Set(steps.map((step) => step.id));
  for (const step of steps) {
    for (const label of step.required_documents) {
      const producer = assumptions.document_producers[label];
      if (producer) {
        const id = producerId(step, producer);
        if (!ids.has(id)) throw new TypeError(`missing_simulation_document_producer:${id}`);
        if (!step.depends_on.includes(id)) step.depends_on.push(id);
      } else if (!assumptions.document_preparation_days[label])
        throw new TypeError(`missing_simulation_document_duration:${label}`);
    }
  }
  return orderGraph(steps);
}
interface Draws {
  steps: Map<string, number[]>;
  documents: Map<string, number>;
}
function drawsFor(steps: StepDefinition[], seed: number): Draws {
  const next = random(seed);
  const draws: Draws = { steps: new Map(), documents: new Map() };
  for (const step of steps) {
    draws.steps.set(step.id, [next(), next(), next(), next(), next()]);
    for (const label of step.required_documents) {
      const id = documentId(step, label);
      if (!draws.documents.has(id)) draws.documents.set(id, next());
    }
  }
  return draws;
}
function schedule(
  steps: StepDefinition[],
  policy: SimulationPolicy,
  assumptions: SimulationAssumptions,
  draws: Draws,
): number {
  const completion = new Map<string, number>();
  const documents = new Map<string, number>();
  let sequentialFinish = 0;
  for (const step of steps) {
    if (step.external) {
      completion.set(step.id, 0);
      continue;
    }
    const units = draws.steps.get(step.id)!;
    let ready = Math.max(0, ...step.depends_on.map((dependency) => completion.get(dependency)!));
    if (!policy.parallel_steps) ready = Math.max(ready, sequentialFinish);
    let reactivePreparation = ready;
    for (const label of step.required_documents) {
      const id = documentId(step, label);
      const producer = assumptions.document_producers[label];
      let available = documents.get(id);
      if (producer) available = completion.get(producerId(step, producer))!;
      else if (available === undefined) {
        const preparation = sample(
          assumptions.document_preparation_days[label]!,
          draws.documents.get(id)!,
        );
        available = policy.proactive_documents ? preparation : reactivePreparation + preparation;
        documents.set(id, available);
        if (!policy.proactive_documents) reactivePreparation = available;
      }
      ready = Math.max(ready, available!);
    }
    const processing = sample(assumptions.step_duration_days[baseId(step)]!, units[0]!);
    // Logical zero-duration joins carry no invented notice, handoff or processing disruption.
    const positiveTask = assumptions.step_duration_days[baseId(step)]!.max > 0;
    const gap = positiveTask
      ? sample(policy.notice_days, units[3]!) + sample(policy.handoff_days, units[4]!)
      : 0;
    const shock =
      positiveTask && units[1]! < assumptions.delay_probability.value
        ? sample(assumptions.unexpected_delay_days, units[2]!)
        : 0;
    const finished = ready + gap + processing + shock;
    if (!Number.isFinite(finished)) throw new TypeError('simulation_numeric_overflow');
    completion.set(step.id, finished);
    sequentialFinish = finished;
  }
  return completion.get(steps.find((step) => step.terminal)!.id)!;
}
function distribution(samples: number[]): DaysDistribution {
  const sorted = [...samples].sort((a, b) => a - b);
  function quantile(probability: number): number {
    const index = probability * (sorted.length - 1);
    const lower = Math.floor(index);
    const weight = index - lower;
    return (
      sorted[lower]! + weight * (sorted[Math.min(lower + 1, sorted.length - 1)]! - sorted[lower]!)
    );
  }
  return {
    samples_days: [...samples],
    median: quantile(0.5),
    p10: quantile(0.1),
    p90: quantile(0.9),
    min: sorted[0]!,
    max: sorted.at(-1)!,
  };
}
function cohort(
  inputs: readonly CaseInput[],
  assumptions: SimulationAssumptions,
  seed: number,
  runs: number,
): SimulationCaseResult[] {
  return inputs.map((input, caseIndex) => {
    const steps = graph(input, assumptions);
    const baseline: number[] = [];
    const assisted: number[] = [];
    for (let run = 0; run < runs; run++) {
      const draws = drawsFor(steps, (seed + Math.imul(caseIndex + 1, 0x9e3779b9) + run) >>> 0);
      baseline.push(schedule(steps, assumptions.baseline, assumptions, draws));
      assisted.push(schedule(steps, assumptions.orchestration, assumptions, draws));
    }
    return {
      case_id: input.case_id,
      journey: input.journey,
      target_step_id: steps.find((step) => step.terminal)!.id,
      baseline_days: distribution(baseline),
      orchestrated_days: distribution(assisted),
      days_saved: distribution(baseline.map((days, index) => days - assisted[index]!)),
    };
  });
}
const parameters: SensitivityParameter[] = [
  'processing_duration',
  'delay_probability',
  'delay_severity',
  'document_preparation',
  'baseline_notice',
  'baseline_handoff',
  'orchestrated_notice',
  'orchestrated_handoff',
  'parallel_steps',
  'proactive_documents',
];
function vary(
  source: SimulationAssumptions,
  parameter: SensitivityParameter,
  setting: number | boolean,
): SimulationAssumptions {
  const result = structuredClone(source);
  function scale(window: SimulationRange): void {
    window.min *= Number(setting);
    window.max *= Number(setting);
  }
  if (parameter === 'parallel_steps' || parameter === 'proactive_documents')
    result.orchestration[parameter] = Boolean(setting);
  else if (parameter === 'processing_duration')
    Object.values(result.step_duration_days).forEach(scale);
  else if (parameter === 'document_preparation')
    Object.values(result.document_preparation_days).forEach(scale);
  else if (parameter === 'delay_probability')
    result.delay_probability.value = Math.min(1, result.delay_probability.value * Number(setting));
  else if (parameter === 'delay_severity') scale(result.unexpected_delay_days);
  else {
    const policy = parameter.startsWith('baseline') ? result.baseline : result.orchestration;
    scale(parameter.endsWith('notice') ? policy.notice_days : policy.handoff_days);
  }
  return result;
}

/** Seeded synthetic scheduling only: no clock, IO, LLM, observed customer timings or legal determinations. */
export function simulateJourneys(options: SimulationOptions = {}): SimulationResult {
  fields(options, ['seed', 'runs', 'cases', 'assumptions', 'include_sensitivity'], 'options');
  const assumptions: SimulationAssumptions =
    options.assumptions === undefined
      ? getSimulationAssumptions()
      : structuredClone(options.assumptions as SimulationAssumptions);
  validateAssumptions(assumptions);
  const seed = options.seed === undefined ? assumptions.default_seed.value : options.seed;
  const runs = options.runs === undefined ? assumptions.default_runs.value : options.runs;
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff)
    throw new TypeError('invalid_simulation_seed');
  if (!Number.isSafeInteger(runs) || runs < 1 || runs > assumptions.maximum_runs.value)
    throw new TypeError('invalid_simulation_runs');
  if (options.include_sensitivity !== undefined && typeof options.include_sensitivity !== 'boolean')
    throw new TypeError('invalid_simulation_sensitivity');
  const inputs =
    options.cases === undefined
      ? ([
          { case_id: DEMO_FIXTURES.hire, journey: 'individual_relocation' },
          { case_id: DEMO_FIXTURES.company, journey: 'company_setup' },
        ] as CaseInput[])
      : options.cases;
  if (
    !Array.isArray(inputs) ||
    inputs.length === 0 ||
    Array.from(inputs).some((input) => !input) ||
    new Set(inputs.map((input) => input.case_id)).size !== inputs.length
  )
    throw new TypeError('invalid_simulation_cases');
  const cases = cohort(inputs, assumptions, seed, runs);
  const sensitivity: SimulationSensitivity[] = [];
  if (options.include_sensitivity !== false) {
    for (const parameter of parameters) {
      const structural = parameter === 'parallel_steps' || parameter === 'proactive_documents';
      const low = structural ? false : 1 - assumptions.sensitivity_relative_change.value;
      const high = structural ? true : 1 + assumptions.sensitivity_relative_change.value;
      const lowCases = cohort(inputs, vary(assumptions, parameter, low), seed, runs);
      const highCases = cohort(inputs, vary(assumptions, parameter, high), seed, runs);
      for (let index = 0; index < cases.length; index++) {
        const lowMedian = lowCases[index]!.days_saved.median;
        const highMedian = highCases[index]!.days_saved.median;
        sensitivity.push({
          parameter,
          low_setting: low,
          high_setting: high,
          case_id: cases[index]!.case_id,
          low_median_saved_days: lowMedian,
          high_median_saved_days: highMedian,
          median_saved_span_days: Math.abs(highMedian - lowMedian),
        });
      }
    }
    const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
    sensitivity.sort(
      (a, b) =>
        b.median_saved_span_days - a.median_saved_span_days ||
        compare(a.parameter, b.parameter) ||
        compare(a.case_id, b.case_id),
    );
  }
  return {
    contract_version: CONTRACT_VERSION,
    illustrative: true,
    evidence_scope: 'illustrative_simulation',
    measured_real_world: false,
    seed,
    runs,
    randomness: 'common_random_numbers_per_step_and_document',
    assumptions,
    inputs: structuredClone([...inputs]),
    cases,
    sensitivity,
    reasons: [
      reason(
        'evidence_scope',
        'illustrative_simulation',
        'not_measured',
        'simulation.assumptions_not_customer_outcomes',
      ),
      reason(
        'paired_seed',
        seed,
        'controlled_randomness',
        'simulation.same_processing_and_disruptions_both_policies',
      ),
    ],
  };
}
