import type { AppState } from '@/domain/types';

/** What the server sends and the client keeps. `epoch` changes whenever the server restarts. */
export interface Snapshot {
  epoch: string;
  state: AppState;
}

/**
 * Whether `incoming` should replace `current`. A new epoch always wins (the server restarted and
 * its revision counter started over); within an epoch only a higher revision does, so a slow
 * response can never roll the screen back.
 */
export function isNewer(incoming: Snapshot, current: Snapshot): boolean {
  return incoming.epoch !== current.epoch || incoming.state.rev > current.state.rev;
}
