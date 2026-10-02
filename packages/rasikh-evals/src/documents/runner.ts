import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTRACT_VERSION } from '@rasikh/shared';
import { scoreExtraction } from '../metrics.ts';
import {
  createStructuredModel,
  type StructuredModel,
  type VertexOptions,
} from '../providers/structured.ts';
import { PROMPT_PROVENANCE } from '../prompts/profiles.ts';
import {
  defaultManifestPath,
  loadDocumentManifest,
  readVerifiedImage,
  type DocumentCohort,
  type DocumentImage,
} from './manifest.ts';
import { StructuredVisionAdapter, type VisionDocumentAdapter } from './model.ts';

interface DocumentCaseResult {
  id: string;
  document_id: string;
  cohort: DocumentCohort;
  run: number;
  status: 'pass' | 'fail' | 'error' | 'unavailable';
  correct_fields: number;
  total_fields: number;
  incorrect_fields: string[];
  unexpected_fields: string[];
  error?: string;
}
interface CohortRun {
  run: number;
  accuracy: number | null;
  correct_fields: number;
  scored_fields: number;
  valid_responses: number;
  planned_requests: number;
  failures: number;
}
export interface DocumentGroupResult {
  evidence_scope: 'live_vision' | 'test_double' | 'unavailable';
  images: number;
  runs: number;
  planned_requests: number;
  valid_responses: number;
  request_errors: number;
  incorrect_documents: number;
  correct_fields: number;
  scored_fields: number;
  planned_fields: number;
  accuracy: number | null;
  coverage: number;
  target: 0.95;
  target_met: boolean | null;
  by_run: CohortRun[];
  variance: {
    complete_runs: number;
    mean: number | null;
    min: number | null;
    max: number | null;
    standard_deviation: number | null;
  };
}
export interface DocumentEvalReport {
  schema_version: '1.0.0';
  contract_version: string;
  evidence_scope: 'live_vision' | 'test_double' | 'unavailable';
  generated_at: string;
  started_at: string;
  model: string | null;
  provider: string | null;
  status: 'pass' | 'fail' | 'incomplete' | 'unavailable';
  synthetic: true;
  runs: number;
  concurrency: number;
  dataset: {
    name: string;
    images: number;
    manifest_sha256: string;
    seed: number;
    render_environment: Record<string, string>;
  };
  groups: Record<DocumentCohort, DocumentGroupResult>;
  target_explanation: string;
  prompt_provenance: typeof PROMPT_PROVENANCE;
  sources: string[];
  limitations: string[];
  blockers: string[];
  results: DocumentCaseResult[];
}
export interface DocumentEvalOptions {
  modelAdapter?: StructuredModel;
  adapter?: VisionDocumentAdapter;
  providerOptions?: Partial<VertexOptions>;
  runs?: number;
  concurrency?: number;
  manifestPath?: string;
  outputDirectory?: string;
  write?: boolean;
  onProgress?: (completed: number, total: number) => void;
}

