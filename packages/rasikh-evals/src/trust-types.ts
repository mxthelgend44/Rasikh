/** Public Trust wire data. Only fixed keys, aggregate numbers, and safe provenance. */
export const TRUST_SCHEMA_VERSION = '1.0.0' as const;
export const TRUST_SECTION_IDS = ['core', 'guard', 'injection', 'documents', 'judge'] as const;
export type TrustSectionId = (typeof TRUST_SECTION_IDS)[number];
export type TrustStatus = 'pass' | 'fail' | 'incomplete';
export type TrustScope =
  | 'live_reference_model'
  | 'live_http'
  | 'mixed_live_controls'
  | 'live_vision'
  | 'live_model_judge'
  | 'unavailable';
export type TrustMetricScope =
  | 'live_reference_prompt'
  | 'deterministic'
  | 'live_http'
  | 'local_and_http_controls'
  | 'live_vision'
  | 'live_model_judge'
  | 'unmeasured';
export type TrustIssue =
  | 'missing'
  | 'unreadable'
  | 'malformed_json'
  | 'incompatible'
  | 'invalid_evidence'
  | 'stale'
  | 'future_timestamp'
  | 'not_live'
  | 'primary_live_required'
  | 'before_current_attempt'
  | 'incomplete_coverage'
  | 'request_errors'
  | 'failed_checks'
  | 'target_missed'
  | 'summary_source_mismatch';
export type TrustLimitation =
  | 'synthetic_evidence_only'
  | 'app_prompt_parity_unverified'
  | 'same_model_judge'
  | 'small_judge_calibration'
  | 'repeated_fixtures_are_not_independent_cohorts'
  | 'guard_reports_share_fixture_cohort'
  | 'authorization_is_not_executed_egress'
  | 'guard_policy_matrix_not_openappa'
  | 'no_unsafe_model_proposals_to_test_guard'
  | 'simulation_is_illustrative'
  | 'evaluated_contract_differs_from_main';

export const TRUST_METRIC_IDS = {
  core: [
    'extraction_field_accuracy',
    'roadmap_order_correctness',
    'roadmap_blocker_correctness',
    'engine_golden_correctness',
    'summary_fact_coverage',
    'summary_forbidden_content_rate',
    'summary_response_coverage',
    'guard_leak_rate',
    'guard_expected_denial_rate',
    'guard_verified_coverage',
  ],
  guard: [
    'authorization_leak_rate',
    'expected_denial_rate',
    'verified_coverage',
    'conformance_pass_rate',
  ],
  injection: [
    'model_hijack_rate',
    'model_coverage',
    'system_level_leak_rate',
    'end_to_end_unsafe_authorization_rate',
    'actual_unsafe_proposal_guard_coverage',
    'forced_control_leak_rate',
    'forced_control_verified_coverage',
    'guard_http_forced_control_leak_rate',
  ],
  documents: [
    'clean_accuracy',
    'clean_coverage',
    'degraded_accuracy',
    'degraded_coverage',
    'arabic_accuracy',
    'arabic_coverage',
  ],
  judge: [
    'calibration_accuracy',
    'calibration_recall',
    'calibration_coverage',
    'regex_calibration_accuracy',
    'semantic_summary_leak_rate',
    'summary_judge_coverage',
  ],
} as const;
export type TrustMetricId = (typeof TRUST_METRIC_IDS)[TrustSectionId][number];

