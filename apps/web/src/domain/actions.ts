import type {
  AgentAction,
  Application,
  AppState,
  Decision,
  DocumentKind,
  ExtractedField,
  Family,
  GuardCheck,
  Hire,
  Id,
  JurisdictionKind,
  SetupRecommendation,
  StepStatus,
  TeamMember,
} from './types';
import type { DataLabel, Destination } from '@rasikh/shared';
import { demoNow } from './clock';
import { applyApplicationAction } from './reducers/applications';
import { applyCompanyAction } from './reducers/company';
import { applyHireAction } from './reducers/hire';
import { applyRecordAction } from './reducers/records';
import type { Context } from './reducers/shared';

export { DomainError } from './reducers/shared';

export type NewHire = Omit<Hire, 'id' | 'startedAt' | 'backing' | 'locale' | 'family'> & {
  locale?: Hire['locale'];
  family?: Family;
};

export type NewTeamMember = Omit<TeamMember, 'id' | 'companyId' | 'hireId'>;

export interface NewCompany {
  employerId: Id;
  name: string;
  homeCountry: string;
  industry: string;
  activities: string[];
  teamSize: number;
  timeline: string;
}

export type Action =
  | { type: 'hire.create'; hire: NewHire; id?: Id; backed?: boolean }
  | { type: 'hire.back'; hireId: Id; backed: boolean; by: string }
  | {
      type: 'step.set_status';
      stepId: Id;
      status: StepStatus;
      waitingOn?: string;
      blockedReason?: string;
    }
  | {
      type: 'document.add';
      hireId: Id;
      kind: DocumentKind;
      fileName: string;
      labels: DataLabel[];
      fields: ExtractedField[];
      reasoning: string;
      status?: 'uploaded' | 'extracted' | 'verified' | 'rejected';
    }
  | { type: 'agent.log'; entry: Omit<AgentAction, 'id' | 'at'> }
  | { type: 'approval.decide'; approvalId: Id; approve: boolean }
  | {
      type: 'application.create';
      application: Omit<Application, 'id' | 'state'>;
      /** Raises an approval request for the newcomer and puts the application in draft. */
      approval: { title: string; detail: string; stepId: Id };
    }
  | {
      type: 'application.decide';
      applicationId: Id;
      outcome: Decision['outcome'];
      terms?: Decision['terms'];
      note: string;
      decidedBy: string;
    }
  | { type: 'grant.set'; hireId: Id; label: DataLabel; destination: Destination; granted: boolean }
  | { type: 'guard.record'; check: Omit<GuardCheck, 'id' | 'at'> }
  | {
      type: 'company.create';
      id?: Id;
      company: NewCompany;
      jurisdiction: JurisdictionKind;
      recommendation?: SetupRecommendation;
      team: NewTeamMember[];
    }
  | { type: 'setup.set_status'; stepId: Id; status: StepStatus };

/**
 * The single place state changes. Pure: returns a new state and bumps `rev`. `realNowMs` is a
 * parameter so tests can pin the clock.
 */
export function applyAction(
  state: AppState,
  action: Action,
  realNowMs: number = Date.now(),
): AppState {
  const draft = structuredClone(state);
  const context: Context = { now: demoNow(state, realNowMs) };

  switch (action.type) {
    case 'hire.create':
    case 'hire.back':
    case 'step.set_status':
      applyHireAction(draft, action, context);
      break;
    case 'application.create':
    case 'application.decide':
    case 'approval.decide':
      applyApplicationAction(draft, action, context);
      break;
    case 'company.create':
    case 'setup.set_status':
      applyCompanyAction(draft, action, context);
      break;
    case 'document.add':
    case 'agent.log':
    case 'grant.set':
    case 'guard.record':
      applyRecordAction(draft, action, context);
      break;
  }

  draft.rev = state.rev + 1;
  return draft;
}
