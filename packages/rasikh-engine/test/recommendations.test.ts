import assert from 'node:assert/strict';
import test from 'node:test';
import { CONTRACT_VERSION } from '@rasikh/shared';
import { recommendSetupPaths } from '../src/setup.js';
import { matchNeighborhoods } from '../src/neighborhoods.js';
import type {
  CompanySetupInput,
  NeighborhoodInput,
  NeighborhoodWeights,
  SetupWeights,
} from '../src/recommendation-types.js';
import type { StructuredReason } from '../src/types.js';

const company: CompanySetupInput = {
  activities: ['software development'],
  industry: 'technology',
  team_size: 3,
  physical_space: 'office',
  client_base: 'international',
  regulatory_profile: 'standard',
};
const newcomer: NeighborhoodInput = {
  office_location: 'Hub71',
  budget_band: 'medium',
  household: 'single',
  car: false,
  preferences: ['waterfront', 'walkability'],
};
const zeroSetup: SetupWeights = {
  activities: 0,
  industry: 0,
  team_size: 0,
  physical_space: 0,
  client_base: 0,
  regulatory_profile: 0,
};
const zeroNeighborhood: NeighborhoodWeights = {
  commute: 0,
  budget: 0,
  household: 0,
  mobility: 0,
  preferences: 0,
};

function assertReasons(reasons: StructuredReason[]): void {
  assert.ok(reasons.length > 0);
  for (const reason of reasons) {
    assert.deepEqual(Object.keys(reason).sort(), [
      'criterion',
      'effect',
      'explanation_key',
      'value',
    ]);
    assert.equal(typeof reason.criterion, 'string');
    assert.match(reason.explanation_key, /^[a-z0-9_.]+$/);
    assert.ok(typeof reason.effect === 'number' || typeof reason.effect === 'string');
    assert.doesNotThrow(() => JSON.stringify(reason.value));
  }
}

function assertRanking(
  items: {
    contract_version: string;
    rank: number;
    id: string;
    score: number;
    score_breakdown: {
      criterion: string;
      fit: number;
      weight: number;
      contribution: number;
      illustrative: boolean;
    }[];
    reasons: StructuredReason[];
    illustrative: boolean;
    requirements: { value: string[]; illustrative: boolean };
    sources: string[];
  }[],
): void {
  items.forEach((item, index) => {
    assert.equal(item.contract_version, CONTRACT_VERSION);
    assert.equal(item.rank, index + 1);
    assert.equal(item.illustrative, true);
    assert.equal(item.requirements.illustrative, true);
    assert.ok(
      item.sources.length > 0 && item.sources.every((source) => source.startsWith('https://')),
    );
    assert.ok(item.score >= 0 && item.score <= 100);
    const contributionSum = item.score_breakdown.reduce(
      (sum, criterion) => sum + criterion.contribution,
      0,
    );
    assert.ok(Math.abs(contributionSum - item.score) < 0.0000011);
    for (const criterion of item.score_breakdown) {
      assert.ok(criterion.fit >= 0 && criterion.fit <= 1);
      assert.ok(criterion.weight >= 0);
      assert.equal(criterion.illustrative, true);
      assert.equal(
        item.reasons.find((reason) => reason.criterion === criterion.criterion)?.effect,
        criterion.contribution,
      );
    }
    assertReasons(item.reasons);
    if (index > 0) {
      assert.ok(items[index - 1].score >= item.score);
      if (items[index - 1].score === item.score) assert.ok(items[index - 1].id < item.id);
    }
  });
}

function summary(items: { id: string; score: number }[]): { id: string; score: number }[] {
  return items.map(({ id, score }) => ({ id, score }));
}

test('setup produces every route, explained contributions, contract version and an unassessed Hub71 candidate', () => {
  const result = recommendSetupPaths(company);
  assert.equal(result.contract_version, CONTRACT_VERSION);
  assert.equal(result.illustrative, true);
  assert.deepEqual(result.options.map((item) => item.id).sort(), [
    'adgm',
    'kezad',
    'mainland',
    'masdar',
    'twofour54',
  ]);
  assert.equal(result.options[0].id, 'adgm');
  assertRanking(result.options);
  assertReasons(result.reasons);
  assert.equal(result.hub71_eligibility.contract_version, CONTRACT_VERSION);
  assert.equal(result.hub71_eligibility.candidate_for_review, true);
  assert.equal(result.hub71_eligibility.determination, 'not_assessed');
  assertReasons(result.hub71_eligibility.reasons);
  assert.ok(result.hub71_eligibility.reasons.some((reason) => reason.effect === 'review_required'));
});

