import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runRepeatedEvaluations } from './repeated.ts';
import { configureVertexEnvironment } from './providers/env.ts';
import { VertexAiAdapter } from './adapters/vertex.ts';
import { safeDiagnostic } from './adapters/errors.ts';
import type { EvalOptions } from './runner.ts';

function parseArguments(args: string[]): EvalOptions & { runs?: number } {
  const options: EvalOptions & { runs?: number } = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    const [flag, inline] = arg.split('=', 2);
    const value = inline ?? args[++i];
    if (flag === '--mode' && (value === 'demo' || value === 'live')) options.mode = value;
    else if (flag === '--guard' && (value === 'cached' || value === 'http'))
      options.guardMode = value;
    else if (flag === '--output' && value) options.outputDirectory = resolve(value);
    else if (flag === '--provider' && (value === 'vertex' || value === 'openai'))
      options.provider = value;
    else if (flag === '--runs' && value && /^\d+$/.test(value)) options.runs = Number(value);
    else if (flag === '--concurrency' && value && /^\d+$/.test(value))
      options.concurrency = Number(value);
    else
      throw new Error(
        'Usage: npm run eval -- [--mode demo|live] [--guard cached|http] [--provider vertex|openai] [--runs 1..10] [--concurrency 1..16] [--output directory]',
      );
  }
  return options;
}

try {
  const options = parseArguments(process.argv.slice(2));
  if ((options.mode ?? 'demo') === 'demo' && !options.outputDirectory)
    options.outputDirectory = fileURLToPath(new URL('../evals/cache', import.meta.url));
  if (
    options.mode === 'live' &&
    (options.provider ?? 'vertex') === 'vertex' &&
    !process.env.RASIKH_EVAL_APP_URL
  ) {
    await configureVertexEnvironment();
    options.aiAdapter = new VertexAiAdapter();
  }
  const report = await runRepeatedEvaluations(options);
  process.stdout.write(
    `Rasikh evals: ${report.status}; ${report.run_count} run(s), ${report.model_name}; ${report.totals.passed}/${report.totals.cases} exact case passes, ${report.totals.errors} errors. Guard verified: ${report.guard.verified_checks}/${report.guard.attacks}.\n`,
  );
  process.exitCode = report.status === 'pass' ? 0 : 1;
} catch (error) {
  process.stderr.write(`${safeDiagnostic(error)}\n`);
  process.exitCode = 1;
}
