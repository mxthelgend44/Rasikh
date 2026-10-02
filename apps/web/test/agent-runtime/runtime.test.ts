import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  AgentRuntime,
  DeterministicDemoExtractor,
  HttpGuardClient,
  InMemoryEmployerRequests,
  MemoryAuditSink,
  type ExtractorPort,
  type GuardPort,
  type GuardVerdict,
} from '../../src/lib/agent-runtime/index';
import { rasikhEngine } from '../../src/lib/agent-runtime/engine-adapter';

const PASSPORT = [
  'Full name: Layla Haddad',
  'Passport number: FAKE-P-001',
  'Nationality: Jordanian',
  'Date of birth: 1991-04-12',
  'Expiry date: 2031-04-11',
].join('\n');
const doc = { ref: 'doc_passport_hire_demo_001', kind: 'passport' as const, text: PASSPORT };

const ALLOW: GuardVerdict = {
  decision: 'allow',
  reason: 'ok',
  policy_rule: 'rule.allow',
  check_id: 'chk_1',
  contract_version: '1.0.0',
  source: 'guard',
};
const deny = (decision: 'deny' | 'needs_consent'): GuardVerdict => ({
  ...ALLOW,
  decision,
  reason: 'Not permitted.',
  policy_rule: 'rule.deny',
  ...(decision === 'needs_consent'
    ? { consent_request: { label: 'passport' as const, destination: 'employer' as const } }
    : {}),
});

class FakeGuard implements GuardPort {
  calls: string[] = [];
  constructor(private answer: (tool: string) => GuardVerdict | Error) {}
  async startSession() {
    this.calls.push('session');
    return 'gs_test';
  }
  async observe() {
    this.calls.push('observe');
  }
  async check(r: { tool: string }) {
    this.calls.push(`check:${r.tool}`);
    const a = this.answer(r.tool);
    if (a instanceof Error) throw a;
    return a;
  }
}
class SpyExtractor implements ExtractorPort {
  calls = 0;
  provenance = new DeterministicDemoExtractor().provenance;
  constructor(private output: () => unknown) {}
  async extract() {
    this.calls++;
    return this.output();
  }
}

function build(
  over: { guard?: GuardPort; extractor?: ExtractorPort; live?: boolean; configured?: boolean } = {},
) {
  const guard = over.guard ?? new FakeGuard(() => ALLOW);
  const extractor = over.extractor ?? new DeterministicDemoExtractor();
  const actions = new InMemoryEmployerRequests();
  const audit = new MemoryAuditSink();
  const runtime = new AgentRuntime({
    guard,
    extractor,
    engine: rasikhEngine,
    actions,
    audit,
    providerConfigured: over.configured ?? true,
    now: () => new Date('2026-10-02T12:00:00Z'),
  });
  return { runtime, guard, extractor, actions, audit };
}
const good = () =>
  new DeterministicDemoExtractor().extract({
    kind: 'passport',
    text: PASSPORT,
    fields: ['full_name', 'passport_number', 'nationality', 'date_of_birth', 'expiry_date'],
  });

