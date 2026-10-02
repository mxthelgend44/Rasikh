import { configureVertexEnvironment } from '../providers/env.ts';
import { createStructuredModel } from '../providers/structured.ts';
import { safeDiagnostic } from '../adapters/errors.ts';
import { runDocumentEvaluations } from './runner.ts';

try {
  await configureVertexEnvironment();
  const report = await runDocumentEvaluations({ modelAdapter: createStructuredModel(), runs: 3 });
  process.stdout.write(
    `Document vision: ${report.status}; ${report.runs} runs, ${report.model}; clean, degraded and Arabic cohorts recorded separately.\n`,
  );
  process.exitCode = report.status === 'pass' ? 0 : 1;
} catch (error) {
  process.stderr.write(`${safeDiagnostic(error)}\n`);
  process.exitCode = 1;
}
