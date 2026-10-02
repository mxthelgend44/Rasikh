import { getVertexAccessToken } from './auth';
import { boundedJson } from './bounded-json';
import type { VertexConfig } from './config';
import { AiError, isRecord } from './errors';

export interface ModelRequest {
  instructions: string;
  schema: Record<string, unknown>;
  input: unknown;
  file?: { mimeType: string; data: string };
}

/** Vertex responseSchema is a subset; full strictness is enforced again after inference. */
export function vertexSchema(schema: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const type = schema.type;
  if (Array.isArray(type)) {
    const nonnull = type.filter((item) => item !== 'null');
    if (type.includes('null')) result.nullable = true;
    if (nonnull.length === 1) result.type = String(nonnull[0]).toUpperCase();
    else result.anyOf = nonnull.map((item) => ({ type: String(item).toUpperCase() }));
  } else if (typeof type === 'string') result.type = type.toUpperCase();
  for (const key of [
    'required',
    'enum',
    'minimum',
    'maximum',
    'minItems',
    'maxItems',
    'description',
  ]) {
    if (schema[key] !== undefined) result[key] = schema[key];
  }
  if (isRecord(schema.properties)) {
    result.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([key, value]) => {
        if (!isRecord(value))
          throw new AiError('ai_unavailable', 'The AI response schema is unavailable.');
        return [key, vertexSchema(value)];
      }),
    );
    result.propertyOrdering = Object.keys(schema.properties);
  }
  if (isRecord(schema.items)) result.items = vertexSchema(schema.items);
  return result;
}

export async function generate(
  config: VertexConfig,
  request: ModelRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<unknown> {
  if (typeof window !== 'undefined') throw new Error('Vertex requests are server-only.');
  let accessToken: string;
  try {
    accessToken = await getVertexAccessToken(config.env, fetchImpl);
  } catch {
    throw new AiError('ai_unavailable', 'The live AI credentials are unavailable.');
  }
  const hostname =
    config.location === 'global'
      ? 'aiplatform.googleapis.com'
      : `${config.location}-aiplatform.googleapis.com`;
  const url = `https://${hostname}/v1/projects/${config.project}/locations/${config.location}/publishers/google/models/${config.model}:generateContent`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: request.instructions }] },
        contents: [
          {
            role: 'user',
            parts: [
              { text: JSON.stringify(request.input) },
              ...(request.file
                ? [{ inlineData: { mimeType: request.file.mimeType, data: request.file.data } }]
                : []),
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: vertexSchema(request.schema),
          temperature: 0.2,
          maxOutputTokens: 4096,
          candidateCount: 1,
        },
      }),
      signal: controller.signal,
      redirect: 'error',
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new AiError(
        response.status === 429 ? 'ai_busy' : 'ai_unavailable',
        response.status === 429
          ? 'The live AI provider is busy. Try again shortly.'
          : 'The live AI provider could not complete this request.',
      );
    }
    const envelope = await boundedJson(response, 65536);
    if (
      !isRecord(envelope) ||
      !Array.isArray(envelope.candidates) ||
      envelope.candidates.length !== 1
    ) {
      throw new Error('Missing candidate');
    }
    const candidate = envelope.candidates[0];
    if (
      !isRecord(candidate) ||
      candidate.finishReason !== 'STOP' ||
      !isRecord(candidate.content) ||
      !Array.isArray(candidate.content.parts)
    )
      throw new Error('Incomplete response');
    const output = candidate.content.parts
      .filter((part) => isRecord(part) && part.thought !== true && typeof part.text === 'string')
      .map((part) => (part as { text: string }).text)
      .join('');
    if (!output.trim()) throw new Error('Missing response');
    return JSON.parse(output);
  } catch (error) {
    if (error instanceof AiError) throw error;
    throw new AiError(
      controller.signal.aborted ? 'ai_timeout' : 'invalid_model_response',
      controller.signal.aborted
        ? 'The live AI request timed out. Try again.'
        : 'The AI response could not be verified.',
    );
  } finally {
    clearTimeout(timer);
  }
}
