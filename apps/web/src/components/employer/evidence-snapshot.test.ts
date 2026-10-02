import { describe, expect, it } from 'vitest';
import evidenceSnapshot from './evidence-snapshot.json';

describe('employer historical evaluation evidence', () => {
  it('keeps failure, incomplete coverage and unverified app parity explicit', () => {
    expect(evidenceSnapshot.kind).toBe('historical_evaluation_snapshot');
    expect(evidenceSnapshot.trust.status).toBe('fail');
    expect(evidenceSnapshot.trust.complete).toBe(false);
    expect(evidenceSnapshot.trust.synthetic).toBe(true);
    expect(evidenceSnapshot.trust.appPromptParity).toBe('unverified');
    expect(evidenceSnapshot.model.appPromptsAvailableAtSnapshot).toBe(false);
    expect(evidenceSnapshot.model.promptScope).toBe('reference_prompt');
    expect(evidenceSnapshot.model.model).toBe('vertex:gemini-3.8-flash');
    expect(evidenceSnapshot.trust.evaluatedContract).not.toBe(
      evidenceSnapshot.trust.mainContractAtSnapshot,
    );
  });

  it('preserves measured unsafe allows without combining repeated fixture cohorts', () => {
    expect(evidenceSnapshot.guard.status).toBe('fail');
    expect(evidenceSnapshot.guard.runs).toHaveLength(3);
    for (const run of evidenceSnapshot.guard.runs) {
      expect(run.attacks).toBe(25);
      expect(run.verified).toBe(25);
      expect(run.denied).toBe(13);
      expect(run.unsafeAllows).toBe(12);
      expect(run.denied + run.unsafeAllows + run.errors).toBe(run.attacks);
      expect(run.failedConformance).toEqual([
        'fresh_ref_observed_flow',
        'wrong_method_response_version',
      ]);
    }
    expect(evidenceSnapshot.trust.limitations).toContain(
      'repeated_fixtures_are_not_independent_cohorts',
    );
    expect(evidenceSnapshot.trust.limitations).toContain('authorization_is_not_executed_egress');
  });

  it('carries separate source identity and time for each archived measurement', () => {
    for (const source of [
      evidenceSnapshot.trust,
      evidenceSnapshot.guard,
      evidenceSnapshot.model,
    ]) {
      expect(source.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(source.source).toMatch(/^packages\/rasikh-evals\/evals\/.+\.json$/);
      expect(Number.isFinite(Date.parse(source.generatedAt))).toBe(true);
    }
    expect(evidenceSnapshot.guard.generatedAt).not.toBe(evidenceSnapshot.model.generatedAt);
    expect(evidenceSnapshot.model.extraction).toEqual({ correct: 315, total: 315 });
    expect(evidenceSnapshot.model.summary).toEqual({ correct: 180, total: 180 });
  });
});
