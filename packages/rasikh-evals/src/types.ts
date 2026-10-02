import type { DataLabel, Destination, GuardDecision, PayloadRef } from '@rasikh/shared';
import type { planRoadmap, getBlockers } from '@rasikh/engine';

export type Mode = 'demo' | 'live';
export type CaseInput = Parameters<typeof planRoadmap>[0];
export type CaseState = Parameters<typeof getBlockers>[0];
export type Scalar = string | number | boolean | null;
export interface DocumentFixture {
  id: string;
  case_id: string;
  synthetic: true;
  kind: 'passport' | 'offer_letter' | 'degree_certificate' | 'bank_statement';
  text: string;
  expected: Record<string, Scalar>;
}
export interface BlockerSnapshot {
  step_id: string;
  unmet_dependencies: string[];
  missing_documents: DataLabel[];
}
export interface RoadmapAnswer {
  step_ids: string[];
  blockers: BlockerSnapshot[];
}
export interface RoadmapFixture {
  id: string;
  synthetic: true;
  state: CaseState;
  expected: RoadmapAnswer;
}
export interface Fact {
  id: string;
  any_of: string[];
  contradictions?: string[];
}
export interface ForbiddenContent {
  id: string;
  patterns: string[];
}
export interface SummaryFixture {
  id: string;
  case_id: string;
  synthetic: true;
  destination: 'landlord' | 'bank';
  allowed_facts: Record<string, Scalar>;
  sensitive_data: Record<string, Scalar>;
  consent_labels: DataLabel[];
  required_facts: Fact[];
  forbidden: ForbiddenContent[];
}
export interface GuardFixture {
  id: string;
  case_id: string;
  synthetic: true;
  attack: string;
  kind: 'direct' | 'indirect';
  observed: PayloadRef[];
  outbound: {
    tool: string;
    destination: Destination;
    data_labels: DataLabel[];
    payload_refs: PayloadRef[];
  };
  expected: 'deny';
}
export interface AiAdapter {
  readonly name: string;
  extract(fixture: DocumentFixture): Promise<Record<string, unknown>>;
  roadmap(fixture: RoadmapFixture, groundTruth: RoadmapAnswer): Promise<RoadmapAnswer>;
  summarize(fixture: SummaryFixture): Promise<string>;
}
export interface GuardOutcome {
  decision: GuardDecision;
  source: 'cached' | 'http' | 'fail_closed';
  verified: boolean;
  contract_version?: string;
  policy_rule?: string;
  error?: string;
}
export interface GuardAdapter {
  readonly name: string;
  check(fixture: GuardFixture): Promise<GuardOutcome>;
}
export interface CaseResult {
  id: string;
  suite: 'extraction' | 'roadmap' | 'summary' | 'guard';
  status: 'pass' | 'fail' | 'error';
  evidence: Record<string, unknown>;
  error?: string;
}
export interface Metric {
  value: number | null;
  numerator: number;
  denominator: number;
  unit: 'ratio';
  target: number;
  higher_is_better: boolean;
}
export interface EvalReport {
  schema_version: '1.0.0';
  contract_version: string;
  generated_at: string;
  mode: Mode;
  synthetic: true;
  adapters: { ai: string; guard: string };
  validation_scope: {
    ai: 'synthetic_cache' | 'reference_model' | 'app_transport' | 'custom_adapter';
    engine: 'static_golden_regression';
    guard: 'synthetic_cache' | 'http' | 'unavailable' | 'mixed';
    complete_live_evidence: boolean;
  };
  status: 'pass' | 'fail' | 'incomplete';
  totals: { cases: number; passed: number; failed: number; errors: number };
  metrics: Record<string, Metric>;
  guard: {
    attacks: number;
    cached_denials: number;
    verified_denials: number;
    verified_checks: number;
    non_denials: number;
    leaks: number;
    errors: number;
    coverage: number;
  };
  notes: string[];
  results: CaseResult[];
}
