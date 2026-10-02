import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve, sep } from 'node:path';
import test from 'node:test';
import { CONTRACT_VERSION } from '@rasikh/shared';
import { buildTrustData, writeTrustData } from '../src/trust.ts';
import { TRUST_SECTION_IDS, type TrustInputs } from '../src/trust-types.ts';

const AT = '2026-10-02T07:30:00.000Z';
const NOW = '2026-10-02T08:30:00.000Z';
const FILES = {
  core: 'REPORT.json',
  guard: 'GUARD_CONFORMANCE.json',
  injection: 'INJECTION.json',
  documents: 'DOCUMENTS.json',
  judge: 'JUDGE.json',
  simulation: 'SIMULATION.json',
} as const;
type Reports = Record<keyof typeof FILES, any>;
const saved = Object.fromEntries(
  await Promise.all(
    Object.entries(FILES).map(async ([id, file]) => [
      id,
      JSON.parse(await readFile(new URL(`../evals/${file}`, import.meta.url), 'utf8')),
    ]),
  ),
) as Reports;

/** Frozen local synthetic evidence; no live calls, clock dependence, or output text scoring. */
function reports(): Reports {
  const r = structuredClone(saved);
  for (const [id, report] of Object.entries(r)) {
    if (id === 'guard') {
      for (const run of report.runs) {
        run.generated_at = AT;
        run.contract_version = CONTRACT_VERSION;
        for (const item of run.attacks.cases) item.outcome.contract_version = CONTRACT_VERSION;
      }
    } else {
      report.generated_at = AT;
      report.contract_version = CONTRACT_VERSION;
    }
  }
  r.core.run_dates = Array.from({ length: r.core.run_count }, () => AT);
  r.judge.summaries.source_generated_at = AT;
  return r;
}
function inputs(r: Reports, bindJudge = true): TrustInputs {
  const primary = JSON.stringify(r.core);
  if (bindJudge) {
    r.judge.summaries.source_sha256 = createHash('sha256').update(primary).digest('hex');
    r.judge.summaries.source_model = r.core.model_name;
  }
  return Object.fromEntries(
    Object.entries(r).map(([id, value]) => [id, { json: JSON.stringify(value) }]),
  ) as TrustInputs;
}
function build(r = reports()) {
  return buildTrustData(inputs(r), { now: NOW });
}

test('actual failed evidence stays visible; unique cohorts, repeated checks, and local blocks remain distinct', () => {
  const data = build();
  assert.equal(data.status, 'fail');
  assert.equal(data.complete, false);
  assert.equal(data.latest_live_available, true);
  assert.equal(data.security_failure_observed, true);
  assert.equal(data.sections.core.metrics.guard_leak_rate.value, 0.48);
  assert.deepEqual(
    data.sections.guard.metrics.authorization_leak_rate.per_run_values,
    [0.48, 0.48, 0.48],
  );
  assert.equal(data.sections.guard.counts.unique_attacks, 25);
  assert.equal(data.sections.guard.counts.unique_blocked_attacks, 13);
  assert.equal(data.sections.guard.counts.repeated_checks, 75);
  assert.equal(data.sections.guard.counts.repeated_denials, 39);
  assert.equal(data.sections.injection.metrics.forced_control_leak_rate.value, 0.1);
  assert.equal(data.sections.injection.counts.local_validator_blocks, 12);
  assert.equal(data.sections.injection.counts.guard_http_control_blocks, 42);
  assert.equal(data.sections.injection.counts.guard_http_control_checks, 48);
  assert.equal(data.sections.injection.counts.model_errors, 1);
  assert.equal(data.sections.injection.complete, false);
  assert.equal(data.sections.injection.metrics.model_coverage.target_met, false);
  assert.equal(data.sections.injection.counts.actual_outbound_actions_executed, 0);
  assert.equal(data.sections.documents.status, 'pass');
  assert.equal(data.sections.judge.status, 'pass');
  assert.equal(data.same_model_judge, true);
  assert.ok(data.limitations.includes('app_prompt_parity_unverified'));
  assert.ok(data.limitations.includes('same_model_judge'));
  assert.ok(data.limitations.includes('guard_policy_matrix_not_openappa'));
  assert.equal(data.evaluated_contract_version, CONTRACT_VERSION);
  assert.equal(data.main_contract_version, '1.1.0');
});

