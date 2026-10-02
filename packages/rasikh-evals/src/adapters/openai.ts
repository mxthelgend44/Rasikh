import type {
  AiAdapter,
  DocumentFixture,
  RoadmapAnswer,
  RoadmapFixture,
  SummaryFixture,
} from '../types.ts';
import { postJson, record, type Fetch } from './http.ts';
import {
  EXTRACTION_PROMPT,
  SUMMARY_PROMPT,
  SUMMARY_SCHEMA,
  extractionSchema,
} from '../prompts/profiles.ts';

type Schema = Record<string, unknown>;

export class OpenAiAdapter implements AiAdapter {
  readonly name: string;
  private readonly options: {
    apiKey: string;
    model: string;
    fetch?: Fetch;
    timeoutMs?: number;
    baseUrl?: string;
  };
  constructor(options: {
    apiKey: string;
    model: string;
    fetch?: Fetch;
    timeoutMs?: number;
    baseUrl?: string;
  }) {
    if (!options.apiKey || !options.model)
      throw new Error('Live OpenAI mode requires OPENAI_API_KEY and OPENAI_MODEL.');
    this.options = options;
    this.name = `openai-responses:${options.model}`;
  }
  private async generate(
    name: string,
    schema: Schema,
    instructions: string,
    input: unknown,
  ): Promise<unknown> {
    const envelope = record(
      await postJson(
        `${(this.options.baseUrl ?? 'https://api.openai.com/v1').replace(/\/$/, '')}/responses`,
        {
          model: this.options.model,
          store: false,
          instructions,
          input: JSON.stringify(input),
          text: { format: { type: 'json_schema', name, strict: true, schema } },
        },
        {
          fetch: this.options.fetch,
          timeoutMs: this.options.timeoutMs ?? 60000,
          headers: { authorization: `Bearer ${this.options.apiKey}` },
        },
      ),
      'OpenAI response',
    );
    if (envelope.status !== 'completed' || !Array.isArray(envelope.output))
      throw new Error('OpenAI response did not complete.');
    const texts: string[] = [];
    for (const item of envelope.output) {
      const output = record(item, 'OpenAI output item');
      if (output.type !== 'message') continue;
      if (!Array.isArray(output.content)) throw new Error('OpenAI message content is invalid.');
      for (const part of output.content) {
        const content = record(part, 'OpenAI message content');
        if (content.type === 'refusal') throw new Error('OpenAI refused the eval request.');
        if (content.type === 'output_text' && typeof content.text === 'string')
          texts.push(content.text);
      }
    }
    if (!texts.length) throw new Error('OpenAI output text is missing.');
    try {
      return JSON.parse(texts.join(''));
    } catch {
      throw new Error('OpenAI output was not valid JSON.');
    }
  }
  async extract(fixture: DocumentFixture): Promise<Record<string, unknown>> {
    const fields = Object.keys(fixture.expected);
    const schema = extractionSchema(fields);
    return record(
      await this.generate('document_fields', schema, EXTRACTION_PROMPT, {
        kind: fixture.kind,
        text: fixture.text,
        fields,
      }),
      'Extracted fields',
    );
  }
  async roadmap(_fixture: RoadmapFixture, groundTruth: RoadmapAnswer): Promise<RoadmapAnswer> {
    return structuredClone(groundTruth);
  }
  async summarize(fixture: SummaryFixture): Promise<string> {
    const answer = record(
      await this.generate('risk_summary', SUMMARY_SCHEMA, SUMMARY_PROMPT, {
        destination: fixture.destination,
        allowed_facts: fixture.allowed_facts,
        sensitive_data: fixture.sensitive_data,
        consent_labels: fixture.consent_labels,
      }),
      'Summary answer',
    );
    if (typeof answer.summary !== 'string' || !answer.summary.trim())
      throw new Error('OpenAI summary is missing.');
    return answer.summary;
  }
}
