import type { DataLabel, Destination, PayloadRef } from '@rasikh/shared';

export type AiMode = 'demo' | 'live';

export const DOCUMENT_KINDS = ['passport', 'emirates_id', 'bank_statement', 'degree'] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

/** Labels each document kind carries. Offer letters are out of scope: salary may only reach the model redacted. */
export const KIND_LABELS: Record<DocumentKind, DataLabel[]> = {
  passport: ['passport'],
  emirates_id: ['emirates_id'],
  bank_statement: ['bank_statement'],
  degree: ['degree'],
};

/** What the Guard answered, or why we refused to proceed without an answer. */
export interface GuardVerdict {
  decision: 'allow' | 'deny' | 'needs_consent';
  /** Plain language, safe to show the user. */
  reason: string;
  policy_rule: string | null;
  check_id: string | null;
  contract_version: string | null;
  consent_request?: { label: DataLabel; destination: Destination };
  /** "guard": Guard answered. "fail_closed": we could not get a valid answer, which is NOT a policy denial. */
  source: 'guard' | 'fail_closed';
}

export interface GuardPort {
  startSession(caseId: string): Promise<string>;
  observe(sessionId: string, source: Destination, refs: PayloadRef[]): Promise<void>;
  check(request: {
    sessionId: string;
    tool: string;
    destination: Destination;
    labels: DataLabel[];
    refs: PayloadRef[];
  }): Promise<GuardVerdict>;
}

export interface Provenance {
  mode: AiMode;
  /** "none" means no model provider was contacted. */
  provider: 'openai' | 'none';
  model: string | null;
  live_model_call: boolean;
  schema_version: string;
  prompt_sha256: string;
  /** Existing Vertex/synthetic evaluations do not measure this provider. */
  evaluation: { openai_extraction_eval: 'not_run'; note: string };
}

export interface ModelField {
  value: string | number | null;
  /** Verbatim text from the document supporting the value. */
  evidence: string | null;
  confidence: number;
}
export type ModelFields = Record<string, ModelField>;

export interface ExtractorPort {
  readonly provenance: Provenance;
  extract(input: { kind: DocumentKind; text: string; fields: readonly string[] }): Promise<unknown>;
}

export interface ReviewField {
  name: string;
  /** An extracted fact, not a verified one, until the newcomer confirms it. */
  category: 'extracted_fact';
  value: string | number | null;
  evidence: string | null;
  confidence: number;
  status: 'ok' | 'needs_review' | 'missing';
  issue?: 'evidence_not_in_document';
}

export interface RoadmapGrounding {
  step_id: string;
  unmet_dependencies: string[];
  missing_documents: DataLabel[];
}

export interface RoadmapEnginePort {
  nextAction(input: { caseId: string; documents: PayloadRef[] }): RoadmapGrounding | null;
  estimateRemainingDays(input: { caseId: string; documents: PayloadRef[] }): number;
}

export interface Recommendation {
  /** Recommendation, as distinct from extracted facts and estimates. */
  category: 'recommendation';
  summary: string;
  grounded_in: { engine: 'rasikh-engine'; step_id: string; missing_documents: DataLabel[] };
}
export interface Estimate {
  category: 'estimate';
  illustrative: true;
  remaining_days: number;
  note: string;
}

export interface ActionProposal {
  proposal_id: string;
  tool: 'request_document';
  destination: Destination;
  requested_label: DataLabel;
  step_id: string;
  /** Binds approval to this exact action. */
  digest: string;
}

export interface ActionResult {
  delivered: boolean;
  reference: string;
}
export interface ActionToolPort {
  /** Only ever called after the human approved and Guard allowed. */
  execute(proposal: ActionProposal): Promise<ActionResult>;
}

export type Blocked =
  | { code: 'guard_denied' | 'guard_needs_consent' | 'guard_unavailable'; guard: GuardVerdict }
  | { code: 'provider_unavailable' | 'consent_required' | 'invalid_model_output'; message: string };

export type JourneyStatus =
  | 'blocked'
  | 'awaiting_review'
  | 'awaiting_approval'
  | 'complete_no_action'
  | 'rejected'
  | 'executed';

export interface JourneyRecord {
  id: string;
  case_id: string;
  guard_session_id: string;
  status: JourneyStatus;
  doc_ref: PayloadRef;
  kind: DocumentKind;
  fields: ReviewField[];
  provenance: Provenance;
  confirmed?: Record<string, { value: string | number | null; source: 'model' | 'user_corrected' }>;
  proposal?: ActionProposal;
  recommendation?: Recommendation;
  estimate?: Estimate;
  blocked?: Blocked;
  action_result?: ActionResult;
}

export interface AuditRecord {
  at: string;
  journey_id: string;
  event:
    | 'extraction_checked'
    | 'extraction_completed'
    | 'extraction_rejected'
    | 'review_confirmed'
    | 'action_checked'
    | 'action_executed'
    | 'action_declined';
  tool?: string;
  destination?: Destination;
  labels?: DataLabel[];
  decision?: GuardVerdict['decision'];
  decision_source?: GuardVerdict['source'];
  policy_rule?: string | null;
  check_id?: string | null;
  contract_version?: string | null;
  mode?: AiMode;
  provider?: Provenance['provider'];
  model?: string | null;
  live_model_call?: boolean;
  outcome?: string;
}
export interface AuditSink {
  record(entry: AuditRecord): void;
}
