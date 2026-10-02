import type { DataLabel } from '@rasikh/shared';
import type { DocumentKind, ExtractedField, Hire } from './types';

export interface Extraction {
  labels: DataLabel[];
  fields: ExtractedField[];
  reasoning: string;
  status: 'verified' | 'extracted';
}

/** Deterministic document number, so a re-upload reads the same. */
function documentNumber(id: string, prefix: string): string {
  let hash = 7;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 9_000_000;
  return `${prefix}${String(hash + 1_000_000)}`;
}

/**
 * Demo-mode extraction: a realistic reading of a document, derived from the hire record. In live
 * AI mode the same shape is produced by the model (Session 6). Confidence varies a little per
 * field, as a real reading would.
 */
export function demoExtraction(kind: DocumentKind, hire: Hire, employerName: string): Extraction {
  switch (kind) {
    case 'passport':
      return {
        labels: ['passport'],
        status: 'verified',
        fields: [
          { key: 'name', label: 'Full name', value: hire.fullName, confidence: 0.99 },
          {
            key: 'number',
            label: 'Passport number',
            value: documentNumber(hire.id, 'P'),
            confidence: 0.97,
          },
          { key: 'nationality', label: 'Nationality', value: hire.nationality, confidence: 0.99 },
          { key: 'dob', label: 'Date of birth', value: '1991-03-14', confidence: 0.96 },
          { key: 'expiry', label: 'Expiry date', value: '2031-08-02', confidence: 0.94 },
        ],
        reasoning:
          'The name matches your offer letter, and the passport is valid for well over six months.',
      };
    case 'offer_letter':
      return {
        labels: ['employment', 'salary'],
        status: 'verified',
        fields: [
          { key: 'employer', label: 'Employer', value: employerName, confidence: 0.99 },
          { key: 'role', label: 'Role', value: hire.role, confidence: 0.98 },
          {
            key: 'salary',
            label: 'Salary',
            value: `AED ${hire.estMonthlySalaryAed.toLocaleString('en-US')} a month (est.)`,
            confidence: 0.93,
          },
          { key: 'start', label: 'Start date', value: hire.startDate, confidence: 0.97 },
        ],
        reasoning:
          'The employer and role match what your employer entered in Rasikh, and the letter is signed.',
      };
    case 'degree':
      return {
        labels: ['degree'],
        status: 'verified',
        fields: [
          {
            key: 'institution',
            label: 'Institution',
            value: 'University of ' + hire.originCity,
            confidence: 0.95,
          },
          {
            key: 'qualification',
            label: 'Qualification',
            value: 'Bachelor of Science',
            confidence: 0.94,
          },
          { key: 'year', label: 'Year', value: '2016', confidence: 0.98 },
        ],
        reasoning: 'The degree fits the role, and the name matches your passport.',
      };
    default:
      return {
        labels: [],
        status: 'extracted',
        fields: [{ key: 'name', label: 'Name', value: hire.fullName, confidence: 0.9 }],
        reasoning: 'The agent read this document but has no checks to run on it yet.',
      };
  }
}
