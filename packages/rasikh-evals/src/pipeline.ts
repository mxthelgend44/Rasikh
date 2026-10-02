import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface PipelineStep {
  name: string;
  file: string;
  args?: string[];
}
export interface PipelineEvidence {
  schema_version: '1.0.0';
  started_at: string;
  generated_at: string;
  status: 'pass' | 'fail';
  steps: Array<{ name: string; exit_code: number }>;
}
const steps: PipelineStep[] = [
  { name: 'guard_conformance', file: 'src/guard-conformance.ts' },
  {
    name: 'core_live',
    file: 'src/cli.ts',
    args: ['--mode', 'live', '--provider', 'vertex', '--runs', '3'],
  },
  { name: 'injection', file: 'src/injection/cli.ts', args: ['live'] },
  { name: 'documents', file: 'src/documents/cli.ts' },
  { name: 'semantic_judge', file: 'src/judge/cli.ts' },
  { name: 'simulation', file: 'src/simulation.ts' },
  { name: 'trust', file: 'src/trust.ts' },
];

/** Failures remain failures, but cannot prevent later evidence and Trust generation. */
export async function runEvaluationPipeline(
  options: {
    execute?: (step: PipelineStep, minimumSourceDate: string) => Promise<number>;
    steps?: PipelineStep[];
    write?: boolean;
  } = {},
): Promise<PipelineEvidence> {
  const directory = fileURLToPath(new URL('..', import.meta.url));
  const started = new Date().toISOString();
  const result: PipelineEvidence = {
    schema_version: '1.0.0',
    started_at: started,
    generated_at: started,
    status: 'pass',
    steps: [],
  };
  let active: ReturnType<typeof spawn> | undefined;
  let interrupted = false;
  const onSignal = () => {
    interrupted = true;
    active?.kill('SIGTERM');
  };
  process.once('SIGINT', onSignal);
  process.once('SIGTERM', onSignal);
  const execute =
    options.execute ??
    ((step: PipelineStep) =>
      new Promise<number>((finish) => {
        active = spawn(process.execPath, ['--import', 'tsx', step.file, ...(step.args ?? [])], {
          cwd: directory,
          env: { ...process.env, RASIKH_EVAL_MIN_SOURCE_DATE: started },
          windowsHide: true,
          stdio: 'inherit',
        });
        active.once('error', () => finish(1));
        active.once('exit', (code) => finish(code ?? 1));
      }));
  try {
    for (const step of options.steps ?? steps) {
      if (interrupted) {
        result.status = 'fail';
        break;
      }
      let exitCode: number;
      try {
        exitCode = await execute(step, started);
      } catch {
        exitCode = 1;
      }
      if (!Number.isInteger(exitCode) || exitCode < 0) exitCode = 1;
      result.steps.push({ name: step.name, exit_code: exitCode });
      if (exitCode !== 0) result.status = 'fail';
    }
  } finally {
    process.removeListener('SIGINT', onSignal);
    process.removeListener('SIGTERM', onSignal);
    active?.kill('SIGTERM');
  }
  if (interrupted) result.status = 'fail';
  result.generated_at = new Date().toISOString();
  if (options.write !== false) {
    await mkdir(resolve(directory, 'evals'), { recursive: true });
    await writeFile(
      resolve(directory, 'evals/PIPELINE.json'),
      `${JSON.stringify(result, null, 2)}\n`,
    );
  }
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = await runEvaluationPipeline();
  process.stdout.write(
    `Full evaluation pipeline: ${report.status}; all completed step exit codes are recorded in PIPELINE.json.\n`,
  );
  process.exitCode = report.status === 'pass' ? 0 : 1;
}