function scoreGroup(
  cohort: DocumentCohort,
  documents: DocumentImage[],
  results: DocumentCaseResult[],
  runs: number,
  scope: DocumentEvalReport['evidence_scope'],
): DocumentGroupResult {
  const images = documents.filter((document) => document.cohort === cohort);
  const cases = results.filter((result) => result.cohort === cohort);
  const valid = cases.filter((result) => result.status === 'pass' || result.status === 'fail');
  const byRun = Array.from({ length: runs }, (_, index): CohortRun => {
    const run = index + 1;
    const runCases = valid.filter((result) => result.run === run);
    const correct = runCases.reduce((sum, result) => sum + result.correct_fields, 0);
    const fields = runCases.reduce((sum, result) => sum + result.total_fields, 0);
    return {
      run,
      accuracy: fields ? correct / fields : null,
      correct_fields: correct,
      scored_fields: fields,
      valid_responses: runCases.length,
      planned_requests: images.length,
      failures: cases.filter((result) => result.run === run && result.status === 'error').length,
    };
  });
  const correctFields = valid.reduce((sum, result) => sum + result.correct_fields, 0);
  const scoredFields = valid.reduce((sum, result) => sum + result.total_fields, 0);
  const plannedRequests = images.length * runs;
  const accuracy = scoredFields ? correctFields / scoredFields : null;
  const complete = byRun
    .filter((run) => run.valid_responses === run.planned_requests && run.accuracy !== null)
    .map((run) => run.accuracy!);
  const mean = complete.length
    ? complete.reduce((sum, value) => sum + value, 0) / complete.length
    : null;
  return {
    evidence_scope: scope,
    images: images.length,
    runs,
    planned_requests: plannedRequests,
    valid_responses: valid.length,
    request_errors: cases.filter((result) => result.status === 'error').length,
    incorrect_documents: valid.filter((result) => result.status === 'fail').length,
    correct_fields: correctFields,
    scored_fields: scoredFields,
    planned_fields:
      images.reduce((sum, document) => sum + Object.keys(document.expected).length, 0) * runs,
    accuracy,
    coverage: plannedRequests ? valid.length / plannedRequests : 0,
    target: 0.95,
    target_met: accuracy === null || valid.length !== plannedRequests ? null : accuracy >= 0.95,
    by_run: byRun,
    variance: {
      complete_runs: complete.length,
      mean,
      min: complete.length ? Math.min(...complete) : null,
      max: complete.length ? Math.max(...complete) : null,
      standard_deviation:
        complete.length < 2 || mean === null
          ? null
          : Math.sqrt(
              complete.reduce((sum, value) => sum + (value - mean) ** 2, 0) / complete.length,
            ),
    },
  };
}

export function renderDocumentReport(report: DocumentEvalReport): string {
  const percent = (value: number | null) =>
    value === null ? 'unavailable' : `${(value * 100).toFixed(2)}%`;
  const lines = [
    '# Rasikh rendered-document evaluation',
    '',
    `Evidence: **${report.evidence_scope}**. Status: **${report.status}**. Model: **${report.model ?? 'not configured'}**. Run date: ${report.generated_at}.`,
    '',
    `${report.dataset.images} synthetic images, ${report.runs} runs per image; ${report.concurrency} concurrent requests. Manifest SHA-256: ${report.dataset.manifest_sha256}.`,
    '',
    '| Cohort / evidence | Images | Runs | Valid requests | Field accuracy | Field counts | Coverage | Target |',
    '|---|---:|---:|---:|---:|---:|---:|---:|',
  ];
  for (const [name, group] of Object.entries(report.groups))
    lines.push(
      `| ${name} / ${group.evidence_scope} | ${group.images} | ${group.runs} | ${group.valid_responses}/${group.planned_requests} | ${percent(group.accuracy)} | ${group.correct_fields}/${group.scored_fields} scored (${group.planned_fields} planned) | ${percent(group.coverage)} | ≥95% with full response coverage |`,
    );
  lines.push(
    '',
    report.target_explanation,
    '',
    '| Cohort | Complete runs | Mean | Range | Standard deviation |',
    '|---|---:|---:|---|---:|',
  );
  for (const [name, group] of Object.entries(report.groups))
    lines.push(
      `| ${name} | ${group.variance.complete_runs} | ${percent(group.variance.mean)} | ${percent(group.variance.min)} to ${percent(group.variance.max)} | ${percent(group.variance.standard_deviation)} |`,
    );
  lines.push(
    '',
    'Variance includes only runs with every image successfully scored. Missing responses are not successful fields; targets remain unverified until coverage is complete.',
    '',
    ...report.blockers.map((blocker) => `- Blocker: ${blocker}`),
    ...report.limitations.map((limit) => `- ${limit}`),
    '',
    '## Reproduce the image corpus',
    '',
    'The images are generated by `scripts/render-documents.py` with seed 7102026. Each manifest entry records source text, expected fields, dimensions, SHA-256, exact rotation/blur/lighting/noise/crop/stamp/encoding parameters, operation order and text bounds. No OCR or model output generates the expected answers.',
    '',
    'The renderer uses Pillow and package-local `arabic-reshaper==3.0.0` plus `python-bidi==0.6.7`. The font is identified by filename and hash; it is not redistributed. Default on Windows is Tahoma. Reproduce with the recorded Pillow/Python/font versions, then run:',
    '',
    '```text',
    'python scripts/render-documents.py',
    '```',
    '',
    'Use `--font /path/to/Arabic-capable.ttf` on other systems. Different fonts or Pillow versions can change image hashes. Arabic ISO dates are directionally isolated before shaping; right-to-left characters were visually checked. Crops affect outer margins rather than scored fields. Stamps are clearly marked synthetic.',
    '',
    '## Run vision extraction',
    '',
    'The root eval CLI calls `runDocumentEvaluations()` with the shared structured-model provider after environment configuration. The adapter sends only requested field names and actual PNG/JPEG image bytes to the model; source text and expected values stay local. Default is three runs with concurrency four. A missing model/project/credentials produces unavailable/error evidence and null accuracy, never cached predictions.',
    '',
    'Each case below references a real image input checksum in the manifest. No real person or valid passport/account data is used.',
    '',
    '| Image | Cohort | Run | Status | Correct fields | Incorrect fields / error |',
    '|---|---|---:|---|---:|---|',
  );
  for (const result of report.results)
    lines.push(
      `| ${result.document_id} | ${result.cohort} | ${result.run} | ${result.status} | ${result.correct_fields}/${result.total_fields} | ${result.error ?? [...result.incorrect_fields, ...result.unexpected_fields.map((field) => `unexpected:${field}`)].join(', ')} |`,
    );
  lines.push(
    '',
    ...report.sources.map((source) => `Source: [official API documentation](${source})`),
    '',
  );
  return lines.join('\n');
}

