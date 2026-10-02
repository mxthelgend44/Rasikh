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
  assertOwner,
  DomainError,
  logAction,
  lookup,
  TEAM_MOVE_HIRE_IDS,
  type Context,
} from './shared';

type CompanyAction = Extract<Action, { type: 'company.create' | 'setup.set_status' | 'team.add' }>;

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
          ? nextId(draft.counters, 'company', draft.companies)
          : DEMO_FIXTURES.company);
      if (id in draft.companies) throw new DomainError(`Company already exists: ${id}`);
      if (action.team.length > action.company.teamSize) {
        throw new DomainError('The team exceeds the planned team size');
      }
      if (
        new Set(action.team.map((member) => member.fullName.trim().toLowerCase())).size !==
        action.team.length
      ) {
        throw new DomainError('Team members must be unique within the expansion');
      }
      draft.companies[id] = {
        ...action.company,
        id,
        recommendation: action.recommendation,
        createdAt: context.now,
      };
      const steps = buildSetupSteps(id, action.jurisdiction, (key) => `setup_${id}_${key}`);
      for (const step of steps) draft.setupSteps[step.id] = step;
      for (const member of action.team) {
        const memberId = nextId(draft.counters, 'team', draft.teamMembers);
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
      const company = lookup(draft.companies, step.companyId, 'company');
      assertOwner(company.employerId, action.employerId);
      if (step.status === 'locked' && action.status !== 'locked') {
        throw new DomainError('Complete the dependencies before updating this setup step');
      }
      step.status = action.status;
      step.completedAt = action.status === 'done' ? context.now : undefined;
      for (const next of unlockSteps(setupStepsOf(draft, step.companyId))) {
        draft.setupSteps[next.id] = next;
      }
      if (step.key === 'visa_quota' && action.status === 'done') {
        moveTeam(draft, step.companyId, context);
      }
      logAction(draft, context, {
        caseId: company.id,
        caseType: 'company',
        kind: 'step_updated',
        summary: `${step.title}: ${action.status.replaceAll('_', ' ')}`,
        reasoning:
          'This setup progress is recorded in the demo. No authority application was sent.',
        status:
          action.status === 'done' ? 'done' : action.status === 'blocked' ? 'blocked' : 'waiting',
        stepId: step.id,
      });
      return;
    }

    case 'team.add': {
      const company = lookup(draft.companies, action.companyId, 'company');
      assertOwner(company.employerId, action.employerId);
      const members = Object.values(draft.teamMembers).filter(
        (member) => member.companyId === company.id,
      );
      if (
        members.some(
          (member) =>
            member.fullName.trim().toLocaleLowerCase() ===
            action.member.fullName.trim().toLocaleLowerCase(),
        )
      ) {
        throw new DomainError('That team member is already in this expansion');
      }
      const id = nextId(draft.counters, 'team', draft.teamMembers);
      draft.teamMembers[id] = { ...action.member, id, companyId: company.id };
      company.teamSize = Math.max(company.teamSize, members.length + 1);
      logAction(draft, context, {
        caseId: company.id,
        caseType: 'company',
        kind: 'step_updated',
        summary: `Added ${action.member.fullName} to the expansion team`,
        reasoning:
          'The person is recorded in the demo. Their relocation starts once the visa quota is complete.',
        status: 'done',
      });
      if (
        setupStepsOf(draft, company.id).some(
          (step) => step.key === 'visa_quota' && step.status === 'done',
        )
      ) {
        moveTeam(draft, company.id, context);
      }
      return;
    }
  }
}
