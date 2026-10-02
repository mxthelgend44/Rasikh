import { CONTRACT_VERSION } from '@rasikh/shared';
import type { Snapshot } from '@/store/snapshot';
import { getStore } from '@/server/store';
import { readConfig, type AiEnv, type VertexConfig } from './config';
import { explanationContext, validateExplanation } from './context';
import { AiError } from './errors';
import { authorizeExtraction, guardAvailable } from './guard';
import {
  EXTRACTION_PROMPT,
  EXPLANATION_PROMPT,
  EXPLANATION_SCHEMA,
  EXTRACTION_SCHEMA_TEMPLATE,
  extractionSchema,
  sha256,
  schemaHash,
} from './prompts';
import {
  fieldsFor,
  SUPPORTED_KINDS,
  validateExtracted,
  type ExtractionInput,
  type ExplanationInput,
} from './validation';
import { generate } from './vertex';

export interface AiRuntime {
  env: AiEnv;
  snapshot(): Snapshot;
  fetch: typeof fetch;
}
export function currentRuntime(): AiRuntime {
  return { env: process.env, snapshot: () => getStore().snapshot(), fetch };
}
function revision(env: AiEnv): string | null {
  const value = env.RASIKH_APP_REVISION;
  return value && /^[a-f0-9]{40}$/.test(value) ? value : null;
}
async function provenance(
  config: VertexConfig,
  instructions: string,
  schema: unknown,
  guardCheck: string | null,
) {
  return {
    provider: 'vertex' as const,
    model: config.model,
    live: true as const,
    prompt_sha256: await sha256(instructions),
    response_schema_sha256: await schemaHash(schema),
    guard_check_id: guardCheck,
    app_revision: revision(config.env),
    app_prompt_parity: 'unverified' as const,
  };
}

export async function extractDocument(input: ExtractionInput, runtime = currentRuntime()) {
  const config = readConfig(runtime.env);
  const snapshot = runtime.snapshot();
  if (!Object.hasOwn(snapshot.state.hires, input.hireId))
    throw new AiError('unknown_case', 'This newcomer case was not found.', 404);
  const guardCheck = await authorizeExtraction(
    input.hireId,
    input.kind,
    runtime.env,
    runtime.fetch,
  );
  const fields = fieldsFor(input.kind);
  const schema = extractionSchema(fields);
  const raw = await generate(
    config,
    {
      instructions: EXTRACTION_PROMPT,
      schema,
      input: {
        document_source: 'user_supplied',
        kind: input.kind === 'degree' ? 'degree_certificate' : input.kind,
        ...(input.text === undefined ? {} : { text: input.text }),
        fields,
      },
      file: input.file,
    },
    runtime.fetch,
  );
  const extracted = validateExtracted(raw, input.kind);
  return {
    contract_version: CONTRACT_VERSION,
    fields: fields.map((key) => ({
      key,
      label: key.replaceAll('_', ' '),
      value: extracted[key] === null ? null : String(extracted[key]),
      confidence: null,
    })),
    reasoning:
      'Vertex extracted the requested fields from the supplied document. Missing or unreadable values remain empty. Review every field before confirming it.',
    provenance: await provenance(config, EXTRACTION_PROMPT, schema, guardCheck),
  };
}

export async function explainJourney(input: ExplanationInput, runtime = currentRuntime()) {
  const config = readConfig(runtime.env);
  const before = runtime.snapshot();
  const context = explanationContext(before.state, input);
  const response = validateExplanation(
    await generate(
      config,
      {
        instructions: EXPLANATION_PROMPT,
        schema: EXPLANATION_SCHEMA,
        input: context.projection,
      },
      runtime.fetch,
    ),
  );
  const proof = await provenance(config, EXPLANATION_PROMPT, EXPLANATION_SCHEMA, null);
  // A revocation or workflow change while the model is running invalidates its explanation.
  const after = runtime.snapshot();
  const current = explanationContext(after.state, input);
  if (before.epoch !== after.epoch || JSON.stringify(current) !== JSON.stringify(context)) {
    throw new AiError(
      'context_changed',
      'Your journey or sharing permissions changed. Request a fresh explanation.',
      409,
    );
  }
  return {
    contract_version: CONTRACT_VERSION,
    explanation: {
      ...response,
      stepId: context.stepId,
      requiresApproval: context.requiresApproval,
      disclosureNotes: context.disclosureNotes,
    },
    provenance: proof,
  };
}

export async function aiStatus(runtime = currentRuntime()) {
  try {
    const config = readConfig(runtime.env);
    const canExtract = await guardAvailable(runtime.env, runtime.fetch);
    return {
      contract_version: CONTRACT_VERSION,
      available: true,
      provider: 'vertex',
      model: config.model,
      capabilities: { extract: canExtract, explain: true },
      supportedKinds: [...SUPPORTED_KINDS],
      reason: canExtract
        ? null
        : 'Live explanations are configured. Document processing is waiting for Guard.',
      live: false,
    };
  } catch (error) {
    return {
      contract_version: CONTRACT_VERSION,
      available: false,
      provider: 'vertex',
      model: null,
      capabilities: { extract: false, explain: false },
      supportedKinds: [...SUPPORTED_KINDS],
      reason: error instanceof AiError ? error.message : 'Live AI is unavailable.',
      live: false,
    };
  }
}

export async function aiMetadata(runtime = currentRuntime()) {
  const status = await aiStatus(runtime);
  const unavailable = {
    implementation: 'unavailable',
    prompt_source: null,
    prompt_sha256: null,
    response_schema_source: null,
    response_schema_sha256: null,
    schema_kind: null,
  };
  return {
    contract_version: CONTRACT_VERSION,
    adapter_schema_version: '1.0.0',
    scope: 'app_runtime_adapter',
    eval_adapter_compatible: false,
    app_prompt_parity: 'unverified',
    live: false,
    app_revision: revision(runtime.env),
    engine_revision: null,
    model: { provider: status.available ? 'vertex' : null, name: status.model },
    capabilities: {
      text_extract: status.capabilities.extract,
      image_extract: status.capabilities.extract,
      explain: status.capabilities.explain,
      summary: false,
    },
    operations: {
      extract: status.capabilities.extract
        ? {
            implementation: 'app_model',
            prompt_source: 'apps/web/src/server/ai/prompts.ts#EXTRACTION_PROMPT',
            prompt_sha256: await sha256(EXTRACTION_PROMPT),
            response_schema_source: 'apps/web/src/server/ai/prompts.ts#EXTRACTION_SCHEMA_TEMPLATE',
            response_schema_sha256: await schemaHash(EXTRACTION_SCHEMA_TEMPLATE),
            schema_kind: 'requested_fields_template',
          }
        : unavailable,
      explain: status.capabilities.explain
        ? {
            implementation: 'app_model',
            prompt_source: 'apps/web/src/server/ai/prompts.ts#EXPLANATION_PROMPT',
            prompt_sha256: await sha256(EXPLANATION_PROMPT),
            response_schema_source: 'apps/web/src/server/ai/prompts.ts#EXPLANATION_SCHEMA',
            response_schema_sha256: await schemaHash(EXPLANATION_SCHEMA),
            schema_kind: 'fixed',
          }
        : unavailable,
      roadmap: unavailable,
      summary: unavailable,
    },
  };
}
