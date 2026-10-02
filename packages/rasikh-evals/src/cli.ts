import { resolve } from 'node:path';
import { runEvaluations } from './runner.ts';
import type { EvalOptions } from './runner.ts';

function parseArguments(args: string[]): EvalOptions {
  const options: EvalOptions = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    const [flag, inline] = arg.split('=', 2);
    const value = inline ?? args[++i];
    if (flag === '--mode' && (value === 'demo' || value === 'live')) options.mode = value;
    else if (flag === '--guard' && (value === 'cached' || value === 'http'))
      options.guardMode = value;
    else if (flag === '--output' && value) options.outputDirectory = resolve(value);
    else
      throw new Error(
        'Usage: npm run eval -- [--mode demo|live] [--guard cached|http] [--output directory]',
      );
  }
  return options;
}

try {
  const report = await runEvaluations(parseArguments(process.argv.slice(2)));
  process.stdout.write(
    `Rasikh evals: ${report.status}; ${report.totals.passed}/${report.totals.cases} passed, ${report.totals.failed} failed, ${report.totals.errors} errors. Guard verified: ${report.guard.verified_checks}/${report.guard.attacks}.\n`,
  );
  process.exitCode = report.status === 'pass' ? 0 : 1;
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : 'Evaluation failed.'}\n`);
  process.exitCode = 1;
}
