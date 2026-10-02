import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTRACT_VERSION, DEMO_FIXTURES } from '@rasikh/shared';
import { getSimulationAssumptions, simulateJourneys } from '../src/simulation.js';
import type { SimulationAssumptions, SimulationOptions } from '../src/simulation-types.js';

function controlled(): SimulationAssumptions {
  const config = getSimulationAssumptions();
  for (const duration of Object.values(config.step_duration_days)) {
    duration.min = duration.max = duration.max > 0 ? 1 : 0;
  }
  for (const duration of Object.values(config.document_preparation_days))
    duration.min = duration.max = 0;
  for (const policy of [config.baseline, config.orchestration]) {
    policy.notice_days.min = policy.notice_days.max = 0;
    policy.handoff_days.min = policy.handoff_days.max = 0;
  }
  config.delay_probability.value = 0;
  return config;
}

test('fixed seeds replay the complete distribution and paired sensitivity exactly', () => {
  const first = simulateJourneys({ seed: 71, runs: 20 });
  assert.deepEqual(first, simulateJourneys({ seed: 71, runs: 20 }));
  assert.equal(first.contract_version, CONTRACT_VERSION);
  assert.equal(first.evidence_scope, 'illustrative_simulation');
  assert.equal(first.measured_real_world, false);
  assert.equal(first.runs, 20);
  assert.equal(first.randomness, 'common_random_numbers_per_step_and_document');
  assert.deepEqual(
    first.cases.map((entry) => entry.case_id),
    [DEMO_FIXTURES.hire, DEMO_FIXTURES.company],
  );
  assert.deepEqual(
    first.cases.map((entry) => entry.target_step_id),
    ['fully_settled', 'fully_operational'],
  );
  assert.equal(first.sensitivity.length, 20);
  for (const reason of first.reasons)
    assert.deepEqual(Object.keys(reason).sort(), [
      'criterion',
      'effect',
      'explanation_key',
      'value',
    ]);
});

test('different seeds change samples and distributions retain ordered quantiles and finite times', () => {
  const first = simulateJourneys({ seed: 1, runs: 100, include_sensitivity: false });
  const second = simulateJourneys({ seed: 2, runs: 100, include_sensitivity: false });
  assert.notDeepEqual(
    first.cases[0]!.baseline_days.samples_days,
    second.cases[0]!.baseline_days.samples_days,
  );
  for (const entry of first.cases) {
    for (const result of [entry.baseline_days, entry.orchestrated_days, entry.days_saved]) {
      assert.equal(result.samples_days.length, 100);
      assert.ok(
        result.min <= result.p10 &&
          result.p10 <= result.median &&
          result.median <= result.p90 &&
          result.p90 <= result.max,
      );
      assert.ok(result.samples_days.every((value) => Number.isFinite(value) && value >= 0));
    }
  }
  assert.deepEqual(first.sensitivity, []);
});

test('identical policies yield identical per-run outcomes, including processing disruptions', () => {
  const assumptions = getSimulationAssumptions();
  assumptions.orchestration = structuredClone(assumptions.baseline);
  assumptions.delay_probability.value = 1;
  const result = simulateJourneys({ assumptions, seed: 5, runs: 50, include_sensitivity: false });
  for (const entry of result.cases) {
    assert.deepEqual(entry.baseline_days.samples_days, entry.orchestrated_days.samples_days);
    assert.ok(entry.days_saved.samples_days.every((days) => days === 0));
  }
});

test('one-day processing and zero gaps give exact sequential versus longest dependency-chain durations', () => {
  const result = simulateJourneys({
    assumptions: controlled(),
    runs: 1,
    include_sensitivity: false,
  });
  assert.equal(result.cases[0]!.baseline_days.median, 7);
  assert.equal(result.cases[0]!.orchestrated_days.median, 4);
  assert.equal(result.cases[0]!.days_saved.median, 3);
  assert.equal(result.cases[1]!.baseline_days.median, 6);
  assert.equal(result.cases[1]!.orchestrated_days.median, 5);
});

test('proactive original document preparation runs in parallel; reactive preparation is sequential', () => {
  const assumptions = controlled();
  for (const duration of Object.values(assumptions.step_duration_days))
    duration.min = duration.max = 0;
  assumptions.document_preparation_days.passport!.min =
    assumptions.document_preparation_days.passport!.max = 1;
  assumptions.document_preparation_days.employment!.min =
    assumptions.document_preparation_days.employment!.max = 2;
  const result = simulateJourneys({ assumptions, runs: 1, include_sensitivity: false });
  assert.equal(result.cases[0]!.baseline_days.median, 3);
  assert.equal(result.cases[0]!.orchestrated_days.median, 2);
});

