import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  AgentRuntime,
  DeterministicDemoExtractor,
  HttpGuardClient,
  InMemoryEmployerRequests,
  MemoryAuditSink,
} from '../../src/lib/agent-runtime/index';
import { rasikhEngine } from '../../src/lib/agent-runtime/engine-adapter';

// Opt-in: needs a running Guard sidecar (cd packages/rasikh-guard && cargo run --release -p rasikh-guard).
// RASIKH_GUARD_E2E=1 RASIKH_GUARD_URL=http://127.0.0.1:8787 npm run test:agent
const url = process.env.RASIKH_GUARD_URL ?? 'http://127.0.0.1:8787';
const text =
  'Full name: Layla Haddad\nPassport number: FAKE-P-001\nNationality: Jordanian\nDate of birth: 1991-04-12\nExpiry date: 2031-04-11';

describe('against a real Guard sidecar', { skip: process.env.RASIKH_GUARD_E2E !== '1' }, () => {
  it('allows passport extraction and the employer request, and blocks a landlord-bound action', async () => {
    const actions = new InMemoryEmployerRequests();
    const audit = new MemoryAuditSink();
    const guard = new HttpGuardClient({ baseUrl: url });
    const runtime = new AgentRuntime({
      guard,
      extractor: new DeterministicDemoExtractor(),
      engine: rasikhEngine,
      actions,
      audit,
      providerConfigured: true,
    });
    const j = await runtime.extract({
      case_id: 'hire_demo_001',
      document: { ref: 'doc_passport_hire_demo_001', kind: 'passport', text },
    });
    assert.equal(j.status, 'awaiting_review');
    const c = runtime.confirmReview({ journey_id: j.id, confirmed_by: 'newcomer' });
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

    // Same session, observed passport, landlord destination: Guard requires consent, so no call.
    const verdict = await guard.check({
      sessionId: j.guard_session_id,
      tool: 'submit_rental_application',
      destination: 'landlord',
      labels: ['passport'],
      refs: [{ ref: 'doc_passport_hire_demo_001', labels: ['passport'] }],
    });
    assert.equal(verdict.decision, 'needs_consent');
    assert.equal(verdict.source, 'guard');
  });
});
