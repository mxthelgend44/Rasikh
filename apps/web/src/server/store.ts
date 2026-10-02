import { randomUUID } from 'node:crypto';
import { applyAction, type Action } from '@/domain/actions';
import { createSeed } from '@/domain/seed';
import type { AppState } from '@/domain/types';
import type { Snapshot } from '@/store/snapshot';

export type { Snapshot };

export type Listener = (snapshot: Snapshot) => void;

/**
 * The single authoritative copy of the demo state, in memory. Every surface reads it and changes
 * it through `dispatch`, and every change is pushed to all subscribers.
 *
 * This is a demo store: state is lost on restart, which is what Reset demo does anyway. A real
 * deployment would put the same `applyAction` in front of a database.
 */
export class Store {
  private state: AppState = createSeed();
  private readonly epoch = randomUUID();
  private readonly listeners = new Set<Listener>();

  snapshot(): Snapshot {
    return { epoch: this.epoch, state: this.state };
  }

  dispatch(action: Action): Snapshot {
    this.state = applyAction(this.state, action);
    return this.publish();
  }

  /** Back to the seed. The revision keeps rising so connected clients accept it. */
  reset(): Snapshot {
    this.state = { ...createSeed(), rev: this.state.rev + 1 };
    return this.publish();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private publish(): Snapshot {
    const snapshot = this.snapshot();
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch {
        this.listeners.delete(listener);
      }
    }
    return snapshot;
  }
}

const KEY = Symbol.for('rasikh.store');

/**
 * One instance per server process. Held on `globalThis` because Next bundles route handlers and
 * server components separately in development, and each bundle would otherwise get its own copy.
 */
export function getStore(): Store {
  const holder = globalThis as unknown as { [KEY]?: Store };
  holder[KEY] ??= new Store();
  return holder[KEY];
}
