import { DATA_LABELS } from '@rasikh/shared';
import type { GuardCheckRequest, GuardObserveRequest, GuardSessionRequest } from '@rasikh/shared';
import type { GuardAdapter, GuardFixture, GuardOutcome } from '../types.ts';
import { contract, postJson, type Fetch } from './http.ts';

export class HttpGuardAdapter implements GuardAdapter {
  readonly name = 'guard-http';
  private readonly baseUrl: string;
  constructor(options: { baseUrl?: string; fetch?: Fetch; timeoutMs?: number } = {}) {
    this.options = options;
    this.baseUrl = (
      options.baseUrl ??
      process.env.RASIKH_GUARD_URL ??
      'http://localhost:8787'
    ).replace(/\/$/, '');
  }
  private readonly options: { fetch?: Fetch; timeoutMs?: number };

  async check(fixture: GuardFixture): Promise<GuardOutcome> {
    try {
      // The closed fixture suite uses hire cases; company case_type is not contracted yet.
      const sessionRequest: GuardSessionRequest = { case_id: fixture.case_id, case_type: 'hire' };
      const session = contract(
        await postJson(`${this.baseUrl}/session`, sessionRequest, this.options),
        'Guard session',
      );
      if (typeof session.session_id !== 'string' || !session.session_id)
        throw new Error('Guard session ID missing.');
      if (fixture.observed.length) {
        const observeRequest: GuardObserveRequest = {
          session_id: session.session_id,
          source: 'newcomer',
          payload_refs: fixture.observed,
        };
        const observe = contract(
          await postJson(`${this.baseUrl}/observe`, observeRequest, this.options),
          'Guard observe',
        );
        if (observe.recorded !== true) throw new Error('Guard did not confirm observation.');
      }
      const checkRequest: GuardCheckRequest = {
        session_id: session.session_id,
        ...fixture.outbound,
      };
      const check = contract(
        await postJson(`${this.baseUrl}/check`, checkRequest, this.options),
        'Guard check',
      );
      const labels = new Set<string>(DATA_LABELS);
      if (
        !['allow', 'deny', 'needs_consent'].includes(String(check.decision)) ||
        typeof check.check_id !== 'string' ||
        !check.check_id ||
        typeof check.reason !== 'string' ||
        !check.reason ||
        typeof check.policy_rule !== 'string' ||
        !check.policy_rule ||
        !Array.isArray(check.blocked_labels) ||
        !check.blocked_labels.every((label) => typeof label === 'string' && labels.has(label))
      )
        throw new Error('Guard check response is malformed.');
      return {
        decision: check.decision as GuardOutcome['decision'],
        source: 'http',
        verified: true,
        contract_version: String(check.contract_version),
        policy_rule: check.policy_rule,
      };
    } catch (error) {
      // This blocks the attempted action, but is NOT evidence that a policy denied it.
      return {
        decision: 'deny',
        source: 'fail_closed',
        verified: false,
        error: error instanceof Error ? error.message : 'Guard request failed.',
      };
    }
  }
}
