import { nextId } from '../ids';
import type {
  Application,
  Approval,
  Decision,
  Disclosure,
  Grant,
  GuardCheck,
  RiskSummary,
} from '../types';
import { ago } from './time';

/** Illustrative mock data: fictional applicants, estimated figures, written risk reasoning. */

const RENTAL_DISCLOSURE: Disclosure[] = [
  { label: 'employment', derived: false },
  { label: 'passport', derived: false },
  { label: 'salary', derived: true },
];

const BANK_DISCLOSURE: Disclosure[] = [
  { label: 'passport', derived: false },
  { label: 'employment', derived: false },
  { label: 'salary', derived: false },
];

const RISK_MARYAH: RiskSummary = {
  level: 'moderate',
  headline:
    'Moderate risk, mainly because rent is high against income. Employer backing offsets most of it.',
  generatedBy: 'demo',
  points: [
    {
      label: 'Employer backing',
      effect: 'positive',
      reason:
        'Gulf Meridian Technologies has backed this application, which lowers the chance of a missed payment.',
    },
    {
      label: 'Rent against income',
      effect: 'concern',
      reason:
        'Affordability is a yes, but with a narrow margin: the rent is high for the recorded income. Only the yes or no result is shared, not the salary.',
    },
    {
      label: 'Documents',
      effect: 'positive',
      reason:
        'Passport, offer letter and degree were read and cross-checked. Names and dates agree.',
    },
    {
      label: 'Residence visa',
      effect: 'neutral',
      reason: 'The visa is still being processed, so the lease start should follow its issue date.',
    },
    {
      label: 'Cheques',
      effect: 'neutral',
      reason: 'The property accepts two or four cheques. Four would spread the estimated payments.',
    },
  ],
};

const RISK_REEM_APPROVED: RiskSummary = {
  level: 'low',
  headline: 'Low risk. Income comfortably covers the rent and the employer backs the hire.',
  generatedBy: 'demo',
  points: [
    {
      label: 'Employer backing',
      effect: 'positive',
      reason: 'Gulf Meridian Technologies has backed this application.',
    },
    {
      label: 'Rent against income',
      effect: 'positive',
      reason:
        'Affordability is a yes with a comfortable margin. Only the yes or no result is shared, not the salary.',
    },
    {
      label: 'Documents',
      effect: 'positive',
      reason: 'Passport, offer letter and degree were verified and agree with each other.',
    },
  ],
};

const RISK_BANK: RiskSummary = {
  level: 'low',
  headline: 'Low risk. Employment is verified and the Emirates ID application is already in.',
  generatedBy: 'demo',
  points: [
    {
      label: 'Employment',
      effect: 'positive',
      reason: 'The offer letter was verified against the employer record and is signed.',
    },
    {
      label: 'Employer backing',
      effect: 'positive',
      reason: 'The employer backs the hire and is a known partner of the bank.',
    },
    {
      label: 'Emirates ID',
      effect: 'neutral',
      reason: 'The application is submitted but the card is not issued yet.',
    },
    {
      label: 'Banking history',
      effect: 'neutral',
      reason: 'No bank statement was shared, so there is nothing to assess either way.',
    },
  ],
};

interface ApplicationSeed {
  id: string;
  hireId: string;
  kind: Application['kind'];
  partyId: string;
  propertyId?: string;
  state: Application['state'];
  submittedAgo?: number;
  risk?: RiskSummary;
  cheques?: number;
}

