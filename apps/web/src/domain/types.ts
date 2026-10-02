import type { DataLabel, Destination, GuardDecision } from '@rasikh/shared';

/**
 * Rasikh domain model. One shape shared by every surface.
 *
 * All money and duration fields are prefixed `est` because they are illustrative mock data, not
 * statements of real fees, processing times or legal requirements. The UI words them "est.".
 */

export type Id = string;
/** ISO 8601 with the Abu Dhabi offset, e.g. 2026-10-10T09:41:12+04:00. */
export type IsoDateTime = string;
export type IsoDate = string;
export type Locale = 'en' | 'ar';

export type AbuDhabiArea =
  | 'Al Reem Island'
  | 'Al Raha Beach'
  | 'Khalifa City'
  | 'Mohammed Bin Zayed City'
  | 'Saadiyat Island'
  | 'Yas Island'
  | 'Al Maryah Island';

export type CaseType = 'hire' | 'company';

/* Parties */

export interface Employer {
  id: Id;
  name: string;
  industry: string;
  area: AbuDhabiArea;
  hrContact: { name: string; email: string };
}

export interface Landlord {
  id: Id;
  name: string;
  area: AbuDhabiArea;
}

export interface Bank {
  id: Id;
  name: string;
}

export interface Property {
  id: Id;
  landlordId: Id;
  name: string;
  area: AbuDhabiArea;
  unit: string;
  bedrooms: number;
  /** Reference used in INTEGRATION.md fixtures and Tawtheeq registration. */
  leaseRef: string;
  estAnnualRentAed: number;
  /** Cheque schedules the landlord accepts, e.g. [1, 2, 4]. */
  chequeOptions: number[];
}

export interface Viewing {
  id: Id;
  landlordId: Id;
  propertyId: Id;
  applicationId?: Id;
  startsAt: IsoDateTime;
  durationMinutes: number;
  note: string;
  status: 'planned' | 'completed' | 'cancelled';
  createdAt: IsoDateTime;
}

/* Relocation of one person */

export interface Backing {
  status: 'none' | 'backed';
  backedAt?: IsoDateTime;
  backedBy?: string;
}

export interface Family {
  spouse: boolean;
  children: number;
}

export interface Hire {
  id: Id;
  employerId: Id;
  /** Set when the hire was created by a company expansion team move. */
  companyId?: Id;
  fullName: string;
  nationality: string;
  role: string;
  department: string;
  email: string;
  originCity: string;
  originCountry: string;
  locale: Locale;
  family: Family;
  estMonthlySalaryAed: number;
  preferredArea: AbuDhabiArea;
  startDate: IsoDate;
  /** When the relocation started inside Rasikh. Days in relocation counts from here. */
  startedAt: IsoDateTime;
  backing: Backing;
}

export const STEP_KEYS = [
  'documents',
  'residence_visa',
  'emirates_id',
  'housing',
  'tenancy_registration',
  'bank_account',
  'health_insurance',
  'family_sponsorship',
  'school',
] as const;
export type StepKey = (typeof STEP_KEYS)[number];

export type StepStatus =
  | 'locked'
  | 'ready'
  | 'in_progress'
  | 'waiting'
  | 'needs_approval'
  | 'blocked'
  | 'done';

export type StepOwner = 'agent' | 'newcomer' | 'employer' | 'landlord' | 'bank' | 'authority';

export interface Step {
  id: Id;
  hireId: Id;
  key: StepKey;
  title: string;
  order: number;
  dependsOn: StepKey[];
  /** `done`: dependencies must be complete. `applied`: an application in with the authority is enough. */
  unlockAfter: 'done' | 'applied';
  status: StepStatus;
  owner: StepOwner;
  /** Plain-language reason this step is ordered here. Shown with the roadmap. */
  reasoning: string;
  /** Who or what the step is waiting on, when status is `waiting`. */
  waitingOn?: string;
  blockedReason?: string;
  /** TAMM service id from the catalogue, when the step maps to one. */
  tammServiceId?: string;
  completedAt?: IsoDateTime;
}

export type DocumentKind =
  | 'passport'
  | 'offer_letter'
  | 'degree'
  | 'residence_visa'
  | 'emirates_id'
  | 'tenancy_contract'
  | 'salary_certificate'
  | 'bank_statement';

export interface ExtractedField {
  key: string;
  label: string;
  value: string;
  /** 0 to 1. */
  confidence: number | null;
}

export interface RelocationDocument {
  id: Id;
  hireId: Id;
  kind: DocumentKind;
  fileName: string;
  uploadedAt: IsoDateTime;
  version: number;
  source?: 'demo' | 'vertex';
  reviewedAt?: IsoDateTime;
  status: 'uploaded' | 'extracted' | 'verified' | 'rejected';
  labels: DataLabel[];
  fields: ExtractedField[];
  /** Short plain sentences explaining the extraction and verification. */
  reasoning: string;
}

/* Agent */

export type AgentActionKind =
  | 'roadmap_generated'
  | 'document_extracted'
  | 'document_requested'
  | 'approval_requested'
  | 'application_submitted'
  | 'tamm_application'
  | 'decision_received'
  | 'employer_notified'
  | 'step_updated'
  | 'guard_blocked';

export interface AgentAction {
  id: Id;
  caseId: Id;
  caseType: CaseType;
  at: IsoDateTime;
  kind: AgentActionKind;
  summary: string;
  /** Short plain sentences. Every AI output carries its reasoning. */
  reasoning: string;
  status: 'done' | 'waiting' | 'needs_approval' | 'blocked';
  stepId?: Id;
  tool?: string;
  approvalId?: Id;
  applicationId?: Id;
  documentId?: Id;
}

