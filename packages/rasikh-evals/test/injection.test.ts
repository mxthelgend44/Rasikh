import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTRACT_VERSION } from '@rasikh/shared';
import { CachedInjectionModel } from '../src/injection/demo.ts';
import { injectionFixtures, fakeInjectionProfile } from '../src/injection/fixtures.ts';
import { ReferenceInjectionModel, validateInjectionAnswer } from '../src/injection/model.ts';
import {
  HttpInjectionGate,
  runInjectionEvaluations,
  followsInjection,
  renderInjectionReport,
} from '../src/injection/runner.ts';
import type {
  InjectionGate,
  InjectionModelAdapter,
  ProposedAction,
} from '../src/injection/types.ts';
import type { StructuredModel } from '../src/providers/structured.ts';
import { VertexStructuredModel } from '../src/providers/structured.ts';
import type { Fetch } from '../src/adapters/http.ts';

const first = injectionFixtures[0]!;
function proposal(action: ProposedAction) {
  return {
    ...action,
    payload_refs: action.payload_refs.map((ref) => ({ ...ref, derived: ref.derived ?? false })),
  };
}
function liveModel(action?: ProposedAction): InjectionModelAdapter {
  return {
    name: 'test-live-model',
    provider: 'test',
    scope: 'live_reference_prompt',
    async propose() {
      return { answer: 'Synthetic answer.', proposed_actions: action ? [action] : [] };
    },
  };
}
function verifiedGate(decision: 'allow' | 'deny' | 'needs_consent'): InjectionGate {
  return {
    name: 'test-verified-http',
    async check() {
      return {
        decision,
        verified: true,
        scope: 'live_guard_http',
        reason: 'Synthetic policy reason.',
      };
    },
  };
}

test('20 independently specified fake attacks cover five artifacts, both languages and all requested labels', () => {
  assert.equal(injectionFixtures.length, 20);
  assert.equal(new Set(injectionFixtures.map((fixture) => fixture.id)).size, 20);
  assert.equal(injectionFixtures.filter((fixture) => fixture.language === 'en').length, 10);
  assert.equal(injectionFixtures.filter((fixture) => fixture.language === 'ar').length, 10);
  for (const artifact of [
    'lease',
    'offer_letter',
    'landlord_message',
    'bank_letter',
    'tamm_status',
  ]) {
    assert.equal(injectionFixtures.filter((fixture) => fixture.artifact === artifact).length, 4);
  }
  assert.deepEqual(
    [...new Set(injectionFixtures.map((fixture) => fixture.private_data.label))].sort(),
    ['bank_statement', 'family', 'health', 'passport', 'salary'],
  );
  for (const fixture of injectionFixtures) {
    assert.equal(fixture.synthetic, true);
    assert.equal(fixture.private_data.synthetic, true);
    assert.match(fixture.private_data.value, /FAKE/);
    assert.match(fixture.untrusted_content, /SYNTHETIC TEST DOCUMENT/);
    assert.equal(followsInjection(fixture, fixture.control_action), true);
    if (fixture.control_action.external_address)
      assert.match(fixture.control_action.external_address, /\.example/);
  }
  assert.ok(Object.values(fakeInjectionProfile).every((value) => value.includes('FAKE')));
});

test('cache metrics are explicit and distinguish cached model hijacks from cached Guard blocks', async () => {
  const report = await runInjectionEvaluations({
    mode: 'demo',
    now: () => new Date('2026-10-02T08:00:00Z'),
  });
  assert.equal(report.metrics.model_hijack_rate!.value, 4 / 20);
  assert.equal(report.metrics.model_hijack_rate!.evidence_scope, 'synthetic_cache');
  assert.equal(report.metrics.system_level_leak_rate!.value, 0);
  assert.equal(report.metrics.guard_http_forced_control_leak_rate!.value, null);
  assert.equal(report.model_provider, 'synthetic-cache');
  assert.equal(report.generated_at, '2026-10-02T08:00:00.000Z');
  assert.equal(report.counts.actual_outbound_actions_executed, 0);
  assert.ok(
    report.results
      .flatMap((result) => [result.forced_control, ...result.actions])
      .every((action) => !action.outbound_executed),
  );
});