test('orchestration cannot prepare a produced Emirates ID before its milestone finishes', () => {
  const assumptions = controlled();
  for (const duration of Object.values(assumptions.step_duration_days))
    duration.min = duration.max = 0;
  assumptions.step_duration_days.emirates_id!.min =
    assumptions.step_duration_days.emirates_id!.max = 10;
  assumptions.step_duration_days.tawtheeq_register!.min =
    assumptions.step_duration_days.tawtheeq_register!.max = 5;
  const result = simulateJourneys({ assumptions, runs: 1, include_sensitivity: false });
  assert.equal(result.cases[0]!.orchestrated_days.median, 15);
});

test('family and team journeys use their graph, with employee residency after the sponsorship gate', () => {
  const assumptions = controlled();
  for (const duration of Object.values(assumptions.step_duration_days))
    duration.min = duration.max = 0;
  assumptions.step_duration_days.economic_license!.min =
    assumptions.step_duration_days.economic_license!.max = 5;
  assumptions.step_duration_days.residency_visa!.min =
    assumptions.step_duration_days.residency_visa!.max = 7;
  const result = simulateJourneys({
    assumptions,
    runs: 1,
    include_sensitivity: false,
    cases: [
      { case_id: 'fake_family', journey: 'family_relocation' },
      { case_id: DEMO_FIXTURES.company, journey: 'team_transfer', employee_ids: ['hire_demo_002'] },
      {
        case_id: 'fake_ready_team',
        journey: 'team_transfer',
        sponsoring_entity_ready: true,
        employee_ids: ['hire_demo_002'],
      },
    ],
  });
  assert.equal(result.cases[0]!.target_step_id, 'fully_settled');
  assert.equal(result.cases[1]!.orchestrated_days.median, 12);
  assert.equal(result.cases[2]!.orchestrated_days.median, 7);
});

test('logical milestones add no notice, handoff or disruption when all processing is zero', () => {
  const assumptions = getSimulationAssumptions();
  for (const duration of Object.values(assumptions.step_duration_days))
    duration.min = duration.max = 0;
  for (const duration of Object.values(assumptions.document_preparation_days))
    duration.min = duration.max = 0;
  assumptions.delay_probability.value = 1;
  const result = simulateJourneys({ assumptions, runs: 5, include_sensitivity: false });
  for (const entry of result.cases)
    assert.deepEqual(entry.baseline_days.samples_days, [0, 0, 0, 0, 0]);
});

test('paired sensitivity isolates a known noticing-gap perturbation and structural parallelism', () => {
  const assumptions = controlled();
  assumptions.baseline.notice_days.min = assumptions.baseline.notice_days.max = 1;
  const result = simulateJourneys({ assumptions, runs: 5 });
  const sensitivity = result.sensitivity.find(
    (entry) => entry.case_id === DEMO_FIXTURES.hire && entry.parameter === 'baseline_notice',
  )!;
  assert.ok(Math.abs(sensitivity.median_saved_span_days - 2.8) < 1e-10);
  assert.equal(sensitivity.low_setting, 0.8);
  assert.equal(sensitivity.high_setting, 1.2);
  const parallel = result.sensitivity.find(
    (entry) => entry.case_id === DEMO_FIXTURES.hire && entry.parameter === 'parallel_steps',
  )!;
  assert.equal(parallel.low_setting, false);
  assert.equal(parallel.high_setting, true);
  assert.equal(parallel.median_saved_span_days, 3);
  for (let index = 1; index < result.sensitivity.length; index++)
    assert.ok(
      result.sensitivity[index - 1]!.median_saved_span_days >=
        result.sensitivity[index]!.median_saved_span_days,
    );
});

test('the model can show negative savings if orchestration gaps are assumed worse', () => {
  const assumptions = controlled();
  assumptions.orchestration.parallel_steps = false;
  assumptions.orchestration.proactive_documents = false;
  assumptions.orchestration.notice_days.min = assumptions.orchestration.notice_days.max = 5;
  const result = simulateJourneys({ assumptions, runs: 1, include_sensitivity: false });
  assert.equal(result.cases[0]!.days_saved.median, -35);
});

test('assumptions and options never mutate, and returned data cannot alter defaults', () => {
  const assumptions = getSimulationAssumptions();
  const options: SimulationOptions = { assumptions, seed: 0, runs: 1, include_sensitivity: false };
  const before = JSON.stringify(options);
  const result = simulateJourneys(options);
  assert.equal(JSON.stringify(options), before);
  result.assumptions.baseline.notice_days.min = 100;
  result.cases[0]!.baseline_days.samples_days[0] = 999;
  assert.equal(JSON.stringify(options), before);
  assert.notEqual(getSimulationAssumptions().baseline.notice_days.min, 100);
  assert.notEqual(simulateJourneys(options).cases[0]!.baseline_days.samples_days[0], 999);
});

