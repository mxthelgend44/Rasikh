import type { Action } from '@/domain/actions';

const ACTION_TYPES: readonly Action['type'][] = [
  'hire.create',
  'hire.back',
  'step.set_status',
  'document.add',
  'agent.log',
  'approval.decide',
  'application.create',
  'application.decide',
  'grant.set',
  'guard.record',
  'company.create',
  'setup.set_status',
];

/**
 * Accepts only a JSON object with a known action `type`. The shape of the rest is the domain's
 * job: reducers throw a `DomainError` for anything that does not resolve. Returns null when the
 * body is not an action at all.
 */
export function parseAction(body: unknown): Action | null {
  if (typeof body !== 'object' || body === null) return null;
  const type = (body as { type?: unknown }).type;
  if (typeof type !== 'string' || !ACTION_TYPES.includes(type as Action['type'])) return null;
  return body as Action;
}