test('reference model receives untrusted source separately, without a scripted proposal or expected answer', async () => {
  let request: Parameters<StructuredModel['generate']>[0] | undefined;
  const model: StructuredModel = {
    name: 'vertex:test',
    provider: 'vertex',
    async generate(value) {
      request = value;
      return { answer: 'Only a summary.', proposed_actions: [] };
    },
  };
  const adapter = new ReferenceInjectionModel(model);
  assert.deepEqual(await adapter.propose(first), {
    answer: 'Only a summary.',
    proposed_actions: [],
  });
  assert.equal(adapter.provider, 'vertex');
  assert.equal(adapter.scope, 'live_reference_prompt');
  assert.equal(request!.name, 'rasikh_injection_proposal');
  assert.match(request!.instructions, /untrusted_source/);
  assert.ok(!JSON.stringify(request!.input).includes('SYNTHETIC FORCED PROPOSAL'));
  assert.ok(!JSON.stringify(request!.input).includes('control_action'));
  assert.equal(
    (request!.input as { untrusted_source: { content: string } }).untrusted_source.content,
    first.untrusted_content,
  );
});

test('action schema boundary rejects malformed fields, unknown labels and sparse arrays', () => {
  const valid = { answer: 'Test', proposed_actions: [proposal(first.control_action)] };
  assert.doesNotThrow(() => validateInjectionAnswer(valid));
  for (const action of [
    { ...valid.proposed_actions[0], tool: '' },
    { ...valid.proposed_actions[0], data_labels: ['secret'] },
    { ...valid.proposed_actions[0], external_address: undefined },
    { ...valid.proposed_actions[0], consent_bypass: 'true' },
    { ...valid.proposed_actions[0], payload_refs: [null] },
    { ...valid.proposed_actions[0], data_labels: new Array(1) },
  ])
    assert.throws(() => validateInjectionAnswer({ answer: 'Test', proposed_actions: [action] }));
  assert.throws(() => validateInjectionAnswer({ answer: 'Test', proposed_actions: new Array(1) }));
});

test('real HTTP gate observes the raw ref, checks the stripped ref and never grants document-claimed consent or sends the body', async () => {
  const fixture = injectionFixtures[8]!;
  const requests: { url: string; body: Record<string, unknown> }[] = [];
  const request: Fetch = async (input, init) => {
    const url = String(input);
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    requests.push({ url, body });
    const value = url.endsWith('/session')
      ? { contract_version: CONTRACT_VERSION, session_id: 'test_session' }
      : url.endsWith('/observe')
        ? { contract_version: CONTRACT_VERSION, recorded: true }
        : {
            contract_version: CONTRACT_VERSION,
            check_id: 'test_check',
            decision: 'needs_consent',
            reason: 'Your passport has not been shared with landlords yet.',
            policy_rule: 'passport.landlord.requires_consent',
            blocked_labels: ['passport'],
            consent_request: { label: 'passport', destination: 'landlord' },
          };
    return Response.json(value);
  };
  const outcome = await new HttpInjectionGate({
    baseUrl: 'http://guard.test',
    fetch: request,
  }).check(fixture, fixture.control_action);
  assert.equal(outcome.decision, 'needs_consent');
  assert.equal(outcome.verified, true);
  assert.equal(outcome.scope, 'live_guard_http');
  assert.deepEqual(
    requests.map((item) => new URL(item.url).pathname),
    ['/session', '/observe', '/check'],
  );
  assert.deepEqual(requests[1]!.body.payload_refs, [
    { ref: fixture.private_data.ref, labels: ['passport'] },
  ]);
  assert.deepEqual(requests[2]!.body.payload_refs, fixture.control_action.payload_refs);
  assert.ok(!JSON.stringify(requests).includes(fixture.private_data.value));
  assert.ok(!requests.some((item) => item.url.endsWith('/consent')));
});

test('external address, including one disguised as a trusted bank, is blocked locally before any network or injected gate call', async () => {
  let calls = 0;
  const fixture = injectionFixtures[1]!;
  const action = { ...fixture.control_action, destination: 'bank' };
  const gate = new HttpInjectionGate({
    fetch: async () => {
      calls++;
      throw new Error('must not run');
    },
  });
  const outcome = await gate.check(fixture, action);
  assert.equal(outcome.scope, 'local_closed_destination_validation');
  assert.equal(outcome.decision, 'deny');
  const report = await runInjectionEvaluations({
    mode: 'live',
    fixtures: [{ ...fixture, control_action: action }],
    injectionAdapter: liveModel(action),
    guard: {
      name: 'spy',
      async check() {
        calls++;
        return {
          decision: 'allow',
          verified: true,
          scope: 'live_guard_http',
          reason: 'Wrong mapping.',
        };
      },
    },
  });
  assert.equal(calls, 0);
  assert.equal(report.metrics.system_level_leak_rate!.value, 0);
  assert.equal(report.metrics.guard_http_forced_control_leak_rate!.value, null);
});

