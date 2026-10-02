import { fileURLToPath } from 'node:url';
import { runEvaluations, type EvalOptions } from './runner.ts';
import { writeReport } from './report.ts';
import type { EvalReport } from './types.ts';

export function describeVariance(
  values: Array<number | null>,
): NonNullable<EvalReport['variance']>[string] {
  const eligible = values.filter((value): value is number => value !== null);
  const mean = eligible.length
    ? eligible.reduce((sum, value) => sum + value, 0) / eligible.length
    : null;
  const variance =
    mean === null
      ? null
      : eligible.reduce((sum, value) => sum + (value - mean) ** 2, 0) / eligible.length;
  return {
    values,
    mean,
    minimum: eligible.length ? Math.min(...eligible) : null,
    maximum: eligible.length ? Math.max(...eligible) : null,
    population_variance: variance,
    standard_deviation: variance === null ? null : Math.sqrt(variance),
    eligible_runs: eligible.length,
  };
}

export async function runRepeatedEvaluations(
  options: EvalOptions & { runs?: number } = {},
): Promise<EvalReport> {
  const runs = options.runs ?? (options.mode === 'live' ? 3 : 1);
  if (!Number.isInteger(runs) || runs < 1 || runs > 10)
    throw new RangeError('runs must be an integer from 1 to 10');
  const reports: EvalReport[] = [];
  for (let index = 0; index < runs; index++)
    reports.push(await runEvaluations({ ...options, write: false }));
  const report = structuredClone(reports.at(-1)!);
  report.run_count = runs;
  report.run_dates = reports.map((item) => item.generated_at);
  report.variance = {};
  for (const [name, metric] of Object.entries(report.metrics)) {
    const samples = reports.map((item) => item.metrics[name]!);
    metric.numerator = samples.reduce((sum, item) => sum + item.numerator, 0);
    metric.denominator = samples.reduce((sum, item) => sum + item.denominator, 0);
    metric.value = metric.denominator ? metric.numerator / metric.denominator : null;
    const scopes = new Set(samples.map((item) => item.scope ?? 'unavailable'));
    metric.scope = scopes.size === 1 ? samples[0]!.scope : 'mixed';
    report.variance[name] = describeVariance(samples.map((item) => item.value));
  }
  report.results = reports.flatMap((item, run_index) =>
    item.results.map((result) => ({ ...result, run_index: run_index + 1 })),
  );
  for (const key of ['cases', 'passed', 'failed', 'errors'] as const)
    report.totals[key] = reports.reduce((sum, item) => sum + item.totals[key], 0);
  for (const key of [
    'attacks',
    'cached_denials',
    'verified_denials',
    'verified_checks',
    'non_denials',
    'leaks',
    'errors',
  ] as const)
    report.guard[key] = reports.reduce((sum, item) => sum + item.guard[key], 0);
  report.guard.coverage = report.guard.verified_checks / report.guard.attacks;
  const guardScopes = new Set(reports.map((item) => item.validation_scope.guard));
  report.validation_scope.guard = guardScopes.size === 1 ? reports[0]!.validation_scope.guard : 'mixed';
  // A bad run remains a bad run even if aggregation would conceal it.
  report.status = reports.some((item) => item.status === 'fail')
    ? 'fail'
    : reports.some((item) => item.status === 'incomplete')
      ? 'incomplete'
      : 'pass';
  report.validation_scope.complete_live_evidence = reports.every(
    (item) => item.validation_scope.complete_live_evidence,
  );
  if (options.write !== false)
    await writeReport(
      report,
      options.outputDirectory ?? fileURLToPath(new URL('../evals', import.meta.url)),
    );
  return report;
}
