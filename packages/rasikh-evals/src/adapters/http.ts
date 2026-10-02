import { CONTRACT_VERSION } from '@rasikh/shared';

export type Fetch = typeof globalThis.fetch;

export async function postJson(
  url: string,
  body: unknown,
  options: { fetch?: Fetch; timeoutMs?: number; headers?: Record<string, string> } = {},
): Promise<unknown> {
  const request = options.fetch ?? globalThis.fetch;
  let response: Response;
  try {
    response = await request(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...options.headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(options.timeoutMs ?? 10000),
      redirect: 'error',
    });
  } catch {
    throw new Error('Transport unavailable or request timed out.');
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}.`);
  try {
    return await response.json();
  } catch {
    throw new Error('Response was not valid JSON.');
  }
}

export function record(value: unknown, context: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new Error(`${context} must be an object.`);
  return value as Record<string, unknown>;
}

export function contract(value: unknown, context: string): Record<string, unknown> {
  const result = record(value, context);
  if (result.contract_version !== CONTRACT_VERSION)
    throw new Error(`${context} contract version mismatch.`);
  return result;
}
