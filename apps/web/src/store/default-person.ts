import type { AppState, Hire } from '@/domain/types';

/**
 * Who a phone shows before anyone has been chosen. `hires` must be sorted newest first.
 *
 * A hire created during this demo always wins: it is the story in progress, and it appears on the
 * newcomer's screen without any step. On a cold open there is no such hire, so show the person with
 * a decision waiting; the first screen then has something to do instead of an empty feed.
 */
export function defaultHire(state: AppState, hires: Hire[]): Hire | undefined {
  const anchor = Date.parse(state.clock.anchor);
  const created = hires.find((hire) => Date.parse(hire.startedAt) >= anchor);
  if (created) return created;

  const waiting = new Set(
    Object.values(state.approvals)
      .filter((approval) => approval.status === 'pending')
      .map((approval) => approval.hireId),
  );
  return hires.find((hire) => waiting.has(hire.id)) ?? hires[0];
}
