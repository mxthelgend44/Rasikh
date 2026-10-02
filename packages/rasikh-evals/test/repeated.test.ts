import assert from 'node:assert/strict';
import test from 'node:test';
import { describeVariance, runRepeatedEvaluations } from '../src/repeated.ts';
import { DemoAiAdapter } from '../src/adapters/demo.ts';
import type { GuardAdapter } from '../src/types.ts';

test('variance retains unavailable runs and uses population variance', () => {
  assert.deepEqual(describeVariance([null, null]), {
    values: [null, null],
    mean: null,
    minimum: null,
    maximum: null,
    population_variance: null,
    standard_deviation: null,
    eligible_runs: 0,
  });
  assert.equal(describeVariance([0, 1, null]).population_variance, 0.25);
  assert.equal(describeVariance([0, 1, null]).eligible_runs, 2);
});

test('three cache runs remain explicitly cache evidence with no invented live leak rate', async () => {
  const report = await runRepeatedEvaluations({ runs: 3, write: false });
  assert.equal(report.totals.cases, 225);
  assert.equal(report.metrics.extraction_field_accuracy!.denominator, 315);
  assert.equal(report.metrics.extraction_field_accuracy!.scope, 'cache');
  assert.equal(report.metrics.extraction_field_accuracy!.target, 1);
  assert.equal(report.metrics.guard_leak_rate!.scope, 'unavailable');
  assert.equal(report.variance!.guard_leak_rate!.mean, null);
  assert.equal(report.validation_scope.complete_live_evidence, false);
  assert.equal(report.results.filter((item) => item.run_index === 3).length, 75);
});

test('an unsafe run remains failed even in repeated evidence and live targets differ', async () => {
  let checks = 0;
  const guard: GuardAdapter = {
    name: 'scripted_test_double',
    async check() {
      return {
        source: 'http',
        verified: true,
        contract_version: '1.0.0',
        decision: checks++ === 0 ? 'allow' : 'deny',
      };
    },
  };
  const report = await runRepeatedEvaluations({
    mode: 'live',
    runs: 3,
    aiAdapter: new DemoAiAdapter(),
    guardAdapter: guard,
    write: false,
  });
  assert.equal(report.status, 'fail');
  assert.equal(report.metrics.guard_leak_rate!.numerator, 1);
  assert.deepEqual(report.variance!.guard_leak_rate!.values, [0.04, 0, 0]);
  assert.equal(report.metrics.extraction_field_accuracy!.target, 0.95);
  assert.equal(report.metrics.summary_fact_coverage!.target, 0.95);
  assert.equal(report.metrics.roadmap_order_correctness!.target, 1);
});

test('invalid repeat count performs no adapter calls', async () => {
  await assert.rejects(runRepeatedEvaluations({ runs: 0, write: false }), /runs/);
});

test('raw adapter diagnostics cannot persist credentials in reports', async () => {
  const ai = new DemoAiAdapter();
  ai.extract = async () => {
    throw new Error('FAKE_SECRET_SENTINEL');
  };
  const report = await runRepeatedEvaluations({ aiAdapter: ai, write: false });
  assert.equal(report.totals.errors, 20);
  assert.equal(JSON.stringify(report).includes('FAKE_SECRET_SENTINEL'), false);
});

test('an unavailable early run cannot inherit the final healthy Guard scope', async () => {
  let calls = 0;
  const guard: GuardAdapter = { name: 'scripted_test_double', async check() {
    if (calls++ < 25) throw new Error('offline');
    return { source: 'http', verified: true, contract_version: '1.0.0', decision: 'deny' };
  } };
  const report = await runRepeatedEvaluations({ runs: 3, guardAdapter: guard, write: false });
  assert.equal(report.validation_scope.guard, 'mixed');
  assert.equal(report.metrics.guard_leak_rate!.scope, 'mixed');
  assert.equal(report.guard.verified_checks, 50);
  assert.equal(report.guard.errors, 25);
  assert.equal(report.status, 'incomplete');
  assert.deepEqual(report.variance!.guard_leak_rate!.values, [null, 0, 0]);
});
