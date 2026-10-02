import type { Action } from '../actions';
import { buildRoadmap, roadmapNarrative } from '../roadmap';
import type { AppState, Hire } from '../types';
import {
  allocateHireId,
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
      hire.backing = action.backed
        ? { status: 'backed', backedAt: context.now, backedBy: action.by }
        : { status: 'none' };
      for (const application of Object.values(draft.applications)) {
        if (application.hireId === hire.id && application.state !== 'approved') {
          application.employerBacked = action.backed;
        }
      }
      if (action.backed) {
        logAction(draft, context, {
          caseId: hire.id,
          caseType: 'hire',
          kind: 'step_updated',
          summary: `${hire.fullName.split(' ')[0]} is now backed by their employer`,
          reasoning:
            'Landlords and banks decide sooner when the employer stands behind an application, so the backing is attached to every application from now on.',
          status: 'done',
        });
      }
      return;
    }

    case 'step.set_status': {
      const step = lookup(draft.steps, action.stepId, 'step');
      step.status = action.status;
      step.completedAt = action.status === 'done' ? context.now : undefined;
      step.waitingOn = action.status === 'waiting' ? action.waitingOn : undefined;
      step.blockedReason = action.status === 'blocked' ? action.blockedReason : undefined;
      refreshUnlocks(draft, step.hireId);
      return;
    }
  }
}
