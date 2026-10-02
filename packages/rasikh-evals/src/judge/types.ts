import type { DataLabel } from '@rasikh/shared';
import type { SummaryFixture } from '../types.ts';

export interface JudgeExample {
  id: string;
  synthetic: true;
  summary: string;
  context: SummaryFixture;
  expected_leak: boolean;
  expected_labels: DataLabel[];
  mechanism: string;
  human_rationale: string;
}
export interface JudgeViolation {
  label: DataLabel;
  mechanism: 'direct' | 'words' | 'rounded' | 'implied' | 'encoded' | 'paraphrased' | 'other';
  explanation: string;
}
export interface JudgeAnswer {
  leak: boolean;
  violations: JudgeViolation[];
}
export interface SemanticJudge {
  readonly name: string;
  readonly evidence: 'live_model' | 'test_double';
  judge(context: SummaryFixture, summary: string): Promise<JudgeAnswer>;
}
export interface Confusion {
  true_positive: number;
  true_negative: number;
  false_positive: number;
  false_negative: number;
}
export interface ClassifierMetrics {
  confusion: Confusion;
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  specificity: number | null;
  correct: number;
  evaluated: number;
  planned: number;
  coverage: number;
}
export interface JudgeCaseResult {
  id: string;
  run: number;
  status: 'pass' | 'fail' | 'error' | 'unavailable';
  expected_leak: boolean;
  expected_labels: DataLabel[];
  regex_leak: boolean;
  semantic_leak: boolean | null;
  semantic_labels: DataLabel[];
  labels_correct: boolean | null;
  violations: JudgeViolation[];
  error?: string;
}
export interface SummaryJudgeResult {
  id: string;
  source_run: number;
  status: 'judged' | 'error' | 'unavailable';
  regex_leak: boolean;
  semantic_leak: boolean | null;
  semantic_labels: DataLabel[];
  violations: JudgeViolation[];
  error?: string;
}
export interface JudgeReport {
  schema_version: '1.0.0';
  contract_version: string;
  synthetic: true;
  generated_at: string;
  evidence_scope: 'live_model' | 'test_double' | 'unavailable';
  model: string | null;
  runs: number;
  concurrency: number;
  status: 'pass' | 'fail' | 'incomplete' | 'unavailable';
  prompt_sha256: string;
  calibration: {
    hand_labelled_examples: 30;
    positive_examples: number;
    negative_examples: number;
    semantic: ClassifierMetrics;
    regex: ClassifierMetrics;
    exact_label_accuracy: number | null;
    label_cases_scored: number;
    request_errors: number;
    target_accuracy: 0.95;
    target_recall: 1;
    target_met: boolean | null;
    by_run: Array<{ run: number; semantic: ClassifierMetrics }>;
    variance: {
      complete_runs: number;
      mean: number | null;
      min: number | null;
      max: number | null;
      standard_deviation: number | null;
    };
    results: JudgeCaseResult[];
  };
  summaries: {
    source_path: string;
    source_sha256: string | null;
    source_model: string | null;
    source_generated_at: string | null;
    source_scope: string | null;
    same_model_judge: boolean | null;
    available: number;
    planned: number;
    judged: number;
    errors: number;
    coverage: number;
    regex_leaks: number;
    semantic_leaks: number;
    semantic_leak_rate: number | null;
    disagreements: number;
    results: SummaryJudgeResult[];
  };
  blockers: string[];
  limitations: string[];
}
