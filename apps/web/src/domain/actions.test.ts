import { describe, expect, it } from 'vitest';
import { DEMO_FIXTURES } from '@rasikh/shared';
import { applyAction, DomainError, type Action, type NewHire } from './actions';
import { createSeed } from './seed';
import { stepsOf } from './selectors';
import type { AppState, StepKey } from './types';

const REAL_NOW = 1_700_000_000_000;
const seed = () => createSeed(REAL_NOW);
const run = (state: AppState, action: Action) => applyAction(state, action, REAL_NOW + 1000);

const NEW_HIRE: NewHire = {
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
};

function stepOf(state: AppState, hireId: string, key: StepKey) {
  const step = stepsOf(state, hireId).find((candidate) => candidate.key === key);
  if (!step) throw new Error(`No ${key} step for ${hireId}`);
  return step;
}

describe('applyAction contract', () => {
  it('returns a new state, bumps rev and leaves the input untouched', () => {
    const before = seed();
    const snapshot = JSON.stringify(before);
    const after = run(before, { type: 'hire.create', hire: NEW_HIRE });
    expect(after).not.toBe(before);
    expect(after.rev).toBe(before.rev + 1);
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it('stamps new records with the demo clock, not the real one', () => {
    const after = run(seed(), { type: 'hire.create', hire: NEW_HIRE });
    expect(after.hires[DEMO_FIXTURES.hire]?.startedAt).toMatch(/^2026-10-10T09:30:01\+04:00$/);
  });
});

describe('hire.create and backing', () => {
  it('uses the demo fixture id first, then generates ids', () => {
    const first = run(seed(), { type: 'hire.create', hire: NEW_HIRE });
    expect(first.hires[DEMO_FIXTURES.hire]?.fullName).toBe('Priya Menon');
    const second = run(first, {
      type: 'hire.create',
      hire: { ...NEW_HIRE, fullName: 'Second Person' },
    });
    expect(Object.keys(second.hires).filter((id) => id.startsWith('hire_0'))).toHaveLength(1);
  });

  it('builds a roadmap with documents ready and logs why', () => {
    const after = run(seed(), { type: 'hire.create', hire: NEW_HIRE });
    expect(stepOf(after, DEMO_FIXTURES.hire, 'documents').status).toBe('ready');
    expect(stepOf(after, DEMO_FIXTURES.hire, 'bank_account').status).toBe('locked');
    const note = Object.values(after.agentActions).find(
      (entry) => entry.caseId === DEMO_FIXTURES.hire && entry.kind === 'roadmap_generated',
    );
    expect(note?.reasoning).toContain('Emirates ID application');
  });

  it('rejects a duplicate id', () => {
    expect(() => run(seed(), { type: 'hire.create', hire: NEW_HIRE, id: 'hire_seed_01' })).toThrow(
      DomainError,
    );
  });

  it('attaches and removes employer backing', () => {
    const created = run(seed(), { type: 'hire.create', hire: NEW_HIRE });
    expect(created.hires[DEMO_FIXTURES.hire]?.backing.status).toBe('none');
    const backed = run(created, {
      type: 'hire.back',
      hireId: DEMO_FIXTURES.hire,
      backed: true,
      by: 'Layla Haddad',
    });
    expect(backed.hires[DEMO_FIXTURES.hire]?.backing).toMatchObject({
      status: 'backed',
      backedBy: 'Layla Haddad',
    });
    const removed = run(backed, {
      type: 'hire.back',
      hireId: DEMO_FIXTURES.hire,
      backed: false,
      by: 'Layla Haddad',
    });
    expect(removed.hires[DEMO_FIXTURES.hire]?.backing.status).toBe('none');
  });
});

describe('step.set_status cascade', () => {
  it('completing documents opens the visa and housing', () => {
    const created = run(seed(), { type: 'hire.create', hire: NEW_HIRE });
    const documents = stepOf(created, DEMO_FIXTURES.hire, 'documents');
    const after = run(created, { type: 'step.set_status', stepId: documents.id, status: 'done' });
    expect(stepOf(after, DEMO_FIXTURES.hire, 'documents').completedAt).toBeDefined();
    expect(stepOf(after, DEMO_FIXTURES.hire, 'residence_visa').status).toBe('ready');
    expect(stepOf(after, DEMO_FIXTURES.hire, 'housing').status).toBe('ready');
  });

  it('keeps waiting and blocked reasons only for those statuses', () => {
    const state = seed();
    const blocked = stepOf(state, 'hire_seed_01', 'documents');
    expect(blocked.blockedReason).toBeDefined();
    const fixed = run(state, { type: 'step.set_status', stepId: blocked.id, status: 'done' });
    expect(stepOf(fixed, 'hire_seed_01', 'documents').blockedReason).toBeUndefined();
  });

  it('rejects an unknown step', () => {
    expect(() => run(seed(), { type: 'step.set_status', stepId: 'nope', status: 'done' })).toThrow(
      DomainError,
    );
  });
});

describe('approvals and applications', () => {
  it('sends the application when the newcomer approves', () => {
    const state = seed();
    const approval = Object.values(state.approvals).find(
      (a) => a.hireId === 'hire_seed_04' && a.status === 'pending',
    );
    expect(approval).toBeDefined();
    const after = run(state, { type: 'approval.decide', approvalId: approval!.id, approve: true });
    expect(after.applications['app_seed_06']?.state).toBe('submitted');
    expect(after.applications['app_seed_06']?.submittedAt).toBeDefined();
    expect(stepOf(after, 'hire_seed_04', 'housing')).toMatchObject({
      status: 'waiting',
      waitingOn: 'the landlord',
    });
  });

  it('drops the draft when the newcomer declines', () => {
    const state = seed();
    const approval = Object.values(state.approvals).find(
      (a) => a.hireId === 'hire_seed_04' && a.status === 'pending',
    );
    const after = run(state, { type: 'approval.decide', approvalId: approval!.id, approve: false });
    expect(after.applications['app_seed_06']).toBeUndefined();
    expect(stepOf(after, 'hire_seed_04', 'housing').status).toBe('ready');
  });

  it('cannot decide an approval twice', () => {
    const state = seed();
    const approval = Object.values(state.approvals).find((a) => a.status === 'approved');
    expect(() =>
      run(state, { type: 'approval.decide', approvalId: approval!.id, approve: true }),
    ).toThrow(DomainError);
  });

  it('creates a draft application with a pending approval', () => {
    const created = run(seed(), { type: 'hire.create', hire: NEW_HIRE, backed: true });
    const housing = stepOf(created, DEMO_FIXTURES.hire, 'housing');
    const after = run(created, {
      type: 'application.create',
      application: {
        hireId: DEMO_FIXTURES.hire,
        kind: 'rental',
        partyId: 'landlord_al_reem',
        propertyId: 'prop_reem_2207',
        disclosed: [{ label: 'employment', derived: false }],
        employerBacked: true,
      },
      approval: {
        title: 'Approve submitting your rental application to Al Reem Residences?',
        detail: 'Unit 2207',
        stepId: housing.id,
      },
    });
    const draft = Object.values(after.applications).find((a) => a.hireId === DEMO_FIXTURES.hire);
    expect(draft?.state).toBe('awaiting_approval');
    expect(draft?.employerBacked).toBe(true);
    expect(stepOf(after, DEMO_FIXTURES.hire, 'housing').status).toBe('needs_approval');
    expect(
      Object.values(after.approvals).some(
        (a) => a.hireId === DEMO_FIXTURES.hire && a.status === 'pending',
      ),
    ).toBe(true);
  });

  it('a landlord approval completes housing and unlocks tenancy registration', () => {
    const state = seed();
    const after = run(state, {
      type: 'application.decide',
      applicationId: 'app_seed_05',
      outcome: 'approved',
      terms: { cheques: 4 },
      note: 'Approved with four cheques.',
      decidedBy: 'Omar Al Mansoori',
    });
    expect(after.applications['app_seed_05']?.state).toBe('approved');
    expect(stepOf(after, 'hire_seed_05', 'housing').status).toBe('done');
    const feed = Object.values(after.agentActions).find(
      (entry) => entry.caseId === 'hire_seed_05' && entry.kind === 'decision_received',
    );
    expect(feed?.summary).toContain('with 4 cheques');
  });

  it('a request for information blocks the step with the reason', () => {
    const after = run(seed(), {
      type: 'application.decide',
      applicationId: 'app_seed_05',
      outcome: 'info_requested',
      note: 'Please share your latest payslip.',
      decidedBy: 'Omar Al Mansoori',
    });
    expect(after.applications['app_seed_05']?.state).toBe('needs_info');
    expect(stepOf(after, 'hire_seed_05', 'housing').blockedReason).toContain(
      'Please share your latest payslip.',
    );
  });

  it('cannot decide an application that is already decided', () => {
    expect(() =>
      run(seed(), {
        type: 'application.decide',
        applicationId: 'app_seed_01',
        outcome: 'approved',
        note: 'again',
        decidedBy: 'x',
      }),
    ).toThrow(DomainError);
  });
});

describe('grants and guard records', () => {
  it('adds a grant once and removes it', () => {
    const grant: Action = {
      type: 'grant.set',
      hireId: 'hire_seed_01',
      label: 'passport',
      destination: 'landlord',
      granted: true,
    };
    const once = run(seed(), grant);
    const twice = run(once, grant);
    const count = (state: AppState) =>
      Object.values(state.grants).filter(
        (g) => g.hireId === 'hire_seed_01' && g.label === 'passport',
      ).length;
    expect(count(once)).toBe(1);
    expect(count(twice)).toBe(1);
    const removed = run(twice, { ...grant, granted: false } as Action);
    expect(count(removed)).toBe(0);
  });

  it('records a guard check with the demo timestamp', () => {
    const after = run(seed(), {
      type: 'guard.record',
      check: {
        caseId: 'hire_seed_01',
        tool: 'share_salary_slip',
        destination: 'landlord',
        decision: 'deny',
        reason: 'Salary details can only be shared with landlords as a yes or no result.',
        policyRule: 'salary.landlord.derived_only',
        blockedLabels: ['salary'],
      },
    });
    const logged = Object.values(after.guardChecks).find(
      (c) => c.caseId === 'hire_seed_01' && c.decision === 'deny',
    );
    expect(logged?.at).toMatch(/\+04:00$/);
  });
});

describe('company expansion and team move', () => {
  const COMPANY: Action = {
    type: 'company.create',
    company: {
      employerId: 'emp_northwind',
      name: 'Northwind Analytics',
      homeCountry: 'Ireland',
      industry: 'Data analytics',
      activities: ['Analytics software', 'Consulting'],
      teamSize: 3,
      timeline: 'Within three months',
    },
    jurisdiction: 'mainland',
    team: [
      {
        fullName: 'Niamh Byrne',
        nationality: 'Irish',
        role: 'Engineering lead',
        originCity: 'Dublin',
        originCountry: 'Ireland',
        family: { spouse: true, children: 1 },
        estMonthlySalaryAed: 36_000,
      },
      {
        fullName: 'Tariq Anwar',
        nationality: 'British',
        role: 'Data engineer',
        originCity: 'Manchester',
        originCountry: 'United Kingdom',
        family: { spouse: false, children: 0 },
        estMonthlySalaryAed: 27_000,
      },
      {
        fullName: 'Sofia Rossi',
        nationality: 'Italian',
        role: 'Analyst',
        originCity: 'Milan',
        originCountry: 'Italy',
        family: { spouse: false, children: 0 },
        estMonthlySalaryAed: 21_000,
      },
    ],
  };

  function completeUpTo(state: AppState, keys: string[]): AppState {
    let current = state;
    for (const key of keys) {
      const step = Object.values(current.setupSteps).find((s) => s.key === key)!;
      current = run(current, { type: 'setup.set_status', stepId: step.id, status: 'done' });
    }
    return current;
  }

  it('creates the company under the fixture id with a setup roadmap and a team', () => {
    const after = run(seed(), COMPANY);
    expect(after.companies[DEMO_FIXTURES.company]?.name).toBe('Northwind Analytics');
    expect(Object.values(after.setupSteps)).toHaveLength(6);
    expect(Object.values(after.teamMembers)).toHaveLength(3);
    expect(Object.values(after.hires).some((hire) => hire.companyId)).toBe(false);
  });

  it('unlocks setup steps in dependency order', () => {
    const created = run(seed(), COMPANY);
    const afterName = completeUpTo(created, ['trade_name']);
    const status = (key: string) =>
      Object.values(afterName.setupSteps).find((s) => s.key === key)?.status;
    expect(status('license')).toBe('ready');
    expect(status('office_lease')).toBe('ready');
    expect(status('establishment_card')).toBe('locked');
  });

  it('moves the team into the hire pipeline when the visa quota completes', () => {
    const created = run(seed(), COMPANY);
    const done = completeUpTo(created, [
      'trade_name',
      'license',
      'establishment_card',
      'visa_quota',
    ]);
    for (const id of DEMO_FIXTURES.transferredHires) {
      expect(done.hires[id]).toMatchObject({
        companyId: DEMO_FIXTURES.company,
        employerId: 'emp_northwind',
      });
      expect(done.hires[id]?.backing.backedBy).toBe('Northwind Analytics');
      expect(stepsOf(done, id).length).toBeGreaterThan(5);
    }
    const niamh = Object.values(done.hires).find((hire) => hire.fullName === 'Niamh Byrne');
    expect(stepsOf(done, niamh!.id).map((s) => s.key)).toContain('family_sponsorship');
    expect(Object.values(done.teamMembers).every((member) => member.hireId)).toBe(true);
  });

  it('does not move the team twice', () => {
    const created = run(seed(), COMPANY);
    const done = completeUpTo(created, [
      'trade_name',
      'license',
      'establishment_card',
      'visa_quota',
    ]);
    const quota = Object.values(done.setupSteps).find((s) => s.key === 'visa_quota')!;
    const again = run(done, { type: 'setup.set_status', stepId: quota.id, status: 'done' });
    expect(Object.keys(again.hires)).toHaveLength(Object.keys(done.hires).length);
  });
});
