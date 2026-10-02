import type { Hire, Id, Step, StepKey, StepOwner, StepStatus } from './types';

interface StepSpec {
  key: StepKey;
  title: string;
  stage: string;
  owner: StepOwner;
  dependsOn: StepKey[];
  unlockAfter?: 'applied';
  /** Plain-language reason for the ordering. Hedged on purpose: these are not legal statements. */
  reasoning: string;
  /** TAMM service id from the mocked catalogue (packages/tamm-mcp/data/catalogue.json). */
  tammServiceId?: string;
  appliesTo?: (hire: Pick<Hire, 'family'>) => boolean;
}

export const STEP_SPECS: StepSpec[] = [
  {
    key: 'documents',
    title: 'Upload your documents',
    stage: 'Documents',
    owner: 'newcomer',
    dependsOn: [],
    reasoning:
      'Every later step needs verified copies of your passport, offer letter and degree, so this goes first.',
  },
  {
    key: 'residence_visa',
    title: 'Residence visa',
    stage: 'Visa',
    owner: 'employer',
    dependsOn: ['documents'],
    reasoning: 'Your employer sponsors the visa. It needs your verified passport and offer letter.',
    tammServiceId: 'svc_residency_visa',
  },
  {
    key: 'emirates_id',
    title: 'Emirates ID application',
    stage: 'Emirates ID',
    owner: 'agent',
    dependsOn: ['residence_visa'],
    reasoning:
      'The Emirates ID application follows the residence visa, so the agent submits it as soon as the visa is issued.',
    tammServiceId: 'svc_emirates_id',
  },
  {
    key: 'housing',
    title: 'Find and rent a home',
    stage: 'Housing',
    owner: 'landlord',
    dependsOn: ['documents'],
    reasoning:
      'Landlords decide sooner when your documents are verified and your employer backs you. This can run alongside the visa.',
  },
  {
    key: 'tenancy_registration',
    title: 'Register your tenancy contract',
    stage: 'Housing',
    owner: 'agent',
    dependsOn: ['housing', 'residence_visa'],
    reasoning:
      'Registration needs a signed lease and your residence visa. Family sponsorship can depend on it.',
    tammServiceId: 'svc_tawtheeq_register',
  },
  {
    key: 'bank_account',
    title: 'Open a current account',
    stage: 'Banking',
    owner: 'bank',
    dependsOn: ['emirates_id'],
    unlockAfter: 'applied',
    reasoning:
      'Banks usually ask for your Emirates ID application before opening an account. This unlocks as soon as it is submitted.',
  },
  {
    key: 'health_insurance',
    title: 'Health insurance',
    stage: 'Insurance',
    owner: 'agent',
    dependsOn: ['residence_visa'],
    reasoning: 'Cover is arranged once your residence visa is issued.',
    tammServiceId: 'svc_health_insurance',
  },
  {
    key: 'family_sponsorship',
    title: 'Sponsor your family',
    stage: 'Family',
    owner: 'agent',
    dependsOn: ['tenancy_registration'],
    reasoning: 'Family sponsorship can depend on a registered tenancy contract.',
    appliesTo: (hire) => hire.family.spouse || hire.family.children > 0,
  },
  {
    key: 'school',
    title: 'Register at a school',
    stage: 'School',
    owner: 'newcomer',
    dependsOn: ['family_sponsorship'],
    reasoning: 'School registration follows family sponsorship.',
    tammServiceId: 'svc_school_registration',
    appliesTo: (hire) => hire.family.children > 0,
  },
];

const SPEC_BY_KEY = new Map(STEP_SPECS.map((spec) => [spec.key, spec]));

export function stageLabel(key: StepKey): string {
  return SPEC_BY_KEY.get(key)?.stage ?? 'Relocation';
}

/** Steps that apply to this hire, in order, with dependencies resolved to a starting state. */
export function buildRoadmap(hire: Hire, stepId: (key: StepKey) => Id): Step[] {
  const steps = STEP_SPECS.filter((spec) => spec.appliesTo?.(hire) ?? true).map(
    (spec, index): Step => ({
      id: stepId(spec.key),
      hireId: hire.id,
      key: spec.key,
      title: spec.title,
      order: index,
      dependsOn: spec.dependsOn,
      unlockAfter: spec.unlockAfter ?? 'done',
      status: spec.dependsOn.length === 0 ? 'ready' : 'locked',
      owner: spec.owner,
      reasoning: spec.reasoning,
      tammServiceId: spec.tammServiceId,
    }),
  );
  return unlockSteps(steps);
}

const SATISFIES_APPLIED: StepStatus[] = ['waiting', 'done'];

export interface Unlockable {
  key: string;
  dependsOn: string[];
  status: StepStatus;
  unlockAfter?: 'done' | 'applied';
}

function dependencySatisfied(
  dependency: Unlockable | undefined,
  rule: 'done' | 'applied',
): boolean {
  if (!dependency) return true;
  return rule === 'applied'
    ? SATISFIES_APPLIED.includes(dependency.status)
    : dependency.status === 'done';
}

/**
 * Moves every `locked` step to `ready` once its dependencies allow it. Never moves a step
 * backwards, so progress is not lost if a dependency is edited later. Steps that do not change
 * are returned as the same object.
 */
export function unlockSteps<T extends Unlockable>(steps: T[]): T[] {
  const byKey = new Map(steps.map((step) => [step.key, step]));
  return steps.map((step) => {
    if (step.status !== 'locked') return step;
    const rule = step.unlockAfter ?? 'done';
    const open = step.dependsOn.every((key) => dependencySatisfied(byKey.get(key), rule));
    return open ? { ...step, status: 'ready' as const } : step;
  });
}

/** The agent's plain-language note when it builds a roadmap. */
export function roadmapNarrative(
  hire: Pick<Hire, 'fullName' | 'family'>,
  stepCount: number,
): { summary: string; reasoning: string } {
  const first = hire.fullName.split(' ')[0] ?? hire.fullName;
  const family = hire.family.spouse ? ' Family sponsorship waits for the registered tenancy.' : '';
  return {
    summary: `Built a ${stepCount}-step roadmap for ${first}`,
    reasoning: `The bank account is ordered after the Emirates ID application, and the tenancy contract after the visa.${family}`,
  };
}
