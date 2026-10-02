/**
 * Facts the deck and the research brief share. Every number here is either a product fact
 * (the policy matrix, the catalogue) or a measured test result from this repository, with
 * the command that reproduces it. Nothing here is a market, outcome or customer claim.
 */

export const REVIEWED_ON = '2 October 2026';

/** The 9 x 7 Guard policy matrix (INTEGRATION.md 3.4). */
export const LABELS = [
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
export const DESTINATIONS = [
  'tamm',
  'employer',
  'landlord',
  'bank',
  'school',
  'llm_provider',
  'newcomer',
] as const;

export type Effect =
  | 'allow'
  | 'deny'
  | 'consent'
  | 'derived'
  | 'extraction'
  | 'redacted'
  | 'insurance';

export const MATRIX: Record<(typeof LABELS)[number], Effect[]> = {
  passport: ['allow', 'allow', 'consent', 'consent', 'deny', 'extraction', 'allow'],
  emirates_id: ['allow', 'allow', 'consent', 'consent', 'deny', 'extraction', 'allow'],
  salary: ['allow', 'allow', 'derived', 'consent', 'deny', 'redacted', 'allow'],
  bank_statement: ['deny', 'deny', 'derived', 'consent', 'deny', 'extraction', 'allow'],
  employment: ['allow', 'allow', 'allow', 'allow', 'deny', 'redacted', 'allow'],
  family: ['allow', 'allow', 'consent', 'deny', 'consent', 'redacted', 'allow'],
  address: ['allow', 'allow', 'allow', 'consent', 'consent', 'redacted', 'allow'],
  degree: ['allow', 'allow', 'deny', 'deny', 'deny', 'extraction', 'allow'],
  health: ['insurance', 'deny', 'deny', 'deny', 'deny', 'deny', 'allow'],
};

export type Evidence = {
  value: number;
  unit?: string;
  label: string;
  detail: string;
  command: string;
};

/** Security evidence, measured on main on the review date. */
export const SECURITY_EVIDENCE: Evidence[] = [
  {
    value: 681,
    label: 'Guard tests pass',
    detail: '571 unchanged OpenAPPA engine tests plus 110 Rasikh Guard tests, 0 failures.',
    command: 'cd packages/rasikh-guard && cargo test --workspace',
  },
  {
    value: 63,
    label: 'policy cells, each tested',
    detail: 'Every label and destination pair, on both sides of its condition.',
    command: 'cargo test -p rasikh-guard --test policy_rules',
  },
  {
    value: 25,
    label: 'attack paths denied',
    detail:
      'Indirect leaks: fresh "summary" refs, relabelled documents, laundered redactions, consent reuse.',
    command: 'cargo test -p rasikh-guard --test adversarial',
  },
  {
    value: 0,
    unit: '/ 75',
    label: 'forbidden allows, independent suite',
    detail: '25 attacks over 3 runs by a separate evaluation harness against the live sidecar.',
    command: 'cd packages/rasikh-evals && npm run eval:guard',
  },
  {
    value: 37,
    label: 'refusals with a verified fix',
    detail: 'For every refusable cell, following the remedy through the real store reaches allow.',
    command: 'cargo test -p rasikh-guard --test remedies',
  },
  {
    value: 11,
    label: 'database rules proven on the emulator',
    detail: 'Employers never read health data or bank statements; consents cannot be deleted.',
    command: 'cd packages/rasikh-data && npm run test:rules',
  },
];

export type StatusRow = { part: string; state: 'working' | 'prototype' | 'planned'; note: string };

export const BUILT_TODAY: StatusRow[] = [
  {
    part: 'Rasikh Guard',
    state: 'working',
    note: 'Policy, consent, remedies, OpenAPPA label gate, HTTP sidecar, container image',
  },
  {
    part: 'TAMM MCP server',
    state: 'prototype',
    note: 'Six tools over a mock catalogue; no live government API is connected',
  },
  {
    part: 'Firestore data layer',
    state: 'working',
    note: 'Schema, validating converters, security rules, indexes',
  },
  {
    part: 'Newcomer and employer apps',
    state: 'prototype',
    note: 'Surfaces in progress; this deck does not show live users',
  },
  {
    part: 'UAE PASS sign-in',
    state: 'planned',
    note: 'Simulated in the prototype; a real integration needs approval',
  },
  {
    part: 'Pilot with a Hub71 company',
    state: 'planned',
    note: 'The next conversation, not a signed agreement',
  },
];