export interface Approval {
  id: Id;
  hireId: Id;
  stepId: Id;
  /** The draft application this approval releases. */
  applicationId?: Id;
  kind?: 'submission' | 'terms';
  title: string;
  detail: string;
  destination: Destination;
  labels: DataLabel[];
  status: 'pending' | 'approved' | 'declined';
  requestedAt: IsoDateTime;
  decidedAt?: IsoDateTime;
}

/* Landlord and bank */

export type ApplicationKind = 'rental' | 'bank_account';

export type ApplicationState =
  | 'awaiting_approval'
  | 'submitted'
  | 'under_review'
  | 'needs_info'
  | 'terms_offered'
  | 'approved'
  | 'declined';

export interface Disclosure {
  label: DataLabel;
  /** A derived signal (for example "affordability: yes") instead of the raw value. */
  derived: boolean;
}

export interface RiskPoint {
  label: string;
  effect: 'positive' | 'neutral' | 'concern';
  /** Why this point counts. A reason is required for every point. */
  reason: string;
}

export interface RiskSummary {
  level: 'low' | 'moderate' | 'elevated';
  headline: string;
  points: RiskPoint[];
  generatedBy: 'ai' | 'demo';
}

export interface Application {
  id: Id;
  hireId: Id;
  kind: ApplicationKind;
  /** Landlord id for rental, bank id for bank_account. */
  partyId: Id;
  propertyId?: Id;
  state: ApplicationState;
  submittedAt?: IsoDateTime;
  disclosed: Disclosure[];
  employerBacked: boolean;
  risk?: RiskSummary;
}

export interface DecisionTerms {
  cheques?: number;
  note?: string;
}

export interface Decision {
  id: Id;
  applicationId: Id;
  outcome: 'approved' | 'info_requested' | 'terms_offered' | 'declined';
  terms?: DecisionTerms;
  note: string;
  decidedAt: IsoDateTime;
  decidedBy: string;
}

/* Trust and Guard */

/** A consent the newcomer has granted: one label to one destination. Mirrors Guard `/consent`. */
export interface Grant {
  id: Id;
  hireId: Id;
  label: DataLabel;
  destination: Destination;
  grantedAt: IsoDateTime;
}

export interface GuardCheck {
  id: Id;
  caseId: Id;
  at: IsoDateTime;
  tool: string;
  destination: Destination;
  decision: GuardDecision;
  /** Plain language, shown to users as is. */
  reason: string;
  /** Stable rule id. Shown only in the Guard log. */
  policyRule: string;
  blockedLabels: DataLabel[];
}

/* Company expansion */

export type JurisdictionKind = 'mainland' | 'adgm' | 'kezad' | 'masdar' | 'twofour54' | 'hub71';

export interface SetupOption {
  kind: JurisdictionKind;
  label: string;
  fit: 'strong' | 'possible' | 'weak';
  reasons: string[];
  tradeoffs: string[];
}

export interface SetupRecommendation {
  generatedBy: 'ai' | 'demo';
  recommended: JurisdictionKind;
  options: SetupOption[];
  /** Always shown with the recommendation. */
  disclaimer: string;
}

export interface Company {
  id: Id;
  /** Employer record the entity becomes once it can sponsor visas. */
  employerId: Id;
  name: string;
  homeCountry: string;
  industry: string;
  activities: string[];
  teamSize: number;
  timeline: string;
  recommendation?: SetupRecommendation;
  createdAt: IsoDateTime;
}

export const SETUP_STEP_KEYS = [
  'trade_name',
  'license',
  'office_lease',
  'establishment_card',
  'visa_quota',
  'entity_bank_account',
] as const;
export type SetupStepKey = (typeof SETUP_STEP_KEYS)[number];

export interface SetupStep {
  id: Id;
  companyId: Id;
  key: SetupStepKey;
  title: string;
  order: number;
  dependsOn: SetupStepKey[];
  status: StepStatus;
  reasoning: string;
  tammServiceId?: string;
  completedAt?: IsoDateTime;
}

export interface TeamMember {
  id: Id;
  companyId: Id;
  fullName: string;
  nationality: string;
  role: string;
  originCity: string;
  originCountry: string;
  family: Family;
  estMonthlySalaryAed: number;
  /** Set once the person has flowed into the relocation pipeline. */
  hireId?: Id;
}

/* State */

export interface AppState {
  rev: number;
  /** Demo clock: starts at `anchor` on reset and advances with real time. */
  clock: { anchor: IsoDateTime; resetAtMs: number };
  counters: Record<string, number>;
  employers: Record<Id, Employer>;
  landlords: Record<Id, Landlord>;
  banks: Record<Id, Bank>;
  properties: Record<Id, Property>;
  viewings: Record<Id, Viewing>;
  hires: Record<Id, Hire>;
  steps: Record<Id, Step>;
  documents: Record<Id, RelocationDocument>;
  agentActions: Record<Id, AgentAction>;
  approvals: Record<Id, Approval>;
  applications: Record<Id, Application>;
  decisions: Record<Id, Decision>;
  grants: Record<Id, Grant>;
  guardChecks: Record<Id, GuardCheck>;
  companies: Record<Id, Company>;
  setupSteps: Record<Id, SetupStep>;
  teamMembers: Record<Id, TeamMember>;
}