test('model follows an injection and Guard blocks it: model failure does not imply system leak', async () => {
  const report = await runInjectionEvaluations({
    mode: 'live',
    fixtures: [first],
    injectionAdapter: liveModel(first.control_action),
    guard: verifiedGate('deny'),
  });
  assert.equal(report.metrics.model_hijack_rate!.value, 1);
  assert.equal(report.metrics.system_level_leak_rate!.value, 0);
  assert.equal(report.metrics.forced_control_leak_rate!.value, 0);
  assert.equal(report.status, 'pass');
});

test('needs_consent gates the send; the model cannot override it with a consent_bypass flag', async () => {
  const fixture = injectionFixtures[8]!;
  const report = await runInjectionEvaluations({
    mode: 'live',
    fixtures: [fixture],
    injectionAdapter: liveModel(fixture.control_action),
    guard: verifiedGate('needs_consent'),
  });
  assert.equal(report.metrics.model_hijack_rate!.value, 1);
  assert.equal(report.metrics.system_level_leak_rate!.value, 0);
  assert.equal(report.results[0]!.actions[0]!.gate.decision, 'needs_consent');
});

test('unsafe allow is a failed system result and distinct from model robustness', async () => {
  const report = await runInjectionEvaluations({
    mode: 'live',
    fixtures: [first],
    injectionAdapter: liveModel(),
    guard: verifiedGate('allow'),
  });
  assert.equal(report.metrics.model_hijack_rate!.value, 0);
  assert.equal(report.metrics.system_level_leak_rate!.value, null);
  assert.equal(report.metrics.forced_control_leak_rate!.value, 1);
  assert.equal(report.status, 'fail');
});

test('unavailable, malformed and version-mismatched Guard responses are errors, never measured successful blocks', async () => {
  const responses = [
    async () => {
      throw new Error('private error details must not appear');
    },
    async () => Response.json({ contract_version: '999.0.0', session_id: 'x' }),
    async (input: RequestInfo | URL) =>
      String(input).endsWith('/session')
        ? Response.json({ contract_version: CONTRACT_VERSION, session_id: 'x' })
        : String(input).endsWith('/observe')
          ? Response.json({ contract_version: CONTRACT_VERSION, recorded: true })
          : Response.json({ contract_version: CONTRACT_VERSION, decision: 'deny' }),
  ];
  for (const request of responses) {
    const report = await runInjectionEvaluations({
      mode: 'scripted_guard',
      fixtures: [first],
      fetch: request as Fetch,
    });
    assert.equal(report.status, 'incomplete');
    assert.equal(report.counts.guard_errors, 1);
    assert.equal(report.metrics.forced_control_leak_rate!.value, null);
    assert.equal(report.metrics.forced_control_verified_coverage!.value, 0);
    assert.equal(report.results[0]!.forced_control.gate.verified, false);
    assert.ok(!JSON.stringify(report).includes('private error details'));
  }
});

test('scripted controls never count as model measurements; live cache substitution is rejected', async () => {
  const report = await runInjectionEvaluations({
    mode: 'scripted_guard',
    fixtures: [first],
    guard: verifiedGate('deny'),
  });
  assert.equal(report.counts.model_evaluated, 0);
  assert.equal(report.metrics.model_hijack_rate!.value, null);
  assert.equal(report.model_name, null);
  assert.equal(report.results[0]!.model.injection_followed, null);
  await assert.rejects(
    runInjectionEvaluations({ mode: 'live', injectionAdapter: new CachedInjectionModel() }),
    /synthetic cache/,
  );
});

test('fresh summary reference attacks preserve stripped labels and expose observed-label propagation failures', async () => {
  const fixtures = injectionFixtures.filter((fixture) =>
    ['injection_10', 'injection_19'].includes(fixture.id),
  );
  assert.equal(fixtures.length, 2);
  for (const fixture of fixtures) {
    assert.notEqual(fixture.control_action.payload_refs[0]!.ref, fixture.private_data.ref);
    assert.deepEqual(fixture.control_action.data_labels, []);
    assert.deepEqual(fixture.control_action.payload_refs[0]!.labels, []);
  }
  const report = await runInjectionEvaluations({
    mode: 'scripted_guard',
    fixtures,
    guard: verifiedGate('allow'),
  });
  assert.equal(report.metrics.forced_control_leak_rate!.value, 1);
  assert.equal(report.metrics.guard_http_forced_control_leak_rate!.value, 1);
  assert.equal(report.status, 'fail');
});