export async function runDocumentEvaluations(
  options: DocumentEvalOptions = {},
): Promise<DocumentEvalReport> {
  const runs = options.runs ?? 3;
  const concurrency = options.concurrency ?? 4;
  if (
    !Number.isInteger(runs) ||
    runs < 1 ||
    runs > 10 ||
    !Number.isInteger(concurrency) ||
    concurrency < 1 ||
    concurrency > 8
  )
    throw new Error('Document runs must be 1–10 and concurrency 1–8.');
  const started = new Date().toISOString();
  const manifestPath = options.manifestPath ?? defaultManifestPath;
  const manifest = await loadDocumentManifest(manifestPath);
  const verifiedImages = new Map<string, Buffer>();
  for (const document of manifest.documents)
    verifiedImages.set(document.id, await readVerifiedImage(document, manifestPath));
  let model: StructuredModel | undefined = options.modelAdapter;
  let adapter = options.adapter;
  const blockers: string[] = [];
  if (!adapter) {
    try {
      model ??= createStructuredModel(options.providerOptions);
      adapter = new StructuredVisionAdapter(model);
    } catch {
      blockers.push(
        'Live vision provider is not configured. Configure the shared Vertex project/model and credentials; no predictions were fabricated.',
      );
    }
  }
  const scope = adapter?.evidence ?? 'unavailable';
  const jobs = Array.from({ length: runs }, (_, index) =>
    manifest.documents.map((document) => ({ run: index + 1, document })),
  ).flat();
  const results: DocumentCaseResult[] = [];
  let next = 0;
  const work = async () => {
    while (next < jobs.length) {
      const job = jobs[next++]!;
      const document = job.document;
      const base = {
        id: `${document.id}:run_${job.run}`,
        document_id: document.id,
        cohort: document.cohort,
        run: job.run,
        total_fields: Object.keys(document.expected).length,
        correct_fields: 0,
        incorrect_fields: [] as string[],
        unexpected_fields: [] as string[],
      };
      if (!adapter)
        results.push({
          ...base,
          status: 'unavailable',
          error: 'Live vision provider unavailable.',
        });
      else {
        try {
          const answer = await adapter.extract(document, verifiedImages.get(document.id)!);
          const score = scoreExtraction(
            {
              id: document.id,
              case_id: document.case_id,
              synthetic: true,
              kind: document.kind,
              text: '',
              expected: document.expected,
            },
            answer,
          );
          results.push({
            ...base,
            status: score.exact ? 'pass' : 'fail',
            correct_fields: score.correct,
            incorrect_fields: score.fields
              .filter((field) => !field.correct)
              .map((field) => field.field),
            unexpected_fields: score.unexpected_fields,
          });
        } catch {
          results.push({
            ...base,
            status: 'error',
            error:
              'Vision model request failed or returned an invalid response. No answer was substituted.',
          });
        }
      }
      options.onProgress?.(results.length, jobs.length);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, work));
  results.sort((a, b) => a.run - b.run || a.document_id.localeCompare(b.document_id));
  const groups = Object.fromEntries(
    (['clean', 'degraded', 'arabic'] as const).map((cohort) => [
      cohort,
      scoreGroup(cohort, manifest.documents, results, runs, scope),
    ]),
  ) as Record<DocumentCohort, DocumentGroupResult>;
  const errors = results.filter((result) => result.status === 'error').length;
  if (errors)
    blockers.push(
      `${errors} vision requests failed; report coverage and unavailable accuracy honestly. Missing or expired credentials, transport, provider errors or malformed responses need investigation.`,
    );
  const groupValues = Object.values(groups);
  const missingCohorts = Object.entries(groups)
    .filter(([, group]) => !group.images || !group.planned_requests)
    .map(([cohort]) => cohort);
  if (missingCohorts.length)
    blockers.push(
      `Missing document cohorts: ${missingCohorts.join(', ')}. Every cohort must contain images and meet its target before this benchmark can pass.`,
    );
  const unexpectedFields = results.some((result) => result.unexpected_fields.length > 0);
  if (unexpectedFields)
    blockers.push(
      'One or more vision responses included unexpected fields. Unrequested fields fail the benchmark independently of requested-field accuracy.',
    );
  const allTargetsVerified = groupValues.every(
    (group) => group.images > 0 && group.planned_requests > 0 && group.target_met === true,
  );
  const status = !adapter
    ? 'unavailable'
    : unexpectedFields || groupValues.some((group) => group.target_met === false)
      ? 'fail'
      : errors || !allTargetsVerified
        ? 'incomplete'
        : 'pass';
  const report: DocumentEvalReport = {
    schema_version: '1.0.0',
    contract_version: CONTRACT_VERSION,
    evidence_scope: scope,
    generated_at: new Date().toISOString(),
    started_at: started,
    model: adapter?.name ?? null,
    provider: model?.provider ?? (scope === 'test_double' ? 'test_double' : null),
    status,
    synthetic: true,
    runs,
    concurrency,
    dataset: {
      name: manifest.dataset,
      images: manifest.documents.length,
      manifest_sha256: createHash('sha256')
        .update(await readFile(manifestPath))
        .digest('hex'),
      seed: manifest.seed,
      render_environment: manifest.render_environment,
    },
    groups,
    target_explanation:
      'The live field-accuracy target is at least 95% for each cohort independently, with 100% request coverage and all three cohorts present. This balances extraction tolerance with a clear degraded/Arabic quality bar. Unexpected response fields fail independently. Cached predictions are never used. Accuracy is computed only from actual valid responses; the target is unverified when responses are missing.',
    prompt_provenance: PROMPT_PROVENANCE,
    sources: [
      'https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/image-understanding',
      'https://developers.openai.com/api/docs/guides/images-vision',
    ],
    limitations: [
      'This is a rendered synthetic document benchmark, not measured real customer scans or field performance.',
      'Only 20 English source documents and eight Arabic/bilingual documents are represented. Variants share identities; repeated runs are not independent population samples.',
      'Reference extraction instructions reuse the harness prompt with image/Arabic formatting guidance. apps/web has no AI prompt implementation, so app prompt parity remains unverified.',
      'Arabic and bilingual accuracy are pooled into the Arabic cohort; clean/degraded cohorts are English. Cross-language degradation is not measured.',
      'All fees, identity data, documents and financial values are deliberately fictitious. No official document crests, real biometrics, valid MRZ or document numbers are included.',
      'The same corpus was used for all runs; variance describes model repeatability on this finite corpus. No confidence claim about real populations follows.',
    ],
    blockers,
    results,
  };
  if (options.write !== false) {
    const directory =
      options.outputDirectory ?? fileURLToPath(new URL('../../evals', import.meta.url));
    await mkdir(directory, { recursive: true });
    await writeFile(
      join(directory, 'DOCUMENTS.json'),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8',
    );
    await writeFile(join(directory, 'DOCUMENTS.md'), renderDocumentReport(report), 'utf8');
  }
  return report;
}
