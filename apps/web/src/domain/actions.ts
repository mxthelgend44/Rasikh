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
  Property,
  SetupRecommendation,
  StepStatus,
  TeamMember,
  Viewing,
} from './types';
import type { DataLabel, Destination } from '@rasikh/shared';
import { demoNow } from './clock';
import { applyApplicationAction } from './reducers/applications';
import { applyCompanyAction } from './reducers/company';
import { applyHireAction } from './reducers/hire';
import { applyRecordAction } from './reducers/records';
import { applyPropertyAction } from './reducers/properties';
import type { Context } from './reducers/shared';
import { validateAction } from './validate-action';

export { DomainError, isDomainError } from './reducers/shared';

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
  | { type: 'hire.back'; hireId: Id; employerId?: Id; backed: boolean; by: string }
  | {
      type: 'step.set_status';
      stepId: Id;
      status: StepStatus;
      waitingOn?: string;
      blockedReason?: string;
      employerId?: Id;
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
      source?: 'demo' | 'vertex';
    }
  | {
      type: 'document.review';
      hireId: Id;
      documentId: Id;
      fields?: ExtractedField[];
      accept: boolean;
      expectedVersion?: number;
    }
  | { type: 'agent.log'; entry: Omit<AgentAction, 'id' | 'at'> }
  | { type: 'approval.decide'; approvalId: Id; hireId?: Id; approve: boolean }
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
      partyId?: Id;
    }
  | { type: 'application.start_review'; applicationId: Id; partyId: Id }
  | { type: 'application.accept_terms'; applicationId: Id; hireId: Id }
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
  | { type: 'setup.set_status'; stepId: Id; status: StepStatus; employerId?: Id }
  | { type: 'team.add'; companyId: Id; employerId: Id; member: NewTeamMember }
  | {
      type: 'property.create';
      landlordId: Id;
      property: Omit<Property, 'id' | 'landlordId'>;
      id?: Id;
    }
  | {
      type: 'property.update';
      landlordId: Id;
      propertyId: Id;
      patch: Partial<Omit<Property, 'id' | 'landlordId'>>;
    }
  | {
      type: 'viewing.create';
      landlordId: Id;
      viewing: Omit<Viewing, 'id' | 'landlordId' | 'createdAt' | 'status'>;
    }
  | {
      type: 'viewing.update';
      landlordId: Id;
      viewingId: Id;
      patch: Partial<Pick<Viewing, 'startsAt' | 'durationMinutes' | 'note' | 'status'>>;
    };

/**
 * The single place state changes. Pure: returns a new state and bumps `rev`. `realNowMs` is a
 * parameter so tests can pin the clock.
 */
export function applyAction(
  state: AppState,
  action: Action,
  realNowMs: number = Date.now(),
): AppState {
  validateAction(action);
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
    case 'application.start_review':
    case 'application.accept_terms':
      applyApplicationAction(draft, action, context);
      break;
    case 'company.create':
    case 'setup.set_status':
    case 'team.add':
      applyCompanyAction(draft, action, context);
      break;
    case 'document.add':
    case 'document.review':
    case 'agent.log':
    case 'grant.set':
    case 'guard.record':
      applyRecordAction(draft, action, context);
      break;
    case 'property.create':
    case 'property.update':
    case 'viewing.create':
    case 'viewing.update':
      applyPropertyAction(draft, action, context);
      break;
  }

  draft.rev = state.rev + 1;
  return draft;
}
