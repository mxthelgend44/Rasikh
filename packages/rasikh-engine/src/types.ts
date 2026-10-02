import type { DataLabel, IllustrativeNumber, PayloadRef } from '@rasikh/shared';

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };
export interface StructuredReason {
  criterion: string;
  value: JsonValue;
  effect: number | string;
  explanation_key: string;
}
export type Journey =
  | 'individual_relocation'
  | 'family_relocation'
  | 'company_setup'
  | 'team_transfer';
export type SetupPath = 'mainland' | 'adgm' | 'kezad' | 'masdar' | 'twofour54';
export interface CaseInput {
  case_id: string;
  journey: Journey;
  setup_path?: SetupPath;
  employee_ids?: string[];
  /** Caller-supplied verified readiness, never an engine legal determination. */
  sponsoring_entity_ready?: boolean;
}
export interface StepDefinition {
  id: string;
  title_key: string;
  depends_on: string[];
  required_documents: DataLabel[];
  parties: string[];
  estimated_duration_days: IllustrativeNumber;
  illustrative: true;
  terminal?: boolean;
  external?: boolean;
  subject_ref?: string;
  reasons: StructuredReason[];
}
export type StepStatus = 'pending' | 'in_progress' | 'waiting' | 'completed';
export interface StepState {
  step_id: string;
  status: StepStatus;
  /** ISO-8601 timestamp with timezone; the engine never reads the clock. */
  since: string;
}
export interface CaseState {
  input: CaseInput;
  completed_step_ids: string[];
  documents: PayloadRef[];
  /** Team employee steps use only their own entry; absent entries mean no documents. */
  documents_by_subject?: Record<string, PayloadRef[]>;
  step_states?: StepState[];
  as_of?: string;
}
export interface ResultBase {
  contract_version: string;
  illustrative: true;
  reasons: StructuredReason[];
}
export interface RoadmapResult extends ResultBase {
  case_id: string;
  journey: Journey;
  steps: StepDefinition[];
}
export interface BlockedStep {
  step_id: string;
  unmet_dependencies: string[];
  missing_documents: DataLabel[];
  reasons: StructuredReason[];
}
export interface BlockersResult extends ResultBase {
  case_id: string;
  blockers: BlockedStep[];
}
export interface UnlocksResult extends ResultBase {
  step_id: string;
  /** Direct dependants; completing the source meets one dependency, not all. */
  directly_enables: string[];
  /** All transitive dependants, in roadmap order. */
  eventually_enables: string[];
}
export interface CriticalPathResult extends ResultBase {
  case_id: string;
  target_step_id: string;
  step_ids: string[];
  estimated_remaining_days: IllustrativeNumber;
}
export type RiskLevel = 'on_track' | 'at_risk' | 'stuck';
export interface RiskAction {
  action_key: string;
  step_id: string;
  dependency_id?: string;
  document_label?: DataLabel;
}
export interface RiskFinding {
  step_id: string;
  level: Exclude<RiskLevel, 'on_track'>;
  reason: StructuredReason;
  next_action: RiskAction;
}
export interface RiskResult extends ResultBase {
  case_id: string;
  risk_level: RiskLevel;
  findings: RiskFinding[];
}
export interface RiskConfig {
  /** At risk after the illustrative window; stuck after this multiple. */
  stuck_window_multiplier: number;
}
