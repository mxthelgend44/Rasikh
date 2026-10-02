/**
 * TAMM MCP tool wire types. INTEGRATION.md section 4.
 *
 * Every response carries `mock: true`. The UI never displays it; code and docs always state it.
 * Fees and durations are illustrative and carry `illustrative: true`.
 */

import type {
  ApplicationStatus,
  Audience,
  DataLabel,
  GuardDecision,
  PayloadRef,
} from './contract';

export const TAMM_TOOLS = [
  'search_services',
  'get_service_requirements',
  'start_application',
  'get_application_status',
  'check_trade_name',
  'register_tenancy_tawtheeq',
] as const;
export type TammTool = (typeof TAMM_TOOLS)[number];

export interface TammResponseBase {
  contract_version: string;
  mock: true;
}

export interface IllustrativeNumber {
  value: number;
  illustrative: true;
}

export interface UaePassLoginRequest {
  subject_ref: string;
  audience: Audience;
}

export interface UaePassLoginResponse {
  contract_version: string;
  uaepass_session: string;
  simulated: true;
}

export interface SearchServicesInput {
  query: string;
  audience: Audience;
  uaepass_session: string;
}

export interface TammServiceSummary {
  service_id: string;
  name: string;
  entity: string;
  audience: Audience;
  tags: string[];
}

export interface SearchServicesOutput extends TammResponseBase {
  results: TammServiceSummary[];
}

export interface GetServiceRequirementsInput {
  service_id: string;
  uaepass_session: string;
}

export interface RequiredDocument {
  label: DataLabel;
  description: string;
}

export interface GetServiceRequirementsOutput extends TammResponseBase {
  service_id: string;
  required_documents: RequiredDocument[];
  depends_on: string[];
  est_fee_aed: IllustrativeNumber;
  est_duration_days: IllustrativeNumber;
}

export interface StartApplicationInput {
  service_id: string;
  applicant_ref: string;
  documents: PayloadRef[];
  uaepass_session: string;
  guard_session_id: string;
}

export interface StartApplicationSuccess extends TammResponseBase {
  application_id: string;
  status: ApplicationStatus;
}

export interface StartApplicationDenied extends TammResponseBase {
  denied: true;
  guard: {
    decision: GuardDecision;
    reason: string;
    policy_rule: string;
  };
}

export type StartApplicationOutput = StartApplicationSuccess | StartApplicationDenied;

export interface GetApplicationStatusInput {
  application_id: string;
  uaepass_session: string;
}

export interface ApplicationHistoryEntry {
  status: ApplicationStatus;
  at: string;
}

export interface NeedsInfo {
  message: string;
  required_labels: DataLabel[];
}

export interface GetApplicationStatusOutput extends TammResponseBase {
  application_id: string;
  status: ApplicationStatus;
  history: ApplicationHistoryEntry[];
  needs_info: NeedsInfo | null;
}

export interface CheckTradeNameInput {
  name: string;
  uaepass_session: string;
}

export interface CheckTradeNameOutput extends TammResponseBase {
  name: string;
  available: boolean;
  notes: string;
}

export interface RegisterTenancyTawtheeqInput {
  lease_ref: string;
  applicant_ref: string;
  uaepass_session: string;
  guard_session_id: string;
}

export type RegisterTenancyTawtheeqOutput = StartApplicationOutput;
