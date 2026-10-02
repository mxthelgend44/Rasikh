import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTRACT_VERSION, DATA_LABELS } from '@rasikh/shared';
import type { DataLabel, Destination, GuardDecision } from '@rasikh/shared';
import { HttpGuardAdapter } from './adapters/guard.ts';
import type { Fetch } from './adapters/http.ts';
import { guardFixtures } from './fixtures/guard.ts';
import type { GuardOutcome } from './types.ts';

export interface GuardProvenance {
  service_source: 'native_launched' | 'reused_healthy' | 'provided';
  base_url: string;
  service_owned: boolean;
  demo_mode: 'off' | 'on' | 'unknown';
  pid?: number;
  executable?: string;
  build?: 'cargo_locked';
}
export interface ConformanceCase {
  id: string;
  status: 'pass' | 'fail' | 'error' | 'skipped';
  expected: string;
  detail?: string;
  exchanges: { method: string; path: string; status: number; body: unknown }[];
}
export interface GuardAttackEvidence {
  id: string;
  kind: 'direct' | 'indirect';
  label: DataLabel;
  destination: Destination;
  expected: 'deny';
  status: 'pass' | 'fail' | 'error';
  outcome: GuardOutcome;
}
export interface GuardConformanceEvidence {
  schema_version: '1.0.0';
  contract_version: string;
  generated_at: string;
  run: number;
  evidence_scope: 'live_http';
  synthetic: true;
  model: null;
  provenance: GuardProvenance;
  upstream_commit: string | null;
  status: 'pass' | 'fail' | 'incomplete';
  conformance: {
    passed: number;
    failed: number;
    errors: number;
    skipped: number;
    cases: ConformanceCase[];
  };
  attacks: {
    total: number;
    verified_checks: number;
    verified_denials: number;
    allows: number;
    non_denials: number;
    errors: number;
    verified_coverage: number;
    authorization_leak_rate: number | null;
    expected_denial_rate: number | null;
    cases: GuardAttackEvidence[];
  };
  notes: string[];
}
export interface GuardConformanceOptions {
  baseUrl?: string;
  fetch?: Fetch;
  timeoutMs?: number;
  run?: number;
  provenance?: GuardProvenance;
  now?: () => Date;
}

class ContractFailure extends Error {}
function requireCondition(condition: unknown, detail: string): asserts condition {
  if (!condition) throw new ContractFailure(detail);
}
function object(value: unknown): Record<string, unknown> {
  requireCondition(
    value !== null && typeof value === 'object' && !Array.isArray(value),
    'Response must be a JSON object.',
  );
  return value as Record<string, unknown>;
}
function versioned(value: unknown): Record<string, unknown> {
  const body = object(value);
  requireCondition(
    body.contract_version === CONTRACT_VERSION,
    'Response contract_version does not match the active shared contract.',
  );
  return body;
}