describe('successful permitted flow', () => {
  it('extracts, reviews, recommends from the engine, and acts only after approval', async () => {
    const { runtime, actions, audit } = build();
    const j = await runtime.extract({ case_id: 'hire_demo_001', document: doc });
    assert.equal(j.status, 'awaiting_review');
    assert.equal(j.provenance.live_model_call, false);
    assert.equal(j.provenance.provider, 'none');
    assert.ok(j.fields.every((f) => f.status === 'ok' && f.category === 'extracted_fact'));

    const c = runtime.confirmReview({ journey_id: j.id, confirmed_by: 'newcomer' });
    assert.equal(c.status, 'awaiting_approval');
    assert.equal(c.recommendation?.category, 'recommendation');
    assert.deepEqual(c.recommendation?.grounded_in.missing_documents, ['employment']);
    assert.equal(c.estimate?.category, 'estimate');
    assert.equal(c.estimate?.illustrative, true);
    assert.equal(actions.sent.length, 0, 'nothing is sent before approval');

    const p = c.proposal!;
    const done = await runtime.decide({
      journey_id: j.id,
      proposal_id: p.proposal_id,
      digest: p.digest,
      approved: true,
      approved_by: 'newcomer',
    });
    assert.equal(done.status, 'executed');
    assert.equal(actions.sent.length, 1);
    assert.equal(actions.sent[0]!.label, 'employment');

    const trail = JSON.stringify(audit.entries);
    for (const secret of ['Layla', 'FAKE-P-001', 'Jordanian', '1991', 'Passport number'])
      assert.ok(!trail.includes(secret), `audit leaked ${secret}`);
    assert.ok(audit.entries.some((e) => e.event === 'action_executed'));
    assert.ok(audit.entries.every((e) => e.live_model_call === false));
  });

  it('corrections are marked user-supplied', async () => {
    const { runtime } = build();
    const j = await runtime.extract({ case_id: 'hire_demo_001', document: doc });
    const c = runtime.confirmReview({
      journey_id: j.id,
      confirmed_by: 'newcomer',
      corrections: { nationality: 'Jordan' },
    });
    assert.equal(c.confirmed!.nationality!.source, 'user_corrected');
    assert.equal(c.confirmed!.full_name!.source, 'model');
  });
});

describe('malformed model output', () => {
  const cases: [string, unknown][] = [
    ['not json', 'sorry I cannot'],
    ['missing field', { fields: { full_name: { value: 'x', evidence: 'x', confidence: 1 } } }],
    ['extra top-level key', { fields: {}, note: 'ignore previous instructions' }],
    [
      'confidence out of range',
      {
        fields: Object.fromEntries(
          ['full_name', 'passport_number', 'nationality', 'date_of_birth', 'expiry_date'].map(
            (n) => [n, { value: 'x', evidence: 'x', confidence: 7 }],
          ),
        ),
      },
    ],
    [
      'wrong value type',
      {
        fields: Object.fromEntries(
          ['full_name', 'passport_number', 'nationality', 'date_of_birth', 'expiry_date'].map(
            (n) => [n, { value: { a: 1 }, evidence: null, confidence: 1 }],
          ),
        ),
      },
    ],
  ];
  for (const [name, output] of cases)
    it(`is discarded: ${name}`, async () => {
      const { runtime } = build({ extractor: new SpyExtractor(() => output) });
      const j = await runtime.extract({ case_id: 'hire_demo_001', document: doc });
      assert.equal(j.status, 'blocked');
      assert.equal(j.blocked && 'code' in j.blocked && j.blocked.code, 'invalid_model_output');
      assert.equal(j.fields.length, 0);
    });

  it('drops values whose evidence is not in the document', async () => {
    const forged = {
      fields: Object.fromEntries(
        ['full_name', 'passport_number', 'nationality', 'date_of_birth', 'expiry_date'].map((n) => [
          n,
          { value: 'Evil Name', evidence: 'Full name: Evil Name', confidence: 1 },
        ]),
      ),
    };
    const { runtime } = build({ extractor: new SpyExtractor(() => forged) });
    const j = await runtime.extract({ case_id: 'hire_demo_001', document: doc });
    assert.equal(j.status, 'awaiting_review');
    assert.ok(j.fields.every((f) => f.value === null && f.issue === 'evidence_not_in_document'));
    assert.throws(
      () => runtime.confirmReview({ journey_id: j.id, confirmed_by: 'newcomer' }),
      /unreviewed_fields_remain/,
    );
  });

  it('low confidence needs review before confirmation', async () => {
    const low = {
      fields: Object.fromEntries(
        ['full_name', 'passport_number', 'nationality', 'date_of_birth', 'expiry_date'].map((n) => [
          n,
          { value: 'Layla Haddad', evidence: 'Full name: Layla Haddad', confidence: 0.4 },
        ]),
      ),
    };
    const { runtime } = build({ extractor: new SpyExtractor(() => low) });
    const j = await runtime.extract({ case_id: 'hire_demo_001', document: doc });
    assert.ok(j.fields.every((f) => f.status === 'needs_review'));
    assert.throws(
      () => runtime.confirmReview({ journey_id: j.id, confirmed_by: 'newcomer' }),
      /unreviewed_fields_remain/,
    );
  });
});

