import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTRACT_VERSION, DATA_LABELS, DESTINATIONS } from '@rasikh/shared';
import type { Fetch } from '../src/adapters/http.ts';
import { renderGuardConformance, runGuardConformance } from '../src/guard-conformance.ts';

interface MockOptions {
  freshRefLeak?: boolean;
  bareMethodError?: boolean;
  healthVersion?: string;
  consentAttack?: boolean;
}
function syntheticService(options: MockOptions = {}): { fetch: Fetch; calls: string[] } {
  let sequence = 0;
  const sessions = new Map<string, { observed: boolean; checks: Record<string, unknown>[] }>();
  const consents = new Map<string, { session: string; active: boolean }>();
  const calls: string[] = [];
  function json(body: unknown, status = 200): Response {
    return new Response(
      JSON.stringify({ contract_version: CONTRACT_VERSION, ...(body as object) }),
      { status, headers: { 'content-type': 'application/json' } },
    );
  }
  function error(code: string, status: number): Response {
    return json({ error: { code, message: 'Synthetic error.' } }, status);
  }
  const fetch: Fetch = async (input, init) => {
    const url = new URL(String(input));
    const method = init?.method ?? 'GET';
    calls.push(`${method} ${url.pathname}`);
    if (url.pathname === '/health')
      return json({
        contract_version: options.healthVersion ?? CONTRACT_VERSION,
        status: 'ok',
        upstream_commit: 'a'.repeat(40),
      });
    if (method === 'GET' && url.pathname === '/check')
      return options.bareMethodError
        ? new Response('', { status: 405 })
        : error('invalid_request', 405);
    if (url.pathname === '/dev/reset') return error('demo_mode_only', 404);
    if (method === 'DELETE' && url.pathname.startsWith('/consent/')) {
      const id = url.pathname.split('/').at(-1)!;
      const consent = consents.get(id);
      if (!consent) return error('consent_not_found', 404);
      consent.active = false;
      return json({ consent_id: id, active: false });
    }
    if (url.pathname === '/log') {
      const id = url.searchParams.get('session_id');
      if (!id) return error('invalid_request', 400);
      const session = sessions.get(id);
      return session
        ? json({ entries: [...session.checks].reverse() })
        : error('unknown_session', 404);
    }
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    } catch {
      return error('invalid_request', 400);
    }
    if (url.pathname === '/session') {
      if (typeof body.case_id !== 'string' || !body.case_id || typeof body.case_type !== 'string')
        return error('invalid_request', 400);
      const id = `fake_session_${++sequence}`;
      sessions.set(id, { observed: false, checks: [] });
      return json({ session_id: id });
    }
    const sessionId = String(body.session_id);
    const session = sessions.get(sessionId);
    if (!session) return error('unknown_session', 404);
    const refs = (body.payload_refs ?? []) as { ref: string; labels: string[] }[];
    const labels = (body.data_labels ?? []) as string[];
    if (
      [...labels, ...refs.flatMap((ref) => ref.labels)].some(
        (label) => !(DATA_LABELS as readonly string[]).includes(label),
      )
    )
      return error('invalid_request', 400);
    if (url.pathname === '/observe') {
      if (!(DESTINATIONS as readonly unknown[]).includes(body.source))
        return error('invalid_request', 400);
      session.observed = true;
      return json({ recorded: true });
    }
    if (url.pathname === '/consent') {
      if (
        body.granted_by !== 'newcomer' ||
        (body.expires_at !== null && Date.parse(String(body.expires_at)) <= Date.now()) ||
        body.expires_at === 'invalid'
      )
        return error('invalid_request', 400);
      const id = `fake_consent_${++sequence}`;
      consents.set(id, { session: sessionId, active: true });
      return json({ consent_id: id, active: true });
    }
    if (url.pathname === '/check') {
      if (
        typeof body.tool !== 'string' ||
        !(DESTINATIONS as readonly unknown[]).includes(body.destination)
      )
        return error('invalid_request', 400);
      const indirect = labels.length === 0 && session.observed;
      const fresh =
        refs.length > 0 &&
        refs.every((ref) => ref.labels.length === 0 && ref.ref !== 'fake_observed_health');
      let decision = 'deny';
      let blocked = [...new Set([...labels, ...refs.flatMap((ref) => ref.labels)])];
      if (indirect) blocked = ['health'];
      if (options.freshRefLeak && indirect && fresh) {
        decision = 'allow';
        blocked = [];
      } else if (
        options.consentAttack &&
        body.tool === 'submit_rental_application' &&
        labels[0] === 'salary'
      )
        decision = 'needs_consent';
      else if (
        labels[0] === 'passport' &&
        (body.destination === 'landlord' || body.destination === 'bank')
      ) {
        const active = [...consents.values()].some(
          (entry) => entry.session === sessionId && entry.active,
        );
        decision = active && body.destination === 'landlord' ? 'allow' : 'needs_consent';
      } else if (labels[0] === 'emirates_id' && body.destination === 'landlord')
        decision = 'needs_consent';
      if (decision === 'allow') blocked = [];
      const checkId = `fake_check_${++sequence}`;
      const result = {
        check_id: checkId,
        decision,
        reason: 'Synthetic policy explanation.',
        policy_rule: 'synthetic.policy',
        blocked_labels: blocked,
        ...(decision === 'needs_consent'
          ? { consent_request: { label: labels[0], destination: body.destination } }
          : {}),
      };
      session.checks.push({
        check_id: checkId,
        at: '2026-10-02T00:00:00Z',
        tool: body.tool,
        destination: body.destination,
        decision,
        reason: result.reason,
        policy_rule: result.policy_rule,
      });
      return json(result);
    }
    return error('invalid_request', 404);
  };
  return { fetch, calls };
}

