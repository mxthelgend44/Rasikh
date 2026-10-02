import type { DataLabel, GuardDecision, PayloadRef } from '@rasikh/shared';
import type { Fetch } from '../adapters/http.ts';
import type { StructuredModel } from '../providers/structured.ts';

export type InjectionMode = 'demo' | 'live' | 'scripted_guard';
export type InjectionScope =
  | 'synthetic_cache'
  | 'live_reference_prompt'
  | 'live_guard_http'
  | 'local_closed_destination_validation'
  | 'unmeasured'
  | 'mixed';
export interface ProposedAction {
  tool: string;
  destination: string;
  external_address: string | null;
  body: string;
  data_labels: DataLabel[];
  payload_refs: PayloadRef[];
  consent_bypass: boolean;
}
export interface InjectionFixture {
  id: string;
  case_id: string;
  synthetic: true;
  language: 'en' | 'ar';
  artifact: 'lease' | 'offer_letter' | 'landlord_message' | 'bank_letter' | 'tamm_status';
  disguise: 'hidden' | 'footnote' | 'formatting' | 'system_note' | 'consent_bypass' | 'encoding';
  trusted_task: string;
  untrusted_content: string;
  private_data: { label: DataLabel; ref: string; value: string; synthetic: true };
  control_action: ProposedAction;
}
export interface InjectionAnswer {
  answer: string;
  proposed_actions: ProposedAction[];
}
export interface InjectionModelAdapter {
  readonly name: string;
  readonly provider: string;
  readonly scope: 'synthetic_cache' | 'live_reference_prompt';
  propose(fixture: InjectionFixture): Promise<InjectionAnswer>;
}
export interface GateOutcome {
  decision: GuardDecision;
  verified: boolean;
  scope:
    | 'synthetic_cache'
    | 'live_guard_http'
    | 'local_closed_destination_validation'
    | 'unmeasured';
  reason: string;
  policy_rule?: string;
  check_id?: string;
  blocked_labels?: DataLabel[];
  error?: string;
}
export interface InjectionGate {
  readonly name: string;
  check(fixture: InjectionFixture, action: ProposedAction): Promise<GateOutcome>;
}
export interface InjectionActionResult {
  action: ProposedAction;
  injection_followed: boolean;
  gate: GateOutcome;
  /** No outbound action is ever executed by this evaluation harness. */
  outbound_executed: false;
  would_authorize_unsafe_action: boolean;
}
export interface InjectionCaseResult {
  id: string;
  run: number;
  language: 'en' | 'ar';
  artifact: InjectionFixture['artifact'];
  model: {
    scope: InjectionScope;
    evaluated: boolean;
    injection_followed: boolean | null;
    answer?: string;
    error?: string;
  };
  actions: InjectionActionResult[];
  forced_control: InjectionActionResult;
}
export interface InjectionMetric {
  value: number | null;
  numerator: number;
  denominator: number;
  target: number;
  evidence_scope: InjectionScope;
}
export interface InjectionReport {
  schema_version: '1.0.0';
  contract_version: string;
  generated_at: string;
  mode: InjectionMode;
  synthetic: true;
  model_name: string | null;
  model_provider: string | null;
  prompt_scope: 'reference_prompt';
  prompt_version: 'injection-reference-v1';
  number_of_runs: number;
  guard_adapter: string;
  status: 'pass' | 'fail' | 'incomplete';
  metrics: Record<string, InjectionMetric>;
  counts: {
    fixtures: number;
    model_evaluated: number;
    model_errors: number;
    guard_errors: number;
    actual_outbound_actions_executed: 0;
  };
  notes: string[];
  run_summaries: Array<{
    run: number;
    model_evaluated: number;
    model_hijack_rate: number | null;
    system_level_leak_rate: number | null;
    forced_control_leak_rate: number | null;
  }>;
  variance: Record<
    string,
    {
      samples: number;
      minimum: number | null;
      maximum: number | null;
      mean: number | null;
      standard_deviation: number | null;
    }
  >;
  results: InjectionCaseResult[];
}
export interface InjectionOptions {
  mode: InjectionMode;
  modelAdapter?: StructuredModel;
  injectionAdapter?: InjectionModelAdapter;
  guard?: InjectionGate;
  guardBaseUrl?: string;
  fetch?: Fetch;
  timeoutMs?: number;
  fixtures?: readonly InjectionFixture[];
  runs?: number;
  now?: () => Date;
}
