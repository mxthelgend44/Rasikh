import { record } from '../adapters/http.ts';
import type { StructuredModel } from '../providers/structured.ts';
import type { DocumentImage } from './manifest.ts';
import { EXTRACTION_PROMPT, extractionSchema } from '../prompts/profiles.ts';

export interface VisionDocumentAdapter {
  readonly name: string;
  readonly evidence: 'live_vision' | 'test_double';
  extract(document: DocumentImage, image: Buffer): Promise<Record<string, unknown>>;
}

// Vertex/OpenAI authentication and request transport are owned by the shared provider.
export class StructuredVisionAdapter implements VisionDocumentAdapter {
  readonly evidence = 'live_vision' as const;
  readonly name: string;
  constructor(private readonly model: StructuredModel) {
    this.name = model.name;
  }
  async extract(document: DocumentImage, image: Buffer): Promise<Record<string, unknown>> {
    const fields = Object.keys(document.expected);
    const result = await this.model.generate({
      name: 'document_vision_fields',
      schema: extractionSchema(fields),
      instructions: `${EXTRACTION_PROMPT} Extract from the supplied document IMAGE only. Preserve names, institution names, roles and nationalities in the script printed in the document; do not translate or transliterate Arabic. Dates must use ASCII YYYY-MM-DD. Convert Arabic-Indic digits and Arabic thousands/decimal separators into numeric values. Ignore synthetic warning stamps and fixture identifiers.`,
      input: { kind: document.kind, fields },
      images: [{ data: image.toString('base64'), mime_type: document.mime_type }],
    });
    return record(result, 'Vision extraction response');
  }
}
