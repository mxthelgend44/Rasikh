import { CONTRACT_VERSION } from '@rasikh/shared';
import { policyFor } from '@/domain/policy';
import { boundedJson } from './bounded-json';
import { getGuardIdentityToken } from './auth';
import type { AiEnv } from './config';
import { AiError, isRecord } from './errors';
import { labelsFor, type ExtractKind } from './validation';

function guardUrl(env: AiEnv): URL {
  const configured = env.RASIKH_GUARD_URL;
  if (!configured)
    throw new AiError('guard_unavailable', 'Live document processing is waiting for Guard.');
  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new AiError('guard_unavailable', 'Guard is not configured.');
  }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (
    (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new AiError('guard_unavailable', 'Guard is not configured securely.');
  }
  return url;
}

async function call(
  env: AiEnv,
  path: string,
  body?: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<Record<string, unknown>> {
  const base = guardUrl(env);
  if (env.RASIKH_GUARD_AUTH_AUDIENCE) {
    let audience: URL;
    try {
      audience = new URL(env.RASIKH_GUARD_AUTH_AUDIENCE);
    } catch {
      throw new AiError('guard_unavailable', 'Guard identity is not configured.');
    }
    if (audience.origin !== base.origin)
      throw new AiError(
        'guard_unavailable',
        'Guard identity does not match the configured service.',
      );
  }
  const url = new URL(base.pathname.replace(/\/$/, '') + path, base.origin);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const identity = env.RASIKH_GUARD_TOKEN ?? (await getGuardIdentityToken(env, fetchImpl));
    const response = await fetchImpl(url, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        'content-type': 'application/json',
        ...(identity ? { authorization: `Bearer ${identity}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: controller.signal,
      redirect: 'error',
      cache: 'no-store',
    });
    if (!response.ok)
      throw new AiError('guard_unavailable', 'Guard could not approve document processing.');
    const result = await boundedJson(response, 32768);
    if (!isRecord(result) || result.contract_version !== CONTRACT_VERSION)
      throw new Error('Invalid Guard response');
    return result;
  } catch (error) {
    if (error instanceof AiError) throw error;
    throw new AiError('guard_unavailable', 'Guard could not approve document processing.');
  } finally {
    clearTimeout(timer);
  }
}

export async function guardAvailable(
  env: AiEnv,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  try {
    return (await call(env, '/health', undefined, fetchImpl)).status === 'ok';
  } catch {
    return false;
  }
}

/** A fresh session prevents unrelated profile reads from entering the extraction context. */
export async function authorizeExtraction(
  hireId: string,
  kind: ExtractKind,
  env: AiEnv,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const labels = labelsFor(kind);
  if (labels.some((label) => policyFor(label, 'llm_provider') !== 'extraction_only')) {
    throw new AiError(
      'policy_denied',
      'This document cannot be sent to the live AI provider.',
      403,
    );
  }
  const session = await call(env, '/session', { case_id: hireId, case_type: 'hire' }, fetchImpl);
  if (
    typeof session.session_id !== 'string' ||
    !/^[a-zA-Z0-9_-]{1,128}$/.test(session.session_id)
  ) {
    throw new AiError('guard_unavailable', 'Guard could not approve document processing.');
  }
  const payload_refs = [{ ref: `doc_${kind}_${hireId}`, labels }];
  const observed = await call(
    env,
    '/observe',
    { session_id: session.session_id, source: 'newcomer', payload_refs },
    fetchImpl,
  );
  if (observed.recorded !== true)
    throw new AiError('guard_unavailable', 'Guard could not approve document processing.');
  const decision = await call(
    env,
    '/check',
    {
      session_id: session.session_id,
      tool: 'extract_document',
      destination: 'llm_provider',
      data_labels: labels,
      payload_refs,
    },
    fetchImpl,
  );
  if (decision.decision !== 'allow') {
    throw new AiError(
      decision.decision === 'needs_consent' ? 'consent_required' : 'policy_denied',
      'Guard has not approved sending this document to the live AI provider.',
      403,
    );
  }
  if (typeof decision.check_id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(decision.check_id)) {
    throw new AiError('guard_unavailable', 'Guard could not approve document processing.');
  }
  return decision.check_id;
}
