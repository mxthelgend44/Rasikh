import { DEMO_FIXTURES } from '@rasikh/shared';
import { nextId } from '../ids';
import { unlockSteps } from '../roadmap';
import type { AgentAction, AppState, Id, IsoDateTime, Step } from '../types';

/** Thrown for an action that references something that does not exist or is not allowed. */
export class DomainError extends Error {
  readonly name = 'DomainError';
  readonly code = 'rasikh_domain_error';
}

export function isDomainError(error: unknown): error is DomainError {
  return (
    error instanceof DomainError ||
    (error instanceof Error &&
      error.name === 'DomainError' &&
      'code' in error &&
      error.code === 'rasikh_domain_error' &&
      typeof error.message === 'string')
  );
}

export interface Context {
  now: IsoDateTime;
}

export function lookup<T>(map: Record<Id, T>, id: Id, label: string): T {
  if (!Object.hasOwn(map, id)) throw new DomainError(`Unknown ${label}: ${id}`);
  return map[id];
}

export function assertOwner(actual: Id, requested: Id | undefined): void {
  if (requested !== undefined && requested !== actual) {
    throw new DomainError('This record belongs to another organisation');
  }
}

export function stepsOfHire(draft: AppState, hireId: Id): Step[] {
  return Object.values(draft.steps)
    .filter((step) => step.hireId === hireId)
    .sort((a, b) => a.order - b.order);
}

/** Re-runs dependency unlocking for one hire and writes any changed steps back. */
export function refreshUnlocks(draft: AppState, hireId: Id): void {
  for (const step of unlockSteps(stepsOfHire(draft, hireId))) draft.steps[step.id] = step;
}

export function logAction(
  draft: AppState,
  context: Context,
  entry: Omit<AgentAction, 'id' | 'at'>,
): AgentAction {
  const action: AgentAction = {
    ...entry,
    id: nextId(draft.counters, 'act', draft.agentActions),
    at: context.now,
  };
  draft.agentActions[action.id] = action;
  return action;
}

/** The first unused id from `candidates` (demo fixtures), else a generated one. */
export function allocateHireId(draft: AppState, candidates: readonly Id[]): Id {
  return (
    candidates.find((id) => !Object.hasOwn(draft.hires, id)) ??
    nextId(draft.counters, 'hire', draft.hires)
  );
}

export const PATH_ONE_HIRE_IDS: readonly Id[] = [DEMO_FIXTURES.hire];
export const TEAM_MOVE_HIRE_IDS: readonly Id[] = DEMO_FIXTURES.transferredHires;
