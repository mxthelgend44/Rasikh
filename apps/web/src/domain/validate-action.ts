import { DATA_LABELS, DESTINATIONS, GUARD_DECISIONS } from '@rasikh/shared';
import type { Action } from './actions';
import { DOCUMENT_NAMES } from './documents';
import { DomainError } from './reducers/shared';

export const ACTION_TYPES: readonly Action['type'][] = [
  'hire.create',
  'hire.back',
  'step.set_status',
  'document.add',
  'document.review',
  'agent.log',
  'approval.decide',
  'application.create',
  'application.decide',
  'application.start_review',
  'application.accept_terms',
  'grant.set',
  'guard.record',
  'company.create',
  'setup.set_status',
  'team.add',
  'property.create',
  'property.update',
  'viewing.create',
  'viewing.update',
];

type Validator = (value: unknown, label: string) => void;
type Fields = Record<string, Validator>;

function invalid(label: string): never {
  throw new DomainError(`Invalid ${label}`);
}

const text: Validator = (value, label) => {
  if (typeof value !== 'string' || !value.trim() || value.length > 10_000) invalid(label);
};

const note: Validator = (value, label) => {
  if (typeof value !== 'string' || value.length > 10_000) invalid(label);
};

const identifier: Validator = (value, label) => {
  text(value, label);
  if (
    !/^[a-zA-Z0-9][a-zA-Z0-9_.:-]*$/.test(value as string) ||
    Object.hasOwn(Object.prototype, value as string)
  )
    invalid(label);
};

const boolean: Validator = (value, label) => {
  if (typeof value !== 'boolean') invalid(label);
};

function number(minimum: number, maximum = Number.MAX_SAFE_INTEGER, integer = false): Validator {
  return (value, label) => {
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < minimum ||
      value > maximum ||
      (integer && !Number.isInteger(value))
    )
      invalid(label);
  };
}

function choice(values: readonly string[]): Validator {
  return (value, label) => {
    if (typeof value !== 'string' || !values.includes(value)) invalid(label);
  };
}

function optional(validate: Validator): Validator {
  return (value, label) => {
    if (value !== undefined) validate(value, label);
  };
}

function list(validate: Validator, minimum = 0): Validator {
  return (value, label) => {
    if (!Array.isArray(value) || value.length < minimum || value.length > 1000) invalid(label);
    value.forEach((item, index) => validate(item, `${label}[${index}]`));
  };
}

function shape(fields: Fields): Validator {
  return (value, label) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) invalid(label);
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      if (!Object.hasOwn(fields, key)) invalid(`${label}.${key}`);
    }
    for (const [key, validate] of Object.entries(fields)) validate(record[key], `${label}.${key}`);
  };
}

function patch(fields: Fields): Validator {
  const validate = shape(
    Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, optional(field)])),
  );
  return (value, label) => {
    validate(value, label);
    if (!Object.values(value as Record<string, unknown>).some((field) => field !== undefined))
      invalid(label);
  };
}

const date: Validator = (value, label) => {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    invalid(label);
};

const timestamp: Validator = (value, label) => {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) ||
    !Number.isFinite(Date.parse(value))
  )
    invalid(label);
  date((value as string).slice(0, 10), label);
};

const status = choice([
  'locked',
  'ready',
  'in_progress',
  'waiting',
  'needs_approval',
  'blocked',
  'done',
]);
const jurisdiction = choice(['mainland', 'adgm', 'kezad', 'masdar', 'twofour54', 'hub71']);
const area = choice([
  'Al Reem Island',
  'Al Raha Beach',
  'Khalifa City',
  'Mohammed Bin Zayed City',
  'Saadiyat Island',
  'Yas Island',
  'Al Maryah Island',
]);
const family = shape({ spouse: boolean, children: number(0, 100, true) });
const extractedFields = list(
  shape({
    key: text,
    label: text,
    value: note,
    confidence: (value, label) => {
      if (value !== null) number(0, 1)(value, label);
    },
  }),
);
const memberFields: Fields = {
  fullName: text,
  nationality: text,
  role: text,
  originCity: text,
  originCountry: text,
  family,
  estMonthlySalaryAed: number(0),
};
const propertyFields: Fields = {
  name: text,
  area,
  unit: text,
  bedrooms: number(0, 100, true),
  leaseRef: identifier,
  estAnnualRentAed: number(0),
  chequeOptions: list(number(1, 12, true), 1),
};
const viewingFields: Fields = {
  startsAt: timestamp,
  durationMinutes: number(5, 480, true),
  note,
};
const risk = shape({
  level: choice(['low', 'moderate', 'elevated']),
  headline: text,
  generatedBy: choice(['ai', 'demo']),
  points: list(
    shape({ label: text, effect: choice(['positive', 'neutral', 'concern']), reason: text }),
    1,
  ),
});
const recommendation = shape({
  generatedBy: choice(['ai', 'demo']),
  recommended: jurisdiction,
  disclaimer: text,
  options: list(
    shape({
      kind: jurisdiction,
      label: text,
      fit: choice(['strong', 'possible', 'weak']),
      reasons: list(text, 1),
      tradeoffs: list(text),
    }),
    1,
  ),
});

