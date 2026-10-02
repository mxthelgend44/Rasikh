import type { Hire, Property, RiskPoint, RiskSummary } from './types';

/** Share of gross income the rent represents. Used to choose a result, never shown or shared. */
function rentShare(hire: Hire, property: Property): number {
  return property.estAnnualRentAed / (hire.estMonthlySalaryAed * 12);
}

const COMFORTABLE =
  'Affordability is a yes with a comfortable margin. Only the yes or no result is shared, not the salary.';
const NARROW =
  'Affordability is a yes, but with a narrow margin: the rent is high for the recorded income. Only the yes or no result is shared, not the salary.';
const SHORT =
  'Affordability is a no: the rent is high for the recorded income. Only the yes or no result is shared, not the salary.';

/**
 * Demo-mode risk summary for a rental draft: plain language, a reason for every point, built only
 * from what the application discloses (employment, passport, and an affordability result). It
 * never states a salary or an income ratio, because the landlord is only allowed a yes or no.
 * These sentences match the seeded ones, so their Arabic translations apply.
 */
export function demoRentalRisk(hire: Hire, property: Property, employerName: string): RiskSummary {
  const share = rentShare(hire, property);
  const level: RiskSummary['level'] =
    share <= 0.35 ? 'low' : share <= 0.5 ? 'moderate' : 'elevated';
  const backed = hire.backing.status === 'backed';

  const points: RiskPoint[] = [];
  if (backed) {
    points.push({
      label: 'Employer backing',
      effect: 'positive',
      reason: `${employerName} has backed this application.`,
    });
  }
  points.push({
    label: 'Rent against income',
    effect: level === 'low' ? 'positive' : 'concern',
    reason: level === 'low' ? COMFORTABLE : level === 'moderate' ? NARROW : SHORT,
  });
  points.push({
    label: 'Documents',
    effect: 'positive',
    reason: 'Passport, offer letter and degree were verified and agree with each other.',
  });

  const headline =
    level === 'low'
      ? backed
        ? 'Low risk. Income comfortably covers the rent and the employer backs the hire.'
        : 'Low risk. Income comfortably covers the rent.'
      : level === 'moderate'
        ? backed
          ? 'Moderate risk, mainly because rent is high against income. Employer backing offsets most of it.'
          : 'Moderate risk, mainly because rent is high against income.'
        : 'Elevated risk: the rent is high for the recorded income.';

  return { level, headline, points, generatedBy: 'demo' };
}