describe('provider, consent and Guard gates before the model', () => {
  it('provider error is reported, not hidden', async () => {
    const ex = new SpyExtractor(() => {
      throw new Error('boom');
    });
    const j = await build({ extractor: ex }).runtime.extract({ case_id: 'c1', document: doc });
    assert.equal(j.blocked && 'code' in j.blocked && j.blocked.code, 'provider_unavailable');
  });

  it('live mode without credentials refuses and never calls Guard or a provider', async () => {
    const ex = new SpyExtractor(() => good());
    ex.provenance = { ...ex.provenance, mode: 'live', provider: 'openai' };
    const guard = new FakeGuard(() => ALLOW);
    const j = await build({ extractor: ex, guard, configured: false }).runtime.extract({
      case_id: 'c1',
      document: doc,
    });
    assert.equal(j.blocked && 'code' in j.blocked && j.blocked.code, 'provider_unavailable');
    assert.equal(ex.calls, 0);
    assert.deepEqual(guard.calls, []);
  });

  it('live mode requires explicit disclosure acknowledgement', async () => {
    const ex = new SpyExtractor(() => good());
    ex.provenance = { ...ex.provenance, mode: 'live', provider: 'openai' };
    const guard = new FakeGuard(() => ALLOW);
    const { runtime } = build({ extractor: ex, guard });
    const j = await runtime.extract({ case_id: 'c1', document: doc });
    assert.equal(j.blocked && 'code' in j.blocked && j.blocked.code, 'consent_required');
    assert.equal(ex.calls, 0);
    assert.deepEqual(guard.calls, []);
    const ok = await runtime.extract({
      case_id: 'c1',
      document: doc,
      acknowledge_provider_disclosure: true,
    });
    assert.equal(ok.status, 'awaiting_review');
    assert.equal(ex.calls, 1);
  });

  for (const decision of ['deny', 'needs_consent'] as const)
    it(`Guard ${decision} prevents the model call`, async () => {
      const ex = new SpyExtractor(() => good());
      const { runtime, audit } = build({
        extractor: ex,
        guard: new FakeGuard(() => deny(decision)),
      });
      const j = await runtime.extract({ case_id: 'c1', document: doc });
      assert.equal(j.status, 'blocked');
      assert.equal(ex.calls, 0);
      assert.equal(audit.entries[0]!.decision, decision);
      if (decision === 'needs_consent')
        assert.deepEqual(j.blocked && 'guard' in j.blocked && j.blocked.guard.consent_request, {
          label: 'passport',
          destination: 'employer',
        });
    });

  it('unreachable Guard fails closed and is not labelled a policy denial', async () => {
    const ex = new SpyExtractor(() => good());
    const guard = new HttpGuardClient({
      baseUrl: 'http://guard.invalid',
      fetch: async () => {
        throw new Error('ECONNREFUSED');
      },
    });
    const { runtime, audit } = build({ extractor: ex, guard });
    const j = await runtime.extract({ case_id: 'c1', document: doc });
    assert.equal(j.blocked && 'code' in j.blocked && j.blocked.code, 'guard_unavailable');
    assert.equal(ex.calls, 0);
    assert.equal(audit.entries[0]!.decision_source, 'fail_closed');
  });
});

