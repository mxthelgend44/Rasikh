import type { Action } from '../actions';
import { buildRoadmap, roadmapNarrative } from '../roadmap';
import type { AppState, Hire } from '../types';
import {
  allocateHireId,
  assertOwner,
  DomainError,
  logAction,
  lookup,
  PATH_ONE_HIRE_IDS,
  refreshUnlocks,
  type Context,
} from './shared';

type HireAction = Extract<Action, { type: 'hire.create' | 'hire.back' | 'step.set_status' }>;

/** Creates a hire with a roadmap and the agent's note explaining it. Shared with the team move. */
export function createHire(
  draft: AppState,
  context: Context,
  fields: Omit<Hire, 'backing'>,
  backedBy?: string,
): Hire {
  lookup(draft.employers, fields.employerId, 'employer');
  if (fields.companyId) {
    const company = lookup(draft.companies, fields.companyId, 'company');
    assertOwner(company.employerId, fields.employerId);
  }
  if (Object.hasOwn(draft.hires, fields.id))
    throw new DomainError(`Hire already exists: ${fields.id}`);
  const hire: Hire = {
    ...fields,
    backing: backedBy ? { status: 'backed', backedAt: context.now, backedBy } : { status: 'none' },
  };
  draft.hires[hire.id] = hire;
  const steps = buildRoadmap(hire, (key) => `step_${hire.id}_${key}`);
  for (const step of steps) draft.steps[step.id] = step;
  logAction(draft, context, {
    caseId: hire.id,
    caseType: 'hire',
    kind: 'roadmap_generated',
    ...roadmapNarrative(hire, steps.length),
    status: 'done',
  });
  return hire;
}

export function applyHireAction(draft: AppState, action: HireAction, context: Context): void {
  switch (action.type) {
    case 'hire.create': {
      const id = action.id ?? allocateHireId(draft, PATH_ONE_HIRE_IDS);
      if (id in draft.hires) throw new DomainError(`Hire already exists: ${id}`);
      createHire(
        draft,
        context,
        {
          ...action.hire,
          id,
          startedAt: context.now,
          locale: action.hire.locale ?? 'en',
          family: action.hire.family ?? { spouse: false, children: 0 },
        },
        action.backed ? 'Employer' : undefined,
      );
      return;
    }

    case 'hire.back': {
      const hire = lookup(draft.hires, action.hireId, 'hire');
      assertOwner(hire.employerId, action.employerId);
      hire.backing = action.backed
        ? { status: 'backed', backedAt: context.now, backedBy: action.by }
        : { status: 'none' };
      for (const application of Object.values(draft.applications)) {
        if (application.hireId === hire.id && application.state !== 'approved') {
          application.employerBacked = action.backed;
        }
      }
      logAction(draft, context, {
        caseId: hire.id,
        caseType: 'hire',
        kind: 'step_updated',
        summary: action.backed
          ? `${hire.fullName.split(' ')[0]} is now backed by their employer`
          : `Removed employer backing for ${hire.fullName.split(' ')[0]}`,
        reasoning: action.backed
          ? 'Employer backing is recorded for open applications in this demo. No external notification was sent.'
          : 'Open applications now show no employer backing. Existing decisions remain in the history.',
        status: 'done',
      });
      return;
    }

    case 'step.set_status': {
      const step = lookup(draft.steps, action.stepId, 'step');
      const hire = lookup(draft.hires, step.hireId, 'hire');
      assertOwner(hire.employerId, action.employerId);
      if (step.status === 'locked' && action.status !== 'locked') {
        throw new DomainError('Complete the dependencies before updating this step');
      }
      step.status = action.status;
      step.completedAt = action.status === 'done' ? context.now : undefined;
      step.waitingOn = action.status === 'waiting' ? action.waitingOn : undefined;
      step.blockedReason = action.status === 'blocked' ? action.blockedReason : undefined;
      refreshUnlocks(draft, step.hireId);
      return;
    }
  }
}
