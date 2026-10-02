import { nextId } from '../ids';
import { buildRoadmap, roadmapNarrative } from '../roadmap';
import { slugify } from '../text';
import type { AbuDhabiArea, AgentAction, Family, Hire, RelocationDocument, Step } from '../types';
import { ago, ANCHOR_MS, DAY_MS } from './time';
import { applyProfile, type Profile } from './profiles';

/** Illustrative mock data: fictional people, estimated salaries. */

interface Degree {
  institution: string;
  qualification: string;
  year: number;
}

interface HireSpec {
  id: string;
  fullName: string;
  nationality: string;
  role: string;
  department: string;
  originCity: string;
  originCountry: string;
  family: Family;
  estMonthlySalaryAed: number;
  preferredArea: AbuDhabiArea;
  /** Days from the anchor until the start date. Negative means already started. */
  startInDays: number;
  /** Days before the anchor that the relocation started in Rasikh. */
  startedAgo: number;
  /** For settled hires: days before the anchor that the last step completed. */
  settledAgo?: number;
  profile: Profile;
  degree: Degree;
}

const SOLO: Family = { spouse: false, children: 0 };

export const HIRE_SPECS: HireSpec[] = [
  {
    id: 'hire_seed_01',
    fullName: 'Samuel Okoye',
    nationality: 'Nigerian',
    role: 'QA engineer',
    department: 'Platform',
    originCity: 'Lagos',
    originCountry: 'Nigeria',
    family: SOLO,
    estMonthlySalaryAed: 17_000,
    preferredArea: 'Khalifa City',
    startInDays: 14,
    startedAgo: 21,
    profile: 'blocked_docs',
    degree: {
      institution: 'University of Lagos',
      qualification: 'BSc Computer Science',
      year: 2018,
    },
  },
  {
    id: 'hire_seed_02',
    fullName: 'Mei Lin Tan',
    nationality: 'Singaporean',
    role: 'Data scientist',
    department: 'Analytics',
    originCity: 'Singapore',
    originCountry: 'Singapore',
    family: SOLO,
    estMonthlySalaryAed: 31_000,
    preferredArea: 'Al Reem Island',
    startInDays: -6,
    startedAgo: 24,
    profile: 'banking',
    degree: {
      institution: 'Nanyang Technological University',
      qualification: 'MSc Data Science',
      year: 2020,
    },
  },
  {
    id: 'hire_seed_03',
    fullName: 'Carlos Mendes',
    nationality: 'Brazilian',
    role: 'Cloud engineer',
    department: 'Platform',
    originCity: 'São Paulo',
    originCountry: 'Brazil',
    family: SOLO,
    estMonthlySalaryAed: 28_000,
    preferredArea: 'Al Reem Island',
    startInDays: -34,
    startedAgo: 41,
    settledAgo: 3,
    profile: 'settled',
    degree: {
      institution: 'University of São Paulo',
      qualification: 'BEng Computer Engineering',
      year: 2016,
    },
  },
  {
    id: 'hire_seed_04',
    fullName: 'Anders Lindqvist',
    nationality: 'Swedish',
    role: 'Solutions architect',
    department: 'Customer engineering',
    originCity: 'Stockholm',
    originCountry: 'Sweden',
    family: { spouse: true, children: 2 },
    estMonthlySalaryAed: 38_000,
    preferredArea: 'Al Maryah Island',
    startInDays: 9,
    startedAgo: 12,
    profile: 'housing_approval',
    degree: {
      institution: 'KTH Royal Institute of Technology',
      qualification: 'MSc Computer Science',
      year: 2010,
    },
  },
  {
    id: 'hire_seed_05',
    fullName: 'Olga Petrova',
    nationality: 'Georgian',
    role: 'Product designer',
    department: 'Design',
    originCity: 'Tbilisi',
    originCountry: 'Georgia',
    family: SOLO,
    estMonthlySalaryAed: 24_000,
    preferredArea: 'Al Maryah Island',
    startInDays: 12,
    startedAgo: 9,
    profile: 'visa_wait_renting',
    degree: {
      institution: 'Tbilisi State Academy of Arts',
      qualification: 'BA Visual Communication',
      year: 2017,
    },
  },
  {
    id: 'hire_seed_06',
    fullName: 'Rahul Deshmukh',
    nationality: 'Indian',
    role: 'DevOps engineer',
    department: 'Platform',
    originCity: 'Pune',
    originCountry: 'India',
    family: SOLO,
    estMonthlySalaryAed: 22_000,
    preferredArea: 'Al Reem Island',
    startInDays: -10,
    startedAgo: 17,
    profile: 'tenancy_wait',
    degree: {
      institution: 'College of Engineering Pune',
      qualification: 'BTech Information Technology',
      year: 2017,
    },
  },
  {
    id: 'hire_seed_07',
    fullName: 'Amira Hassan',
    nationality: 'Egyptian',
    role: 'Finance analyst',
    department: 'Finance',
    originCity: 'Cairo',
    originCountry: 'Egypt',
    family: SOLO,
    estMonthlySalaryAed: 19_000,
    preferredArea: 'Al Reem Island',
    startInDays: -30,
    startedAgo: 36,
    settledAgo: 5,
    profile: 'settled',
    degree: {
      institution: 'American University in Cairo',
      qualification: 'BBA Accounting',
      year: 2019,
    },
  },
  {
    id: 'hire_seed_08',
    fullName: 'Tomasz Kowalski',
    nationality: 'Polish',
    role: 'Backend engineer',
    department: 'Platform',
    originCity: 'Kraków',
    originCountry: 'Poland',
    family: SOLO,
    estMonthlySalaryAed: 23_000,
    preferredArea: 'Yas Island',
    startInDays: 21,
    startedAgo: 2,
    profile: 'new',
    degree: {
      institution: 'AGH University of Krakow',
      qualification: 'MSc Computer Science',
      year: 2019,
    },
  },
  {
    id: 'hire_seed_09',
    fullName: 'Lerato Dlamini',
    nationality: 'South African',
    role: 'Graduate analyst',
    department: 'Analytics',
    originCity: 'Johannesburg',
    originCountry: 'South Africa',
    family: SOLO,
    estMonthlySalaryAed: 11_000,
    preferredArea: 'Al Raha Beach',
    startInDays: 16,
    startedAgo: 6,
    profile: 'visa_wait',
    degree: {
      institution: 'University of the Witwatersrand',
      qualification: 'BCom Information Systems',
      year: 2025,
    },
  },
];

