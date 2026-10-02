import type {
  BlockerSnapshot,
  DocumentFixture,
  Metric,
  RoadmapAnswer,
  SummaryFixture,
} from './types.ts';

export function ratio(
  numerator: number,
  denominator: number,
  target: number,
  higherIsBetter = true,
): Metric {
  return {
    value: denominator === 0 ? null : numerator / denominator,
    numerator,
    denominator,
    target,
    unit: 'ratio',
    higher_is_better: higherIsBetter,
  };
}

function normalizeScalar(value: unknown): unknown {
  return typeof value === 'string'
    ? value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en')
    : value;
}

export function scoreExtraction(fixture: DocumentFixture, answer: Record<string, unknown>) {
  const fields = Object.entries(fixture.expected).map(([field, expected]) => ({
    field,
    correct:
      Object.hasOwn(answer, field) && normalizeScalar(answer[field]) === normalizeScalar(expected),
  }));
  const unexpectedFields = Object.keys(answer).filter(
    (field) => !Object.hasOwn(fixture.expected, field),
  );
  return {
    correct: fields.filter((field) => field.correct).length,
    total: fields.length,
    fields,
    unexpected_fields: unexpectedFields,
    exact: fields.every((field) => field.correct) && unexpectedFields.length === 0,
  };
}

const normalizedBlockers = (blockers: BlockerSnapshot[]): BlockerSnapshot[] =>
  blockers
    .map((blocker) => ({
      step_id: blocker.step_id,
      unmet_dependencies: [...blocker.unmet_dependencies].sort(),
      missing_documents: [...blocker.missing_documents].sort(),
    }))
    .sort((a, b) => a.step_id.localeCompare(b.step_id));

export function scoreRoadmap(expected: RoadmapAnswer, answer: RoadmapAnswer) {
  return {
    order_correct: JSON.stringify(expected.step_ids) === JSON.stringify(answer.step_ids),
    blockers_correct:
      JSON.stringify(normalizedBlockers(expected.blockers)) ===
      JSON.stringify(normalizedBlockers(answer.blockers)),
  };
}

export function scoreSummary(fixture: SummaryFixture, answer: string) {
  const matches = (pattern: string) => new RegExp(pattern, 'iu').test(answer.normalize('NFKC'));
  const facts = fixture.required_facts.map((fact) => ({
    id: fact.id,
    covered: fact.any_of.some(matches) && !fact.contradictions?.some(matches),
  }));
  const violations = fixture.forbidden
    .filter((item) => item.patterns.some(matches))
    .map((item) => item.id);
  return {
    covered: facts.filter((fact) => fact.covered).length,
    total: facts.length,
    facts,
    forbidden_total: fixture.forbidden.length,
    violations,
  };
}