test('setup responds to financial, industrial, media, sustainability and domestic services scenarios', () => {
  const scenarios: [Partial<CompanySetupInput>, string][] = [
    [
      { activities: ['asset management'], industry: 'finance', regulatory_profile: 'financial' },
      'adgm',
    ],
    [
      {
        activities: ['manufacturing', 'logistics'],
        industry: 'industrial',
        team_size: 60,
        physical_space: 'warehouse',
        regulatory_profile: 'industrial',
      },
      'kezad',
    ],
    [
      { activities: ['film', 'gaming'], industry: 'media', regulatory_profile: 'media' },
      'twofour54',
    ],
    [
      { activities: ['clean energy'], industry: 'sustainability', physical_space: 'none' },
      'masdar',
    ],
    [
      {
        activities: ['consulting'],
        industry: 'professional services',
        team_size: 25,
        client_base: 'uae',
      },
      'mainland',
    ],
  ];
  for (const [overrides, expected] of scenarios) {
    const result = recommendSetupPaths({ ...company, ...overrides });
    assert.equal(result.options[0].id, expected);
    assert.equal(result.options.length, 5);
  }
});

test('a nontechnology company has no Hub71 technology signal; neither flag makes an eligibility finding', () => {
  const result = recommendSetupPaths({
    ...company,
    activities: ['manufacturing'],
    industry: 'industrial',
  });
  assert.equal(result.hub71_eligibility.candidate_for_review, false);
  assert.equal(result.hub71_eligibility.determination, 'not_assessed');
  const financialTech = recommendSetupPaths({
    ...company,
    activities: ['fintech'],
    regulatory_profile: 'financial',
  });
  assert.equal(financialTech.hub71_eligibility.candidate_for_review, true);
  assert.equal(financialTech.hub71_eligibility.determination, 'not_assessed');
});

test('setup exact aliases normalize case and separators, and duplicate activity groups do not inflate scores', () => {
  const baseline = recommendSetupPaths(company);
  const aliased = recommendSetupPaths({
    ...company,
    activities: [' SOFTware_development ', 'software development', 'SaaS'],
    industry: 'TECH',
  });
  assert.deepEqual(summary(aliased.options), summary(baseline.options));
  assert.equal(aliased.hub71_eligibility.candidate_for_review, true);
});

test('unknown and empty setup activities use neutral fit with explicit structured reasons', () => {
  const unknown = recommendSetupPaths({
    ...company,
    activities: ['underwater basket weaving'],
    industry: 'unlisted sector',
  });
  for (const item of unknown.options) {
    assert.equal(item.score_breakdown.find((entry) => entry.criterion === 'activities')?.fit, 0.5);
    assert.equal(item.score_breakdown.find((entry) => entry.criterion === 'industry')?.fit, 0.5);
  }
  assert.equal(unknown.hub71_eligibility.candidate_for_review, false);
  assert.ok(
    unknown.reasons.some((reason) => reason.explanation_key === 'setup.industry.unrecognized'),
  );
  const empty = recommendSetupPaths({ ...company, activities: [] });
  assert.ok(
    empty.reasons.some(
      (reason) => reason.explanation_key === 'setup.activities.unrecognized_or_empty',
    ),
  );
});

test('setup weights merge with defaults and criterion-only weighting changes the winner', () => {
  const partial = recommendSetupPaths(company, { client_base: 80 });
  assert.equal(partial.weights.client_base, 80);
  assert.equal(partial.weights.activities, 25);
  const warehouse = recommendSetupPaths(
    { ...company, physical_space: 'warehouse' },
    { ...zeroSetup, physical_space: 1 },
  );
  assert.equal(warehouse.options[0].id, 'kezad');
  assert.equal(warehouse.options[0].score, 100);
  assertRanking(warehouse.options);
  const standard = recommendSetupPaths(company, { ...zeroSetup, regulatory_profile: 1 });
  assert.equal(standard.options[0].id, 'masdar');
});