/** Deterministic pseudo document number so seeded documents are stable across resets. */
function documentNumber(id: string, prefix: string): string {
  let hash = 7;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 9_000_000;
  return `${prefix}${String(hash + 1_000_000)}`;
}

function dateOnly(ms: number): string {
  return new Date(ms + 4 * 3_600_000).toISOString().slice(0, 10);
}

export function hireFromSpec(spec: HireSpec): Hire {
  return {
    id: spec.id,
    employerId: 'emp_gulf_meridian',
    fullName: spec.fullName,
    nationality: spec.nationality,
    role: spec.role,
    department: spec.department,
    email: `${slugify(spec.fullName)}@mail.example`,
    originCity: spec.originCity,
    originCountry: spec.originCountry,
    locale: 'en',
    family: spec.family,
    estMonthlySalaryAed: spec.estMonthlySalaryAed,
    preferredArea: spec.preferredArea,
    startDate: dateOnly(ANCHOR_MS + spec.startInDays * DAY_MS),
    startedAt: ago(spec.startedAgo),
    backing: { status: 'backed', backedAt: ago(spec.startedAgo), backedBy: 'Layla Haddad' },
  };
}

export function stepsForSpec(spec: HireSpec, hire: Hire): Step[] {
  const roadmap = buildRoadmap(hire, (key) => `step_${hire.id}_${key}`);
  const startedMs = ANCHOR_MS - spec.startedAgo * DAY_MS;
  const finishMs = ANCHOR_MS - (spec.settledAgo ?? 0) * DAY_MS;
  return applyProfile(roadmap, spec.profile, startedMs, finishMs);
}

