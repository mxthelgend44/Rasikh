/** Rasikh Guard sidecar wire types. INTEGRATION.md section 3. */

import type { DataLabel, Destination, GuardDecision, PayloadRef } from './contract';

export interface GuardHealthResponse {
  contract_version: string;
  status: 'ok';
  upstream_commit: string;
}

export interface GuardSessionRequest {
  case_id: string;
  /** The contract only shows "hire". Values for company cases are an open question (DECISIONS.md). */
  case_type: string;
}

export interface GuardSessionResponse {
  contract_version: string;
  session_id: string;
}

export interface GuardObserveRequest {
  session_id: string;
  source: Destination;
  payload_refs: PayloadRef[];
}

export interface GuardObserveResponse {
  contract_version: string;
  recorded: boolean;
}

export interface GuardCheckRequest {
  session_id: string;
  tool: string;
  destination: Destination;
  data_labels: DataLabel[];
  payload_refs: PayloadRef[];
}

export interface GuardConsentRequestInfo {
  label: DataLabel;
  destination: Destination;
}

export interface GuardCheckResponse {
  contract_version: string;
  check_id: string;
  decision: GuardDecision;
  /** Plain language, shown to users as is. */
  reason: string;
  /** Stable rule id. Shown only in the Guard log. */
  policy_rule: string;
  /** Only the labels that caused a non-allow decision. */
  blocked_labels: DataLabel[];
  /** Present only when decision is "needs_consent". */
  consent_request?: GuardConsentRequestInfo;
}

export interface GuardConsentRequest {
  session_id: string;
  label: DataLabel;
  destination: Destination;
  granted_by: 'newcomer';
  expires_at: string | null;
}

export interface GuardConsentResponse {
  contract_version: string;
  consent_id: string;
  active: boolean;
}

export interface GuardLogEntry {
  check_id: string;
  /** ISO 8601 with offset, e.g. 2026-10-10T09:41:12+04:00. */
  at: string;
  tool: string;
  destination: Destination;
  decision: GuardDecision;
  reason: string;
  policy_rule: string;
}

export interface GuardLogResponse {
  contract_version: string;
  /** Newest first. */
  entries: GuardLogEntry[];
}
