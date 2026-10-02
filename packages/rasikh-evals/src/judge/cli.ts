import { configureVertexEnvironment } from '../providers/env.ts';
import { createStructuredModel } from '../providers/structured.ts';
import { safeDiagnostic } from '../adapters/errors.ts';
import { runJudgeEvaluations } from './runner.ts';

try {
  await configureVertexEnvironment();
  const report = await runJudgeEvaluations({ modelAdapter: createStructuredModel(), runs: 3 });
  process.stdout.write(
    `Semantic judge: ${report.status}; three calibration repeats and each preserved live summary assessed once.\n`,
  );
  process.exitCode = report.status === 'pass' ? 0 : 1;
} catch (error) {
  process.stderr.write(`${safeDiagnostic(error)}\n`);
  process.exitCode = 1;
}