export function documentsForSpec(spec: HireSpec, hire: Hire): RelocationDocument[] {
  const at = ago(spec.startedAgo, -2);
  const degreeOk = spec.profile !== 'blocked_docs';
  const salary = `AED ${hire.estMonthlySalaryAed.toLocaleString('en-US')} a month (est.)`;
  const birthYear = 1982 + (hire.fullName.length % 16);
  return [
    {
      id: `doc_passport_${hire.id}`,
      hireId: hire.id,
      kind: 'passport',
      fileName: 'passport.pdf',
      uploadedAt: at,
      status: 'verified',
      labels: ['passport'],
      fields: [
        { key: 'name', label: 'Full name', value: hire.fullName, confidence: 0.99 },
        {
          key: 'number',
          label: 'Passport number',
          value: documentNumber(hire.id, 'P'),
          confidence: 0.97,
        },
        { key: 'nationality', label: 'Nationality', value: hire.nationality, confidence: 0.99 },
        { key: 'dob', label: 'Date of birth', value: `${birthYear}-03-14`, confidence: 0.96 },
        { key: 'expiry', label: 'Expiry date', value: '2031-08-02', confidence: 0.95 },
      ],
      reasoning:
        'The name matches the offer letter and the passport has more than six months of validity left.',
    },
    {
      id: `doc_offer_letter_${hire.id}`,
      hireId: hire.id,
      kind: 'offer_letter',
      fileName: 'offer-letter.pdf',
      uploadedAt: at,
      status: 'verified',
      labels: ['employment', 'salary'],
      fields: [
        {
          key: 'employer',
          label: 'Employer',
          value: 'Gulf Meridian Technologies',
          confidence: 0.99,
        },
        { key: 'role', label: 'Role', value: hire.role, confidence: 0.98 },
        { key: 'salary', label: 'Salary', value: salary, confidence: 0.94 },
        { key: 'start', label: 'Start date', value: hire.startDate, confidence: 0.97 },
      ],
      reasoning: 'The employer and role match the Rasikh hire record, and the letter is signed.',
    },
    {
      id: `doc_degree_${hire.id}`,
      hireId: hire.id,
      kind: 'degree',
      fileName: 'degree-certificate.pdf',
      uploadedAt: at,
      status: degreeOk ? 'verified' : 'rejected',
      labels: ['degree'],
      fields: [
        {
          key: 'institution',
          label: 'Institution',
          value: spec.degree.institution,
          confidence: 0.96,
        },
        {
          key: 'qualification',
          label: 'Qualification',
          value: spec.degree.qualification,
          confidence: 0.95,
        },
        { key: 'year', label: 'Year', value: String(spec.degree.year), confidence: 0.98 },
      ],
      reasoning: degreeOk
        ? 'The degree matches the role requirements and the name matches the passport.'
        : 'The certificate has no attestation stamp. The visa application needs an attested copy.',
    },
  ];
}

