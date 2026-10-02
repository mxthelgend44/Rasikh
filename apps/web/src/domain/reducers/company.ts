import { DEMO_FIXTURES } from '@rasikh/shared';
import type { Action } from '../actions';
import { buildSetupSteps } from '../expansion';
import { nextId } from '../ids';
import { unlockSteps } from '../roadmap';
import { dateAfter, slugify } from '../text';
import type { AppState, Id, SetupStep } from '../types';
import { createHire } from './hire';
import {
  allocateHireId,
  DomainError,
  logAction,
  lookup,
  TEAM_MOVE_HIRE_IDS,
  type Context,
} from './shared';

type CompanyAction = Extract<Action, { type: 'company.create' | 'setup.set_status' }>;

function setupStepsOf(draft: AppState, companyId: Id): SetupStep[] {
  return Object.values(draft.setupSteps)
    .filter((step) => step.companyId === companyId)
    .sort((a, b) => a.order - b.order);
}

/**
 * The key link between landing and settling: once the entity can sponsor visas, the people it is
 * transferring enter the ordinary hire pipeline, backed by the company.
 */
function moveTeam(draft: AppState, companyId: Id, context: Context): void {
  const company = lookup(draft.companies, companyId, 'company');
  const waiting = Object.values(draft.teamMembers).filter(
    (member) => member.companyId === companyId && !member.hireId,
  );
  for (const member of waiting) {
    const id = allocateHireId(draft, TEAM_MOVE_HIRE_IDS);
    createHire(
      draft,
      context,
      {
        id,
        employerId: company.employerId,
        companyId,
        fullName: member.fullName,
        nationality: member.nationality,
        role: member.role,
        department: 'Abu Dhabi branch',
        email: `${slugify(member.fullName)}@mail.example`,
        originCity: member.originCity,
        originCountry: member.originCountry,
        locale: 'en',
        family: member.family,
        estMonthlySalaryAed: member.estMonthlySalaryAed,
        preferredArea: 'Al Maryah Island',
        startDate: dateAfter(context.now, 21),
        startedAt: context.now,
      },
      company.name,
    );
    member.hireId = id;
  }
  if (waiting.length > 0) {
    logAction(draft, context, {
      caseId: companyId,
      caseType: 'company',
      kind: 'step_updated',
      summary: `Started the relocation of ${waiting.length} ${waiting.length === 1 ? 'person' : 'people'}`,
      reasoning:
        'The visa quota is in place, so the entity can sponsor visas. Each person now has their own roadmap and is backed by the company.',
      status: 'done',
    });
  }
}

export function applyCompanyAction(draft: AppState, action: CompanyAction, context: Context): void {
  switch (action.type) {
    case 'company.create': {
      lookup(draft.employers, action.company.employerId, 'employer');
      const id =
        action.id ??
        (DEMO_FIXTURES.company in draft.companies
          ? nextId(draft.counters, 'company')
          : DEMO_FIXTURES.company);
      if (id in draft.companies) throw new DomainError(`Company already exists: ${id}`);
      draft.companies[id] = {
        id,
        ...action.company,
        recommendation: action.recommendation,
        createdAt: context.now,
      };
      const steps = buildSetupSteps(id, action.jurisdiction, (key) => `setup_${id}_${key}`);
      for (const step of steps) draft.setupSteps[step.id] = step;
      for (const member of action.team) {
        const memberId = nextId(draft.counters, 'team');
        draft.teamMembers[memberId] = { id: memberId, companyId: id, ...member };
      }
      logAction(draft, context, {
        caseId: id,
        caseType: 'company',
        kind: 'roadmap_generated',
        summary: `Built a ${steps.length}-step setup roadmap for ${action.company.name}`,
        reasoning: `Setup runs in the order the authorities unlock it. Once the visa quota is in place, ${action.team.length} ${action.team.length === 1 ? 'person' : 'people'} start relocating on their own.`,
        status: 'done',
      });
      return;
    }

    case 'setup.set_status': {
      const step = lookup(draft.setupSteps, action.stepId, 'setup step');
      step.status = action.status;
      step.completedAt = action.status === 'done' ? context.now : undefined;
      for (const next of unlockSteps(setupStepsOf(draft, step.companyId))) {
        draft.setupSteps[next.id] = next;
      }
      if (step.key === 'visa_quota' && action.status === 'done') {
        moveTeam(draft, step.companyId, context);
      }
      return;
    }
  }
}
