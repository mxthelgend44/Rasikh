import { fileURLToPath } from 'node:url';
import { configureVertexEnvironment } from '../providers/env.ts';
import { createStructuredModel } from '../providers/structured.ts';
import { safeDiagnostic } from '../adapters/errors.ts';
import { runInjectionEvaluations, writeInjectionEvidence } from './runner.ts';

try {
  const mode = process.argv[2] ?? 'live';
  if (!['live', 'demo', 'scripted_guard'].includes(mode))
    throw new Error('Invalid injection mode.');
  if (mode === 'live') await configureVertexEnvironment();
  const report = await runInjectionEvaluations({
    mode: mode as 'live' | 'demo' | 'scripted_guard',
    modelAdapter: mode === 'live' ? createStructuredModel() : undefined,
    runs: mode === 'live' ? 3 : 1,
  });
  const prefix =
    mode === 'live'
      ? 'INJECTION'
      : mode === 'demo'
        ? 'INJECTION_CACHE'
        : 'INJECTION_GUARD_CONTROLS';
  await writeInjectionEvidence(
    report,
    fileURLToPath(new URL('../../evals', import.meta.url)),
    prefix,
  );
  process.stdout.write(
    `Injection evaluation: ${report.status}; model and Guard control observations are reported separately in ${prefix}.md.\n`,
  );
  process.exitCode = report.status === 'pass' ? 0 : 1;
} catch (error) {
  process.stderr.write(`${safeDiagnostic(error)}\n`);
  process.exitCode = 1;
}