test('conformance exercises the exact endpoint sequence and distinguishes genuine HTTP evidence', async () => {
  const service = syntheticService();
  const result = await runGuardConformance({
    fetch: service.fetch,
    baseUrl: 'http://synthetic.invalid',
    now: () => new Date('2026-10-02T00:00:00Z'),
  });
  assert.equal(result.status, 'pass');
  assert.equal(result.generated_at, '2026-10-02T00:00:00.000Z');
  assert.equal(result.model, null);
  assert.equal(result.attacks.verified_checks, 25);
  assert.equal(result.attacks.verified_denials, 25);
  assert.equal(result.attacks.authorization_leak_rate, 0);
  assert.equal(result.attacks.verified_coverage, 1);
  assert.equal(result.conformance.failed, 0);
  assert.equal(result.conformance.errors, 0);
  assert.equal(result.conformance.skipped, 1);
  assert.ok(service.calls.includes('POST /observe'));
  assert.ok(service.calls.some((call) => call.startsWith('DELETE /consent/')));
  assert.ok(!service.calls.includes('POST /dev/reset'));
});

test('fresh-reference authorization leaks remain failures with the original 25 attacks unchanged', async () => {
  const result = await runGuardConformance({
    fetch: syntheticService({ freshRefLeak: true }).fetch,
  });
  assert.equal(result.status, 'fail');
  assert.equal(result.attacks.verified_checks, 25);
  assert.equal(result.attacks.verified_denials, 13);
  assert.equal(result.attacks.allows, 12);
  assert.equal(result.attacks.authorization_leak_rate, 12 / 25);
  assert.equal(
    result.attacks.cases.filter((entry) => entry.kind === 'indirect' && entry.status === 'fail')
      .length,
    12,
  );
  assert.equal(
    result.conformance.cases.find((entry) => entry.id === 'fresh_ref_observed_flow')?.status,
    'fail',
  );
  assert.equal(result.conformance.errors, 0);
});

test('needs_consent fails expected-deny attacks without becoming an explicit allow leak', async () => {
  const result = await runGuardConformance({
    fetch: syntheticService({ consentAttack: true }).fetch,
  });
  assert.equal(result.attacks.verified_checks, 25);
  assert.equal(result.attacks.non_denials, 1);
  assert.equal(result.attacks.allows, 0);
  assert.equal(result.attacks.authorization_leak_rate, 0);
  assert.equal(result.status, 'fail');
});

