import type {
  AiAdapter,
  DocumentFixture,
  RoadmapAnswer,
  RoadmapFixture,
  SummaryFixture,
} from '../types.ts';
import { contract, postJson, record, type Fetch } from './http.ts';
import { roadmapAnswer } from './validate.ts';

// Explicit eval transport; apps/web does not currently implement these routes.
export class AppHttpAdapter implements AiAdapter {
  readonly name = 'app-http';
  private readonly baseUrl: string;
  constructor(
    baseUrl: string,
    private readonly options: { fetch?: Fetch; timeoutMs?: number; token?: string } = {},
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }
  private async call(path: string, body: unknown): Promise<Record<string, unknown>> {
    return contract(
      await postJson(`${this.baseUrl}/${path}`, body, {
        ...this.options,
        headers: this.options.token ? { authorization: `Bearer ${this.options.token}` } : undefined,
      }),
      `App ${path}`,
    );
  }
  async extract(fixture: DocumentFixture): Promise<Record<string, unknown>> {
    const result = await this.call('extract', {
      case_id: fixture.case_id,
      synthetic: true,
      document: { id: fixture.id, kind: fixture.kind, text: fixture.text },
      fields: Object.keys(fixture.expected),
    });
    return record(result.fields, 'Extracted fields');
  }
  async roadmap(fixture: RoadmapFixture, groundTruth: RoadmapAnswer): Promise<RoadmapAnswer> {
    const result = await this.call('roadmap', {
      synthetic: true,
      state: fixture.state,
      engine_ground_truth: groundTruth,
    });
    return roadmapAnswer(result);
  }
  async summarize(fixture: SummaryFixture): Promise<string> {
    const result = await this.call('summary', {
      case_id: fixture.case_id,
      synthetic: true,
      destination: fixture.destination,
      allowed_facts: fixture.allowed_facts,
      sensitive_data: fixture.sensitive_data,
      consent_labels: fixture.consent_labels,
    });
    if (typeof result.summary !== 'string' || !result.summary.trim())
      throw new Error('App summary is missing.');
    return result.summary;
  }
}