const APPLICATION_SEEDS: ApplicationSeed[] = [
  {
    id: 'app_seed_01',
    hireId: 'hire_seed_06',
    kind: 'rental',
    partyId: 'landlord_al_reem',
    propertyId: 'prop_reem_1104',
    state: 'approved',
    submittedAgo: 14,
    risk: RISK_REEM_APPROVED,
    cheques: 2,
  },
  {
    id: 'app_seed_02',
    hireId: 'hire_seed_02',
    kind: 'rental',
    partyId: 'landlord_al_reem',
    propertyId: 'prop_reem_0815',
    state: 'approved',
    submittedAgo: 19,
    risk: RISK_REEM_APPROVED,
    cheques: 4,
  },
  {
    id: 'app_seed_03',
    hireId: 'hire_seed_03',
    kind: 'rental',
    partyId: 'landlord_al_reem',
    propertyId: 'prop_reem_0912',
    state: 'approved',
    submittedAgo: 36,
    cheques: 2,
  },
  {
    id: 'app_seed_04',
    hireId: 'hire_seed_07',
    kind: 'rental',
    partyId: 'landlord_al_reem',
    propertyId: 'prop_reem_1530',
    state: 'approved',
    submittedAgo: 31,
    cheques: 2,
  },
  {
    id: 'app_seed_05',
    hireId: 'hire_seed_05',
    kind: 'rental',
    partyId: 'landlord_al_reem',
    propertyId: 'prop_maryah_1706',
    state: 'under_review',
    submittedAgo: 2,
    risk: RISK_MARYAH,
  },
  {
    id: 'app_seed_06',
    hireId: 'hire_seed_04',
    kind: 'rental',
    partyId: 'landlord_al_reem',
    propertyId: 'prop_maryah_1706',
    state: 'awaiting_approval',
    risk: RISK_REEM_APPROVED,
  },
  {
    id: 'app_seed_07',
    hireId: 'hire_seed_02',
    kind: 'bank_account',
    partyId: 'bank_saadiyat',
    state: 'under_review',
    submittedAgo: 2,
    risk: RISK_BANK,
  },
  {
    id: 'app_seed_08',
    hireId: 'hire_seed_03',
    kind: 'bank_account',
    partyId: 'bank_saadiyat',
    state: 'approved',
    submittedAgo: 30,
  },
  {
    id: 'app_seed_09',
    hireId: 'hire_seed_07',
    kind: 'bank_account',
    partyId: 'bank_saadiyat',
    state: 'approved',
    submittedAgo: 26,
  },
];