test('unavailable health fails closed without claiming 25 service denials or mutating state', async () => {
  let calls = 0;
  const fetch: Fetch = async () => {
    calls++;
    throw new Error('unavailable');
  };
  const result = await runGuardConformance({ fetch });
  assert.equal(calls, 1);
  assert.equal(result.status, 'incomplete');
  assert.equal(result.attacks.verified_checks, 0);
  assert.equal(result.attacks.verified_denials, 0);
  assert.equal(result.attacks.errors, 25);
  assert.equal(result.attacks.authorization_leak_rate, null);
  assert.equal(result.attacks.expected_denial_rate, null);
});

test('health version mismatches prevent mutations and cannot produce verified evidence', async () => {
  const service = syntheticService({ healthVersion: '99.0.0' });
  const result = await runGuardConformance({ fetch: service.fetch });
  assert.equal(result.status, 'incomplete');
  assert.equal(result.attacks.verified_checks, 0);
  assert.deepEqual(service.calls, ['GET /health']);
  assert.equal(result.conformance.cases[0]?.status, 'fail');
});

test('non-JSON method errors violate the every-response-version guarantee', async () => {
  const result = await runGuardConformance({
    fetch: syntheticService({ bareMethodError: true }).fetch,
  });
  assert.equal(
    result.conformance.cases.find((entry) => entry.id === 'wrong_method_response_version')?.status,
    'fail',
  );
  assert.equal(result.attacks.verified_checks, 25);
});

test('reset is probed only when this suite owns an explicitly demo-disabled service', async () => {
  const service = syntheticService();
  const result = await runGuardConformance({
    fetch: service.fetch,
    provenance: {
      service_source: 'native_launched',
      base_url: 'http://localhost:8787',
      service_owned: true,
      demo_mode: 'off',
    },
  });
  assert.ok(service.calls.includes('POST /dev/reset'));
  assert.equal(result.conformance.skipped, 0);
  const enabled = syntheticService();
  await runGuardConformance({
    fetch: enabled.fetch,
    provenance: {
      service_source: 'native_launched',
      base_url: 'http://localhost:8787',
      service_owned: true,
      demo_mode: 'on',
    },
  });
  assert.ok(!enabled.calls.includes('POST /dev/reset'));
});

test('Markdown records actual failures, evidence scope, run count and variation', async () => {
  const failure = await runGuardConformance({
    fetch: syntheticService({ freshRefLeak: true }).fetch,
    run: 1,
  });
  const clean = await runGuardConformance({ fetch: syntheticService().fetch, run: 2 });
  const markdown = renderGuardConformance([failure, clean]);
  assert.match(markdown, /live HTTP/);
  assert.match(markdown, /Runs: \*\*2\*\*/);
  assert.match(markdown, /48.0%/);
  assert.match(markdown, /0.0%–48.0%/);
  assert.match(markdown, /guard_indirect_12/);
  assert.throws(() => renderGuardConformance([]), /At least one/);
});

test('launcher preserves argument boundaries and rejects invalid origins or unsupported options', async () => {
  const launcher = await import(new URL('../scripts/with-guard.mjs', import.meta.url).href);
  assert.deepEqual(
    launcher.parseLauncherArguments([
      '--url',
      'http://127.0.0.1:18787',
      '--reuse-only',
      '--',
      'node',
      '-e',
      'fake code with spaces',
    ]),
    {
      baseUrl: 'http://127.0.0.1:18787',
      reuseOnly: true,
      command: ['node', '-e', 'fake code with spaces'],
    },
  );
  for (const url of [
    'https://localhost:8787',
    'http://fake:fake@localhost:8787',
    'http://localhost:8787/path',
    'http://localhost:8787/?query=1',
    'http://localhost:8787/#fragment',
  ]) {
    assert.throws(() => launcher.parseLauncherArguments(['--url', url]), /Guard URL/);
  }
  assert.throws(() => launcher.parseLauncherArguments(['--unknown']), /Usage/);
});