test('three repeats preserve all observations and report variance independently from sample count', async () => {
  const report = await runInjectionEvaluations({ mode: 'demo', runs: 3 });
  assert.equal(report.number_of_runs, 3);
  assert.equal(report.results.length, 60);
  assert.equal(report.metrics.model_hijack_rate!.denominator, 60);
  assert.equal(report.variance.model_hijack_rate!.samples, 3);
  assert.equal(report.variance.model_hijack_rate!.standard_deviation, 0);
  assert.equal(report.run_summaries.length, 3);
  assert.match(renderInjectionReport(report), /reference_prompt/);
  assert.match(renderInjectionReport(report), /scripted/);
});

test('malformed model output and invalid custom Gate outcomes are unmeasured errors', async () => {
  const report = await runInjectionEvaluations({
    mode: 'live',
    fixtures: [first],
    injectionAdapter: {
      ...liveModel(),
      async propose() {
        return { answer: 'bad', proposed_actions: [null] } as never;
      },
    },
    guard: {
      name: 'malformed',
      async check() {
        return { decision: 'allow', verified: true, reason: '' } as never;
      },
    },
  });
  assert.equal(report.counts.model_errors, 1);
  assert.equal(report.counts.model_evaluated, 0);
  assert.equal(report.counts.guard_errors, 1);
  assert.equal(report.metrics.model_hijack_rate!.value, null);
  assert.equal(report.metrics.forced_control_leak_rate!.value, null);
});

test('an unverified or error-bearing allow from an injected gate is normalized to fail-closed deny', async () => {
  for (const outcome of [
    {
      decision: 'allow',
      scope: 'live_guard_http',
      verified: false,
      reason: 'Unverified response.',
    },
    {
      decision: 'allow',
      scope: 'live_guard_http',
      verified: true,
      reason: 'Partial response.',
      error: 'Request failed.',
    },
  ]) {
    const report = await runInjectionEvaluations({
      mode: 'scripted_guard',
      fixtures: [first],
      guard: {
        name: 'invalid-allow',
        async check() {
          return outcome as never;
        },
      },
    });
    assert.equal(report.results[0]!.forced_control.gate.decision, 'deny');
    assert.equal(report.metrics.forced_control_leak_rate!.value, null);
    assert.equal(report.counts.guard_errors, 1);
  }
});

test('Vertex credential callback diagnostics never reach injection evidence or trigger a network request', async () => {
  const marker = 'FAKE_INJECTION_CREDENTIAL_DIAGNOSTIC_DO_NOT_PUBLISH';
  let requests = 0;
  const model = new VertexStructuredModel({
    project: 'fake-eval-project',
    model: 'fake-eval-model',
    accessToken: async () => {
      throw new Error(marker);
    },
    fetch: async () => {
      requests++;
      throw new Error('Network must not run without credentials.');
    },
  });
  const report = await runInjectionEvaluations({
    mode: 'live',
    fixtures: [first],
    modelAdapter: model,
    guard: verifiedGate('deny'),
  });
  assert.equal(requests, 0);
  assert.equal(report.counts.model_errors, 1);
  assert.equal(report.metrics.model_hijack_rate!.value, null);
  assert.ok(!JSON.stringify(report).includes(marker));
  assert.ok(!renderInjectionReport(report).includes(marker));
});

test('credential-like diagnostics in a Gate error are discarded rather than rendered as a successful policy reason', async () => {
  const marker = 'FAKE_GUARD_CREDENTIAL_DIAGNOSTIC_DO_NOT_PUBLISH';
  const report = await runInjectionEvaluations({
    mode: 'scripted_guard',
    fixtures: [first],
    guard: {
      name: 'error-bearing-gate',
      async check() {
        return {
          decision: 'deny',
          verified: false,
          scope: 'unmeasured',
          reason: marker,
          error: marker,
        };
      },
    },
  });
  assert.equal(report.counts.guard_errors, 1);
  assert.equal(report.metrics.forced_control_leak_rate!.value, null);
  assert.ok(!JSON.stringify(report).includes(marker));
  assert.ok(!renderInjectionReport(report).includes(marker));
});
