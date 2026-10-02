import { describe, expect, it } from 'vitest';
import { demoRentalRisk } from './rental-risk';
import { createSeed } from './seed';

const state = createSeed(1_700_000_000_000);
const property = state.properties['prop_reem_2207']!;
const hire = { ...state.hires['hire_seed_08']! };

describe('demoRentalRisk', () => {
  it('gives a reason for every point', () => {
    const risk = demoRentalRisk(hire, property, 'Gulf Meridian Technologies');
    expect(risk.points.length).toBeGreaterThanOrEqual(3);
    for (const point of risk.points) expect(point.reason.length).toBeGreaterThan(20);
  });

  it('never states a salary, an income ratio or a percentage', () => {
    for (const salary of [9_000, 18_000, 26_000, 60_000]) {
      const risk = demoRentalRisk({ ...hire, estMonthlySalaryAed: salary }, property, 'Employer');
      const text = [risk.headline, ...risk.points.map((point) => point.reason)].join(' ');
      expect(text).not.toMatch(/%|AED|\d{4,}/);
    }
  });

  it('picks the level from affordability', () => {
    expect(demoRentalRisk({ ...hire, estMonthlySalaryAed: 40_000 }, property, 'E').level).toBe(
      'low',
    );
    expect(demoRentalRisk({ ...hire, estMonthlySalaryAed: 18_000 }, property, 'E').level).toBe(
      'moderate',
    );
    expect(demoRentalRisk({ ...hire, estMonthlySalaryAed: 9_000 }, property, 'E').level).toBe(
      'elevated',
    );
  });

  it('only mentions employer backing when the hire is backed', () => {
    const backed = demoRentalRisk({ ...hire, backing: { status: 'backed' } }, property, 'Employer');
    const unbacked = demoRentalRisk({ ...hire, backing: { status: 'none' } }, property, 'Employer');
    expect(backed.points.some((point) => point.label === 'Employer backing')).toBe(true);
    expect(unbacked.points.some((point) => point.label === 'Employer backing')).toBe(false);
    expect(unbacked.headline).not.toMatch(/backs the hire|Employer backing/);
  });

  it('reuses the seeded sentences, so their Arabic translations apply', () => {
    const risk = demoRentalRisk(
      { ...hire, estMonthlySalaryAed: 40_000 },
      property,
      'Gulf Meridian Technologies',
    );
    const seeded = Object.values(state.applications)
      .flatMap((application) => application.risk?.points ?? [])
      .map((point) => point.reason);
    expect(seeded).toContain(risk.points[1]?.reason);
    expect(seeded).toContain(risk.points[2]?.reason);
  });
});
