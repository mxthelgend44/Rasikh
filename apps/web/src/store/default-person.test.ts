import { describe, expect, it } from 'vitest';
import { applyAction } from '@/domain/actions';
import { createSeed } from '@/domain/seed';
import type { AppState } from '@/domain/types';
import { defaultHire } from './default-person';

const NOW = 1_700_000_000_000;
const sorted = (state: AppState) =>
  Object.values(state.hires).sort((a, b) => b.startedAt.localeCompare(a.startedAt));

describe('defaultHire', () => {
  it('cold open shows the person with a decision waiting, not the newest seed hire', () => {
    const state = createSeed(NOW);
    expect(sorted(state)[0]?.id).toBe('hire_seed_08');
    expect(defaultHire(state, sorted(state))?.id).toBe('hire_seed_04');
  });

  it('a hire created during the demo wins over the cold-open choice', () => {
    const state = applyAction(
      createSeed(NOW),
      {
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
      },
      NOW + 1000,
    );
    expect(defaultHire(state, sorted(state))?.fullName).toBe('Priya Menon');
  });

  it('falls back to the newest hire when nobody has a decision waiting', () => {
    const state = createSeed(NOW);
    for (const approval of Object.values(state.approvals)) approval.status = 'approved';
    expect(defaultHire(state, sorted(state))?.id).toBe('hire_seed_08');
  });

  it('returns undefined when there are no hires', () => {
    const state = createSeed(NOW);
    state.hires = {};
    expect(defaultHire(state, [])).toBeUndefined();
  });
});
