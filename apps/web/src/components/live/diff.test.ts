import { describe, expect, it } from 'vitest';
import { applyAction } from '@/domain/actions';
import { createSeed } from '@/domain/seed';
import type { AppState } from '@/domain/types';
import type { Snapshot } from '@/store/snapshot';
import {
  audienceEvents,
  audienceOf,
  diffStates,
  foldEvents,
  isReset,
  isRelevant,
  pushToast,
  resetEvent,
  routeFor,
  surfaceOf,
  ToastGate,
  type LiveEvent,
} from './diff';

const NOW = Date.parse('2026-10-10T09:00:00+04:00');
const seed = (): AppState => createSeed(NOW);
const snap = (state: AppState, epoch = 'a'): Snapshot => ({ epoch, state });

function pendingApproval(state: AppState) {
  const approval = Object.values(state.approvals).find((item) => item.status === 'pending');
  if (!approval?.applicationId) throw new Error('seed has no pending rental approval');
  return approval;
}

const event = (overrides: Partial<LiveEvent> = {}): LiveEvent => ({
  key: 'k',
  kind: 'agent',
  who: 'Anders',
  text: 'Did a thing',
  tone: 'success',
  ...overrides,
});

describe('diffStates', () => {
  it('reports nothing for the same state or an identical copy', () => {
    const state = seed();
    expect(diffStates(state, state)).toEqual([]);
    expect(diffStates(state, structuredClone(state))).toEqual([]);
  });

  it('tells one story for an approval: the feed entry, not the application, approval and step too', () => {
    const before = seed();
    const approval = pendingApproval(before);
    const after = applyAction(
      before,
      {
        type: 'approval.decide',
        approvalId: approval.id,
        hireId: approval.hireId,
        approve: true,
      },
      NOW + 1000,
    );
    const events = diffStates(before, after);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      kind: 'agent',
      hireId: approval.hireId,
      applicationId: approval.applicationId,
      applicationKind: 'rental',
      tone: 'info',
    });
    expect(events[0]?.who).toBe(after.hires[approval.hireId]?.fullName.split(' ')[0]);
    expect(events[0]?.text).toContain('Recorded the demo application');
  });

  it('reports a landlord decision with a success tone and the landlord application route', () => {
    let state = seed();
    const approval = pendingApproval(state);
    state = applyAction(
      state,
      {
        type: 'approval.decide',
        approvalId: approval.id,
        hireId: approval.hireId,
        approve: true,
      },
      NOW + 1000,
    );
    const application = state.applications[approval.applicationId ?? ''];
    if (!application) throw new Error('missing application');
    const after = applyAction(
      state,
      {
        type: 'application.decide',
        applicationId: application.id,
        outcome: 'approved',
        note: 'Looks good.',
        decidedBy: 'Landlord',
      },
      NOW + 2000,
    );
    const events = diffStates(state, after);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ kind: 'agent', tone: 'success' });
    expect(routeFor(events[0]!, 'dashboard')).toBe(`/landlord/applications/${application.id}`);
  });

  it('falls back to application, approval and step events for a hire with no feed entry', () => {
    const before = seed();
    const after = structuredClone(before);
    const application = Object.values(after.applications)[0]!;
    application.state = application.state === 'approved' ? 'declined' : 'approved';
    const events = diffStates(before, after);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      kind: 'application',
      applicationId: application.id,
      hireId: application.hireId,
    });
    expect(events[0]?.text).toMatch(/application: (approved|declined)$/);
  });

  it('raises one event per hire from application, approval and step, application first', () => {
    const before = seed();
    const after = structuredClone(before);
    const approval = pendingApproval(after);
    const application = after.applications[approval.applicationId ?? '']!;
    application.state = 'submitted';
    approval.status = 'approved';
    const step = after.steps[approval.stepId]!;
    step.status = 'waiting';
    const events = diffStates(before, after);
    const forHire = events.filter((item) => item.hireId === approval.hireId);
    expect(forHire).toHaveLength(1);
    expect(forHire[0]?.kind).toBe('application');
  });

  it('reports a new pending approval and a step change made without a feed entry', () => {
    const before = seed();
    const after = structuredClone(before);
    const step = Object.values(after.steps).find(
      (item) => item.status === 'ready' || item.status === 'in_progress',
    )!;
    step.status = 'done';
    const events = diffStates(before, after);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      kind: 'step',
      tone: 'success',
      hireId: step.hireId,
    });
    expect(events[0]?.text).toBe(`${step.title}: done`);
  });

  it('does not raise a toast for steps that only unlock', () => {
    const before = seed();
    const after = structuredClone(before);
    const step = Object.values(after.steps).find((item) => item.status === 'locked')!;
    step.status = 'ready';
    expect(diffStates(before, after)).toEqual([]);
  });

  it('names a company for company feed entries', () => {
    const before = seed();
    const company = Object.values(before.companies)[0]!;
    const after = applyAction(
      before,
      {
        type: 'agent.log',
        entry: {
          caseId: company.id,
          caseType: 'company',
          kind: 'step_updated',
          summary: 'Trade name reserved',
          reasoning: 'Demo.',
          status: 'done',
        },
      },
      NOW + 1000,
    );
    const events = diffStates(before, after);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      who: company.name,
      companyId: company.id,
      tone: 'success',
    });
    expect(events[0]?.hireId).toBeUndefined();
    expect(routeFor(events[0]!, 'dashboard')).toBe('/employer/expansion');
  });
});

