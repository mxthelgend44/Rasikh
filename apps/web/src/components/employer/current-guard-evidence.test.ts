import { describe, expect, it } from 'vitest';
import current from './current-guard-evidence.json';
import archived from './evidence-snapshot.json';

describe('dated deployed Guard HTTP evidence', () => {
  it('pins the separate measured source, time, wire contract and revision', () => {
    expect(current.kind).toBe('dated_deployed_guard_http_snapshot');
    expect(current.source.sha256).toBe(
      '74481d43929d414658abfe9dd96d9ec9122cd509727e27d35c2f211704d49071',
    );
    expect(current.source.path).toBe('docs/evidence/guard-current-release-1.2.json');
    expect(current.wireContract).toBe('1.2.0');
    expect(current.deployment.revision).toBe('rasikh-guard-00002-ff2');
    expect(current.scope).toBe('live_http');
    expect(Date.parse(current.startedAt)).toBeGreaterThan(Date.parse(archived.trust.generatedAt));
    expect(Date.parse(current.completedAt)).toBeGreaterThan(Date.parse(current.startedAt));
  });

  it('retains verified denials, skipped reset probes and total reconciliation', () => {
    expect(current.status).toBe('pass');
    expect(current.runs).toHaveLength(3);
    for (const run of current.runs) {
      expect(run.synthetic).toBe(true);
      expect(run.attacks).toBe(25);
      expect(run.verified).toBe(25);
      expect(run.denied).toBe(25);
      expect(run.unsafeAllows).toBe(0);
      expect(run.errors).toBe(0);
      expect(run.conformance).toEqual({
        passed: 33,
        failed: 0,
        errors: 0,
        skipped: 1,
        skippedCases: ['demo_reset_disabled'],
      });
    }
    expect(current.totals.verified_denials).toBe(
      current.runs.reduce((total, run) => total + run.denied, 0),
    );
    expect(current.totals.attack_attempts).toBe(
      current.runs.reduce((total, run) => total + run.attacks, 0),
    );
    expect(current.totals.conformance_passed).toBe(99);
    expect(current.totals.conformance_skipped).toBe(3);
    expect(current.execution).toEqual({
      modelOrVertexCalls: 0,
      resetRequests: 0,
      excludedAncillaryIncluded: false,
    });
  });

  it('does not overwrite the archived failed Trust evidence or app parity limits', () => {
    expect(archived.trust.status).toBe('fail');
    expect(archived.trust.complete).toBe(false);
    expect(archived.trust.appPromptParity).toBe('unverified');
    expect(current.archivedEvidence.allUnchanged).toBe(true);
    expect(current.archivedEvidence.fileCount).toBe(22);
    for (const prior of [archived.trust, archived.guard, archived.model]) {
      expect(current.archivedEvidence.sources).toContainEqual({
        path: prior.source,
        sha256: prior.sha256,
        unchanged: true,
      });
    }
    expect(current.limitations).toContain(
      'No model or Vertex calls were made; model obedience, current-app full security and end-to-end exfiltration were not measured.',
    );
  });
});