export function seedApplications(counters: Record<string, number>) {
  const applications: Application[] = [];
  const decisions: Decision[] = [];

  for (const seed of APPLICATION_SEEDS) {
    applications.push({
      id: seed.id,
      hireId: seed.hireId,
      kind: seed.kind,
      partyId: seed.partyId,
      propertyId: seed.propertyId,
      state: seed.state,
      submittedAt: seed.submittedAgo === undefined ? undefined : ago(seed.submittedAgo),
      disclosed: seed.kind === 'rental' ? RENTAL_DISCLOSURE : BANK_DISCLOSURE,
      employerBacked: true,
      risk: seed.risk,
    });
    if (seed.state === 'approved' && seed.submittedAgo !== undefined) {
      decisions.push({
        id: nextId(counters, 'dec'),
        applicationId: seed.id,
        outcome: 'approved',
        terms: seed.cheques ? { cheques: seed.cheques } : undefined,
        note: seed.kind === 'rental' ? 'Approved on the terms shown.' : 'Account approved.',
        decidedAt: ago(seed.submittedAgo - 1),
        decidedBy: seed.kind === 'rental' ? 'Omar Al Mansoori' : 'Priya Nair',
      });
    }
  }

  const approvals: Approval[] = [
    {
      id: nextId(counters, 'appr'),
      hireId: 'hire_seed_04',
      stepId: 'step_hire_seed_04_housing',
      applicationId: 'app_seed_06',
      title: 'Approve submitting your rental application to Al Reem Residences?',
      detail:
        'Maryah Plaza Residences, unit 1706, two bedrooms, est. AED 135,000 a year. Shared: your employment letter, your passport (already allowed) and an affordability result instead of your salary.',
      destination: 'landlord',
      labels: ['employment', 'passport', 'salary'],
      status: 'pending',
      requestedAt: ago(0, 2),
    },
    {
      id: nextId(counters, 'appr'),
      hireId: 'hire_seed_05',
      stepId: 'step_hire_seed_05_housing',
      applicationId: 'app_seed_05',
      title: 'Approve submitting your rental application to Al Reem Residences?',
      detail: 'Maryah Plaza Residences, unit 1706, est. AED 135,000 a year.',
      destination: 'landlord',
      labels: ['employment', 'passport', 'salary'],
      status: 'approved',
      requestedAt: ago(2, 1),
      decidedAt: ago(2),
    },
  ];

  const grant = (
    hireId: string,
    label: Grant['label'],
    destination: Grant['destination'],
    days: number,
  ): Grant => ({
    id: nextId(counters, 'grant'),
    hireId,
    label,
    destination,
    grantedAt: ago(days),
  });
  const grants: Grant[] = [
    grant('hire_seed_06', 'passport', 'landlord', 14),
    grant('hire_seed_02', 'passport', 'landlord', 19),
    grant('hire_seed_02', 'passport', 'bank', 2),
    grant('hire_seed_02', 'salary', 'bank', 2),
    grant('hire_seed_05', 'passport', 'landlord', 2),
    grant('hire_seed_04', 'passport', 'landlord', 1),
    grant('hire_seed_03', 'passport', 'landlord', 36),
    grant('hire_seed_07', 'passport', 'landlord', 31),
    grant('hire_seed_03', 'passport', 'bank', 30),
    grant('hire_seed_03', 'salary', 'bank', 30),
    grant('hire_seed_07', 'passport', 'bank', 26),
    grant('hire_seed_07', 'salary', 'bank', 26),
  ];

  const check = (partial: Omit<GuardCheck, 'id'>): GuardCheck => ({
    id: nextId(counters, 'chk'),
    ...partial,
  });
  const guardChecks: GuardCheck[] = [
    check({
      caseId: 'hire_seed_05',
      at: ago(2, 3),
      tool: 'share_salary_slip',
      destination: 'landlord',
      decision: 'deny',
      reason: 'Salary details can only be shared with landlords as a yes or no result.',
      policyRule: 'salary.landlord.derived_only',
      blockedLabels: ['salary'],
    }),
    check({
      caseId: 'hire_seed_05',
      at: ago(2, 2),
      tool: 'submit_rental_application',
      destination: 'landlord',
      decision: 'needs_consent',
      reason: 'Your passport has not been shared with landlords yet.',
      policyRule: 'passport.landlord.requires_consent',
      blockedLabels: ['passport'],
    }),
    check({
      caseId: 'hire_seed_05',
      at: ago(2, 1),
      tool: 'submit_rental_application',
      destination: 'landlord',
      decision: 'allow',
      reason:
        'You allowed your passport for landlords, and the rest is an employment letter and a yes or no affordability result.',
      policyRule: 'passport.landlord.consent_granted',
      blockedLabels: [],
    }),
    check({
      caseId: 'hire_seed_02',
      at: ago(2, 1),
      tool: 'submit_account_application',
      destination: 'bank',
      decision: 'allow',
      reason: 'You allowed your passport and salary for banks.',
      policyRule: 'passport.bank.consent_granted',
      blockedLabels: [],
    }),
    check({
      caseId: 'hire_seed_06',
      at: ago(3),
      tool: 'register_tenancy_tawtheeq',
      destination: 'tamm',
      decision: 'allow',
      reason: 'Passport and Emirates ID application can be shared with government services.',
      policyRule: 'passport.tamm.allow',
      blockedLabels: [],
    }),
    check({
      caseId: 'hire_seed_01',
      at: ago(19),
      tool: 'extract_document',
      destination: 'llm_provider',
      decision: 'allow',
      reason: 'Documents may be sent for extraction only. Nothing else leaves with them.',
      policyRule: 'passport.llm_provider.extraction_only',
      blockedLabels: [],
    }),
  ];

  return { applications, decisions, approvals, grants, guardChecks };
}
