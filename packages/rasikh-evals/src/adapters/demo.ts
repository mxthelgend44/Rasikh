import { readFileSync } from 'node:fs';
import type {
  AiAdapter,
  DocumentFixture,
  GuardAdapter,
  GuardFixture,
  GuardOutcome,
  RoadmapAnswer,
  RoadmapFixture,
  SummaryFixture,
} from '../types.ts';
import { record } from './http.ts';
import { roadmapAnswer } from './validate.ts';

type Cache = {
  extraction: Record<string, Record<string, unknown>>;
  roadmap: Record<string, unknown>;
  summary: Record<string, string>;
  guard: Record<string, GuardOutcome>;
};
const cache: Cache = JSON.parse(
  readFileSync(new URL('../fixtures/demo-responses.json', import.meta.url), 'utf8'),
);
function cached<T>(suite: Record<string, T>, id: string): T {
  if (!Object.hasOwn(suite, id)) throw new Error('Synthetic cache response missing.');
  return structuredClone(suite[id]!);
}
export class DemoAiAdapter implements AiAdapter {
  readonly name = 'synthetic-cache';
  async extract(fixture: DocumentFixture): Promise<Record<string, unknown>> {
    return record(cached(cache.extraction, fixture.id), 'Cached fields');
  }
  async roadmap(fixture: RoadmapFixture): Promise<RoadmapAnswer> {
    return roadmapAnswer(cached(cache.roadmap, fixture.id));
  }
  async summarize(fixture: SummaryFixture): Promise<string> {
    return cached(cache.summary, fixture.id);
  }
}
export class DemoGuardAdapter implements GuardAdapter {
  readonly name = 'synthetic-cache';
  async check(fixture: GuardFixture): Promise<GuardOutcome> {
    return cached(cache.guard, fixture.id);
  }
}