const schemas: Record<Action['type'], Fields> = {
  'hire.create': {
    id: optional(identifier),
    backed: optional(boolean),
    hire: shape({
      ...memberFields,
      family: optional(family),
      employerId: identifier,
      companyId: optional(identifier),
      department: text,
      email: (value, label) => {
        text(value, label);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value as string)) invalid(label);
      },
      locale: optional(choice(['en', 'ar'])),
      preferredArea: area,
      startDate: date,
    }),
  },
  'hire.back': { hireId: identifier, employerId: optional(identifier), backed: boolean, by: text },
  'step.set_status': {
    stepId: identifier,
    status,
    waitingOn: optional(text),
    blockedReason: optional(text),
    employerId: optional(identifier),
  },
  'document.add': {
    hireId: identifier,
    kind: choice(Object.keys(DOCUMENT_NAMES)),
    fileName: text,
    labels: list(choice(DATA_LABELS), 1),
    fields: extractedFields,
    reasoning: text,
    status: optional(choice(['uploaded', 'extracted', 'verified', 'rejected'])),
    source: optional(choice(['demo', 'vertex'])),
  },
  'document.review': {
    hireId: identifier,
    documentId: identifier,
    fields: optional(extractedFields),
    accept: boolean,
    expectedVersion: optional(number(1, Number.MAX_SAFE_INTEGER, true)),
  },
  'agent.log': {
    entry: shape({
      caseId: identifier,
      caseType: choice(['hire', 'company']),
      kind: choice([
        'roadmap_generated',
        'document_extracted',
        'document_requested',
        'approval_requested',
        'application_submitted',
        'tamm_application',
        'decision_received',
        'employer_notified',
        'step_updated',
        'guard_blocked',
      ]),
      summary: text,
      reasoning: text,
      status: choice(['done', 'waiting', 'needs_approval', 'blocked']),
      stepId: optional(identifier),
      tool: optional(text),
      approvalId: optional(identifier),
      applicationId: optional(identifier),
      documentId: optional(identifier),
    }),
  },
  'approval.decide': { approvalId: identifier, hireId: optional(identifier), approve: boolean },
  'application.create': {
    application: shape({
      hireId: identifier,
      kind: choice(['rental', 'bank_account']),
      partyId: identifier,
      propertyId: optional(identifier),
      submittedAt: optional(timestamp),
      employerBacked: boolean,
      disclosed: list(shape({ label: choice(DATA_LABELS), derived: boolean })),
      risk: optional(risk),
    }),
    approval: shape({ title: text, detail: text, stepId: identifier }),
  },
  'application.decide': {
    applicationId: identifier,
    outcome: choice(['approved', 'info_requested', 'terms_offered', 'declined']),
    terms: optional(shape({ cheques: optional(number(1, 12, true)), note: optional(text) })),
    note: text,
    decidedBy: text,
    partyId: optional(identifier),
  },
  'application.start_review': { applicationId: identifier, partyId: identifier },
  'application.accept_terms': { applicationId: identifier, hireId: identifier },
  'grant.set': {
    hireId: identifier,
    label: choice(DATA_LABELS),
    destination: choice(DESTINATIONS),
    granted: boolean,
  },
  'guard.record': {
    check: shape({
      caseId: identifier,
      tool: text,
      destination: choice(DESTINATIONS),
      decision: choice(GUARD_DECISIONS),
      reason: text,
      policyRule: text,
      blockedLabels: list(choice(DATA_LABELS)),
    }),
  },
  'company.create': {
    id: optional(identifier),
    jurisdiction,
    recommendation: optional(recommendation),
    company: shape({
      employerId: identifier,
      name: text,
      homeCountry: text,
      industry: text,
      activities: list(text, 1),
      teamSize: number(0, 1000, true),
      timeline: text,
    }),
    team: list(shape(memberFields)),
  },
  'setup.set_status': { stepId: identifier, status, employerId: optional(identifier) },
  'team.add': { companyId: identifier, employerId: identifier, member: shape(memberFields) },
  'property.create': {
    landlordId: identifier,
    property: shape(propertyFields),
    id: optional(identifier),
  },
  'property.update': {
    landlordId: identifier,
    propertyId: identifier,
    patch: patch(propertyFields),
  },
  'viewing.create': {
    landlordId: identifier,
    viewing: shape({
      ...viewingFields,
      propertyId: identifier,
      applicationId: optional(identifier),
    }),
  },
  'viewing.update': {
    landlordId: identifier,
    viewingId: identifier,
    patch: patch({ ...viewingFields, status: choice(['planned', 'completed', 'cancelled']) }),
  },
};

export function validateAction(action: unknown): asserts action is Action {
  if (typeof action !== 'object' || action === null || Array.isArray(action)) invalid('action');
  const type = (action as { type?: unknown }).type;
  if (typeof type !== 'string' || !ACTION_TYPES.includes(type as Action['type']))
    invalid('action type');
  shape({ type: choice([type as string]), ...schemas[type as Action['type']] })(action, 'action');
}