/** Agent feed entries that explain what the agent did for this seeded hire, and why. */
export function actionsForSpec(
  spec: HireSpec,
  hire: Hire,
  steps: Step[],
  counters: Record<string, number>,
): AgentAction[] {
  const first = hire.fullName.split(' ')[0] ?? hire.fullName;
  const stepId = (key: Step['key']) => `step_${hire.id}_${key}`;
  const make = (partial: Omit<AgentAction, 'id' | 'caseId' | 'caseType'>): AgentAction => ({
    id: nextId(counters, 'act'),
    caseId: hire.id,
    caseType: 'hire',
    ...partial,
  });

  const actions: AgentAction[] = [
    make({
      at: ago(spec.startedAgo),
      kind: 'roadmap_generated',
      ...roadmapNarrative(hire, steps.length),
      status: 'done',
    }),
    make({
      at: ago(spec.startedAgo - 1, 20),
      kind: 'document_extracted',
      summary:
        spec.profile === 'blocked_docs'
          ? 'Read the passport and offer letter. The degree is not usable.'
          : 'Read the passport, offer letter and degree',
      reasoning:
        spec.profile === 'blocked_docs'
          ? 'The degree certificate has no attestation stamp, and the visa application needs one.'
          : 'Name, dates and role agree across all three documents.',
      status: spec.profile === 'blocked_docs' ? 'blocked' : 'done',
      stepId: stepId('documents'),
      tool: 'extract_document',
    }),
  ];

  const extra: Partial<Record<Profile, Omit<AgentAction, 'id' | 'caseId' | 'caseType'>[]>> = {
    blocked_docs: [
      {
        at: ago(spec.startedAgo - 2),
        kind: 'employer_notified',
        summary: 'Asked Layla Haddad for an attested degree certificate',
        reasoning:
          'The visa application cannot go in without it, and every later step waits on the visa.',
        status: 'waiting',
        stepId: stepId('documents'),
        tool: 'notify_employer',
      },
    ],
    visa_wait: [
      {
        at: ago(spec.startedAgo - 2),
        kind: 'tamm_application',
        summary: 'Submitted the residence visa application',
        reasoning:
          'Documents were verified, so the application could go in without waiting for you.',
        status: 'waiting',
        stepId: stepId('residence_visa'),
        tool: 'start_application',
      },
    ],
    visa_wait_renting: [
      {
        at: ago(spec.startedAgo - 2),
        kind: 'tamm_application',
        summary: 'Submitted the residence visa application',
        reasoning:
          'Documents were verified, so the application could go in without waiting for you.',
        status: 'waiting',
        stepId: stepId('residence_visa'),
        tool: 'start_application',
      },
      {
        at: ago(2),
        kind: 'application_submitted',
        summary: 'Sent your rental application for Maryah Plaza Residences',
        reasoning:
          'You approved it, and your employer backing was attached so the landlord can decide sooner.',
        status: 'waiting',
        stepId: stepId('housing'),
        tool: 'submit_application',
      },
    ],
    housing_approval: [
      {
        at: ago(4),
        kind: 'tamm_application',
        summary: 'Submitted the Emirates ID application',
        reasoning:
          'The visa was issued today, and the bank account unlocks once this is submitted.',
        status: 'waiting',
        stepId: stepId('emirates_id'),
        tool: 'start_application',
      },
      {
        at: ago(0, 2),
        kind: 'approval_requested',
        summary: 'Needs your approval to apply for Maryah Plaza Residences',
        reasoning:
          'Your family of four needs two bedrooms, and this unit fits your budget and your start date.',
        status: 'needs_approval',
        stepId: stepId('housing'),
        tool: 'request_user_approval',
      },
    ],
    tenancy_wait: [
      {
        at: ago(3),
        kind: 'tamm_application',
        summary: 'Submitted the tenancy contract for registration',
        reasoning:
          'The lease was signed and your visa is issued, which is what registration needs.',
        status: 'waiting',
        stepId: stepId('tenancy_registration'),
        tool: 'register_tenancy_tawtheeq',
      },
    ],
    banking: [
      {
        at: ago(2),
        kind: 'application_submitted',
        summary: 'Sent your account application to Saadiyat Commercial Bank',
        reasoning:
          'Your Emirates ID application is in, which the bank asks for, and your employer backs you.',
        status: 'waiting',
        stepId: stepId('bank_account'),
        tool: 'submit_application',
      },
    ],
    settled: [
      {
        at: ago(spec.settledAgo ?? 0),
        kind: 'step_updated',
        summary: `Every step is complete for ${first}`,
        reasoning: 'The last application was approved, so there is nothing left to chase.',
        status: 'done',
      },
    ],
  };

  for (const entry of extra[spec.profile] ?? []) actions.push(make(entry));
  return actions;
}
