import { fileURLToPath } from 'node:url';
import { planRoadmap, getBlockers } from '@rasikh/engine';
import { CONTRACT_VERSION } from '@rasikh/shared';
import { documentFixtures } from './fixtures/documents.ts';
import { roadmapFixtures } from './fixtures/roadmaps.ts';
import { summaryFixtures } from './fixtures/summaries.ts';
import { guardFixtures } from './fixtures/guard.ts';
import { AppHttpAdapter } from './adapters/app.ts';
import { DemoAiAdapter, DemoGuardAdapter } from './adapters/demo.ts';
import { HttpGuardAdapter } from './adapters/guard.ts';
import { OpenAiAdapter } from './adapters/openai.ts';
import { VertexAiAdapter } from './adapters/vertex.ts';
import { PROMPT_PROVENANCE } from './prompts/profiles.ts';
import { parallelMap } from './concurrency.ts';
import { roadmapAnswer } from './adapters/validate.ts';
import { record } from './adapters/http.ts';
import { safeDiagnostic } from './adapters/errors.ts';
import { ratio, scoreExtraction, scoreRoadmap, scoreSummary } from './metrics.ts';
import { writeReport } from './report.ts';
import type {
  AiAdapter,
  CaseResult,
  EvalReport,
  GuardAdapter,
  Mode,
  RoadmapAnswer,
} from './types.ts';

export interface EvalOptions {
  mode?: Mode;
  aiAdapter?: AiAdapter;
  guardAdapter?: GuardAdapter;
  guardMode?: 'cached' | 'http';
  outputDirectory?: string;
  write?: boolean;
  concurrency?: number;
  provider?: 'vertex' | 'openai';
}

function liveAi(provider: 'vertex' | 'openai' = 'vertex'): AiAdapter {
  if (process.env.RASIKH_EVAL_APP_URL)
    return new AppHttpAdapter(process.env.RASIKH_EVAL_APP_URL, {
      token: process.env.RASIKH_EVAL_APP_TOKEN,
    });
  if (provider === 'vertex') return new VertexAiAdapter();
  return new OpenAiAdapter({
    apiKey: process.env.OPENAI_API_KEY ?? '',
    model: process.env.OPENAI_MODEL ?? '',
  });
}
const safeError = safeDiagnostic;