test('weight rescaling leaves the normalized setup ranking unchanged', () => {
  const base = recommendSetupPaths(company);
  const scaled = Object.fromEntries(
    Object.entries(base.weights).map(([key, weight]) => [key, weight * 10]),
  ) as SetupWeights;
  assert.deepEqual(summary(recommendSetupPaths(company, scaled).options), summary(base.options));
});

test('neighborhoods return all nine areas with structured breakdowns and deterministic ranks', () => {
  const result = matchNeighborhoods(newcomer);
  assert.equal(result.contract_version, CONTRACT_VERSION);
  assert.equal(result.illustrative, true);
  assert.equal(result.areas.length, 9);
  assertRanking(result.areas);
  assertReasons(result.reasons);
  for (const id of [
    'al_reem_island',
    'al_raha_beach',
    'khalifa_city',
    'mohammed_bin_zayed_city',
    'saadiyat_island',
    'yas_island',
    'al_maryah_island',
  ]) {
    assert.ok(result.areas.some((area) => area.id === id));
  }
  assert.deepEqual(matchNeighborhoods(newcomer), result);
});

test('neighborhood budget, family profile, and commute priorities produce meaningful different rankings', () => {
  const budget = matchNeighborhoods(
    { ...newcomer, budget_band: 'low' },
    { ...zeroNeighborhood, budget: 1 },
  );
  assert.equal(budget.areas[0].id, 'mohammed_bin_zayed_city');
  const family = matchNeighborhoods(
    { ...newcomer, household: 'family', car: true },
    { ...zeroNeighborhood, household: 1 },
  );
  assert.equal(family.areas[0].id, 'khalifa_city');
  assert.ok(
    family.areas.every((area) =>
      area.requirements.value.includes('verify_school_availability_and_route'),
    ),
  );
  const commute = matchNeighborhoods(
    { ...newcomer, office_location: 'Yas Island', car: true },
    { ...zeroNeighborhood, commute: 1 },
  );
  assert.equal(commute.areas[0].id, 'yas_island');
  const quiet = matchNeighborhoods(
    { ...newcomer, preferences: ['quiet', 'space'] },
    { ...zeroNeighborhood, preferences: 1 },
  );
  assert.equal(quiet.areas[0].id, 'khalifa_city');
});

test('unknown offices produce neutral commute scores and no invented minutes', () => {
  const result = matchNeighborhoods({ ...newcomer, office_location: 'unlisted office' });
  assert.ok(
    result.reasons.some(
      (reason) => reason.explanation_key === 'neighborhood.office_location.unrecognized',
    ),
  );
  for (const area of result.areas) {
    assert.equal(
      area.score_breakdown.find((criterion) => criterion.criterion === 'commute')?.fit,
      0.5,
    );
    const reason = area.reasons.find((item) => item.criterion === 'commute')!;
    assert.equal((reason.value as { minutes: null }).minutes, null);
    assert.equal(reason.explanation_key, 'neighborhood.commute.unknown_location_neutral_fit');
  }
});

test('office ids, names and known aliases resolve; duplicate preference aliases cannot inflate scores', () => {
  const byName = matchNeighborhoods({ ...newcomer, office_location: ' Al REEM Island ' });
  const byId = matchNeighborhoods({ ...newcomer, office_location: 'al_reem_island' });
  assert.deepEqual(summary(byName.areas), summary(byId.areas));
  const duplicates = matchNeighborhoods({
    ...newcomer,
    preferences: ['WATERFRONT', 'waterfront living', 'walkable', 'walking'],
  });
  assert.deepEqual(summary(duplicates.areas), summary(matchNeighborhoods(newcomer).areas));
  for (const location of ['ADGM', 'twofour54', 'KEZAD', 'Masdar City Free Zone', 'downtown']) {
    const result = matchNeighborhoods({ ...newcomer, office_location: location });
    assert.ok(
      !result.reasons.some(
        (reason) => reason.explanation_key === 'neighborhood.office_location.unrecognized',
      ),
    );
    assertRanking(result.areas);
  }
});

