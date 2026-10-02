import type { Action } from '../actions';
import { nextId } from '../ids';
import type { AppState, Application, Step } from '../types';
import {
  DomainError,
  logAction,
  lookup,
  refreshUnlocks,
  stepsOfHire,
  type Context,
} from './shared';

type ApplicationAction = Extract<
  Action,
  { type: 'application.create' | 'application.decide' | 'approval.decide' }
>;

const OPEN_STATES: Application['state'][] = ['submitted', 'under_review', 'needs_info'];

function partyName(draft: AppState, application: Application): string {
  const party = draft.landlords[application.partyId] ?? draft.banks[application.partyId];
  return party?.name ?? 'the other party';
}

/** The roadmap step an application belongs to. */
function stepFor(draft: AppState, application: Application): Step | undefined {
  const key = application.kind === 'rental' ? 'housing' : 'bank_account';
  return stepsOfHire(draft, application.hireId).find((step) => step.key === key);
}

function cheques(terms: { cheques?: number } | undefined): string {
  return terms?.cheques
    ? ` with ${terms.cheques} ${terms.cheques === 1 ? 'cheque' : 'cheques'}`
    : '';
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
      const id = nextId(draft.counters, 'app');
      draft.applications[id] = {
        ...action.application,
        id,
        state: 'awaiting_approval',
        employerBacked: hire.backing.status === 'backed',
      };
      const approvalId = nextId(draft.counters, 'appr');
      draft.approvals[approvalId] = {
        id: approvalId,
        hireId: hire.id,
        stepId: step.id,
        applicationId: id,
        title: action.approval.title,
        detail: action.approval.detail,
        destination: action.application.kind === 'rental' ? 'landlord' : 'bank',
        labels: action.application.disclosed.map((item) => item.label),
        status: 'pending',
        requestedAt: context.now,
      };
      step.status = 'needs_approval';
      logAction(draft, context, {
        caseId: hire.id,
        caseType: 'hire',
        kind: 'approval_requested',
        summary: action.approval.title,
        reasoning:
          'Nothing is sent until you approve. The agent only shares what your trust passport allows.',
        status: 'needs_approval',
        stepId: step.id,
        tool: 'request_user_approval',
      });
      return;
    }

    case 'approval.decide': {
      const approval = lookup(draft.approvals, action.approvalId, 'approval');
      if (approval.status !== 'pending') throw new DomainError('That approval was already decided');
      approval.status = action.approve ? 'approved' : 'declined';
      approval.decidedAt = context.now;
      const step = draft.steps[approval.stepId];
      const application = approval.applicationId
        ? draft.applications[approval.applicationId]
        : undefined;

      if (action.approve) {
        if (application) {
          application.state = 'submitted';
          application.submittedAt = context.now;
        }
        if (step) {
          step.status = 'waiting';
          step.waitingOn = application?.kind === 'bank_account' ? 'the bank' : 'the landlord';
        }
        logAction(draft, context, {
          caseId: approval.hireId,
          caseType: 'hire',
          kind: 'application_submitted',
          summary: `Sent the application${application ? ` to ${partyName(draft, application)}` : ''}`,
          reasoning:
            'You approved it, and your employer backing was attached so the decision can come sooner.',
          status: 'waiting',
          stepId: approval.stepId,
          tool: 'submit_application',
        });
      } else {
        if (application?.state === 'awaiting_approval') delete draft.applications[application.id];
        if (step) step.status = 'ready';
        logAction(draft, context, {
          caseId: approval.hireId,
          caseType: 'hire',
          kind: 'step_updated',
          summary: 'Dropped the draft application',
          reasoning: 'You declined, so nothing was shared. The step is open again.',
          status: 'done',
          stepId: approval.stepId,
        });
      }
      if (step) refreshUnlocks(draft, step.hireId);
      return;
    }

    case 'application.decide': {
      const application = lookup(draft.applications, action.applicationId, 'application');
      if (!OPEN_STATES.includes(application.state)) {
        throw new DomainError('This application is not awaiting a decision');
      }
      const decisionId = nextId(draft.counters, 'dec');
      draft.decisions[decisionId] = {
        id: decisionId,
        applicationId: application.id,
        outcome: action.outcome,
        terms: action.terms,
        note: action.note,
        decidedAt: context.now,
        decidedBy: action.decidedBy,
      };
      application.state = {
        approved: 'approved',
        info_requested: 'needs_info',
        terms_offered: 'terms_offered',
        declined: 'declined',
      }[action.outcome] as Application['state'];

      const step = stepFor(draft, application);
      const who = partyName(draft, application);
      if (step) {
        if (action.outcome === 'approved') {
          step.status = 'done';
          step.completedAt = context.now;
        } else if (action.outcome === 'terms_offered') {
          step.status = 'needs_approval';
        } else {
          step.status = 'blocked';
          step.blockedReason =
            action.outcome === 'declined'
              ? `${who} declined the application`
              : `${who} asked for more information: ${action.note}`;
        }
        refreshUnlocks(draft, step.hireId);
      }

      const summary = {
        approved: `${who} approved the application${cheques(action.terms)}`,
        info_requested: `${who} asked for more information`,
        terms_offered: `${who} offered different terms${cheques(action.terms)}`,
        declined: `${who} declined the application`,
      }[action.outcome];
      logAction(draft, context, {
        caseId: application.hireId,
        caseType: 'hire',
        kind: 'decision_received',
        summary,
        reasoning:
          action.outcome === 'approved'
            ? 'The next steps that depended on this one are open now.'
            : action.note,
        status: action.outcome === 'approved' ? 'done' : 'needs_approval',
        stepId: step?.id,
      });
      return;
    }
  }
}
