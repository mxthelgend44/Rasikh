import assert from 'node:assert/strict';
import test from 'node:test';
import { documentFixtures } from '../src/fixtures/documents.ts';
import { roadmapFixtures } from '../src/fixtures/roadmaps.ts';
import { summaryFixtures } from '../src/fixtures/summaries.ts';
import { guardFixtures } from '../src/fixtures/guard.ts';
import { ratio, scoreExtraction, scoreRoadmap, scoreSummary } from '../src/metrics.ts';
import { DemoAiAdapter, DemoGuardAdapter } from '../src/adapters/demo.ts';

test('golden suites have the required size, unique IDs, and synthetic data', () => {
  assert.deepEqual(
    [documentFixtures.length, roadmapFixtures.length, summaryFixtures.length, guardFixtures.length],
    [20, 15, 15, 25],
  );
  const fixtures = [...documentFixtures, ...roadmapFixtures, ...summaryFixtures, ...guardFixtures];
  assert.equal(new Set(fixtures.map((fixture) => fixture.id)).size, fixtures.length);
  assert.ok(fixtures.every((fixture) => fixture.synthetic));
  assert.ok(documentFixtures.every((fixture) => /synthetic|fake/i.test(fixture.text)));
  assert.equal(guardFixtures.filter((fixture) => fixture.kind === 'direct').length, 13);
  assert.equal(guardFixtures.filter((fixture) => fixture.kind === 'indirect').length, 12);
});

test('field scoring handles missing/null, normalization and hallucinated fields', () => {
  const fixture = documentFixtures[3]!;
  assert.equal(
    scoreExtraction(fixture, { ...fixture.expected, full_name: '  LUCA  FICTION  ' }).exact,
    true,
  );
  const { date_of_birth: _, ...missing } = fixture.expected;
  assert.equal(scoreExtraction(fixture, missing).correct, 4);
  assert.equal(
    scoreExtraction(fixture, { ...fixture.expected, date_of_birth: '1990-01-01' }).correct,
    4,
  );
  assert.equal(scoreExtraction(fixture, { ...fixture.expected, invented: 'FAKE' }).exact, false);
  const bank = documentFixtures[19]!;
  assert.equal(scoreExtraction(bank, { ...bank.expected, closing_balance_aed: 0 }).exact, true);
  assert.equal(scoreExtraction(bank, { ...bank.expected, closing_balance_aed: '0' }).exact, false);
});

test('roadmap order is strict, blocker member order is immaterial, duplicates fail', () => {
  const expected = roadmapFixtures[0]!.expected;
  const reordered = structuredClone(expected);
  reordered.blockers.reverse();
  reordered.blockers.forEach((blocker) => {
    blocker.unmet_dependencies.reverse();
    blocker.missing_documents.reverse();
  });
  assert.deepEqual(scoreRoadmap(expected, reordered), {
    order_correct: true,
    blockers_correct: true,
  });
  reordered.step_ids.reverse();
  assert.equal(scoreRoadmap(expected, reordered).order_correct, false);
  reordered.blockers.push(reordered.blockers[0]!);
  assert.equal(scoreRoadmap(expected, reordered).blockers_correct, false);
});

test('summary fact grading rejects contradictions and detects salary numbers and words', async () => {
  const fixture = summaryFixtures[0]!;
  const safe = await new DemoAiAdapter().summarize(fixture);
  assert.equal(scoreSummary(fixture, safe).covered, 4);
  assert.deepEqual(scoreSummary(fixture, safe).violations, []);
  assert.ok(
    scoreSummary(fixture, `${safe} Salary AED 24,000.00`).violations.includes('raw_salary'),
  );
  assert.ok(
    scoreSummary(fixture, `${safe} Salary twenty-four-thousand dirhams.`).violations.includes(
      'raw_salary',
    ),
  );
  assert.equal(scoreSummary(fixture, `${safe} Affordability: unconfirmed.`).covered, 3);
  assert.equal(scoreSummary(fixture, 'Affordability: unconfirmed.').covered, 0);
});

test('bank salary is permitted only in the consented fixtures', async () => {
  const adapter = new DemoAiAdapter();
  const consented = summaryFixtures[8]!;
  const withheld = summaryFixtures[9]!;
  assert.deepEqual(scoreSummary(consented, await adapter.summarize(consented)).violations, []);
  const unsafe = `${await adapter.summarize(withheld)} Salary AED 15 000.`;
  assert.deepEqual(scoreSummary(withheld, unsafe).violations, ['raw_salary_without_consent']);
});

test('no observations has null rate, and cached responses do not attest verification', async () => {
  assert.equal(ratio(0, 0, 0).value, null);
  const cached = await new DemoGuardAdapter().check(guardFixtures[0]!);
  assert.equal(cached.source, 'cached');
  assert.equal(cached.verified, false);
  await assert.rejects(
    new DemoAiAdapter().extract({ ...documentFixtures[0]!, id: 'no_such_cache' }),
    /missing/,
  );
});

test('cache answers are independently stored and cloned, never generated from expected values', async () => {
  const adapter = new DemoAiAdapter();
  const original = documentFixtures[0]!;
  const changed = {
    ...original,
    expected: { ...original.expected, full_name: 'Different Fake Name' },
  };
  const answer = await adapter.extract(changed);
  assert.equal(answer.full_name, 'Alex Demo');
  answer.full_name = 'Mutated Cache Copy';
  assert.equal((await adapter.extract(original)).full_name, 'Alex Demo');
  const roadmap = structuredClone(roadmapFixtures[0]!);
  roadmap.expected.step_ids = ['different_step'];
  assert.deepEqual(
    (await adapter.roadmap(roadmap)).step_ids,
    roadmapFixtures[0]!.expected.step_ids,
  );
});
