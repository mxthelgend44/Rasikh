import assert from 'node:assert/strict';
import test from 'node:test';
import { runEvaluationPipeline } from '../src/pipeline.ts';

test('failed security checks do not prevent Trust generation or erase failure status', async () => {
  const called: string[] = [];
  const dates: string[] = [];
  const report = await runEvaluationPipeline({
    write: false,
    steps: [
      { name: 'guard', file: 'unused' },
      { name: 'ai', file: 'unused' },
      { name: 'trust', file: 'unused' },
    ],
    execute: async (step, minimumDate) => {
      called.push(step.name);
      dates.push(minimumDate);
      if (step.name === 'guard') return 1;
      if (step.name === 'ai') throw new Error('FAKE_SECRET_SENTINEL');
      return 0;
    },
  });
  assert.deepEqual(called, ['guard', 'ai', 'trust']);
  assert.equal(report.status, 'fail');
  assert.deepEqual(
    report.steps.map((step) => step.exit_code),
    [1, 1, 0],
  );
  assert.equal(new Set(dates).size, 1);
  assert.equal(dates[0], report.started_at);
  assert.equal(JSON.stringify(report).includes('FAKE_SECRET'), false);
});