export async function runEvaluations(options: EvalOptions = {}): Promise<EvalReport> {
  const mode = options.mode ?? 'demo';
  if (mode !== 'demo' && mode !== 'live') throw new Error('Evaluation mode must be demo or live.');
  if (mode === 'live' && options.guardMode === 'cached')
    throw new Error('Live mode requires HTTP Guard evidence, not cached checks.');
  // Configuration errors stop before any calls or report writes.
  const ai =
    options.aiAdapter ?? (mode === 'demo' ? new DemoAiAdapter() : liveAi(options.provider));
  const guard =
    options.guardAdapter ??
    (mode === 'live' || options.guardMode === 'http'
      ? new HttpGuardAdapter()
      : new DemoGuardAdapter());
  const results: CaseResult[] = [];
  let fieldsCorrect = 0,
    orderCorrect = 0,
    blockersCorrect = 0,
    goldensCorrect = 0,
    factsCovered = 0,
    forbiddenSummaries = 0,
    summariesAnswered = 0;
  const guardCounts = {
    attacks: guardFixtures.length,
    cached_denials: 0,
    verified_denials: 0,
    verified_checks: 0,
    non_denials: 0,
    leaks: 0,
    errors: 0,
    coverage: 0,
  };
  await parallelMap(documentFixtures, options.concurrency ?? 4, async (fixture) => {
    try {
      const answer = record(await ai.extract(fixture), 'Extraction answer');
      const score = scoreExtraction(fixture, answer);
      fieldsCorrect += score.correct;
      results.push({
        id: fixture.id,
        suite: 'extraction',
        status: score.exact ? 'pass' : 'fail',
        evidence: score,
      });
    } catch (error) {
      results.push({
        id: fixture.id,
        suite: 'extraction',
        status: 'error',
        evidence: {},
        error: safeError(error),
      });
    }
  });
  for (const fixture of roadmapFixtures) {
    try {
      const plan = planRoadmap(fixture.state.input);
      const blockers = getBlockers(fixture.state);
      if (
        plan.contract_version !== CONTRACT_VERSION ||
        blockers.contract_version !== CONTRACT_VERSION
      )
        throw new Error('Engine contract version mismatch.');
      const groundTruth: RoadmapAnswer = {
        step_ids: plan.steps.map((step) => step.id),
        blockers: blockers.blockers.map((blocker) => ({
          step_id: blocker.step_id,
          unmet_dependencies: blocker.unmet_dependencies,
          missing_documents: blocker.missing_documents,
        })),
      };
      const golden = scoreRoadmap(fixture.expected, groundTruth);
      if (golden.order_correct && golden.blockers_correct) goldensCorrect++;
      const answer = roadmapAnswer(await ai.roadmap(fixture, groundTruth));
      const score = scoreRoadmap(groundTruth, answer);
      if (score.order_correct) orderCorrect++;
      if (score.blockers_correct) blockersCorrect++;
      results.push({
        id: fixture.id,
        suite: 'roadmap',
        status:
          golden.order_correct &&
          golden.blockers_correct &&
          score.order_correct &&
          score.blockers_correct
            ? 'pass'
            : 'fail',
        evidence: {
          ...score,
          engine_golden_order_correct: golden.order_correct,
          engine_golden_blockers_correct: golden.blockers_correct,
          ...(!golden.order_correct || !golden.blockers_correct
            ? { expected: fixture.expected, engine_actual: groundTruth }
            : {}),
        },
      });
    } catch (error) {
      results.push({
        id: fixture.id,
        suite: 'roadmap',
        status: 'error',
        evidence: {},
        error: safeError(error),
      });
    }
  }
  await parallelMap(summaryFixtures, options.concurrency ?? 4, async (fixture) => {
    try {
      const answer = await ai.summarize(fixture);
      if (typeof answer !== 'string' || !answer.trim())
        throw new Error('Summary answer is empty or invalid.');
      const score = scoreSummary(fixture, answer);
      summariesAnswered++;
      factsCovered += score.covered;
      if (score.violations.length) forbiddenSummaries++;
      results.push({
        id: fixture.id,
        suite: 'summary',
        status: score.covered === score.total && score.violations.length === 0 ? 'pass' : 'fail',
        evidence: {
          ...score,
          ...(mode === 'live' ? { summary: answer, synthetic_source: true } : {}),
        },
      });
    } catch (error) {
      results.push({
        id: fixture.id,
        suite: 'summary',
        status: 'error',
        evidence: {},
        error: safeError(error),
      });
    }
  });
  for (const fixture of guardFixtures) {
    try {
      const outcome = await guard.check(fixture);
      if (!['allow', 'deny', 'needs_consent'].includes(outcome.decision))
        throw new Error('Guard decision invalid.');
      if (outcome.error || outcome.source === 'fail_closed') {
        guardCounts.errors++;
        results.push({
          id: fixture.id,
          suite: 'guard',
          status: 'error',
          evidence: { ...outcome, attack_kind: fixture.kind },
          error: safeDiagnostic(outcome.error ?? 'Guard failed closed without policy evidence.'),
        });
        continue;
      }
      if (
        outcome.source === 'http' &&
        outcome.verified &&
        outcome.contract_version === CONTRACT_VERSION
      ) {
        guardCounts.verified_checks++;
        if (outcome.decision === 'deny') guardCounts.verified_denials++;
        if (outcome.decision !== 'deny') guardCounts.non_denials++;
        if (outcome.decision === 'allow') guardCounts.leaks++;
      } else if (outcome.source === 'cached' && !outcome.verified && mode === 'demo') {
        if (outcome.decision === 'deny') guardCounts.cached_denials++;
      } else throw new Error('Guard returned unverified or incompatible evidence.');
      results.push({
        id: fixture.id,
        suite: 'guard',
        status: outcome.decision === fixture.expected ? 'pass' : 'fail',
        evidence: { ...outcome, attack_kind: fixture.kind },
      });
    } catch (error) {
      guardCounts.errors++;
      results.push({
        id: fixture.id,
        suite: 'guard',
        status: 'error',
        evidence: {
          decision: 'deny',
          source: 'fail_closed',
          verified: false,
          attack_kind: fixture.kind,
        },
        error: safeError(error),
      });
    }
  }
  guardCounts.coverage = guardCounts.verified_checks / guardCounts.attacks;
  const totals = {
    cases: results.length,
    passed: results.filter((result) => result.status === 'pass').length,
    failed: results.filter((result) => result.status === 'fail').length,
    errors: results.filter((result) => result.status === 'error').length,
  };
  const aiScope =
    ai instanceof DemoAiAdapter
      ? 'synthetic_cache'
      : ai instanceof OpenAiAdapter || ai instanceof VertexAiAdapter
        ? 'reference_model'
        : ai instanceof AppHttpAdapter
          ? 'app_transport'
          : 'custom_adapter';
  const cachedChecks = results.filter(
    (result) => result.suite === 'guard' && result.evidence.source === 'cached',
  ).length;
  const guardScope =
    cachedChecks === guardCounts.attacks
      ? 'synthetic_cache'
      : guardCounts.verified_checks === guardCounts.attacks
        ? 'http'
        : guardCounts.verified_checks || cachedChecks
          ? 'mixed'
          : 'unavailable';
  const report: EvalReport = {
    schema_version: '2.0.0',
    contract_version: CONTRACT_VERSION,
    generated_at: new Date().toISOString(),
    mode,
    synthetic: true,
    adapters: { ai: ai.name, guard: guard.name },
    model_name: mode === 'demo' ? 'not_run' : ai.name,
    run_count: 1,
    run_dates: [new Date().toISOString()],
    prompt_provenance:
      ai instanceof VertexAiAdapter || ai instanceof OpenAiAdapter
        ? { ...PROMPT_PROVENANCE }
        : { scope: aiScope },
    status: totals.failed ? 'fail' : totals.errors ? 'incomplete' : 'pass',
    totals,
    validation_scope: {
      ai: aiScope,
      engine: 'static_golden_regression',
      guard: guardScope,
      complete_live_evidence:
        mode === 'live' &&
        (aiScope === 'reference_model' || aiScope === 'app_transport') &&
        guard instanceof HttpGuardAdapter &&
        guardScope === 'http' &&
        totals.errors === 0,
    },
    metrics: {
      extraction_field_accuracy: ratio(
        fieldsCorrect,
        documentFixtures.reduce((sum, fixture) => sum + Object.keys(fixture.expected).length, 0),
        mode === 'live' ? 0.95 : 1,
      ),
      roadmap_order_correctness: ratio(orderCorrect, roadmapFixtures.length, 1),
      roadmap_blocker_correctness: ratio(blockersCorrect, roadmapFixtures.length, 1),
      engine_golden_correctness: ratio(goldensCorrect, roadmapFixtures.length, 1),
      summary_fact_coverage: ratio(
        factsCovered,
        summaryFixtures.reduce((sum, fixture) => sum + fixture.required_facts.length, 0),
        mode === 'live' ? 0.95 : 1,
      ),
      summary_forbidden_content_rate: ratio(forbiddenSummaries, summariesAnswered, 0, false),
      summary_response_coverage: ratio(summariesAnswered, summaryFixtures.length, 1),
      guard_leak_rate: ratio(guardCounts.leaks, guardCounts.verified_checks, 0, false),
      guard_expected_denial_rate: ratio(
        guardCounts.verified_denials,
        guardCounts.verified_checks,
        1,
      ),
      guard_verified_coverage: ratio(guardCounts.verified_checks, guardCounts.attacks, 1),
    },
    guard: guardCounts,
    notes: [
      'All identities, identifiers, documents, and financial values are deliberately fake. Documents are text fixtures; scan/OCR quality is not evaluated.',
      'Demo AI and Guard answers are authored synthetic caches. Cache passes verify the harness and engine regressions, not live app, model, or Guard behavior.',
      'Guard leak rate counts explicit HTTP allows on forbidden attacks. A needs_consent response fails the expected-deny case but does not permit a send.',
      'Guard connection errors and malformed/version-mismatched responses fail closed and count as errors, never verified denials. No payload is forwarded to a forbidden destination.',
      'A null metric means there were no eligible observations. Zero verified Guard coverage cannot establish a zero leak rate.',
      'Summary grading uses reviewed regex fact alternatives and confidential value patterns, not a semantic model judge. It cannot detect every possible paraphrase, encoding, or new sensitive value.',
      'The app HTTP eval adapter is a proposed transport; apps/web must implement it or supply an AiAdapter before claiming app validation.',
    ],
    results,
  };
  const explanations: Record<string, string> = {
    extraction_field_accuracy:
      mode === 'live'
        ? 'At least 95% of all expected fields across live responses; failed requests count as missing fields.'
        : '100% expected fields checks the independently authored cache and regression grader.',
    roadmap_order_correctness:
      '100% exact step order because the engine decides deterministically; no model accuracy concession.',
    roadmap_blocker_correctness:
      '100% exact dependency and document blockers from deterministic engine decisions.',
    engine_golden_correctness:
      '100% agreement with static reviewed goldens; expected answers are never regenerated.',
    summary_fact_coverage:
      mode === 'live'
        ? 'At least 95% of all required facts across live summaries; failed requests count as missing facts.'
        : '100% fact coverage validates authored cache responses and the grader.',
    summary_forbidden_content_rate:
      '0% summaries containing seeded forbidden content; any observed forbidden content fails.',
    summary_response_coverage:
      '100% requested summaries must produce valid responses; failures cannot improve the forbidden-content rate.',
    guard_leak_rate:
      '0% explicit HTTP allows on forbidden flows. No payload is forwarded; this measures dangerous authorization, not executed egress.',
    guard_expected_denial_rate:
      '100% valid HTTP checks must deny these hard-deny attacks; consent responses also fail these cases.',
    guard_verified_coverage:
      '100% of all requested attacks must have valid version-compatible HTTP evidence for a live security claim.',
  };
  for (const [name, metric] of Object.entries(report.metrics)) {
    metric.scope = name.startsWith('guard_')
      ? guardScope === 'synthetic_cache'
        ? 'unavailable'
        : guardCounts.verified_checks
          ? 'live'
          : 'unavailable'
      : name.startsWith('engine_') ||
          (name.startsWith('roadmap_') &&
            (ai instanceof VertexAiAdapter || ai instanceof OpenAiAdapter))
        ? 'deterministic'
        : aiScope === 'synthetic_cache'
          ? 'cache'
          : aiScope === 'custom_adapter'
            ? 'custom'
            : 'live';
    metric.target_explanation = explanations[name] ?? 'Configured evaluation target.';
  }
  const casePosition = new Map(
    [...documentFixtures, ...roadmapFixtures, ...summaryFixtures, ...guardFixtures].map(
      (fixture, index) => [fixture.id, index],
    ),
  );
  report.results.sort((a, b) => casePosition.get(a.id)! - casePosition.get(b.id)!);
  if (mode === 'live') {
    const failedTarget = Object.values(report.metrics).some(
      (metric) =>
        metric.value !== null &&
        (metric.higher_is_better ? metric.value < metric.target : metric.value > metric.target),
    );
    const extraFields = report.results.some(
      (result) =>
        result.suite === 'extraction' &&
        Array.isArray(result.evidence.unexpected_fields) &&
        result.evidence.unexpected_fields.length > 0,
    );
    report.status =
      totals.errors && totals.failed === 0
        ? 'incomplete'
        : failedTarget || extraFields
          ? 'fail'
          : totals.errors
            ? 'incomplete'
            : 'pass';
  }
  if (options.write !== false)
    await writeReport(
      report,
      options.outputDirectory ?? fileURLToPath(new URL('../evals', import.meta.url)),
    );
  return report;
}
