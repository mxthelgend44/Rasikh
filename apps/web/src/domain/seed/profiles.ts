import { toAbuDhabiIso } from '../clock';
import { unlockSteps } from '../roadmap';
import type { Step, StepKey } from '../types';

export type Profile =
  | 'new'
  | 'blocked_docs'
  | 'visa_wait'
  | 'visa_wait_renting'
  | 'housing_approval'
  | 'tenancy_wait'
  | 'banking'
  | 'settled';

interface ProfileSpec {
  done: StepKey[] | 'all';
  waiting?: [StepKey, string][];
  inProgress?: StepKey[];
  needsApproval?: StepKey[];
  blocked?: [StepKey, string][];
}

const ICP = 'the immigration authority (ICP)';

const PROFILES: Record<Profile, ProfileSpec> = {
  new: { done: [], inProgress: ['documents'] },
  blocked_docs: {
    done: [],
    blocked: [
      [
        'documents',
        'The degree certificate is not attested, so the visa application cannot be submitted.',
      ],
    ],
  },
  visa_wait: { done: ['documents'], waiting: [['residence_visa', ICP]] },
  visa_wait_renting: {
    done: ['documents'],
    waiting: [
      ['residence_visa', ICP],
      ['housing', 'the landlord'],
    ],
  },
  housing_approval: {
    done: ['documents', 'residence_visa'],
    waiting: [['emirates_id', ICP]],
    needsApproval: ['housing'],
  },
  tenancy_wait: {
    done: ['documents', 'residence_visa', 'emirates_id', 'housing'],
    waiting: [['tenancy_registration', 'Abu Dhabi Municipality']],
  },
  banking: {
    done: ['documents', 'residence_visa', 'housing', 'tenancy_registration', 'health_insurance'],
    waiting: [['emirates_id', ICP]],
    inProgress: ['bank_account'],
  },
  settled: { done: 'all' },
};

/**
 * Puts a fresh roadmap into the state a profile describes. Completed steps are spread evenly
 * between `startedMs` and `finishMs`, then dependants are unlocked.
 */
export function applyProfile(
  steps: Step[],
  profile: Profile,
  startedMs: number,
  finishMs: number,
): Step[] {
  const spec = PROFILES[profile];
  const doneKeys =
    spec.done === 'all'
      ? steps.map((step) => step.key)
      : spec.done.filter((key) => steps.some((s) => s.key === key));

  const marked = steps.map((step): Step => {
    const doneIndex = doneKeys.indexOf(step.key);
    if (doneIndex >= 0) {
      const fraction = (doneIndex + 1) / (doneKeys.length + 1);
      return {
        ...step,
        status: 'done',
        completedAt: toAbuDhabiIso(startedMs + fraction * (finishMs - startedMs)),
      };
    }
    const waiting = spec.waiting?.find(([key]) => key === step.key);
    if (waiting) return { ...step, status: 'waiting', waitingOn: waiting[1] };
    const blocked = spec.blocked?.find(([key]) => key === step.key);
    if (blocked) return { ...step, status: 'blocked', blockedReason: blocked[1] };
    if (spec.needsApproval?.includes(step.key)) return { ...step, status: 'needs_approval' };
    if (spec.inProgress?.includes(step.key)) return { ...step, status: 'in_progress' };
    return step;
  });
  return unlockSteps(marked);
}