export const TRUST_COUNT_IDS = {
  core: [
    'cases',
    'passed',
    'failed',
    'errors',
    'guard_checks',
    'guard_verified_checks',
    'guard_denials',
    'guard_allows',
  ],
  guard: [
    'unique_attacks',
    'unique_blocked_attacks',
    'unique_allowed_attacks',
    'repeated_checks',
    'repeated_verified_checks',
    'repeated_denials',
    'repeated_allows',
    'attack_errors',
    'conformance_passed',
    'conformance_failed',
    'conformance_errors',
    'conformance_skipped',
  ],
  injection: [
    'unique_fixtures',
    'model_planned',
    'model_evaluated',
    'model_errors',
    'guard_errors',
    'actual_outbound_actions_executed',
    'forced_control_checks',
    'forced_control_allows',
    'local_validator_checks',
    'local_validator_blocks',
    'guard_http_control_checks',
    'guard_http_control_blocks',
    'guard_http_control_allows',
  ],
  documents: [
    'unique_images',
    'planned_requests',
    'valid_responses',
    'request_errors',
    'incorrect_documents',
    'correct_fields',
    'planned_fields',
  ],
  judge: [
    'unique_hand_labelled_examples',
    'calibration_planned',
    'calibration_evaluated',
    'calibration_correct',
    'calibration_errors',
    'summaries_planned',
    'summaries_judged',
    'summary_errors',
    'semantic_summary_leaks',
    'regex_summary_leaks',
  ],
} as const;
export type TrustCountId = (typeof TRUST_COUNT_IDS)[TrustSectionId][number];
export type TrustFile =
  | 'REPORT.json'
  | 'GUARD_CONFORMANCE.json'
  | 'INJECTION.json'
  | 'DOCUMENTS.json'
  | 'JUDGE.json'
  | 'SIMULATION.json';

export interface TrustSource {
  file: TrustFile;
  sha256: string | null;
}
export interface TrustMetric {
  scope: TrustMetricScope;
  numerator: number | null;
  denominator: number | null;
  value: number | null;
  target: number | null;
  direction: 'higher' | 'lower';
  target_met: boolean | null;
  per_run_values: (number | null)[];
}
export interface TrustSection<S extends TrustSectionId = TrustSectionId> {
  scope: TrustScope;
  source: TrustSource;
  generated_at: string | null;
  model: string | null;
  run_count: number | null;
  status: TrustStatus;
  complete: boolean;
  issues: TrustIssue[];
  metrics: Record<(typeof TRUST_METRIC_IDS)[S][number], TrustMetric>;
  counts: Record<(typeof TRUST_COUNT_IDS)[S][number], number | null>;
}
export interface TrustDistribution {
  median: number;
  p10: number;
  p90: number;
  min: number;
  max: number;
}
export interface TrustSimulation {
  scope: 'illustrative_simulation' | 'unavailable';
  source: TrustSource;
  generated_at: string | null;
  status: 'modeled' | 'incomplete';
  complete: boolean;
  issues: TrustIssue[];
  illustrative: true;
  measured_customer_outcomes: false;
  assumption_basis: 'illustrative_unvalidated';
  seed: number | null;
  sample_count_per_journey: number | null;
  distributions: {
    target: 'fully_settled' | 'fully_operational';
    baseline_days: TrustDistribution;
    orchestrated_days: TrustDistribution;
    paired_days_saved: TrustDistribution;
  }[];
}
export interface TrustData {
  schema_version: '1.0.0';
  contract_version: string;
  generated_at: string;
  status: TrustStatus;
  complete: boolean;
  latest_live_available: boolean;
  security_failure_observed: boolean;
  evaluated_contract_version: string;
  main_contract_version: string | null;
  max_age_seconds: number;
  minimum_source_date: string | null;
  synthetic: true;
  app_prompt_parity: 'unverified';
  same_model_judge: boolean | null;
  limitations: TrustLimitation[];
  sections: { [S in TrustSectionId]: TrustSection<S> };
  simulation: TrustSimulation;
}

/** Exact JSON bytes bind the published hash to the original local evidence file. */
export type TrustEvidenceInput = { json: string } | { error: 'missing' | 'unreadable' };
export type TrustInputs = Partial<Record<TrustSectionId | 'simulation', TrustEvidenceInput>>;
export interface TrustBuildOptions {
  /** Inject a UTC ISO timestamp for reproducible tests; defaults to the current time. */
  now?: string;
  /** Evidence older than this is suppressed. Defaults to 24 hours. */
  maxAgeSeconds?: number;
  /** Suppresses older files after a failed current evaluation attempt. */
  minimumSourceDate?: string;
  /** Known merged-main snapshot; defaults to the explicitly recorded 1.1.0 baseline. */
  mainContractVersion?: string | null;
}
