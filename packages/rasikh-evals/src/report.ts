import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { EvalReport } from './types.ts';

const escape = (text: string): string => text.replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
export function renderReport(report: EvalReport): string {
  const lines = [
    '# Rasikh evaluation report',
    '',
    `Evidence scope: **${report.validation_scope.ai}** AI, **${report.validation_scope.engine}** engine, **${report.validation_scope.guard}** Guard. Complete live evidence: **${report.validation_scope.complete_live_evidence ? 'yes' : 'no'}**.`,
    '',
    `Status: **${report.status}** within this scope. Mode: **${report.mode}**. Generated: ${report.generated_at}.`,
    '',
    `Model: **${report.model_name ?? report.adapters.ai}**. Runs: **${report.run_count ?? 1}**. AI adapter: ${report.adapters.ai}. Guard adapter: ${report.adapters.guard}. All fixtures are synthetic.`,
    '',
    `Run dates: ${(report.run_dates ?? [report.generated_at]).join(', ')}.`,
    '',
    `Prompt provenance: ${JSON.stringify(report.prompt_provenance ?? { scope: report.validation_scope.ai })}.`,
    '',
    '| Metric | Evidence | Result | Counts | Target |',
    '|---|---|---:|---:|---:|',
  ];
  for (const [name, metric] of Object.entries(report.metrics))
    lines.push(
      `| ${name} | ${metric.scope ?? 'unspecified'} | ${metric.value === null ? 'not evaluated' : `${(metric.value * 100).toFixed(2)}%`} | ${metric.numerator}/${metric.denominator} | ${metric.higher_is_better ? '≥' : '≤'} ${(metric.target * 100).toFixed(0)}% |`,
    );
  lines.push('', 'Targets:', '');
  for (const [name, metric] of Object.entries(report.metrics))
    lines.push(`- ${name}: ${metric.target_explanation ?? 'Configured evaluation target.'}`);
  if (report.variance) {
    lines.push(
      '',
      'Variance across runs (population variance; proportions use the 0–1 scale):',
      '',
      '| Metric | Per-run results | Mean | Range | Variance | Standard deviation |',
      '|---|---|---:|---|---:|---:|',
    );
    const number = (value: number | null) => (value === null ? 'not evaluated' : value.toFixed(6));
    for (const [name, sample] of Object.entries(report.variance))
      lines.push(
        `| ${name} | ${sample.values.map(number).join(', ')} | ${number(sample.mean)} | ${number(sample.minimum)}–${number(sample.maximum)} | ${number(sample.population_variance)} | ${number(sample.standard_deviation)} |`,
      );
  }
  lines.push('', '| Suite | Cases | Passed | Failed | Errors |', '|---|---:|---:|---:|---:|');
  for (const suite of ['extraction', 'roadmap', 'summary', 'guard']) {
    const results = report.results.filter((result) => result.suite === suite);
    lines.push(
      `| ${suite} | ${results.length} | ${results.filter((result) => result.status === 'pass').length} | ${results.filter((result) => result.status === 'fail').length} | ${results.filter((result) => result.status === 'error').length} |`,
    );
  }
  lines.push(
    '',
    `Guard evidence: ${report.guard.verified_denials} verified HTTP denials; ${report.guard.cached_denials} cached denials; ${report.guard.errors} unavailable or invalid responses.`,
    '',
    ...report.notes.map((note) => `- ${note}`),
    '',
    '| Run | Case | Suite | Status | Details |',
    '|---:|---|---|---|---|',
  );
  for (const result of report.results) {
    const detail =
      result.error ??
      (result.status === 'pass' ? 'Checks satisfied.' : JSON.stringify(result.evidence));
    lines.push(
      `| ${result.run_index ?? 1} | ${result.id} | ${result.suite} | ${result.status} | ${escape(detail)} |`,
    );
  }
  return `${lines.join('\n')}\n`;
}

export async function writeReport(report: EvalReport, directory: string): Promise<void> {
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'REPORT.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  await writeFile(join(directory, 'REPORT.md'), renderReport(report), 'utf8');
}