describe('isReset', () => {
  it('detects a reset by the clock, a new epoch, or a lower revision', () => {
    const state = seed();
    const reset = {
      ...seed(),
      rev: state.rev + 1,
      clock: { ...state.clock, resetAtMs: NOW + 5000 },
    };
    expect(isReset(snap(state), snap(reset))).toBe(true);
    expect(isReset(snap(state, 'a'), snap({ ...state, rev: state.rev + 1 }, 'b'))).toBe(true);
    expect(isReset(snap({ ...state, rev: 5 }), snap({ ...state, rev: 2 }))).toBe(true);
  });

  it('is false for an ordinary step forward', () => {
    const state = seed();
    expect(isReset(snap(state), snap({ ...state, rev: state.rev + 1 }))).toBe(false);
  });

  it('gives the reset toast a key that differs per reset', () => {
    const state = seed();
    const first = resetEvent(snap(state));
    const second = resetEvent(snap({ ...state, clock: { ...state.clock, resetAtMs: NOW + 1 } }));
    expect(first.kind).toBe('reset');
    expect(first.key).not.toBe(second.key);
  });
});

describe('foldEvents', () => {
  const many = (count: number) =>
    Array.from({ length: count }, (_, index) => event({ key: `k${index}`, text: `Text ${index}` }));

  it('leaves a short list alone', () => {
    expect(foldEvents(many(3))).toHaveLength(3);
  });

  it('keeps the first two and counts the rest', () => {
    const folded = foldEvents(many(7));
    expect(folded).toHaveLength(3);
    expect(folded.slice(0, 2).map((item) => item.key)).toEqual(['k0', 'k1']);
    expect(folded[2]).toMatchObject({ kind: 'overflow', count: 5 });
  });
});

describe('relevance and routes', () => {
  it('shows only the viewed person on the newcomer surface, everything on dashboards', () => {
    const mine = event({ hireId: 'hire_seed_04' });
    const theirs = event({ hireId: 'hire_seed_01' });
    expect(isRelevant(mine, 'newcomer', 'hire_seed_04')).toBe(true);
    expect(isRelevant(theirs, 'newcomer', 'hire_seed_04')).toBe(false);
    expect(
      isRelevant(event({ companyId: 'c', hireId: undefined }), 'newcomer', 'hire_seed_04'),
    ).toBe(false);
    expect(isRelevant(theirs, 'dashboard', 'hire_seed_04')).toBe(true);
    expect(isRelevant(theirs, 'newcomer', undefined)).toBe(false);
    expect(isRelevant(resetEvent(snap(seed())), 'newcomer', 'hire_seed_04')).toBe(true);
  });

  it('tells the surfaces apart by path', () => {
    expect(surfaceOf('/newcomer')).toBe('newcomer');
    expect(surfaceOf('/newcomer/agent')).toBe('newcomer');
    expect(surfaceOf('/newcomerish')).toBe('dashboard');
    expect(surfaceOf('/landlord/applications')).toBe('dashboard');
  });

  it('routes to the page that shows the change', () => {
    expect(
      routeFor(event({ applicationId: 'app_1', applicationKind: 'bank_account' }), 'dashboard'),
    ).toBe('/bank/applications/app_1');
    expect(routeFor(event({ hireId: 'hire_seed_04' }), 'dashboard')).toBe(
      '/employer/hires/hire_seed_04',
    );
    expect(routeFor(event({ kind: 'agent' }), 'newcomer')).toBe('/newcomer/agent');
    expect(routeFor(event({ kind: 'step' }), 'newcomer')).toBe('/newcomer');
    expect(routeFor(event({ kind: 'reset' }), 'dashboard')).toBeUndefined();
    expect(routeFor(event({ kind: 'overflow' }), 'dashboard')).toBeUndefined();
    expect(routeFor(event(), 'dashboard')).toBeUndefined();
  });
});

