import type { DocumentKind, ExtractorPort, Provenance } from './types';
import { EXTRACTION_INSTRUCTIONS, PROMPT_SHA256, SCHEMA_VERSION, modelSchema } from './schema';

type Fetch = typeof globalThis.fetch;

const NO_EVAL_NOTE =
  'No evaluation of this provider on this extraction path has been run. Existing packages/rasikh-evals results use Vertex AI and synthetic data and are not evidence for OpenAI.';

/** Live OpenAI Responses API with strict structured outputs. Server-side only. */
export class OpenAiExtractor implements ExtractorPort {
  readonly provenance: Provenance;
  private readonly options: { apiKey: string; model: string; fetch?: Fetch; timeoutMs?: number };
  constructor(options: { apiKey: string; model: string; fetch?: Fetch; timeoutMs?: number }) {
    if (!options.apiKey || !options.model)
      throw new Error('Live mode requires OPENAI_API_KEY and OPENAI_MODEL.');
    this.options = options;
    this.provenance = {
      mode: 'live',
      provider: 'openai',
      model: options.model,
      live_model_call: true,
      schema_version: SCHEMA_VERSION,
      prompt_sha256: PROMPT_SHA256,
      evaluation: { openai_extraction_eval: 'not_run', note: NO_EVAL_NOTE },
    };
  }

  async extract(input: {
    kind: DocumentKind;
    text: string;
    fields: readonly string[];
  }): Promise<unknown> {
    const request = this.options.fetch ?? globalThis.fetch;
    let response: Response;
    try {
      response = await request('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.options.apiKey}`,
        },
        body: JSON.stringify({
          model: this.options.model,
          store: false,
          instructions: EXTRACTION_INSTRUCTIONS,
          input: JSON.stringify({ kind: input.kind, document: input.text, fields: input.fields }),
          text: {
            format: {
              type: 'json_schema',
              name: 'document_fields',
              strict: true,
              schema: modelSchema(input.fields),
            },
          },
        }),
        signal: AbortSignal.timeout(this.options.timeoutMs ?? 60000),
        redirect: 'error',
      });
    } catch {
      throw new Error('Model provider unavailable or timed out.');
    }
    if (!response.ok) throw new Error(`Model provider returned HTTP ${response.status}.`);
    const envelope = (await response.json().catch(() => null)) as {
      status?: string;
      output?: { type?: string; content?: { type?: string; text?: string }[] }[];
    } | null;
    if (!envelope || envelope.status !== 'completed' || !Array.isArray(envelope.output))
      throw new Error('Model response did not complete.');
    const texts: string[] = [];
    for (const item of envelope.output) {
      if (item.type !== 'message') continue;
      for (const part of item.content ?? []) {
        if (part.type === 'refusal') throw new Error('Model refused the request.');
        if (part.type === 'output_text' && typeof part.text === 'string') texts.push(part.text);
      }
    }
    // Returned unvalidated: parseModelOutput decides whether it is acceptable.
    return texts.join('');
  }
}

/**
 * Deterministic demo extractor. It makes NO model call: it reads `Label: value` lines from the
 * supplied text. Provenance says so explicitly; it must never be presented as a live result.
 */
export class DeterministicDemoExtractor implements ExtractorPort {
  readonly provenance: Provenance = {
    mode: 'demo',
    provider: 'none',
    model: null,
    live_model_call: false,
    schema_version: SCHEMA_VERSION,
    prompt_sha256: PROMPT_SHA256,
    evaluation: { openai_extraction_eval: 'not_run', note: NO_EVAL_NOTE },
  };

  async extract(input: {
    kind: DocumentKind;
    text: string;
    fields: readonly string[];
  }): Promise<unknown> {
    const lines = input.text.split(/\r?\n/);
    const fields: Record<string, unknown> = {};
    for (const name of input.fields) {
      const label = name.replace(/_aed$/, '').replace(/_/g, ' ').toLowerCase();
      const line = lines.find((l) => l.toLowerCase().startsWith(`${label}:`));
      const value = line ? line.slice(line.indexOf(':') + 1).trim() : '';
      fields[name] = value
        ? {
            value: name.endsWith('_aed') ? Number(value.replace(/[^\d.]/g, '')) : value,
            evidence: line!.trim(),
            confidence: 0.9,
          }
        : { value: null, evidence: null, confidence: 0 };
    }
    return { fields };
  }
}

/** Placeholder for live mode without credentials. The runtime refuses before it is ever called. */
export class UnconfiguredLiveExtractor implements ExtractorPort {
  readonly provenance: Provenance = {
    mode: 'live',
    provider: 'openai',
    model: null,
    live_model_call: false,
    schema_version: SCHEMA_VERSION,
    prompt_sha256: PROMPT_SHA256,
    evaluation: { openai_extraction_eval: 'not_run', note: NO_EVAL_NOTE },
  };
  async extract(): Promise<unknown> {
    throw new Error('Live mode is not configured.');
  }
}