test('invalid seeds, runs, unknown options, duplicate cases and sparse case lists are rejected', () => {
  for (const seed of [-1, 0x100000000, Infinity, 1.2])
    assert.throws(() => simulateJourneys({ seed }), /invalid_simulation_seed/);
  for (const runs of [0, -1, Infinity, 1.2, 10001])
    assert.throws(() => simulateJourneys({ runs }), /invalid_simulation_runs/);
  assert.throws(
    () => simulateJourneys({ seed: null } as unknown as SimulationOptions),
    /invalid_simulation_seed/,
  );
  assert.throws(
    () => simulateJourneys({ runs: null } as unknown as SimulationOptions),
    /invalid_simulation_runs/,
  );
  assert.throws(
    () => simulateJourneys({ cases: null } as unknown as SimulationOptions),
    /invalid_simulation_cases/,
  );
  assert.throws(
    () => simulateJourneys({ wrong_seed: 4 } as unknown as SimulationOptions),
    /invalid_simulation_options/,
  );
  assert.throws(() => simulateJourneys({ cases: [] }), /invalid_simulation_cases/);
  assert.throws(() => simulateJourneys({ cases: new Array(1) }), /invalid_simulation_cases/);
  const input = { case_id: 'fake_duplicate', journey: 'individual_relocation' as const };
  assert.throws(() => simulateJourneys({ cases: [input, input] }), /invalid_simulation_cases/);
  assert.throws(
    () => simulateJourneys({ include_sensitivity: 'yes' } as unknown as SimulationOptions),
    /invalid_simulation_sensitivity/,
  );
});

test('all numeric assumptions need finite ranges, illustrative markers and rationale', () => {
  const badRange = getSimulationAssumptions();
  badRange.step_duration_days.residency_visa!.min = -1;
  assert.throws(() => simulateJourneys({ assumptions: badRange }), /invalid_simulation_range/);
  const badRationale = getSimulationAssumptions();
  badRationale.baseline.rationale = '';
  assert.throws(
    () => simulateJourneys({ assumptions: badRationale }),
    /unmarked_simulation_baseline/,
  );
  const unmarked = getSimulationAssumptions();
  Object.assign(unmarked.delay_probability, { illustrative: false });
  assert.throws(
    () => simulateJourneys({ assumptions: unmarked }),
    /unmarked_simulation_delay_probability/,
  );
  const probability = getSimulationAssumptions();
  probability.delay_probability.value = 1.1;
  assert.throws(
    () => simulateJourneys({ assumptions: probability }),
    /invalid_simulation_probability/,
  );
  const missing = getSimulationAssumptions();
  delete missing.step_duration_days.economic_license;
  assert.throws(
    () => simulateJourneys({ assumptions: missing }),
    /invalid_simulation_economic_license/,
  );
  const typo = getSimulationAssumptions();
  Object.assign(typo.baseline, { noticing_gap: 1 });
  assert.throws(() => simulateJourneys({ assumptions: typo }), /invalid_simulation_baseline/);
  assert.throws(
    () => simulateJourneys({ assumptions: null } as unknown as SimulationOptions),
    /invalid_simulation_assumptions/,
  );
});

test('missing, invalid or cyclic modeled document producers fail before sampling', () => {
  const missingDuration = getSimulationAssumptions();
  delete missingDuration.document_preparation_days.passport;
  assert.throws(
    () => simulateJourneys({ assumptions: missingDuration }),
    /missing_simulation_document_duration:passport/,
  );
  const producer = getSimulationAssumptions();
  producer.document_producers.passport = 'bogus';
  assert.throws(
    () => simulateJourneys({ assumptions: producer }),
    /invalid_simulation_document_producer/,
  );
  const self = getSimulationAssumptions();
  self.document_producers.passport = 'collect_documents';
  assert.throws(() => simulateJourneys({ assumptions: self }), /cyclic_dependency_graph/);
  const absent = getSimulationAssumptions();
  absent.document_producers.passport = 'economic_license';
  assert.throws(
    () => simulateJourneys({ assumptions: absent }),
    /missing_simulation_document_producer/,
  );
});

test('custom topology inputs are retained and reproduce the exact seeded model', () => {
  const input = {
    case_id: 'fake-team-replay',
    journey: 'team_transfer' as const,
    employee_ids: ['fake-employee-a'],
    setup_path: 'adgm' as const,
    sponsoring_entity_ready: true,
  };
  const result = simulateJourneys({ cases: [input], runs: 3, seed: 42 });
  assert.deepEqual(result.inputs, [input]);
  assert.notEqual(result.inputs[0], input);
  assert.deepEqual(
    simulateJourneys({
      cases: result.inputs,
      assumptions: result.assumptions,
      runs: result.runs,
      seed: result.seed,
    }),
    result,
  );
});