test('unmeasured safety rates stay null while measured zero rates stay zero', () => {
  const data = build(),
    m = data.sections.injection.metrics;
  assert.equal(m.system_level_leak_rate.denominator, 0);
  assert.equal(m.system_level_leak_rate.value, null);
  assert.equal(m.system_level_leak_rate.target_met, null);
  assert.equal(m.actual_unsafe_proposal_guard_coverage.value, null);
  assert.equal(m.model_hijack_rate.value, 0);
  assert.equal(m.model_hijack_rate.target_met, true);
  assert.equal(m.system_level_leak_rate.scope, 'unmeasured');
  assert.equal(data.sections.judge.metrics.regex_calibration_accuracy.target, null);
});

for (const mode of ['cache', 'custom'])
  test(`${mode} primary cannot advertise secondary evidence as latest live`, () => {
    const r = reports();
    r.core.mode = mode;
    const data = build(r);
    assert.equal(data.latest_live_available, false);
    assert.equal(data.complete, false);
    for (const section of Object.values(data.sections)) {
      assert.equal(section.scope, 'unavailable');
      for (const metric of Object.values(section.metrics)) {
        assert.equal(metric.scope, 'unmeasured');
        assert.equal(metric.value, null);
      }
    }
    // An independently observed security failure must still be explicit after current-live suppression.
    assert.equal(data.sections.guard.status, 'fail');
    assert.equal(data.security_failure_observed, true);
  });

test('missing primary suppresses latest-live metrics; entirely missing files have null counts', () => {
  const source = inputs(reports());
  delete source.core;
  const data = buildTrustData(source, { now: NOW });
  assert.equal(data.latest_live_available, false);
  assert.deepEqual(data.sections.core.issues, ['missing']);
  assert.equal(data.sections.guard.metrics.authorization_leak_rate.value, null);
  const absent = buildTrustData({}, { now: NOW });
  assert.equal(absent.status, 'incomplete');
  assert.equal(absent.security_failure_observed, false);
  assert.equal(absent.sections.core.counts.cases, null);
  assert.equal(absent.sections.core.source.sha256, null);
});

