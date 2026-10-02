import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { metadata, recommend, encodeAmenities, reconstructAmenities, distanceKm } from './index.mjs';

const runtime = JSON.parse(readFileSync(new URL('./evaluation/runtime-model.json', import.meta.url), 'utf8'));
const preferences = { schools: .8, healthcare: .7, groceries: 1, parks: .8, transit: .6 };

test('portable inference matches CUDA-produced validation fixtures', () => {
  assert.ok(runtime.parity_fixtures.length > 0);
  for (const fixture of runtime.parity_fixtures) {
    const actual = reconstructAmenities(fixture.counts);
    assert.equal(actual.length, 6);
    actual.forEach((value, index) => assert.ok(Math.abs(value - fixture.reconstruction[index]) <= 2e-5, `${value} differs from ${fixture.reconstruction[index]}`));
    const embedded = encodeAmenities(fixture.counts);
    assert.equal(embedded.length, 3);
    if (fixture.embedding) embedded.forEach((value, index) => assert.ok(Math.abs(value - fixture.embedding[index]) <= 2e-5));
  }
});

test('experimental output retains provenance, attribution and honest metric scope', () => {
  const result = recommend({ preferences, limit: 3 });
  assert.equal(result.experimental, true);
  assert.equal(result.recommendations.length, 3);
  assert.equal(result.license, 'ODbL-1.0');
  assert.equal(result.attribution, '© OpenStreetMap contributors');
  assert.equal(result.license_url, 'https://opendatacommons.org/licenses/odbl/1-0/');
  for (const key of ['source_sha256', 'derived_dataset_sha256', 'checkpoint_sha256']) assert.match(result[key], /^[a-f0-9]{64}$/);
  assert.match(result.score_scope, /not a probability/);
  assert.ok(result.limitations.some(value => /no customer preference or satisfaction validation/i.test(value)));
  assert.ok(result.limitations.some(value => /No rent/gi.test(value)));
  assert.ok(result.recommendations.every(value => value.straight_line_distance_km === null && value.score >= 0 && value.score <= 100));
});

test('selected user amenity choices change matching and reasons', () => {
  const schools = recommend({ preferences: { schools: 1 }, limit: 20 });
  const dining = recommend({ preferences: { dining: 1 }, limit: 20 });
  assert.notDeepEqual(schools.recommendations.map(x => x.id), dining.recommendations.map(x => x.id));
  assert.ok(schools.recommendations.every(x => x.reasons.length === 1 && x.reasons[0].includes('schools')));
  assert.ok(dining.recommendations.every(x => x.reasons.length === 1 && x.reasons[0].includes('dining')));
});

test('pure distance tradeoff ranks nearest mapped place and never yields a travel time', () => {
  const place = runtime.areas[0];
  const result = recommend({ preferences, office: { latitude: place.latitude, longitude: place.longitude }, commuteWeight: 1, limit: 1 });
  assert.equal(result.recommendations[0].straight_line_distance_km, 0);
  assert.equal(result.recommendations[0].score, 100);
  assert.match(result.recommendations[0].reasons.at(-1), /journey time is unknown/);
  assert.equal(distanceKm(24, 54, 24, 54), 0);
  assert.ok(Math.abs(distanceKm(0, 0, 0, 1) - 111.1949266) < 1e-5);
});

test('unsupported or invalid inputs cannot silently become model predictions', () => {
  for (const value of [undefined, null, [], 'x', { preferences: {} }, { preferences: { rent: 1 } }, { preferences, budget: 3000 }, { preferences, commuteWeight: .2 }, { preferences, limit: 1.1 }, { preferences, limit: 21 }, { preferences: { schools: NaN } }, { preferences: { schools: '1' } }, { preferences, office: { latitude: 91, longitude: 54 } }, { preferences, office: { latitude: 24, longitude: 54, journey_time: 10 } }]) assert.throws(() => recommend(value), TypeError);
  for (const value of [[], [1, 2, 3, 4, 5, -1], [1, 2, 3, 4, 5, Infinity]]) assert.throws(() => encodeAmenities(value), TypeError);
});

test('returned objects cannot mutate future recommendations or provenance', () => {
  const before = recommend({ preferences });
  const changed = recommend({ preferences });
  changed.recommendations[0].mapped_object_counts.schools = -1;
  changed.limitations.push('tampered');
  const info = metadata();
  info.provenance.attribution = 'tampered';
  info.features[0] = 'tampered';
  assert.deepEqual(recommend({ preferences }), before);
  assert.equal(metadata().provenance.attribution, '© OpenStreetMap contributors');
});
