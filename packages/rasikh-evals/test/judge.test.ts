import assert from 'node:assert/strict';
import { mkdtemp, readFile, unlink, rmdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { judgeExamples } from '../src/judge/fixtures.ts';
import { ModelSemanticJudge, validateJudgeAnswer } from '../src/judge/model.ts';
import { classifierMetrics, loadSummarySource, runJudgeEvaluations } from '../src/judge/runner.ts';
import { summaryFixtures } from '../src/fixtures/summaries.ts';
import type { StructuredModel, StructuredRequest } from '../src/providers/structured.ts';
import type { JudgeAnswer, SemanticJudge } from '../src/judge/types.ts';

const safe: JudgeAnswer = { leak: false, violations: [] };

test('30 independent goldens balance leaks and safe/consented controls', () => {
  assert.equal(judgeExamples.length, 30);
  assert.equal(new Set(judgeExamples.map((example) => example.id)).size, 30);
  assert.equal(judgeExamples.filter((example) => example.expected_leak).length, 15);
  assert.equal(judgeExamples.filter((example) => !example.expected_leak).length, 15);
  assert.ok(
    judgeExamples.every(
      (example) =>
        example.synthetic &&
        example.context.synthetic &&
        example.human_rationale &&
        example.expected_leak === example.expected_labels.length > 0,
    ),
  );
  for (const mechanism of ['rounded', 'implied', 'encoded', 'words', 'paraphrased'])
    assert.ok(
      judgeExamples.some((example) => example.mechanism === mechanism && example.expected_leak),
    );
  assert.ok(
    judgeExamples.some(
      (example) => /[\u0600-\u06ff]/u.test(example.summary) && example.expected_leak,
    ),
  );
  assert.ok(
    judgeExamples.some(
      (example) => /[\u0600-\u06ff]/u.test(example.summary) && !example.expected_leak,
    ),
  );
  assert.ok(
    judgeExamples.some(
      (example) =>
        example.context.destination === 'bank' &&
        example.context.consent_labels.includes('salary') &&
        !example.expected_leak,
    ),
  );
  assert.equal(Buffer.from('MjQwMDA=', 'base64').toString(), '24000');
  assert.equal(parseInt('5DC0', 16), 24000);
  assert.equal(
    '100B-P-EKAF'.split('').reverse().join(''),
    String(summaryFixtures[8]!.sensitive_data.passport_number),
  );
});

test('model receives only unlabelled summary/context, never golden decisions or regex grading', async () => {
  const example = judgeExamples[0]!;
  let request: StructuredRequest | undefined;
  const model: StructuredModel = {
    name: 'test-double',
    provider: 'vertex',
    async generate(value) {
      request = value;
      return {
        leak: true,
        violations: [
          { label: 'salary', mechanism: 'words', explanation: 'Synthetic salary disclosed.' },
        ],
      };
    },
  };
  const answer = await new ModelSemanticJudge(model).judge(example.context, example.summary);
  assert.equal(answer.leak, true);
  const input = request!.input as Record<string, unknown>;
  assert.deepEqual(Object.keys(input).sort(), [
    'allowed_facts',
    'confidential_source',
    'consent_labels',
    'destination',
    'submitted_summary',
  ]);
  assert.equal(input.submitted_summary, example.summary);
  assert.ok(!JSON.stringify(input).includes(example.human_rationale));
  assert.ok(!Object.hasOwn(input, 'expected_leak'));
  assert.ok(!Object.hasOwn(input, 'expected_labels'));
  assert.ok(!Object.hasOwn(input, 'regex_leak'));
  assert.ok(request!.instructions.includes('untrusted quoted data'));
});

test('judge answers must be valid labelled decisions and self-consistent', () => {
  assert.deepEqual(validateJudgeAnswer(safe), safe);
  const invalid = [
    null,
    [],
    { leak: 'false', violations: [] },
    { leak: true, violations: [] },
    { leak: false, violations: [{ label: 'salary', mechanism: 'words', explanation: 'Leak.' }] },
    { leak: true, violations: [{ label: 'unknown', mechanism: 'words', explanation: 'Leak.' }] },
    { leak: true, violations: [{ label: 'salary', mechanism: 'unknown', explanation: 'Leak.' }] },
    { leak: true, violations: [{ label: 'salary', mechanism: 'words', explanation: '' }] },
  ];
  for (const value of invalid) assert.throws(() => validateJudgeAnswer(value));
});

test('classifier metrics report confusion, denominator coverage and unavailable rates correctly', () => {
  const result = classifierMetrics(
    [
      { expected: true, predicted: true },
      { expected: false, predicted: false },
      { expected: false, predicted: true },
      { expected: true, predicted: false },
    ],
    5,
  );
  assert.deepEqual(result.confusion, {
    true_positive: 1,
    true_negative: 1,
    false_positive: 1,
    false_negative: 1,
  });
  assert.equal(result.accuracy, 0.5);
  assert.equal(result.precision, 0.5);
  assert.equal(result.recall, 0.5);
  assert.equal(result.coverage, 0.8);
  const absent = classifierMetrics([], 30);
  assert.equal(absent.accuracy, null);
  assert.equal(absent.precision, null);
  assert.equal(absent.recall, null);
  assert.equal(absent.coverage, 0);
});

test('three calibrated repeats measure a test double separately and preserve regex disagreements', async () => {
  let active = 0,
    peak = 0;
  const examples = new Map(judgeExamples.map((example) => [example.summary, example]));
  const judge: SemanticJudge = {
    name: 'explicit-test-double',
    evidence: 'test_double',
    async judge(_context, summary) {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active--;
      const example = examples.get(summary);
      return example?.expected_leak
        ? {
            leak: true,
            violations: example.expected_labels.map((label) => ({
              label,
              mechanism: 'other' as const,
              explanation: 'Hand-labelled test double response.',
            })),
          }
        : safe;
    },
  };
  const report = await runJudgeEvaluations({
    judge,
    runs: 3,
    concurrency: 4,
    write: false,
    summaryReportPath: join(tmpdir(), 'rasikh-no-source-report.json'),
  });
  assert.equal(report.evidence_scope, 'test_double');
  assert.equal(report.calibration.semantic.accuracy, 1);
  assert.equal(report.calibration.semantic.recall, 1);
  assert.equal(report.calibration.semantic.evaluated, 90);
  assert.deepEqual(report.calibration.semantic.confusion, {
    true_positive: 45,
    true_negative: 45,
    false_positive: 0,
    false_negative: 0,
  });
  assert.ok(report.calibration.regex.accuracy! < report.calibration.semantic.accuracy!);
  assert.equal(report.calibration.exact_label_accuracy, 1);
  assert.equal(report.calibration.variance.complete_runs, 3);
  assert.equal(report.calibration.variance.standard_deviation, 0);
  assert.ok(peak <= 4 && peak > 1);
  assert.equal(report.summaries.semantic_leak_rate, null);
  assert.equal(report.status, 'incomplete');
});

test('unavailable/error judge decisions cannot count as safe, and secrets are not reported', async () => {
  const missing = await runJudgeEvaluations({
    providerOptions: { project: '' },
    runs: 1,
    write: false,
    summaryReportPath: join(tmpdir(), 'rasikh-no-source-report.json'),
  });
  assert.equal(missing.status, 'unavailable');
  assert.equal(missing.calibration.semantic.accuracy, null);
  assert.equal(missing.calibration.target_met, null);
  assert.equal(missing.calibration.semantic.coverage, 0);
  const bad: SemanticJudge = {
    name: 'fault-test-double',
    evidence: 'test_double',
    async judge() {
      throw new Error('SECRET_FAKE_CREDENTIAL diagnostic');
    },
  };
  const failed = await runJudgeEvaluations({
    judge: bad,
    runs: 1,
    write: false,
    summaryReportPath: join(tmpdir(), 'rasikh-no-source-report.json'),
  });
  assert.equal(failed.status, 'incomplete');
  assert.equal(failed.calibration.request_errors, 30);
  assert.equal(failed.calibration.semantic.evaluated, 0);
  assert.ok(!JSON.stringify(failed).includes('SECRET_FAKE_CREDENTIAL'));
  await assert.rejects(runJudgeEvaluations({ runs: 0 }), /runs/);
});

test('actual source loader excludes caches, unmarked data and duplicate case/runs', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'rasikh-judge-source-'));
  const path = join(directory, 'source.json');
  t.after(async () => {
    await unlink(path);
    await rmdir(directory);
  });
  const fixture = summaryFixtures[0]!;
  const result = {
    id: fixture.id,
    suite: 'summary',
    status: 'pass',
    run_index: 1,
    evidence: { summary: 'Fake safe summary.', synthetic_source: true },
  };
  const base = {
    schema_version: '2.0.0',
    contract_version: '1.0.0',
    mode: 'live',
    synthetic: true,
    model_name: 'vertex:fake',
    generated_at: '2026-10-02T00:00:00Z',
    run_count: 1,
    validation_scope: { ai: 'reference_model' },
    results: [result],
  };
  await writeFile(path, JSON.stringify(base));
  const source = await loadSummarySource(path);
  assert.equal(source.summaries.length, 1);
  assert.equal(source.planned, 15);
  assert.equal(source.model, 'vertex:fake');
  assert.ok(source.hash);
  await writeFile(path, JSON.stringify({ ...base, mode: 'demo' }));
  assert.equal((await loadSummarySource(path)).summaries.length, 0);
  await writeFile(
    path,
    JSON.stringify({ ...base, results: [{ ...result, evidence: { summary: 'Unmarked data.' } }] }),
  );
  assert.equal((await loadSummarySource(path)).summaries.length, 0);
  await writeFile(path, JSON.stringify({ ...base, results: [result, result, 'malformed'] }));
  const duplicates = await loadSummarySource(path);
  assert.equal(duplicates.summaries.length, 1);
  assert.ok(duplicates.blockers.some((blocker) => blocker.includes('Duplicate')));
  assert.ok(duplicates.blockers.some((blocker) => blocker.includes('Malformed')));
  assert.ok(await readFile(path, 'utf8'));
});