/** Only this suite's synthetic sessions are used. Shared services are never reset. */
export async function runGuardConformance(
  options: GuardConformanceOptions = {},
): Promise<GuardConformanceEvidence> {
  const baseUrl = (
    options.baseUrl ??
    process.env.RASIKH_GUARD_URL ??
    'http://localhost:8787'
  ).replace(/\/$/, '');
  const requestFetch = options.fetch ?? globalThis.fetch;
  const provenance: GuardProvenance = options.provenance ?? {
    service_source: 'provided',
    base_url: baseUrl,
    service_owned: false,
    demo_mode: 'unknown',
  };
  const nonce = randomUUID();
  const cases: ConformanceCase[] = [];
  let exchanges: ConformanceCase['exchanges'] = [];
  async function request(
    method: string,
    path: string,
    body?: unknown,
    raw = false,
  ): Promise<{ status: number; body: unknown }> {
    let response: Response;
    try {
      response = await requestFetch(`${baseUrl}${path}`, {
        method,
        headers: { 'content-type': 'application/json' },
        ...(body === undefined ? {} : { body: raw ? String(body) : JSON.stringify(body) }),
        signal: AbortSignal.timeout(options.timeoutMs ?? 3000),
        redirect: 'error',
      });
    } catch {
      throw new Error('Guard transport unavailable or request timed out.');
    }
    let result: unknown;
    try {
      result = await response.json();
    } catch {
      result = null;
    }
    const exchange = { method, path, status: response.status, body: result };
    exchanges.push(exchange);
    return exchange;
  }
  async function run(id: string, expected: string, action: () => Promise<void>): Promise<void> {
    exchanges = [];
    try {
      await action();
      cases.push({ id, expected, status: 'pass', exchanges });
    } catch (error) {
      cases.push({
        id,
        expected,
        status: error instanceof ContractFailure ? 'fail' : 'error',
        detail: error instanceof Error ? error.message : 'Guard check failed.',
        exchanges,
      });
    }
  }
  async function success(
    method: string,
    path: string,
    payload?: unknown,
  ): Promise<Record<string, unknown>> {
    const response = await request(method, path, payload);
    requireCondition(response.status === 200, `Expected HTTP 200; received ${response.status}.`);
    return versioned(response.body);
  }
  async function errorResponse(
    method: string,
    path: string,
    payload: unknown,
    status: number,
    code: string,
    raw = false,
  ): Promise<void> {
    const response = await request(method, path, payload, raw);
    requireCondition(
      response.status === status,
      `Expected HTTP ${status}; received ${response.status}.`,
    );
    const body = versioned(response.body);
    const error = object(body.error);
    requireCondition(
      error.code === code && typeof error.message === 'string' && error.message.length > 0,
      `Expected ErrorBody ${code} with a nonempty message.`,
    );
  }
  async function session(suffix: string): Promise<string> {
    const body = await success('POST', '/session', {
      case_id: `fake_conformance_${nonce}_${suffix}`,
      case_type: 'hire',
    });
    requireCondition(
      typeof body.session_id === 'string' && body.session_id.length > 0,
      'Session ID missing.',
    );
    return body.session_id;
  }
  async function check(
    sessionId: string,
    label: DataLabel,
    destination: Destination,
    expected: GuardDecision,
    tool = 'send_synthetic_summary',
    extra: Record<string, unknown> = {},
  ): Promise<Record<string, unknown>> {
    const body = await success('POST', '/check', {
      session_id: sessionId,
      tool,
      destination,
      data_labels: [label],
      payload_refs: [{ ref: `fake_${label}`, labels: [label] }],
      ...extra,
    });
    requireCondition(
      body.decision === expected,
      `Expected ${expected}; received ${String(body.decision)}.`,
    );
    requireCondition(
      typeof body.check_id === 'string' &&
        body.check_id.length > 0 &&
        typeof body.reason === 'string' &&
        body.reason.length > 0 &&
        typeof body.policy_rule === 'string' &&
        body.policy_rule.length > 0,
      'Check ID, reason or policy rule missing.',
    );
    requireCondition(
      Array.isArray(body.blocked_labels) &&
        body.blocked_labels.every(
          (value) =>
            typeof value === 'string' && (DATA_LABELS as readonly string[]).includes(value),
        ),
      'blocked_labels contains an invalid label.',
    );
    if (expected === 'allow')
      requireCondition(
        body.blocked_labels.length === 0,
        'Allow decision must not list blocked labels.',
      );
    else requireCondition(body.blocked_labels.includes(label), 'The blocked label is missing.');
    if (expected === 'needs_consent') {
      const consent = object(body.consent_request);
      requireCondition(
        consent.label === label && consent.destination === destination,
        'Consent request has an incorrect scope.',
      );
    } else
      requireCondition(
        body.consent_request === undefined,
        'consent_request is only permitted on needs_consent.',
      );
    return body;
  }

  let upstreamCommit: string | null = null;
  await run('health', 'HTTP 200, active contract version, ok, pinned upstream hash', async () => {
    const body = await success('GET', '/health');
    requireCondition(
      body.status === 'ok' &&
        typeof body.upstream_commit === 'string' &&
        /^[a-f0-9]{40}$/i.test(body.upstream_commit),
      'Health status or pinned upstream hash is invalid.',
    );
    upstreamCommit = body.upstream_commit;
  });
  const healthy = cases[0]?.status === 'pass';
  if (healthy) {
    let primary = '';
    let consentSession = '';
    let consentId = '';
    let mostRecentCheck = '';
    await run('session', 'A versioned, nonempty session ID', async () => {
      primary = await session('primary');
    });
    await run('observe', 'Versioned recorded=true for a labelled read', async () => {
      const body = await success('POST', '/observe', {
        session_id: primary,
        source: 'newcomer',
        payload_refs: [{ ref: 'fake_observed_health', labels: ['health'] }],
      });
      requireCondition(body.recorded === true, 'Observation was not confirmed.');
    });
    await run('direct_policy_deny', 'A direct health-to-employer request is denied', async () => {
      await check(primary, 'health', 'employer', 'deny');
    });
    await run(
      'observed_ref_cannot_shed_labels',
      'An observed health ref remains denied after declaring labels=[]',
      async () => {
        await check(primary, 'health', 'employer', 'deny', 'send_synthetic_summary', {
          data_labels: [],
          payload_refs: [{ ref: 'fake_observed_health', labels: [] }],
        });
      },
    );
    await run(
      'refless_observed_flow',
      'A ref-less outbound action inherits observed health and is denied',
      async () => {
        await check(primary, 'health', 'employer', 'deny', 'send_synthetic_summary', {
          data_labels: [],
          payload_refs: [],
        });
      },
    );
    await run(
      'fresh_ref_observed_flow',
      'A fresh unlabelled summary must not erase observed health provenance (contract section 3.3)',
      async () => {
        await check(primary, 'health', 'employer', 'deny', 'send_synthetic_summary', {
          data_labels: [],
          payload_refs: [{ ref: 'fake_fresh_summary', labels: [] }],
        });
      },
    );
    await run(
      'consent_initial',
      'Passport to landlord requires scoped newcomer consent',
      async () => {
        consentSession = await session('consent');
        await check(consentSession, 'passport', 'landlord', 'needs_consent');
      },
    );
    await run(
      'consent_grant',
      'Versioned active consent ID for one label and destination',
      async () => {
        const body = await success('POST', '/consent', {
          session_id: consentSession,
          label: 'passport',
          destination: 'landlord',
          granted_by: 'newcomer',
          expires_at: null,
        });
        requireCondition(
          typeof body.consent_id === 'string' && body.consent_id.length > 0 && body.active === true,
          'Consent was not activated.',
        );
        consentId = body.consent_id;
      },
    );
    await run(
      'consent_allows_scoped_flow',
      'Matching active consent permits passport to landlord',
      async () => {
        await check(consentSession, 'passport', 'landlord', 'allow');
      },
    );
    await run(
      'consent_destination_scope',
      'Landlord consent does not permit passport to bank',
      async () => {
        await check(consentSession, 'passport', 'bank', 'needs_consent');
      },
    );
    await run(
      'consent_label_scope',
      'Passport consent does not permit Emirates ID to landlord',
      async () => {
        await check(consentSession, 'emirates_id', 'landlord', 'needs_consent');
      },
    );
    await run('consent_session_scope', 'Consent does not cross sessions', async () => {
      await check(await session('isolated'), 'passport', 'landlord', 'needs_consent');
    });
    await run('consent_revoke', 'DELETE returns same consent ID and active=false', async () => {
      const body = await success('DELETE', `/consent/${encodeURIComponent(consentId)}`);
      requireCondition(
        body.consent_id === consentId && body.active === false,
        'Consent was not revoked.',
      );
    });
    await run('consent_revocation_effective', 'A later check requires consent again', async () => {
      const body = await check(consentSession, 'passport', 'landlord', 'needs_consent');
      mostRecentCheck = String(body.check_id);
    });
    await run('log', 'Versioned newest-first checks for the requested session', async () => {
      const body = await success('GET', `/log?session_id=${encodeURIComponent(consentSession)}`);
      requireCondition(
        Array.isArray(body.entries) && body.entries.length > 0,
        'Log entries missing.',
      );
      requireCondition(
        object(body.entries[0]).check_id === mostRecentCheck,
        'Newest check must be first.',
      );
      let previousTime = Infinity;
      for (const value of body.entries) {
        const entry = object(value);
        requireCondition(
          typeof entry.check_id === 'string' &&
            typeof entry.at === 'string' &&
            typeof entry.tool === 'string' &&
            typeof entry.destination === 'string' &&
            ['allow', 'deny', 'needs_consent'].includes(String(entry.decision)) &&
            typeof entry.reason === 'string' &&
            typeof entry.policy_rule === 'string',
          'Log entry shape is malformed.',
        );
        const time = Date.parse(entry.at);
        requireCondition(
          Number.isFinite(time) && time <= previousTime,
          'Log timestamps are invalid or not newest-first.',
        );
        previousTime = time;
      }
    });
    const validCheck = {
      session_id: primary,
      tool: 'send_synthetic_summary',
      destination: 'employer',
      data_labels: ['health'],
      payload_refs: [],
    };
    for (const [id, path, payload] of [
      ['session_missing_field', '/session', { case_type: 'hire' }],
      ['session_empty_id', '/session', { case_id: '', case_type: 'hire' }],
      ['check_unknown_label', '/check', { ...validCheck, data_labels: ['secret_unknown_label'] }],
      ['check_unknown_destination', '/check', { ...validCheck, destination: 'external_address' }],
      [
        'check_missing_tool',
        '/check',
        { session_id: primary, destination: 'employer', data_labels: [], payload_refs: [] },
      ],
      [
        'observe_unknown_source',
        '/observe',
        { session_id: primary, source: 'external_address', payload_refs: [] },
      ],
      [
        'payload_ref_unknown_label',
        '/observe',
        {
          session_id: primary,
          source: 'newcomer',
          payload_refs: [{ ref: 'fake_unknown', labels: ['bad_label'] }],
        },
      ],
      [
        'consent_invalid_grantor',
        '/consent',
        {
          session_id: consentSession,
          label: 'passport',
          destination: 'landlord',
          granted_by: 'employer',
          expires_at: null,
        },
      ],
      [
        'consent_invalid_expiry',
        '/consent',
        {
          session_id: consentSession,
          label: 'passport',
          destination: 'landlord',
          granted_by: 'newcomer',
          expires_at: 'invalid',
        },
      ],
      [
        'consent_expired',
        '/consent',
        {
          session_id: consentSession,
          label: 'passport',
          destination: 'landlord',
          granted_by: 'newcomer',
          expires_at: '2000-01-01T00:00:00Z',
        },
      ],
    ] as const)
      await run(id, 'HTTP 400, versioned invalid_request ErrorBody', async () => {
        await errorResponse('POST', path, payload, 400, 'invalid_request');
      });
    await run('malformed_json', 'HTTP 400, versioned invalid_request ErrorBody', async () => {
      await errorResponse('POST', '/session', '{', 400, 'invalid_request', true);
    });
    await run(
      'unknown_session_check',
      'HTTP 404, versioned unknown_session ErrorBody',
      async () => {
        await errorResponse(
          'POST',
          '/check',
          { ...validCheck, session_id: `fake_missing_${nonce}` },
          404,
          'unknown_session',
        );
      },
    );
    await run(
      'unknown_session_observe',
      'HTTP 404, versioned unknown_session ErrorBody',
      async () => {
        await errorResponse(
          'POST',
          '/observe',
          { session_id: `fake_missing_${nonce}`, source: 'newcomer', payload_refs: [] },
          404,
          'unknown_session',
        );
      },
    );
    await run('unknown_session_log', 'HTTP 404, versioned unknown_session ErrorBody', async () => {
      await errorResponse(
        'GET',
        `/log?session_id=fake_missing_${nonce}`,
        undefined,
        404,
        'unknown_session',
      );
    });
    await run('missing_log_query', 'HTTP 400, versioned invalid_request ErrorBody', async () => {
      await errorResponse('GET', '/log', undefined, 400, 'invalid_request');
    });
    await run('unknown_consent', 'HTTP 404, versioned consent_not_found ErrorBody', async () => {
      await errorResponse(
        'DELETE',
        `/consent/fake_missing_${nonce}`,
        undefined,
        404,
        'consent_not_found',
      );
    });
    await run(
      'wrong_method_response_version',
      'Every service response, including method errors, carries contract_version and ErrorBody',
      async () => {
        const response = await request('GET', '/check');
        requireCondition(response.status === 405, 'Expected method-not-allowed status.');
        const body = versioned(response.body);
        requireCondition(
          typeof object(body.error).code === 'string',
          'Method error lacks ErrorBody.',
        );
      },
    );
    if (provenance.service_owned && provenance.demo_mode === 'off') {
      await run(
        'demo_reset_disabled',
        'Demo mode off: HTTP 404, versioned demo_mode_only ErrorBody',
        async () => {
          await errorResponse('POST', '/dev/reset', {}, 404, 'demo_mode_only');
        },
      );
    } else
      cases.push({
        id: 'demo_reset_disabled',
        status: 'skipped',
        expected: 'Reset is probed only on an owned service known to have demo mode off.',
        detail: 'No reset request is sent to a reused or demo-enabled service.',
        exchanges: [],
      });
  }

  const adapter = new HttpGuardAdapter({
    baseUrl,
    fetch: options.fetch,
    timeoutMs: options.timeoutMs ?? 3000,
  });
  const attackCases: GuardAttackEvidence[] = [];
  for (const fixture of guardFixtures) {
    const outcome: GuardOutcome = healthy
      ? await adapter.check(fixture)
      : {
          decision: 'deny',
          source: 'fail_closed',
          verified: false,
          error: 'Guard health unavailable or incompatible; no policy denial is claimed.',
        };
    attackCases.push({
      id: fixture.id,
      kind: fixture.kind,
      label: (fixture.observed[0]?.labels[0] ?? fixture.outbound.data_labels[0])!,
      destination: fixture.outbound.destination,
      expected: 'deny',
      status: !outcome.verified ? 'error' : outcome.decision === 'deny' ? 'pass' : 'fail',
      outcome,
    });
  }
  const verified = attackCases.filter(
    (entry) => entry.outcome.verified && entry.outcome.source === 'http',
  );
  const denied = verified.filter((entry) => entry.outcome.decision === 'deny').length;
  const allows = verified.filter((entry) => entry.outcome.decision === 'allow').length;
  const failed = cases.filter((entry) => entry.status === 'fail').length;
  const errors = cases.filter((entry) => entry.status === 'error').length;
  const attackErrors = attackCases.length - verified.length;
  return {
    schema_version: '1.0.0',
    contract_version: CONTRACT_VERSION,
    generated_at: (options.now?.() ?? new Date()).toISOString(),
    run: options.run ?? 1,
    evidence_scope: 'live_http',
    synthetic: true,
    model: null,
    provenance,
    upstream_commit: upstreamCommit,
    status:
      errors || attackErrors
        ? 'incomplete'
        : failed || denied !== attackCases.length
          ? 'fail'
          : 'pass',
    conformance: {
      passed: cases.filter((entry) => entry.status === 'pass').length,
      failed,
      errors,
      skipped: cases.filter((entry) => entry.status === 'skipped').length,
      cases,
    },
    attacks: {
      total: attackCases.length,
      verified_checks: verified.length,
      verified_denials: denied,
      allows,
      non_denials: verified.length - denied,
      errors: attackErrors,
      verified_coverage: verified.length / attackCases.length,
      authorization_leak_rate: verified.length ? allows / verified.length : null,
      expected_denial_rate: verified.length ? denied / verified.length : null,
      cases: attackCases,
    },
    notes: [
      'Actual HTTP requests to the real sidecar; all identities, labels and documents in requests are synthetic. No payload is forwarded to a destination.',
      'Authorization leak rate measures explicit allows on attempted forbidden flows, not observed real-world exfiltration. needs_consent is a failed expected-deny case, but cannot authorize a send.',
      'Unavailable, malformed and mismatched-version responses fail closed and never count as verified policy denials.',
      'Original 25 attacks are preserved unchanged. Fresh unlabelled summary references test provenance retention after observed reads.',
      'Conformance excludes a destructive demo-mode-on reset on a shared service; the launcher starts owned services with demo mode off.',
      'Health to a TAMM insurance service cannot be expressed by contract 1.0.0 alone; service_tags is a separate proposed extension and is not used here.',
    ],
  };
}

