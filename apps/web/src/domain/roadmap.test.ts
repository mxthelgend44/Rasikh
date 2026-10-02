import { describe, expect, it } from 'vitest';
import { buildSetupSteps } from './expansion';
import { buildRoadmap, unlockSteps } from './roadmap';
import type { Hire, Step, StepKey } from './types';

const BASE_HIRE: Hire = {
  id: 'hire_test',
  employerId: 'emp_test',
  fullName: 'Test Person',
  nationality: 'Indian',
  role: 'Engineer',
  department: 'Platform',
  email: 'test@mail.example',
  originCity: 'Pune',
  originCountry: 'India',
  locale: 'en',
  family: { spouse: false, children: 0 },
  estMonthlySalaryAed: 20_000,
  preferredArea: 'Al Reem Island',
  startDate: '2026-11-01',
  startedAt: '2026-10-01T09:00:00+04:00',
  backing: { status: 'none' },
};

const idOf = (key: StepKey) => `step_${key}`;
const statusOf = (steps: Step[], key: StepKey) => steps.find((step) => step.key === key)?.status;

function withStatus(steps: Step[], changes: Partial<Record<StepKey, Step['status']>>): Step[] {
  return steps.map((step) => ({ ...step, status: changes[step.key] ?? step.status }));
}

describe('buildRoadmap', () => {
  it('starts with documents ready and everything else locked', () => {
    const steps = buildRoadmap(BASE_HIRE, idOf);
    expect(statusOf(steps, 'documents')).toBe('ready');
    expect(statusOf(steps, 'residence_visa')).toBe('locked');
    expect(statusOf(steps, 'housing')).toBe('locked');
  });

  it('leaves out family steps for a hire with no dependants', () => {
    const keys = buildRoadmap(BASE_HIRE, idOf).map((step) => step.key);
    expect(keys).not.toContain('family_sponsorship');
    expect(keys).not.toContain('school');
  });

  it('adds family sponsorship for a spouse and school only for children', () => {
    const spouse = buildRoadmap({ ...BASE_HIRE, family: { spouse: true, children: 0 } }, idOf);
    expect(spouse.map((step) => step.key)).toContain('family_sponsorship');
    expect(spouse.map((step) => step.key)).not.toContain('school');

    const family = buildRoadmap({ ...BASE_HIRE, family: { spouse: true, children: 2 } }, idOf);
    expect(family.map((step) => step.key)).toContain('school');
  });

  it('orders steps with sequential numbers', () => {
    const steps = buildRoadmap({ ...BASE_HIRE, family: { spouse: true, children: 1 } }, idOf);
    expect(steps.map((step) => step.order)).toEqual(steps.map((_, index) => index));
  });

  it('gives every step a plain-language reason', () => {
    for (const step of buildRoadmap(
      { ...BASE_HIRE, family: { spouse: true, children: 1 } },
      idOf,
    )) {
      expect(step.reasoning.length).toBeGreaterThan(20);
    }
  });
});

describe('unlockSteps', () => {
  it('unlocks the visa and housing once documents are done', () => {
    const steps = withStatus(buildRoadmap(BASE_HIRE, idOf), { documents: 'done' });
    const unlocked = unlockSteps(steps);
    expect(statusOf(unlocked, 'residence_visa')).toBe('ready');
    expect(statusOf(unlocked, 'housing')).toBe('ready');
    expect(statusOf(unlocked, 'emirates_id')).toBe('locked');
  });

  it('unlocks the bank account after the Emirates ID is applied for, not issued', () => {
    const waiting = withStatus(buildRoadmap(BASE_HIRE, idOf), {
      documents: 'done',
      residence_visa: 'done',
      emirates_id: 'waiting',
    });
    expect(statusOf(unlockSteps(waiting), 'bank_account')).toBe('ready');

    const notYet = withStatus(buildRoadmap(BASE_HIRE, idOf), {
      documents: 'done',
      residence_visa: 'done',
      emirates_id: 'ready',
    });
    expect(statusOf(unlockSteps(notYet), 'bank_account')).toBe('locked');
  });

  it('keeps tenancy registration locked until both the lease and the visa are done', () => {
    const base = buildRoadmap(BASE_HIRE, idOf);
    const visaOnly = withStatus(base, { documents: 'done', residence_visa: 'done' });
    expect(statusOf(unlockSteps(visaOnly), 'tenancy_registration')).toBe('locked');
    const both = withStatus(base, { documents: 'done', residence_visa: 'done', housing: 'done' });
    expect(statusOf(unlockSteps(both), 'tenancy_registration')).toBe('ready');
  });

  it('makes family sponsorship depend on the registered tenancy', () => {
    const base = buildRoadmap({ ...BASE_HIRE, family: { spouse: true, children: 0 } }, idOf);
    expect(statusOf(unlockSteps(base), 'family_sponsorship')).toBe('locked');
    const registered = withStatus(base, { tenancy_registration: 'done' });
    expect(statusOf(unlockSteps(registered), 'family_sponsorship')).toBe('ready');
  });

  it('never moves a step backwards', () => {
    const steps = withStatus(buildRoadmap(BASE_HIRE, idOf), {
      residence_visa: 'in_progress',
      documents: 'ready',
    });
    expect(statusOf(unlockSteps(steps), 'residence_visa')).toBe('in_progress');
  });
});

describe('buildSetupSteps', () => {
  const ids = (key: string) => `setup_${key}`;

  it('starts with the trade name and locks the rest', () => {
    const steps = buildSetupSteps('company_test', 'mainland', ids);
    expect(steps.find((step) => step.key === 'trade_name')?.status).toBe('ready');
    expect(steps.find((step) => step.key === 'license')?.status).toBe('locked');
    expect(steps.find((step) => step.key === 'visa_quota')?.status).toBe('locked');
  });

  it('maps the licence step to the right TAMM service for each jurisdiction', () => {
    const service = (kind: Parameters<typeof buildSetupSteps>[1]) =>
      buildSetupSteps('c', kind, ids).find((step) => step.key === 'license')?.tammServiceId;
    expect(service('mainland')).toBe('svc_economic_license');
    expect(service('adgm')).toBe('svc_adgm_setup');
    expect(service('masdar')).toBe('svc_masdar_setup');
    expect(service('hub71')).toBeUndefined();
  });

  it('chains the establishment card and visa quota after the licence', () => {
    const steps = buildSetupSteps('c', 'mainland', ids);
    const card = steps.find((step) => step.key === 'establishment_card');
    const quota = steps.find((step) => step.key === 'visa_quota');
    expect(card?.dependsOn).toEqual(['license']);
    expect(quota?.dependsOn).toEqual(['establishment_card']);
  });
});