describe('ToastGate', () => {
  it('drops a repeat of the same change and the same words about the same person', () => {
    const gate = new ToastGate();
    expect(gate.accept(event({ key: 'a' }), 0)).toBe(true);
    expect(gate.accept(event({ key: 'a' }), 1000)).toBe(false);
    expect(gate.accept(event({ key: 'b' }), 1000)).toBe(false);
    expect(gate.accept(event({ key: 'c', text: 'Something else' }), 1000)).toBe(true);
  });

  it('lets the same change through again once the dedupe window has passed', () => {
    const gate = new ToastGate({ dedupeMs: 5000, windowMs: 10_000, limit: 8 });
    expect(gate.accept(event({ key: 'a' }), 0)).toBe(true);
    expect(gate.accept(event({ key: 'a' }), 6000)).toBe(true);
  });

  it('caps the rate and recovers when the window slides', () => {
    const gate = new ToastGate({
      dedupeMs: 60_000,
      windowMs: 10_000,
      limit: 3,
    });
    const at = (index: number, nowMs: number) =>
      gate.accept(event({ key: `k${index}`, text: `Text ${index}` }), nowMs);
    expect([at(0, 0), at(1, 100), at(2, 200), at(3, 300)]).toEqual([true, true, true, false]);
    expect(at(4, 10_500)).toBe(true);
  });

  it('always lets a reset through and starts clean after clear()', () => {
    const gate = new ToastGate({
      dedupeMs: 60_000,
      windowMs: 10_000,
      limit: 1,
    });
    expect(gate.accept(event({ key: 'a' }), 0)).toBe(true);
    expect(gate.accept(event({ key: 'b', text: 'More' }), 1)).toBe(false);
    expect(gate.accept(resetEvent(snap(seed())), 2)).toBe(true);
    gate.clear();
    expect(gate.accept(event({ key: 'a' }), 3)).toBe(true);
  });
});

describe('pushToast', () => {
  const item = (key: string) => ({ id: `t-${key}`, event: event({ key }) });

  it('keeps the newest three', () => {
    let list = [] as ReturnType<typeof item>[];
    for (const key of ['a', 'b', 'c', 'd']) list = pushToast(list, item(key));
    expect(list.map((entry) => entry.event.key)).toEqual(['b', 'c', 'd']);
  });

  it('replaces a toast for the same change instead of stacking a copy', () => {
    const list = pushToast(pushToast([], item('a')), item('a'));
    expect(list).toHaveLength(1);
  });
});

describe('audienceEvents: a toast is a disclosure', () => {
  const approve = () => {
    const before = seed();
    const approval = pendingApproval(before);
    const after = applyAction(
      before,
      {
        type: 'approval.decide',
        approvalId: approval.id,
        hireId: approval.hireId,
        approve: true,
      },
      NOW + 1000,
    );
    return { before, after, approval };
  };

  it('maps a path to its audience', () => {
    expect(audienceOf('/newcomer/agent')).toBe('newcomer');
    expect(audienceOf('/employer/hires/hire_seed_04')).toBe('employer');
    expect(audienceOf('/landlord')).toBe('landlord');
    expect(audienceOf('/bank/applications/x')).toBe('bank');
    expect(audienceOf('/')).toBe('presenter');
    expect(audienceOf('/design-system/state')).toBe('presenter');
    expect(audienceOf('/landlordish')).toBe('presenter');
  });

  it('tells the landlord only that an application reached them, with no agent or approval detail', () => {
    const { before, after, approval } = approve();
    const events = audienceEvents(before, after, 'landlord', undefined);
    expect(events).toHaveLength(1);
    expect(events[0]?.kind).toBe('application');
    expect(events[0]?.applicationId).toBe(approval.applicationId);
    expect(events[0]?.text).toMatch(/^Rental application: submitted$/);
  });

  it('tells the landlord and the bank nothing about a draft', () => {
    const before = seed();
    const draft = Object.values(before.applications).find(
      (application) => application.state === 'awaiting_approval',
    );
    expect(draft).toBeDefined();
    const after = structuredClone(before);
    for (const application of Object.values(after.applications))
      if (application.id === draft?.id) application.state = 'awaiting_approval';
    expect(audienceEvents(before, after, 'landlord', undefined)).toEqual([]);
    expect(audienceEvents(before, after, 'bank', undefined)).toEqual([]);
  });

  it('does not tell the bank about a rental application', () => {
    const { before, after } = approve();
    expect(audienceEvents(before, after, 'bank', undefined)).toEqual([]);
  });

  it("gives the employer a bare 'journey updated', never the agent's words or an approval", () => {
    const { before, after } = approve();
    const events = audienceEvents(before, after, 'employer', undefined);
    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(['agent', 'step']).toContain(event.kind);
      if (event.kind === 'agent') {
        expect(event.text).toBe('Journey updated');
        expect(event.applicationId).toBeUndefined();
      }
    }
    const spoken = events.map((event) => event.text).join(' ');
    expect(spoken).not.toMatch(/approv|consent|passport|salary|Al Reem|landlord/i);
  });

  it('keeps the phone to its own person', () => {
    const { before, after, approval } = approve();
    expect(audienceEvents(before, after, 'newcomer', approval.hireId).length).toBeGreaterThan(0);
    expect(audienceEvents(before, after, 'newcomer', 'hire_seed_01')).toEqual([]);
    expect(audienceEvents(before, after, 'newcomer', undefined)).toEqual([]);
  });

  it('tells the hub and presenter tools nothing', () => {
    const { before, after } = approve();
    expect(audienceEvents(before, after, 'presenter', undefined)).toEqual([]);
  });
});