test('malformed, unreadable, stale, future, and incompatible inputs fail closed without raw diagnostics', () => {
  const source = inputs(reports());
  source.documents = { json: 'BAD SECRET SENTINEL' };
  source.judge = { error: 'unreadable' };
  const data = buildTrustData(source, { now: NOW });
  assert.deepEqual(data.sections.documents.issues, ['malformed_json']);
  assert.deepEqual(data.sections.judge.issues, ['unreadable']);
  assert.equal(data.sections.documents.metrics.clean_accuracy.value, null);
  assert.match(data.sections.documents.source.sha256!, /^[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(data).includes('SENTINEL'));
  const stale = buildTrustData(inputs(reports()), { now: '2026-10-03T07:30:00.001Z' });
  assert.equal(stale.latest_live_available, false);
  assert.ok(stale.sections.core.issues.includes('stale'));
  const r = reports();
  r.core.generated_at = '2026-10-02T09:00:00.000Z';
  assert.ok(build(r).sections.core.issues.includes('future_timestamp'));
  r.core.generated_at = AT;
  r.documents.contract_version = '99.0.0';
  assert.equal(build(r).sections.documents.scope, 'unavailable');
  r.core.mode = 'live';
  r.core.adapters.ai = 'custom-adapter';
  assert.equal(build(r).latest_live_available, false);
});

test('current-attempt lower bound suppresses an old successful file after a failed rerun', () => {
  const data = buildTrustData(inputs(reports()), {
    now: NOW,
    minimumSourceDate: '2026-10-02T07:30:00.001Z',
  });
  assert.equal(data.latest_live_available, false);
  assert.ok(data.sections.core.issues.includes('before_current_attempt'));
  assert.ok(data.sections.guard.issues.includes('before_current_attempt'));
  assert.equal(data.simulation.scope, 'unavailable');
  assert.equal(data.minimum_source_date, '2026-10-02T07:30:00.001Z');
  assert.equal(
    buildTrustData(inputs(reports()), { now: NOW, minimumSourceDate: AT }).latest_live_available,
    true,
  );
});

test('judge results bind to exact primary bytes, not only its filename, model, and date', () => {
  const r = reports(),
    source = inputs(r);
  const raw = JSON.parse((source.core as { json: string }).json);
  raw.notes.push('Changed evidence bytes');
  source.core = { json: JSON.stringify(raw) };
  const data = buildTrustData(source, { now: NOW });
  assert.equal(data.latest_live_available, true);
  assert.equal(data.sections.judge.scope, 'unavailable');
  assert.deepEqual(data.sections.judge.issues, ['summary_source_mismatch']);
  assert.equal(data.sections.judge.metrics.semantic_summary_leak_rate.value, null);
});

test('an attack is uniquely blocked only if all repeats deny; any verified allow remains visible', () => {
  const r = reports(),
    last = r.guard.runs[2];
  last.attacks.cases[0].outcome.decision = 'allow';
  last.attacks.verified_denials--;
  last.attacks.allows++;
  last.attacks.non_denials++;
  last.attacks.authorization_leak_rate = last.attacks.allows / last.attacks.total;
  last.attacks.expected_denial_rate = last.attacks.verified_denials / last.attacks.total;
  const g = build(r).sections.guard;
  assert.equal(g.counts.unique_attacks, 25);
  assert.equal(g.counts.unique_blocked_attacks, 12);
  assert.equal(g.counts.unique_allowed_attacks, 13);
  assert.equal(g.counts.repeated_checks, 75);
  assert.equal(g.counts.repeated_allows, 37);
});

test('contradictory counts and custom Guard outcomes cannot become verified live evidence', () => {
  const r = reports();
  r.guard.runs[0].attacks.verified_denials = 14;
  assert.equal(build(r).sections.guard.scope, 'unavailable');
  const custom = reports();
  custom.guard.runs[0].attacks.cases[0].outcome.source = 'custom';
  assert.ok(build(custom).sections.guard.issues.includes('not_live'));
  const invalid = reports();
  invalid.injection.metrics.system_level_leak_rate.value = 0;
  assert.equal(build(invalid).sections.injection.scope, 'unavailable');
});

function deniedEverywhere(): Reports {
  const r = reports();
  r.core.status = 'pass';
  r.core.totals.passed += r.core.totals.failed;
  r.core.totals.failed = 0;
  r.core.guard.verified_denials = 75;
  r.core.guard.leaks = 0;
  r.core.guard.non_denials = 0;
  for (const [id, numerator] of [
    ['guard_leak_rate', 0],
    ['guard_expected_denial_rate', 75],
  ] as const) {
    r.core.metrics[id].numerator = numerator;
    r.core.metrics[id].value = numerator / 75;
    r.core.variance[id].values = [numerator / 75, numerator / 75, numerator / 75];
  }
  for (const run of r.guard.runs) {
    run.status = 'pass';
    run.attacks.verified_denials = 25;
    run.attacks.allows = 0;
    run.attacks.non_denials = 0;
    run.attacks.authorization_leak_rate = 0;
    run.attacks.expected_denial_rate = 1;
    for (const item of run.attacks.cases) item.outcome.decision = 'deny';
    run.conformance.passed += run.conformance.failed;
    run.conformance.failed = 0;
  }
  for (const result of r.injection.results) {
    result.forced_control.gate.decision = 'deny';
    result.forced_control.would_authorize_unsafe_action = false;
  }
  for (const id of ['forced_control_leak_rate', 'guard_http_forced_control_leak_rate']) {
    r.injection.metrics[id].numerator = 0;
    r.injection.metrics[id].value = 0;
  }
  for (const run of r.injection.run_summaries) run.forced_control_leak_rate = 0;
  return r;
}
test('a model hijack with denied action is separate from unsafe system authorization', () => {
  const r = deniedEverywhere();
  r.injection.results.find((x: any) => x.model.evaluated).model.injection_followed = true;
  r.injection.metrics.model_hijack_rate.numerator = 1;
  r.injection.metrics.model_hijack_rate.value = 1 / 59;
  const safe = build(r);
  assert.equal(safe.sections.injection.metrics.model_hijack_rate.target_met, false);
  assert.equal(safe.security_failure_observed, false);
  r.injection.metrics.end_to_end_unsafe_authorization_rate.numerator = 1;
  r.injection.metrics.end_to_end_unsafe_authorization_rate.value = 1 / 59;
  assert.equal(build(r).security_failure_observed, true);
});

test('recognized OpenAI live adapter works; arbitrary model metadata cannot leak strings', () => {
  const r = reports();
  r.core.model_name = 'openai-responses:gpt-test';
  r.core.adapters.ai = r.core.model_name;
  assert.equal(build(r).latest_live_available, true);
  r.core.model_name = 'SECRET SENTINEL\nBearer token';
  r.core.adapters.ai = r.core.model_name;
  const invalid = build(r);
  assert.equal(invalid.latest_live_available, false);
  assert.ok(!JSON.stringify(invalid).includes('SENTINEL'));
});

test('no raw document, action, summary, prompt, private path, token, or error text is copied', () => {
  const r = reports(),
    sentinel = 'PRIVATE_SENTINEL_92832';
  for (const report of Object.values(r)) {
    report.prompt_text = sentinel;
    report.token_count = sentinel;
    report.api_key = sentinel;
    report.private_document = { salary: sentinel };
    report.debug_path = `C:/private/${sentinel}`;
  }
  r.core.results[0].summary = sentinel;
  r.injection.results[0].actions = [{ body: sentinel }];
  r.guard.runs[0].conformance.cases[0].exchanges = [{ body: sentinel }];
  r.judge.summaries.source_path = sentinel;
  const data = build(r);
  assert.equal(data.sections.judge.scope, 'live_model_judge');
  assert.ok(!JSON.stringify(data).includes(sentinel));
  assert.equal(
    data.sections.core.source.sha256,
    createHash('sha256').update(JSON.stringify(r.core)).digest('hex'),
  );
});

test('simulation is modeled separately, strips samples and case identifiers, and rejects customer-outcome claims', () => {
  const data = build();
  assert.equal(data.simulation.status, 'modeled');
  assert.equal(data.simulation.illustrative, true);
  assert.equal(data.simulation.measured_customer_outcomes, false);
  assert.equal(data.simulation.sample_count_per_journey, 1000);
  const serialized = JSON.stringify(data.simulation);
  assert.ok(!serialized.includes('samples_days'));
  assert.ok(!serialized.includes('case_id'));
  assert.equal(data.simulation.distributions.length, 2);
  const r = reports();
  r.simulation.measured_real_world = true;
  assert.equal(build(r).simulation.scope, 'unavailable');
});

test('freshness options reject invalid dates/typos and support explicit main-version provenance', () => {
  assert.throws(() => buildTrustData({}, { now: '2026-02-30T07:30:00.000Z' }), /Invalid Trust/);
  assert.throws(() => buildTrustData({}, { now: NOW, maxAgeSeconds: 0 }), /Invalid Trust/);
  assert.throws(
    () => buildTrustData({}, { now: NOW, minimumSourceDate: '2026-10-02T09:30:00.000Z' }),
    /Invalid Trust/,
  );
  assert.throws(() => buildTrustData({}, { now: NOW, maxAgeSecond: 1 } as any), /Invalid Trust/);
  assert.equal(
    buildTrustData({}, { now: NOW, mainContractVersion: null }).main_contract_version,
    null,
  );
  assert.equal(
    buildTrustData({}, { now: NOW, mainContractVersion: '1.2.0' }).main_contract_version,
    '1.2.0',
  );
});

test('writer reads only fixed files, handles missing files, and honors current-attempt environment bound', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'rasikh-trust-'));
  const previous = process.env.RASIKH_EVAL_MIN_SOURCE_DATE;
  try {
    const input = inputs(reports());
    await writeFile(join(directory, 'REPORT.json'), (input.core as { json: string }).json, 'utf8');
    await writeFile(join(directory, 'PRIVATE_SECRETS.json'), 'NEVER READ ME', 'utf8');
    process.env.RASIKH_EVAL_MIN_SOURCE_DATE = '2026-10-02T07:30:00.001Z';
    const data = await writeTrustData(directory, { now: NOW });
    assert.equal(data.latest_live_available, false);
    assert.ok(data.sections.core.issues.includes('before_current_attempt'));
    assert.deepEqual(data.sections.documents.issues, ['missing', 'primary_live_required']);
    assert.deepEqual(JSON.parse(await readFile(join(directory, 'trust.json'), 'utf8')), data);
  } finally {
    if (previous === undefined) delete process.env.RASIKH_EVAL_MIN_SOURCE_DATE;
    else process.env.RASIKH_EVAL_MIN_SOURCE_DATE = previous;
    const cleanupTarget = resolve(directory);
    assert.ok(
      cleanupTarget.startsWith(`${resolve(tmpdir())}${sep}`) &&
        basename(cleanupTarget).startsWith('rasikh-trust-'),
    );
    await rm(cleanupTarget, { recursive: true, force: true });
  }
});

test('public schema has fixed object fields, nullable unknowns, and explicit live/simulation gates', async () => {
  const schema = JSON.parse(
    await readFile(new URL('../src/trust-schema.json', import.meta.url), 'utf8'),
  );
  function visit(value: any): void {
    if (value && typeof value === 'object') {
      if (value.type === 'object') {
        assert.equal(value.additionalProperties, false);
        assert.deepEqual([...value.required].sort(), Object.keys(value.properties).sort());
      }
      for (const child of Object.values(value)) visit(child);
    }
  }
  visit(schema);
  assert.equal(schema.properties.latest_live_available.type, 'boolean');
  assert.equal(schema.properties.simulation.properties.measured_customer_outcomes.const, false);
  for (const id of TRUST_SECTION_IDS) {
    const s = schema.properties.sections.properties[id];
    assert.ok(s.properties.generated_at.anyOf.some((x: any) => x.type === 'null'));
    assert.ok(s.properties.run_count.anyOf.some((x: any) => x.type === 'null'));
    assert.equal(s.properties.counts.additionalProperties, false);
  }
});
