import type { DataLabel, Destination } from '@rasikh/shared';

export type PolicyCell =
  | 'allow'
  | 'deny'
  | 'consent'
  | 'derived_only'
  | 'extraction_only'
  | 'redacted'
  | 'insurance_only';

const A: PolicyCell = 'allow';
const D: PolicyCell = 'deny';
const C: PolicyCell = 'consent';

/**
 * Mirror of the default policy in INTEGRATION.md section 3.4, so the trust passport can show the
 * matrix. Guard is the authority and makes the actual decision; these are product defaults for
 * the demo, not legal statements.
 *
 * Columns: tamm, employer, landlord, bank, school, llm_provider, newcomer.
 */
const ROWS: Record<DataLabel, PolicyCell[]> = {
  passport: [A, A, C, C, D, 'extraction_only', A],
  emirates_id: [A, A, C, C, D, 'extraction_only', A],
  salary: [A, A, 'derived_only', C, D, 'redacted', A],
  bank_statement: [D, D, 'derived_only', C, D, 'extraction_only', A],
  employment: [A, A, A, A, D, 'redacted', A],
  family: [A, A, C, D, C, 'redacted', A],
  address: [A, A, A, C, C, 'redacted', A],
  degree: [A, A, D, D, D, 'extraction_only', A],
  health: ['insurance_only', D, D, D, D, D, A],
};

const COLUMNS: Destination[] = [
  'tamm',
  'employer',
  'landlord',
  'bank',
  'school',
  'llm_provider',
  'newcomer',
];

export function policyFor(label: DataLabel, destination: Destination): PolicyCell {
  const index = COLUMNS.indexOf(destination);
  return ROWS[label][index] ?? 'deny';
}

/** Destinations the newcomer sees in the trust passport, in display order. */
export const PASSPORT_DESTINATIONS: Destination[] = [
  'landlord',
  'bank',
  'employer',
  'school',
  'tamm',
];

export const PASSPORT_LABELS: DataLabel[] = [
  'passport',
  'emirates_id',
  'employment',
  'salary',
  'address',
  'family',
  'degree',
  'bank_statement',
  'health',
];