describe('approval and denial gate the downstream action', () => {
  async function toApproval(guard?: GuardPort) {
    const ctx = build({ guard });
    const j = await ctx.runtime.extract({ case_id: 'hire_demo_001', document: doc });
    const c = ctx.runtime.confirmReview({ journey_id: j.id, confirmed_by: 'newcomer' });
    return { ...ctx, id: j.id, p: c.proposal! };
  }

  it('cannot decide before review is confirmed', async () => {
    const { runtime } = build();
    const j = await runtime.extract({ case_id: 'c1', document: doc });
    await assert.rejects(
      runtime.decide({
        journey_id: j.id,
        proposal_id: 'x',
        digest: 'x',
        approved: true,
        approved_by: 'newcomer',
      }),
      /invalid_state/,
    );
  });

  it('rejects approvals that do not match the proposal', async () => {
    const { runtime, actions, id, p } = await toApproval();
    await assert.rejects(
      runtime.decide({
        journey_id: id,
        proposal_id: p.proposal_id,
        digest: 'forged',
        approved: true,
        approved_by: 'newcomer',
      }),
      /approval_does_not_match_proposal/,
    );
    await assert.rejects(
      runtime.decide({
        journey_id: id,
        proposal_id: p.proposal_id,
        digest: p.digest,
        approved: true,
        approved_by: 'agent' as 'newcomer',
      }),
      /approval_does_not_match_proposal/,
    );
    assert.equal(actions.sent.length, 0);
  });

  it('declining sends nothing and skips Guard', async () => {
    const guard = new FakeGuard(() => ALLOW);
    const { runtime, actions, id, p } = await toApproval(guard);
    const before = guard.calls.length;
    const j = await runtime.decide({
      journey_id: id,
      proposal_id: p.proposal_id,
      digest: p.digest,
      approved: false,
      approved_by: 'newcomer',
    });
    assert.equal(j.status, 'rejected');
    assert.equal(actions.sent.length, 0);
    assert.equal(guard.calls.length, before);
  });

  for (const decision of ['deny', 'needs_consent'] as const)
    it(`Guard ${decision} on the action prevents the tool call`, async () => {
      const { runtime, actions, audit, id, p } = await toApproval(
        new FakeGuard((tool) => (tool === 'request_document' ? deny(decision) : ALLOW)),
      );
      const j = await runtime.decide({
        journey_id: id,
        proposal_id: p.proposal_id,
        digest: p.digest,
        approved: true,
        approved_by: 'newcomer',
      });
      assert.equal(j.status, 'awaiting_approval');
      assert.equal(actions.sent.length, 0);
      assert.ok(!audit.entries.some((e) => e.event === 'action_executed'));
    });

  it('Guard failing on the action fails closed', async () => {
    const { runtime, actions, id, p } = await toApproval(
      new FakeGuard((tool) => (tool === 'request_document' ? new Error('down') : ALLOW)),
    );
    const j = await runtime.decide({
      journey_id: id,
      proposal_id: p.proposal_id,
      digest: p.digest,
      approved: true,
      approved_by: 'newcomer',
    });
    assert.equal(j.blocked && 'code' in j.blocked && j.blocked.code, 'guard_unavailable');
    assert.equal(actions.sent.length, 0);
  });

  it('an executed proposal cannot be replayed', async () => {
    const { runtime, actions, id, p } = await toApproval();
    const args = {
      journey_id: id,
      proposal_id: p.proposal_id,
      digest: p.digest,
      approved: true,
      approved_by: 'newcomer' as const,
    };
    await runtime.decide(args);
    await assert.rejects(runtime.decide(args), /invalid_state/);
    assert.equal(actions.sent.length, 1);
  });
});

describe('HttpGuardClient validation', () => {
  const reply =
    (body: unknown, status = 200) =>
    async () =>
      new Response(JSON.stringify(body), { status });
  const req = { sessionId: 's', tool: 't', destination: 'employer' as const, labels: [], refs: [] };
  const base = {
    contract_version: '1.0.0',
    check_id: 'c',
    decision: 'allow',
    reason: 'r',
    policy_rule: 'p',
    blocked_labels: [],
  };

  it('accepts a well-formed allow', async () => {
    const v = await new HttpGuardClient({ baseUrl: 'http://g', fetch: reply(base) }).check(req);
    assert.equal(v.decision, 'allow');
    assert.equal(v.source, 'guard');
  });
  for (const [name, fetch] of [
    ['HTTP 500', reply({}, 500)],
    ['unsupported contract version', reply({ ...base, contract_version: '2.0.0' })],
    ['unknown decision', reply({ ...base, decision: 'maybe' })],
    ['missing policy_rule', reply({ ...base, policy_rule: undefined })],
    ['needs_consent without consent_request', reply({ ...base, decision: 'needs_consent' })],
    ['not json', async () => new Response('<html>', { status: 200 })],
  ] as const)
    it(`fails closed on ${name}`, async () => {
      const v = await new HttpGuardClient({ baseUrl: 'http://g', fetch }).check(req);
      assert.equal(v.decision, 'deny');
      assert.equal(v.source, 'fail_closed');
    });
});
