import type { Action } from '../actions';
import { nextId } from '../ids';
import { policyFor } from '../policy';
import type { AppState, Application, Decision, Step } from '../types';
import {
  assertOwner,
  DomainError,
  logAction,
  lookup,
  refreshUnlocks,
  stepsOfHire,
  type Context,
} from './shared';

type ApplicationAction = Extract<
  Action,
  {
    type:
      | 'application.create'
      | 'application.decide'
      | 'approval.decide'
      | 'application.start_review'
      | 'application.accept_terms';
  }
>;

const OPEN_STATES: Application['state'][] = ['submitted', 'under_review', 'needs_info'];

function validateReferences(draft: AppState, application: Application): void {
  lookup(draft.hires, application.hireId, 'hire');
  lookup(
    application.kind === 'rental' ? draft.landlords : draft.banks,
    application.partyId,
    'party',
  );
  if (application.kind === 'rental') {
    const property = lookup(draft.properties, application.propertyId ?? '', 'property');
    assertOwner(property.landlordId, application.partyId);
  } else if (application.propertyId !== undefined) {
    throw new DomainError('A bank application cannot reference a property');
  }
}

function partyName(draft: AppState, application: Application): string {
  return lookup(
    application.kind === 'rental' ? draft.landlords : draft.banks,
    application.partyId,
    'party',
  ).name;
}

function stepFor(draft: AppState, application: Application): Step {
  const key = application.kind === 'rental' ? 'housing' : 'bank_account';
  const step = stepsOfHire(draft, application.hireId).find((candidate) => candidate.key === key);
  if (!step) throw new DomainError('This application has no matching roadmap step');
  return step;
}

function validateTerms(draft: AppState, application: Application, terms?: Decision['terms']): void {
  if (terms?.cheques === undefined) return;
  if (application.kind !== 'rental')
    throw new DomainError('Cheque schedules apply only to rentals');
  const property = lookup(draft.properties, application.propertyId ?? '', 'property');
  if (!property.chequeOptions.includes(terms.cheques)) {
    throw new DomainError('Choose a cheque schedule accepted by this property');
  }
}

function validateDisclosure(draft: AppState, application: Application): void {
  const destination = application.kind === 'rental' ? 'landlord' : 'bank';
  for (const disclosure of application.disclosed) {
    const policy = policyFor(disclosure.label, destination);
    if (policy === 'allow' || (policy === 'derived_only' && disclosure.derived)) continue;
    if (
      policy === 'consent' &&
      Object.values(draft.grants).some(
        (grant) =>
          grant.hireId === application.hireId &&
          grant.label === disclosure.label &&
          grant.destination === destination,
      )
    )
      continue;
    throw new DomainError(
      `Sharing ${disclosure.label} with this ${destination} is not allowed by the current demo consent`,
    );
  }
}

function updateStep(
  draft: AppState,
  application: Application,
  outcome: Decision['outcome'],
  note: string,
  context: Context,
): Step {
  const step = stepFor(draft, application);
  step.completedAt = undefined;
  step.waitingOn = undefined;
  step.blockedReason = undefined;
  if (outcome === 'approved') {
    step.status = 'done';
    step.completedAt = context.now;
  } else if (outcome === 'terms_offered') {
    step.status = 'needs_approval';
  } else {
    step.status = 'blocked';
    step.blockedReason =
      outcome === 'declined'
        ? `${partyName(draft, application)} declined the application: ${note}`
        : `${partyName(draft, application)} asked for more information: ${note}`;
  }
  refreshUnlocks(draft, step.hireId);
  return step;
}

function recordDecision(
  draft: AppState,
  application: Application,
  fields: Omit<Decision, 'id' | 'applicationId' | 'decidedAt'>,
  context: Context,
): void {
  if (
    fields.outcome === 'approved' &&
    application.kind === 'rental' &&
    Object.values(draft.applications).some(
      (other) =>
        other.id !== application.id &&
        other.kind === 'rental' &&
        other.propertyId === application.propertyId &&
        other.state === 'approved',
    )
  ) {
    throw new DomainError('This property already has an approved rental application');
  }
  const id = nextId(draft.counters, 'dec', draft.decisions);
  draft.decisions[id] = { ...fields, id, applicationId: application.id, decidedAt: context.now };
  application.state = {
    approved: 'approved',
    info_requested: 'needs_info',
    terms_offered: 'terms_offered',
    declined: 'declined',
  }[fields.outcome] as Application['state'];
  const step = updateStep(draft, application, fields.outcome, fields.note, context);
  const description = {
    approved: 'approved the application',
    info_requested: 'requested more information',
    terms_offered: 'offered revised terms',
    declined: 'declined the application',
  }[fields.outcome];
  const cheques = fields.terms?.cheques
    ? ` with ${fields.terms.cheques} ${fields.terms.cheques === 1 ? 'cheque' : 'cheques'}`
    : '';
  logAction(draft, context, {
    caseId: application.hireId,
    caseType: 'hire',
    kind: 'decision_received',
    summary: `Demo: ${partyName(draft, application)} ${description}${cheques}`,
    reasoning: `Recorded locally: ${fields.note} No external notification was sent.`,
    status:
      fields.outcome === 'approved'
        ? 'done'
        : fields.outcome === 'terms_offered'
          ? 'needs_approval'
          : 'blocked',
    stepId: step.id,
    applicationId: application.id,
  });
}

