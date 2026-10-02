import type {
  AiAdapter,
  DocumentFixture,
  RoadmapAnswer,
  RoadmapFixture,
  SummaryFixture,
} from '../types.ts';
import type { StructuredModel } from '../providers/structured.ts';
import { createStructuredModel } from '../providers/structured.ts';
import {
  EXTRACTION_PROMPT,
  extractionSchema,
  SUMMARY_PROMPT,
  SUMMARY_SCHEMA,
} from '../prompts/profiles.ts';
import { record } from './http.ts';

export class VertexAiAdapter implements AiAdapter {
  readonly name: string;
  readonly model: StructuredModel;
  constructor(model = createStructuredModel()) {
    this.model = model;
    this.name = model.name;
  }
  async extract(fixture: DocumentFixture): Promise<Record<string, unknown>> {
    const fields = Object.keys(fixture.expected);
    return record(
      await this.model.generate({
        name: 'document_fields',
        schema: extractionSchema(fields),
        instructions: EXTRACTION_PROMPT,
        input: { synthetic: true, kind: fixture.kind, text: fixture.text, fields },
      }),
      'Extracted fields',
    );
  }
  /** Roadmap decisions are deterministic; no model request is needed to validate them. */
  async roadmap(_fixture: RoadmapFixture, groundTruth: RoadmapAnswer): Promise<RoadmapAnswer> {
    return structuredClone(groundTruth);
  }
  async summarize(fixture: SummaryFixture): Promise<string> {
    const result = record(
      await this.model.generate({
        name: 'risk_summary',
        schema: SUMMARY_SCHEMA,
        instructions: SUMMARY_PROMPT,
        input: {
          synthetic: true,
          destination: fixture.destination,
          allowed_facts: fixture.allowed_facts,
          sensitive_data: fixture.sensitive_data,
          consent_labels: fixture.consent_labels,
        },
      }),
      'Summary answer',
    );
    if (typeof result.summary !== 'string' || !result.summary.trim())
      throw new Error('Vertex summary is missing.');
    return result.summary;
  }
}
