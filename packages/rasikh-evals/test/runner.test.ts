import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { runEvaluations } from '../src/runner.ts';
import { DemoAiAdapter } from '../src/adapters/demo.ts';
import { HttpGuardAdapter } from '../src/adapters/guard.ts';
import { renderReport } from '../src/report.ts';
import type { AiAdapter, GuardAdapter } from '../src/types.ts';

test('one run writes displayable reports; demo does not claim live zero leaks', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'rasikh-eval-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const report = await runEvaluations({ outputDirectory: directory });
  assert.equal(report.status, 'pass');
  assert.deepEqual(report.totals, { cases: 75, passed: 75, failed: 0, errors: 0 });
  assert.equal(report.metrics.extraction_field_accuracy!.denominator, 105);
  assert.equal(report.metrics.summary_fact_coverage!.denominator, 60);
  assert.equal(report.guard.cached_denials, 25);
  assert.equal(report.guard.verified_denials, 0);
  assert.equal(report.validation_scope.ai, 'synthetic_cache');
  assert.equal(report.validation_scope.guard, 'synthetic_cache');
  assert.equal(report.validation_scope.complete_live_evidence, false);
  assert.equal(report.metrics.guard_leak_rate!.value, null);
  assert.equal(report.metrics.guard_verified_coverage!.value, 0);
  const saved = JSON.parse(await readFile(join(directory, 'REPORT.json'), 'utf8'));
  assert.deepEqual(saved, report);
  const markdown = await readFile(join(directory, 'REPORT.md'), 'utf8');
  assert.equal(markdown, renderReport(report));
  assert.ok(markdown.includes('not evaluated'));
  assert.ok(markdown.includes('not live app'));
});

test('Guard connection failures are incomplete and never inflate verified denial rate', async () => {
  const report = await runEvaluations({
    guardMode: 'http',
    guardAdapter: new HttpGuardAdapter({
      fetch: async () => {
        throw new Error('offline');
      },
    }),
    write: false,
  });
  assert.equal(report.status, 'incomplete');
  assert.equal(report.totals.errors, 25);
  assert.equal(report.guard.verified_checks, 0);
  assert.equal(report.guard.verified_denials, 0);
  assert.equal(report.guard.errors, 25);
  assert.equal(report.metrics.guard_leak_rate!.value, null);
});

test('one explicit allow records one leak; needs_consent fails expected deny without leak', async () => {
  const allow: GuardAdapter = {
    name: 'fake-http',
    async check(fixture) {
      return {
        source: 'http',
        verified: true,
        contract_version: '1.0.0',
        decision: fixture.id === 'guard_direct_01' ? 'allow' : 'deny',
      };
    },
  };
  const leaked = await runEvaluations({
    mode: 'live',
    aiAdapter: new DemoAiAdapter(),
    guardAdapter: allow,
    write: false,
  });
  assert.equal(leaked.status, 'fail');
  assert.equal(leaked.guard.verified_denials, 24);
  assert.equal(leaked.metrics.guard_leak_rate!.value, 1 / 25);
  assert.equal(leaked.validation_scope.complete_live_evidence, false);
  const consent: GuardAdapter = {
    name: 'fake-http',
    async check() {
      return {
        source: 'http',
        verified: true,
        contract_version: '1.0.0',
        decision: 'needs_consent',
      };
    },
  };
  const withheld = await runEvaluations({ guardAdapter: consent, write: false });
  assert.equal(withheld.totals.failed, 25);
  assert.equal(withheld.guard.non_denials, 25);
  assert.equal(withheld.metrics.guard_leak_rate!.value, 0);
  assert.equal(withheld.metrics.guard_expected_denial_rate!.value, 0);
});

test('AI failures and wrong answers reduce metrics and do not pass silently', async () => {
  const bad: AiAdapter = {
    name: 'fault-injection',
    async extract() {
      return {};
    },
    async roadmap(fixture) {
      return { ...fixture.expected, step_ids: [...fixture.expected.step_ids].reverse() };
    },
    async summarize() {
      throw new Error('Synthetic model unavailable.');
    },
  };
  const report = await runEvaluations({ aiAdapter: bad, write: false });
  assert.equal(report.status, 'fail');
  assert.equal(report.totals.failed, 35);
  assert.equal(report.totals.errors, 15);
  assert.equal(report.metrics.extraction_field_accuracy!.value, 0);
  assert.equal(report.metrics.roadmap_order_correctness!.value, 0);
  assert.equal(report.metrics.summary_fact_coverage!.value, 0);
  assert.equal(report.metrics.summary_forbidden_content_rate!.value, null);
  assert.equal(report.metrics.summary_response_coverage!.value, 0);
});

test('live mode rejects cached Guard evidence and invalid configuration', async () => {
  await assert.rejects(
    runEvaluations({
      mode: 'live',
      aiAdapter: new DemoAiAdapter(),
      guardMode: 'cached',
      write: false,
    }),
    /requires HTTP/,
  );
  const cached: GuardAdapter = {
    name: 'fake-cache',
    async check() {
      return { source: 'cached', verified: false, contract_version: '1.0.0', decision: 'deny' };
    },
  };
  const report = await runEvaluations({
    mode: 'live',
    aiAdapter: new DemoAiAdapter(),
    guardAdapter: cached,
    write: false,
  });
  assert.equal(report.status, 'incomplete');
  assert.equal(report.totals.errors, 25);
});