function acceptTerms(draft: AppState, application: Application, context: Context): void {
  if (application.state !== 'terms_offered')
    throw new DomainError('This application has no pending terms offer');
  const offer = Object.values(draft.decisions)
    .filter((decision) => decision.applicationId === application.id)
    .at(-1);
  if (offer?.outcome !== 'terms_offered' || (!offer.terms?.cheques && !offer.terms?.note)) {
    throw new DomainError('There are no recorded terms to accept');
  }
  validateTerms(draft, application, offer.terms);
  const hire = lookup(draft.hires, application.hireId, 'hire');
  recordDecision(
    draft,
    application,
    {
      outcome: 'approved',
      terms: offer.terms,
      note: 'The newcomer accepted the recorded demo terms.',
      decidedBy: hire.fullName,
    },
    context,
  );
  for (const approval of Object.values(draft.approvals)) {
    if (
      approval.applicationId === application.id &&
      approval.kind === 'terms' &&
      approval.status === 'pending'
    ) {
      approval.status = 'approved';
      approval.decidedAt = context.now;
    }
  }
}

export function applyApplicationAction(
  draft: AppState,
  action: ApplicationAction,
  context: Context,
): void {
  switch (action.type) {
    case 'application.create': {
      const hire = lookup(draft.hires, action.application.hireId, 'hire');
      const step = lookup(draft.steps, action.approval.stepId, 'step');
      const id = nextId(draft.counters, 'app', draft.applications);
      const application: Application = {
        ...action.application,
        id,
        state: 'awaiting_approval',
        submittedAt: undefined,
        employerBacked: hire.backing.status === 'backed',
      };
      validateReferences(draft, application);
      if (step.hireId !== hire.id || step.id !== stepFor(draft, application).id) {
        throw new DomainError('The approval step does not match this application');
      }
      if (
        Object.values(draft.applications).some(
          (other) =>
            other.hireId === hire.id &&
            other.kind === application.kind &&
            other.state !== 'declined',
        )
      ) {
        throw new DomainError('This hire already has an active application for this step');
      }
      draft.applications[id] = application;
      const approvalId = nextId(draft.counters, 'appr', draft.approvals);
      draft.approvals[approvalId] = {
        id: approvalId,
        hireId: hire.id,
        stepId: step.id,
        applicationId: id,
        kind: 'submission',
        title: action.approval.title,
        detail: action.approval.detail,
        destination: application.kind === 'rental' ? 'landlord' : 'bank',
        labels: [...new Set(application.disclosed.map((item) => item.label))],
        status: 'pending',
        requestedAt: context.now,
      };
      step.status = 'needs_approval';
      step.waitingOn = undefined;
      step.blockedReason = undefined;
      step.completedAt = undefined;
      logAction(draft, context, {
        caseId: hire.id,
        caseType: 'hire',
        kind: 'approval_requested',
        summary: action.approval.title,
        reasoning:
          'A demo draft is ready. Approval records it locally after checking current consent; nothing is sent externally.',
        status: 'needs_approval',
        stepId: step.id,
        tool: 'request_user_approval',
        approvalId,
        applicationId: application.id,
      });
      return;
    }
    case 'approval.decide': {
      const approval = lookup(draft.approvals, action.approvalId, 'approval');
      if (action.hireId !== undefined && action.hireId !== approval.hireId)
        throw new DomainError('This approval belongs to another hire');
      if (approval.status !== 'pending') throw new DomainError('That approval was already decided');
      const step = lookup(draft.steps, approval.stepId, 'step');
      if (step.hireId !== approval.hireId)
        throw new DomainError('This approval has a mismatched roadmap step');
      const application = approval.applicationId
        ? lookup(draft.applications, approval.applicationId, 'application')
        : undefined;
      if (
        application &&
        (application.hireId !== approval.hireId || stepFor(draft, application).id !== step.id)
      ) {
        throw new DomainError('This approval belongs to another application');
      }
      if (approval.kind === 'terms') {
        if (!application) throw new DomainError('This offer has no application');
        if (action.approve) acceptTerms(draft, application, context);
        else
          recordDecision(
            draft,
            application,
            {
              outcome: 'declined',
              note: 'The newcomer declined the proposed demo terms.',
              decidedBy: lookup(draft.hires, approval.hireId, 'hire').fullName,
            },
            context,
          );
      } else if (action.approve) {
        if (application) {
          validateReferences(draft, application);
          if (application.state !== 'awaiting_approval')
            throw new DomainError('This application is no longer a draft');
          validateDisclosure(draft, application);
          application.state = 'submitted';
          application.submittedAt = context.now;
        }
        step.status = 'waiting';
        step.waitingOn = application?.kind === 'bank_account' ? 'the bank' : 'the landlord';
        step.blockedReason = undefined;
        step.completedAt = undefined;
        logAction(draft, context, {
          caseId: approval.hireId,
          caseType: 'hire',
          kind: 'application_submitted',
          summary: `Recorded the demo application${application ? ` for ${partyName(draft, application)}` : ''}`,
          reasoning:
            'You approved the local demo application. Employer backing reflects the current record. No external application was sent.',
          status: 'waiting',
          stepId: step.id,
          tool: 'submit_application',
          approvalId: approval.id,
          applicationId: application?.id,
        });
      } else {
        if (application?.state === 'awaiting_approval') {
          application.state = 'declined';
        }
        step.status = 'ready';
        step.waitingOn = undefined;
        step.blockedReason = undefined;
        step.completedAt = undefined;
        logAction(draft, context, {
          caseId: approval.hireId,
          caseType: 'hire',
          kind: 'step_updated',
          summary: 'Dropped the draft application',
          reasoning: 'You declined the demo draft, so nothing was shared. The step is open again.',
          status: 'done',
          stepId: step.id,
          approvalId: approval.id,
          applicationId: application?.id,
        });
      }
      approval.status = action.approve ? 'approved' : 'declined';
      approval.decidedAt = context.now;
      refreshUnlocks(draft, step.hireId);
      return;
    }
    case 'application.start_review': {
      const application = lookup(draft.applications, action.applicationId, 'application');
      assertOwner(application.partyId, action.partyId);
      validateReferences(draft, application);
      if (application.state !== 'submitted' && application.state !== 'needs_info') {
        throw new DomainError(
          'Only submitted applications or information requests can enter review',
        );
      }
      application.state = 'under_review';
      const step = stepFor(draft, application);
      step.status = 'waiting';
      step.waitingOn = application.kind === 'rental' ? 'the landlord' : 'the bank';
      step.blockedReason = undefined;
      step.completedAt = undefined;
      logAction(draft, context, {
        caseId: application.hireId,
        caseType: 'hire',
        kind: 'step_updated',
        summary: `Demo: ${partyName(draft, application)} started reviewing the application`,
        reasoning:
          'The review status is recorded locally. No new documents were shared and no external message was sent.',
        status: 'waiting',
        stepId: step.id,
      });
      return;
    }
    case 'application.accept_terms': {
      const application = lookup(draft.applications, action.applicationId, 'application');
      if (action.hireId !== application.hireId)
        throw new DomainError('These terms belong to another hire');
      validateReferences(draft, application);
      acceptTerms(draft, application, context);
      return;
    }
    case 'application.decide': {
      const application = lookup(draft.applications, action.applicationId, 'application');
      assertOwner(application.partyId, action.partyId);
      validateReferences(draft, application);
      if (!OPEN_STATES.includes(application.state))
        throw new DomainError('This application is not awaiting a decision');
      validateTerms(draft, application, action.terms);
      if (action.outcome === 'terms_offered' && !action.terms?.cheques && !action.terms?.note) {
        throw new DomainError('Include the revised terms in this offer');
      }
      recordDecision(
        draft,
        application,
        {
          outcome: action.outcome,
          terms: action.terms,
          note: action.note,
          decidedBy: action.decidedBy,
        },
        context,
      );
      if (action.outcome === 'terms_offered') {
        const id = nextId(draft.counters, 'appr', draft.approvals);
        draft.approvals[id] = {
          id,
          hireId: application.hireId,
          stepId: stepFor(draft, application).id,
          applicationId: application.id,
          kind: 'terms',
          title: 'Accept the revised demo terms?',
          detail: `${action.note}${action.terms?.cheques ? ` Payment schedule: ${action.terms.cheques} cheques.` : ''}`,
          destination: application.kind === 'rental' ? 'landlord' : 'bank',
          labels: [],
          status: 'pending',
          requestedAt: context.now,
        };
      }
      return;
    }
  }
}