test('without a car the commute and mobility criteria use the separate illustrative model', () => {
  const withCar = matchNeighborhoods({ ...newcomer, office_location: 'al_reem_island', car: true });
  const withoutCar = matchNeighborhoods({
    ...newcomer,
    office_location: 'al_reem_island',
    car: false,
  });
  const carKhalifa = withCar.areas.find((area) => area.id === 'khalifa_city')!;
  const noCarKhalifa = withoutCar.areas.find((area) => area.id === 'khalifa_city')!;
  for (const criterion of ['commute', 'mobility']) {
    assert.ok(
      carKhalifa.score_breakdown.find((item) => item.criterion === criterion)!.fit >
        noCarKhalifa.score_breakdown.find((item) => item.criterion === criterion)!.fit,
    );
  }
  const sameArea = withoutCar.areas.find((area) => area.id === 'al_reem_island')!;
  assert.equal(
    (
      sameArea.reasons.find((reason) => reason.criterion === 'commute')!.value as {
        minutes: number;
      }
    ).minutes,
    12,
  );
});

test('empty or unknown preferences receive neutral fit, and neighborhood weights merge and rescale', () => {
  const noPreferences = matchNeighborhoods({ ...newcomer, preferences: [] });
  const unknownPreferences = matchNeighborhoods({
    ...newcomer,
    preferences: ['unlisted preference'],
  });
  for (const result of [noPreferences, unknownPreferences]) {
    assert.ok(result.reasons.some((reason) => reason.effect === 'neutral_fit'));
    assert.ok(
      result.areas.every(
        (area) =>
          area.score_breakdown.find((criterion) => criterion.criterion === 'preferences')!.fit ===
          0.5,
      ),
    );
  }
  const partial = matchNeighborhoods(newcomer, { commute: 75 });
  assert.equal(partial.weights.commute, 75);
  assert.equal(partial.weights.budget, 25);
  const base = matchNeighborhoods(newcomer);
  const scaled = Object.fromEntries(
    Object.entries(base.weights).map(([key, weight]) => [key, weight * 10]),
  ) as NeighborhoodWeights;
  assert.deepEqual(summary(matchNeighborhoods(newcomer, scaled).areas), summary(base.areas));
});

test('score ties resolve by stable id for setup and neighborhoods', () => {
  const setup = recommendSetupPaths(
    { ...company, activities: [], industry: 'unknown' },
    { ...zeroSetup, industry: 1 },
  );
  assert.deepEqual(
    setup.options.map((option) => option.id),
    ['adgm', 'kezad', 'mainland', 'masdar', 'twofour54'],
  );
  const neighborhoods = matchNeighborhoods(
    { ...newcomer, office_location: 'unknown' },
    { ...zeroNeighborhood, commute: 1 },
  );
  assert.deepEqual(
    neighborhoods.areas.map((area) => area.id),
    neighborhoods.areas.map((area) => area.id).sort(),
  );
});

test('malformed setup inputs are rejected before scoring', () => {
  const invalid: unknown[] = [
    null,
    [],
    {},
    { ...company, activities: 'software' },
    { ...company, activities: [''] },
    { ...company, activities: [9] },
    { ...company, industry: '' },
    { ...company, industry: null },
    ...[0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1].map((team_size) => ({
      ...company,
      team_size,
    })),
    { ...company, physical_space: 'factory' },
    { ...company, client_base: 'local' },
    { ...company, regulatory_profile: 'unregulated' },
  ];
  for (const input of invalid) assert.throws(() => recommendSetupPaths(input as CompanySetupInput));
});

test('malformed neighborhood inputs are rejected before scoring', () => {
  const invalid: unknown[] = [
    null,
    [],
    {},
    { ...newcomer, office_location: '' },
    { ...newcomer, office_location: 12 },
    { ...newcomer, budget_band: 'cheap' },
    { ...newcomer, household: 'children' },
    { ...newcomer, car: 'false' },
    { ...newcomer, preferences: 'beach' },
    { ...newcomer, preferences: [null] },
    { ...newcomer, preferences: ['  '] },
  ];
  for (const input of invalid) assert.throws(() => matchNeighborhoods(input as NeighborhoodInput));
});

