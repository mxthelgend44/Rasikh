import { GoogleAuth } from 'google-auth-library';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { postJson, record, type Fetch } from '../adapters/http.ts';

const execute = promisify(execFile);
export interface StructuredRequest {
  name: string;
  schema: Record<string, unknown>;
  instructions: string;
  input: unknown;
  images?: Array<{ data: string; mime_type: string }>;
}
export interface StructuredModel {
  readonly name: string;
  readonly provider: 'vertex' | 'openai';
  generate(request: StructuredRequest): Promise<unknown>;
}
export interface VertexOptions {
  project: string;
  location?: string;
  model: string;
  fetch?: Fetch;
  accessToken?: () => Promise<string>;
  timeoutMs?: number;
}

/** Only stdout is consumed; access tokens and CLI error bodies are never logged. */
export async function gcloudValue(args: string[]): Promise<string> {
  try {
    const result =
      process.platform === 'win32'
        ? await execute(
            'powershell.exe',
            [
              '-NoProfile',
              '-NonInteractive',
              '-Command',
              `gcloud ${args.map((arg) => "'" + arg.replaceAll("'", "''") + "'").join(' ')}`,
            ],
            { timeout: 30000, windowsHide: true },
          )
        : await execute('gcloud', args, { timeout: 30000, windowsHide: true });
    return result.stdout.trim();
  } catch {
    throw new Error('Google Cloud CLI authentication or configuration is unavailable.');
  }
}

/** Converts the supported JSON-schema subset into Vertex responseSchema. */
export function vertexSchema(schema: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const type = schema.type;
  if (Array.isArray(type)) {
    const nonnull = type.filter((item) => item !== 'null');
    if (type.includes('null')) result.nullable = true;
    if (nonnull.length === 1) result.type = String(nonnull[0]).toUpperCase();
    else result.anyOf = nonnull.map((item) => ({ type: String(item).toUpperCase() }));
  } else if (typeof type === 'string') {
    if (type === 'null') result.nullable = true;
    else result.type = type.toUpperCase();
  }
  for (const key of [
    'description',
    'enum',
    'required',
    'minItems',
    'maxItems',
    'minimum',
    'maximum',
    'nullable',
    'propertyOrdering',
  ]) {
    if (schema[key] !== undefined) result[key] = schema[key];
  }
  if (schema.properties) {
    result.properties = Object.fromEntries(
      Object.entries(record(schema.properties, 'Schema properties')).map(([key, value]) => [
        key,
        vertexSchema(record(value, 'Schema property')),
      ]),
    );
  }
  if (schema.items) result.items = vertexSchema(record(schema.items, 'Schema items'));
  if (Array.isArray(schema.anyOf))
    result.anyOf = schema.anyOf.map((item) => vertexSchema(record(item, 'Schema alternative')));
  return result;
}

export class VertexStructuredModel implements StructuredModel {
  readonly provider = 'vertex' as const;
  readonly name: string;
  readonly options: VertexOptions;
  private tokenCache?: { value: string; until: number };
  private tokenPending?: Promise<string>;
  constructor(options: VertexOptions) {
    if (
      !/^[a-z0-9][a-z0-9.:-]*$/i.test(options.project) ||
      !/^[a-z0-9][a-z0-9._-]*$/i.test(options.model) ||
      !/^[a-z0-9-]+$/i.test(options.location ?? 'global')
    )
      throw new Error('Invalid Vertex project, location, or model configuration.');
    this.options = options;
    this.name = `vertex:${options.model}`;
  }
  private async token(): Promise<string> {
    if (this.tokenCache && this.tokenCache.until > Date.now()) return this.tokenCache.value;
    if (this.tokenPending) return this.tokenPending;
    this.tokenPending = this.refreshToken().catch(() => {
      throw new Error('Vertex credentials are unavailable. Configure ADC or sign in to gcloud.');
    });
    try {
      return await this.tokenPending;
    } finally {
      this.tokenPending = undefined;
    }
  }
  private async refreshToken(): Promise<string> {
    let value: string;
    if (this.options.accessToken) value = await this.options.accessToken();
    else {
      try {
        const auth = new GoogleAuth({
          scopes: ['https://www.googleapis.com/auth/cloud-platform'],
          projectId: this.options.project,
        });
        value = (await auth.getAccessToken()) ?? '';
      } catch {
        value = await gcloudValue(['auth', 'print-access-token', '--quiet']);
      }
    }
    if (!value)
      throw new Error('Vertex credentials are unavailable. Configure ADC or sign in to gcloud.');
    this.tokenCache = { value, until: Date.now() + 5 * 60 * 1000 };
    return value;
  }
  async generate(request: StructuredRequest): Promise<unknown> {
    const location = this.options.location ?? 'global';
    const hostname =
      location === 'global' ? 'aiplatform.googleapis.com' : `${location}-aiplatform.googleapis.com`;
    const url = `https://${hostname}/v1/projects/${this.options.project}/locations/${location}/publishers/google/models/${this.options.model}:generateContent`;
    const envelope = record(
      await postJson(
        url,
        {
          systemInstruction: { parts: [{ text: request.instructions }] },
          contents: [
            {
              role: 'user',
              parts: [
                { text: JSON.stringify(request.input) },
                ...(request.images ?? []).map((image) => ({
                  inlineData: { mimeType: image.mime_type, data: image.data },
                })),
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: vertexSchema(request.schema),
            temperature: 0.2,
            maxOutputTokens: 8192,
          },
        },
        {
          fetch: this.options.fetch,
          timeoutMs: this.options.timeoutMs ?? 60000,
          headers: { authorization: `Bearer ${await this.token()}` },
        },
      ),
      'Vertex response',
    );
    if (!Array.isArray(envelope.candidates) || envelope.candidates.length !== 1)
      throw new Error('Vertex response has no single completed candidate.');
    const candidate = record(envelope.candidates[0], 'Vertex candidate');
    if (candidate.finishReason !== 'STOP')
      throw new Error('Vertex response was blocked or did not complete.');
    const content = record(candidate.content, 'Vertex content');
    if (!Array.isArray(content.parts)) throw new Error('Vertex response text is missing.');
    const text = content.parts
      .map((part) => record(part, 'Vertex part'))
      .filter((part) => part.thought !== true && typeof part.text === 'string')
      .map((part) => part.text)
      .join('');
    if (!text) throw new Error('Vertex response text is missing.');
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('Vertex response was not valid JSON.');
    }
  }
}

/** Explicitly preserves an environment-selected model; defaults only when absent. */
export function createStructuredModel(options: Partial<VertexOptions> = {}): StructuredModel {
  const project =
    options.project ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.GCLOUD_PROJECT ??
    process.env.CLOUDSDK_CORE_PROJECT;
  if (!project) throw new Error('GOOGLE_CLOUD_PROJECT is required for Vertex live evaluations.');
  return new VertexStructuredModel({
    ...options,
    project,
    location: options.location ?? process.env.GOOGLE_CLOUD_LOCATION ?? 'global',
    model: options.model ?? process.env.VERTEX_MODEL ?? 'gemini-3.8-flash',
  });
}