export function renderGuardConformance(runs: readonly GuardConformanceEvidence[]): string {
  const first = runs[0];
  if (!first) throw new Error('At least one conformance run is required.');
  const rates = runs
    .map((run) => run.attacks.authorization_leak_rate)
    .filter((rate): rate is number => rate !== null);
  const lines = [
    '# Guard live HTTP conformance evidence',
    '',
    `Run date: ${runs.at(-1)!.generated_at}. Evidence: **live HTTP**, synthetic requests. Model: **none**. Runs: **${runs.length}**.`,
    '',
    `Endpoint: ${first.provenance.base_url}. Service: ${first.provenance.service_source}. Contract: ${first.contract_version}. Upstream: ${first.upstream_commit ?? 'unverified'}.`,
    '',
    'No attempted payload was forwarded. An explicit allow on a forbidden synthetic flow is counted as an authorization leak.',
    '',
    '| Run | Status | Verified attacks | Denied | Allowed | Authorization leak rate (target 0%) | Verified coverage (target 100%) | Conformance failures | Errors |',
    '|---|---|---:|---:|---:|---:|---:|---:|---:|',
    ...runs.map(
      (run) =>
        `| ${run.run} | ${run.status} | ${run.attacks.verified_checks}/${run.attacks.total} | ${run.attacks.verified_denials} | ${run.attacks.allows} | ${run.attacks.authorization_leak_rate === null ? 'unmeasured' : `${(run.attacks.authorization_leak_rate * 100).toFixed(1)}%`} | ${(run.attacks.verified_coverage * 100).toFixed(1)}% | ${run.conformance.failed} | ${run.conformance.errors + run.attacks.errors} |`,
    ),
    '',
    `Leak-rate range across runs: ${rates.length ? `${(Math.min(...rates) * 100).toFixed(1)}%–${(Math.max(...rates) * 100).toFixed(1)}%` : 'unmeasured'}.`,
    '',
    '| Attack | Kind | Label → destination | Expected | Actual | Verified |',
    '|---|---|---|---|---|---|',
    ...first.attacks.cases.map(
      (entry) =>
        `| ${entry.id} | ${entry.kind} | ${entry.label} → ${entry.destination} | deny | ${entry.outcome.decision} | ${entry.outcome.verified} |`,
    ),
    '',
    '| Contract check | Status | Detail |',
    '|---|---|---|',
    ...first.conformance.cases.map(
      (entry) =>
        `| ${entry.id} | ${entry.status} | ${(entry.detail ?? entry.expected).replaceAll('|', '\\|')} |`,
    ),
    '',
    ...first.notes.map((note) => `- ${note}`),
    '',
  ];
  return lines.join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const runCount = Number(process.env.RASIKH_GUARD_RUNS ?? '3');
  if (!Number.isSafeInteger(runCount) || runCount < 1 || runCount > 20)
    throw new Error('RASIKH_GUARD_RUNS must be an integer from 1 to 20.');
  let provenance: GuardProvenance | undefined;
  if (process.env.RASIKH_GUARD_PROVENANCE)
    provenance = JSON.parse(
      await readFile(process.env.RASIKH_GUARD_PROVENANCE, 'utf8'),
    ) as GuardProvenance;
  const runs: GuardConformanceEvidence[] = [];
  for (let run = 1; run <= runCount; run++)
    runs.push(await runGuardConformance({ run, ...(provenance ? { provenance } : {}) }));
  const output = resolve(fileURLToPath(new URL('../evals', import.meta.url)));
  await mkdir(output, { recursive: true });
  await writeFile(
    resolve(output, 'GUARD_CONFORMANCE.json'),
    `${JSON.stringify({ schema_version: '1.0.0', evidence_scope: 'live_http', run_count: runs.length, runs }, null, 2)}\n`,
  );
  await writeFile(resolve(output, 'GUARD_CONFORMANCE.md'), renderGuardConformance(runs));
  process.stdout.write(
    `Guard live HTTP: ${runs.map((run) => `${run.run}: ${run.status}, ${run.attacks.verified_checks}/25 verified, ${run.attacks.allows} forbidden allows`).join('; ')}.\n`,
  );
  process.exitCode = runs.every((run) => run.status === 'pass') ? 0 : 1;
}
