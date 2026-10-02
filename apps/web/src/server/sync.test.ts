import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { POST as postAction } from '@/app/api/actions/route';
import { GET as getEvents } from '@/app/api/events/route';
import { GET as getState } from '@/app/api/state/route';
import { POST as postReset } from '@/app/api/reset/route';
import type { Snapshot } from '@/store/snapshot';
import { getStore } from './store';

/** A connected tab: reads Server-Sent Events from the real route handler. */
function openTab() {
  const abort = new AbortController();
  const response = getEvents(new Request('http://localhost/api/events', { signal: abort.signal }));
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  async function next(): Promise<Snapshot> {
    for (;;) {
      const end = buffer.indexOf('\n\n');
      if (end >= 0) {
        const block = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const data = block.split('\n').find((line) => line.startsWith('data: '));
        if (data) return JSON.parse(data.slice(6)) as Snapshot;
        continue;
      }
      const { value, done } = await reader.read();
      if (done) throw new Error('stream closed');
      buffer += decoder.decode(value, { stream: true });
    }
  }

  return { next, close: () => abort.abort(), response };
}

const send = (body: unknown) =>
  postAction(
    new Request('http://localhost/api/actions', { method: 'POST', body: JSON.stringify(body) }),
  );

const HIRE_ACTION = {
  type: 'hire.create',
  hire: {
    employerId: 'emp_gulf_meridian',
    fullName: 'Priya Menon',
    nationality: 'Indian',
    role: 'Senior data engineer',
    department: 'Analytics',
    email: 'priya.menon@mail.example',
    originCity: 'Bengaluru',
    originCountry: 'India',
    estMonthlySalaryAed: 32_000,
    preferredArea: 'Al Reem Island',
    startDate: '2026-11-02',
  },
};

const tabs: ReturnType<typeof openTab>[] = [];
const open = () => {
  const tab = openTab();
  tabs.push(tab);
  return tab;
};

beforeEach(() => {
  getStore().reset();
});

afterEach(() => {
  for (const tab of tabs.splice(0)) tab.close();
});

describe('live sync', () => {
  it('streams the current snapshot as soon as a tab connects', async () => {
    const tab = open();
    const first = await tab.next();
    expect(tab.response.headers.get('Content-Type')).toContain('text/event-stream');
    expect(first.state.rev).toBe(getStore().snapshot().state.rev);
    expect(Object.keys(first.state.hires)).toHaveLength(9);
  });

  it('pushes a change made in one tab to another tab', async () => {
    const tabA = open();
    const tabB = open();
    const [initialA, initialB] = [await tabA.next(), await tabB.next()];

    const response = await send(HIRE_ACTION);
    expect(response.status).toBe(200);

    const [updatedA, updatedB] = [await tabA.next(), await tabB.next()];
    for (const updated of [updatedA, updatedB]) {
      expect(updated.state.rev).toBe(initialA.state.rev + 1);
      expect(updated.state.hires['hire_demo_001']?.fullName).toBe('Priya Menon');
    }
    expect(initialB.state.hires['hire_demo_001']).toBeUndefined();
  });

  it('returns the new snapshot to the tab that made the change', async () => {
    const response = await send(HIRE_ACTION);
    const body = (await response.json()) as Snapshot;
    expect(body.state.hires['hire_demo_001']).toBeDefined();
    expect(body.epoch).toBe(getStore().snapshot().epoch);
  });

  it('rejects a body that is not a known action and changes nothing', async () => {
    const before = getStore().snapshot().state.rev;
    const response = await send({ type: 'drop.table' });
    expect(response.status).toBe(400);
    expect(getStore().snapshot().state.rev).toBe(before);
  });

  it('answers a domain error with its message and leaves the state alone', async () => {
    const before = getStore().snapshot().state.rev;
    const response = await send({ type: 'step.set_status', stepId: 'nope', status: 'done' });
    expect(response.status).toBe(400);
    expect(((await response.json()) as { error: string }).error).toContain('Unknown step');
    expect(getStore().snapshot().state.rev).toBe(before);
  });

  it('notifies every tab on reset and keeps the revision rising', async () => {
    const tab = open();
    await tab.next();
    await send(HIRE_ACTION);
    const afterChange = await tab.next();

    await postReset();
    const afterReset = await tab.next();
    expect(afterReset.state.rev).toBeGreaterThan(afterChange.state.rev);
    expect(afterReset.state.hires['hire_demo_001']).toBeUndefined();
  });

  it('serves the same snapshot over plain GET', async () => {
    const body = (await getState().json()) as Snapshot;
    expect(body).toEqual(getStore().snapshot());
  });
});
