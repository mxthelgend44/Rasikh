import type { DocumentKind } from './types';

/** The documents every hire must have verified before the visa and housing steps can start. */
export const REQUIRED_DOCUMENTS: DocumentKind[] = ['passport', 'offer_letter', 'degree'];

/** Names for the agent's English feed text. The app translates its own labels separately. */
export const DOCUMENT_NAMES: Record<DocumentKind, string> = {
  passport: 'passport',
  offer_letter: 'offer letter',
  degree: 'degree certificate',
  residence_visa: 'residence visa',
  emirates_id: 'Emirates ID',
  tenancy_contract: 'tenancy contract',
  salary_certificate: 'salary certificate',
  bank_statement: 'bank statement',
};

export function documentId(kind: DocumentKind, hireId: string): string {
  return `doc_${kind}_${hireId}`;
}