test('both APIs reject typo, nonfinite, negative, nonnumeric, all-zero and overflowing weights', () => {
  const badCommon: unknown[] = [null, [], { typo: 1 }];
  for (const bad of badCommon) {
    assert.throws(() => recommendSetupPaths(company, bad as Partial<SetupWeights>));
    assert.throws(() => matchNeighborhoods(newcomer, bad as Partial<NeighborhoodWeights>));
  }
  for (const bad of [-1, NaN, Infinity, '1', undefined]) {
    assert.throws(() => recommendSetupPaths(company, { activities: bad } as Partial<SetupWeights>));
    assert.throws(() =>
      matchNeighborhoods(newcomer, { commute: bad } as Partial<NeighborhoodWeights>),
    );
  }
  assert.throws(() => recommendSetupPaths(company, zeroSetup), RangeError);
  assert.throws(() => matchNeighborhoods(newcomer, zeroNeighborhood), RangeError);
  assert.throws(
    () => recommendSetupPaths(company, { activities: 1e308, industry: 1e308 }),
    RangeError,
  );
  assert.throws(() => matchNeighborhoods(newcomer, { commute: 1e308, budget: 1e308 }), RangeError);
});

test('neither API mutates inputs or exposes mutable references into defaults or JSON datasets', () => {
  const frozenCompany = Object.freeze({
    ...company,
    activities: Object.freeze([...company.activities]),
  }) as unknown as CompanySetupInput;
  const frozenNewcomer = Object.freeze({
    ...newcomer,
    preferences: Object.freeze([...newcomer.preferences]),
  }) as unknown as NeighborhoodInput;
  const setupBaseline = recommendSetupPaths(frozenCompany);
  const neighborhoodBaseline = matchNeighborhoods(frozenNewcomer);
  const setupChanged = recommendSetupPaths(frozenCompany);
  setupChanged.options[0].sources.push('https://example.invalid');
  setupChanged.options[0].requirements.value.push('fake');
  setupChanged.weights.activities = 999;
  setupChanged.hub71_eligibility.sources.push('https://example.invalid');
  const neighborhoodChanged = matchNeighborhoods(frozenNewcomer);
  neighborhoodChanged.areas[0].sources.push('https://example.invalid');
  neighborhoodChanged.areas[0].requirements.value.push('fake');
  neighborhoodChanged.weights.commute = 999;
  assert.deepEqual(recommendSetupPaths(frozenCompany), setupBaseline);
  assert.deepEqual(matchNeighborhoods(frozenNewcomer), neighborhoodBaseline);
});

test('seeded scenario variations preserve finite bounded scores and contribution totals, including exact perfect fits', () => {
  let seed = 71;
  const next = (): number => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed;
  };
  for (let iteration = 0; iteration < 100; iteration++) {
    const setupWeights = Object.fromEntries(
      Object.keys(zeroSetup).map((key) => [key, next() % 100]),
    ) as SetupWeights;
    setupWeights.activities += 1;
    const industrial = recommendSetupPaths(
      {
        activities: ['manufacturing', 'logistics'],
        industry: 'industrial',
        team_size: 21 + (next() % 200),
        physical_space: 'warehouse',
        client_base: 'international',
        regulatory_profile: 'industrial',
      },
      setupWeights,
    );
    assertRanking(industrial.options);
    assert.equal(industrial.options.find((option) => option.id === 'kezad')!.score, 100);
    const neighborhoodWeights = Object.fromEntries(
      Object.keys(zeroNeighborhood).map((key) => [key, next() % 100]),
    ) as NeighborhoodWeights;
    neighborhoodWeights.commute += 1;
    const neighborhood = matchNeighborhoods(
      {
        ...newcomer,
        office_location: ['al_reem_island', 'KEZAD', 'unknown'][next() % 3],
        budget_band: (['low', 'medium', 'high'] as const)[next() % 3],
        household: (['single', 'couple', 'family'] as const)[next() % 3],
        car: next() % 2 === 0,
        preferences: [['schools', 'space'], [], ['culture', 'unknown']][next() % 3],
      },
      neighborhoodWeights,
    );
    assertRanking(neighborhood.areas);
    for (const item of [...industrial.options, ...neighborhood.areas]) {
      assert.ok(Number.isFinite(item.score));
      for (const criterion of item.score_breakdown) {
        assert.ok(Number.isFinite(criterion.contribution));
        if (criterion.weight === 0) assert.equal(criterion.contribution, 0);
      }
    }
  }
});
