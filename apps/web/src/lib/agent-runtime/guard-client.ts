import type { DataLabel, Destination, PayloadRef } from '@rasikh/shared';
import type { GuardPort, GuardVerdict } from './types';

const LABELS: readonly string[] = [
  'passport',
  'emirates_id',
  'salary',
  'bank_statement',
  'employment',
  'family',
  'address',
  'degree',
  'health',
];
const DESTINATIONS: readonly string[] = [
  'tamm',
  'employer',
  'landlord',
  'bank',
  'school',
  'llm_provider',
  'newcomer',
];
const DECISIONS = ['allow', 'deny', 'needs_consent'] as const;

type Fetch = typeof globalThis.fetch;

export function failClosed(reason: string): GuardVerdict {
  return {
    decision: 'deny',
    reason,
    policy_rule: null,
    check_id: null,
    contract_version: null,
    source: 'fail_closed',
  };
}

export class GuardUnavailable extends Error {}

/** HTTP client for Rasikh Guard (INTEGRATION.md section 3). Any failure becomes a denial. */
export class HttpGuardClient implements GuardPort {
  private readonly baseUrl: string;
  private readonly fetch: Fetch;
  private readonly timeoutMs: number;
  constructor(options: { baseUrl: string; fetch?: Fetch; timeoutMs?: number }) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.fetch = options.fetch ?? globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? 5000;
  }

  private async post(path: string, body: unknown): Promise<Record<string, unknown>> {
    let response: Response;
    try {
      response = await this.fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs),
        redirect: 'error',
      });
    } catch {
      throw new GuardUnavailable('Guard could not be reached.');
    }
    if (!response.ok) throw new GuardUnavailable(`Guard returned HTTP ${response.status}.`);
    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw new GuardUnavailable('Guard response was not valid JSON.');
    }
    if (typeof json !== 'object' || json === null || Array.isArray(json))
      throw new GuardUnavailable('Guard response was not an object.');
    const record = json as Record<string, unknown>;
    // Same major version only; the audit trail records the exact version.
    if (typeof record.contract_version !== 'string' || !record.contract_version.startsWith('1.'))
      throw new GuardUnavailable('Guard contract version is not supported.');
    return record;
  }

  async startSession(caseId: string): Promise<string> {
    const result = await this.post('/session', { case_id: caseId, case_type: 'hire' });
    if (typeof result.session_id !== 'string' || !result.session_id)
      throw new GuardUnavailable('Guard session id missing.');
    return result.session_id;
  }

  async observe(sessionId: string, source: Destination, refs: PayloadRef[]): Promise<void> {
    const result = await this.post('/observe', {
      session_id: sessionId,
      source,
      payload_refs: refs,
    });
    if (result.recorded !== true) throw new GuardUnavailable('Guard did not confirm observation.');
  }

  async check(request: {
    sessionId: string;
    tool: string;
    destination: Destination;
    labels: DataLabel[];
    refs: PayloadRef[];
  }): Promise<GuardVerdict> {
    try {
      const r = await this.post('/check', {
        session_id: request.sessionId,
        tool: request.tool,
        destination: request.destination,
        data_labels: request.labels,
        payload_refs: request.refs,
      });
      const decision = DECISIONS.find((d) => d === r.decision);
      if (
        !decision ||
        typeof r.check_id !== 'string' ||
        !r.check_id ||
        typeof r.reason !== 'string' ||
        !r.reason ||
        typeof r.policy_rule !== 'string' ||
        !r.policy_rule ||
        !Array.isArray(r.blocked_labels) ||
        !r.blocked_labels.every((l) => typeof l === 'string' && LABELS.includes(l))
      )
        throw new GuardUnavailable('Guard check response is malformed.');
      const verdict: GuardVerdict = {
        decision,
        reason: r.reason,
        policy_rule: r.policy_rule,
        check_id: r.check_id,
        contract_version: String(r.contract_version),
        source: 'guard',
      };
      if (decision === 'needs_consent') {
        const c = r.consent_request as Record<string, unknown> | undefined;
        if (
          !c ||
          !LABELS.includes(String(c.label)) ||
          !DESTINATIONS.includes(String(c.destination))
        )
          throw new GuardUnavailable('Guard consent request is malformed.');
        verdict.consent_request = {
          label: c.label as DataLabel,
          destination: c.destination as Destination,
        };
      }
      return verdict;
    } catch (error) {
      return failClosed(
        error instanceof GuardUnavailable
          ? 'The safety check could not be completed, so nothing was sent.'
          : 'The safety check failed, so nothing was sent.',
      );
    }
  }
}
