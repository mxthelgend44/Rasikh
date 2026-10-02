import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSeed } from '@/domain/seed';
import { LiveStore } from './live-store';
import type { Snapshot } from './snapshot';

class EventStream {
  static instances: EventStream[] = [];
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();
  private listener: ((event: { data: string }) => void) | null = null;

  constructor(public readonly url: string) {
    EventStream.instances.push(this);
  }

  addEventListener(_type: string, listener: (event: { data: string }) => void) {
    this.listener = listener;
  }

  deliver(value: unknown) {
    this.listener?.({ data: JSON.stringify(value) });
  }
}

const snapshot = (epoch: string, rev: number): Snapshot => ({
  epoch,
  state: { ...createSeed(0), rev },
});

beforeEach(() => {
  EventStream.instances = [];
  vi.stubGlobal('EventSource', EventStream);
});

afterEach(() => vi.unstubAllGlobals());

describe('LiveStore convergence', () => {
  it('connects once and applies stream updates without accepting duplicate or old revisions', () => {
    const store = new LiveStore(snapshot('process-a', 1));
    const changed = vi.fn();
    store.subscribe(changed);
    store.connect();
    store.connect();
    expect(EventStream.instances).toHaveLength(1);
    const stream = EventStream.instances[0];
    stream.onopen?.();
    stream.deliver(snapshot('process-a', 3));
    stream.deliver(snapshot('process-a', 2));
    stream.deliver(snapshot('process-a', 3));
    expect(store.getSnapshot().state.rev).toBe(3);
    expect(store.getConnection()).toBe('live');
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it('does not roll back a stream update when a slow POST response arrives', async () => {
    const store = new LiveStore(snapshot('process-a', 1));
    store.connect();
    let finish!: (response: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            finish = resolve;
          }),
      ),
    );
    const action = store.dispatch({
      type: 'hire.back',
      hireId: 'hire_seed_01',
      backed: false,
      by: 'HR',
    });
    EventStream.instances[0].deliver(snapshot('process-a', 4));
    finish(Response.json(snapshot('process-a', 2)));
    await action;
    expect(store.getSnapshot().state.rev).toBe(4);
  });

  it('accepts a server restart but ignores delayed responses from the retired process', async () => {
    const store = new LiveStore(snapshot('process-a', 20));
    store.connect();
    EventStream.instances[0].deliver(snapshot('process-b', 1));
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json(snapshot('process-a', 21))),
    );
    await store.dispatch({ type: 'hire.back', hireId: 'hire_seed_01', backed: false, by: 'HR' });
    expect(store.getSnapshot().epoch).toBe('process-b');
    EventStream.instances[0].deliver(snapshot('process-b', 2));
    expect(store.getSnapshot().state.rev).toBe(2);
  });

  it('reports a rejected action without inventing a local successful update', async () => {
    const initial = snapshot('process-a', 1);
    const store = new LiveStore(initial);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({ error: 'This record belongs to another organisation' }, { status: 400 }),
      ),
    );
    await expect(
      store.dispatch({
        type: 'application.start_review',
        applicationId: 'app_seed_07',
        partyId: 'wrong_bank',
      }),
    ).rejects.toThrow('another organisation');
    expect(store.getSnapshot()).toBe(initial);
  });

  it('rejects invalid snapshots, retains state, and reconnects on valid events', () => {
    const store = new LiveStore(snapshot('process-a', 1));
    store.connect();
    const stream = EventStream.instances[0];
    stream.onopen?.();
    stream.deliver({ epoch: 'process-a', state: { rev: 'invalid' } });
    expect(store.getSnapshot().state.rev).toBe(1);
    expect(store.getConnection()).toBe('offline');
    stream.deliver(snapshot('process-a', 2));
    expect(store.getConnection()).toBe('live');
    expect(store.getSnapshot().state.rev).toBe(2);
  });

  it('accepts reset responses immediately and closes the stream on disconnect', async () => {
    const store = new LiveStore(snapshot('process-a', 1));
    store.connect();
    const fetcher = vi.fn(async () => Response.json(snapshot('process-a', 2)));
    vi.stubGlobal('fetch', fetcher);
    await store.reset();
    expect(fetcher).toHaveBeenCalledWith('/api/reset', expect.objectContaining({ method: 'POST' }));
    expect(store.getSnapshot().state.rev).toBe(2);
    store.disconnect();
    expect(EventStream.instances[0].close).toHaveBeenCalledOnce();
    store.connect();
    expect(EventStream.instances).toHaveLength(2);
  });
});
