/**
 * Closed enums and base types from INTEGRATION.md section 2.
 * Adding a value is a minor contract version bump. Do not extend them here first.
 */

export const CONTRACT_VERSION = '1.1.1';

export const DATA_LABELS = [
  'passport',
  'emirates_id',
  'salary',
  'bank_statement',
  'employment',
  'family',
  'address',
  'degree',
  'health',
] as const;
export type DataLabel = (typeof DATA_LABELS)[number];

export const DESTINATIONS = [
  'tamm',
  'employer',
  'landlord',
  'bank',
  'school',
  'llm_provider',
  'newcomer',
] as const;
export type Destination = (typeof DESTINATIONS)[number];

export const GUARD_DECISIONS = ['allow', 'deny', 'needs_consent'] as const;
export type GuardDecision = (typeof GUARD_DECISIONS)[number];

export const AUDIENCES = ['individual', 'business'] as const;
export type Audience = (typeof AUDIENCES)[number];

export const APPLICATION_STATUSES = [
  'submitted',
  'under_review',
  'needs_info',
  'approved',
  'rejected',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface PayloadRef {
  /** Stable id of the data item, e.g. "doc_passport_hire_demo_001". */
  ref: string;
  /** Every label that applies to this item. */
  labels: DataLabel[];
  /** True if this is a derived signal, e.g. affordability yes/no. */
  derived?: boolean;
}

/** INTEGRATION.md section 6. */
export const ERROR_CODES = [
  'invalid_request',
  'unknown_session',
  'unknown_service',
  'unknown_application',
  'consent_not_found',
  'demo_mode_only',
  'guard_unavailable',
  'internal',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export interface ErrorBody {
  contract_version: string;
  error: {
    /** One of ERROR_CODES. Typed as string because the contract types it as string. */
    code: string;
    /** Plain language, safe to show in logs. */
    message: string;
  };
}
