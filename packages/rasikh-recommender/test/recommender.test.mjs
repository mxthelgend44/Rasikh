import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { recommend, metadata, distanceKm } from '../index.mjs';

test('real-data identity, license and split membership are recorded', () => {
  const meta = metadata();
  assert.equal(meta.source.license, 'ODbL-1.0');
  assert.match(meta.source.raw_sha256, /^[a-f0-9]{64}$/);
  const cells = JSON.parse(readFileSync(new URL('../data/osm-training-cells.json', import.meta.url))).cells;
  const membership = new Map();
  const seenIds = new Set();
  const blockSplits = new Map();
  for (const [split, ids] of Object.entries(meta.evaluation.splits)) {
    for (const id of ids) {
      assert.ok(!membership.has(id)); membership.set(id, split);
      const cell = cells.find(c => c.cell_id === id); assert.ok(cell);
      if (blockSplits.has(cell.spatial_block)) assert.equal(blockSplits.get(cell.spatial_block), split);
      blockSplits.set(cell.spatial_block, split);
      for (const osmId of cell.osm_ids) { assert.ok(!seenIds.has(osmId)); seenIds.add(osmId); }
    }
  }
  assert.equal(membership.size, cells.length);
  assert.equal(seenIds.size, meta.source.amenity_objects);
});

test('held-out observations improve representation reconstruction over the matched baseline', () => {
  const evidence = metadata().evaluation;
  assert.ok(evidence.test.pca_standardized_reconstruction_mse < evidence.test.training_mean_baseline_mse);
  assert.ok(evidence.kmeans_test.four_centroid_squared_distance < evidence.kmeans_test.one_centroid_baseline_squared_distance);
  assert.match(metadata().ranking_validation, /no user/);
});

test('changing priorities changes the ordered recommendation results', () => {
  const parks = recommend({ preferences: { parks: 1 }, limit: 10 });
  const dining = recommend({ preferences: { dining: 1 }, limit: 10 });
  assert.notDeepEqual(parks.recommendations.map(r => r.id), dining.recommendations.map(r => r.id));
  assert.equal(new Set(parks.recommendations.map(r => r.id)).size, 10);
  assert.equal(new Set(parks.recommendations.map(r => r.name.normalize('NFKC').trim().toLowerCase())).size, 10);
  assert.ok(parks.recommendations.every(r => Number.isFinite(r.score) && r.score >= 0 && r.score <= 100));
});

test('office-distance ranking uses actual coordinates without inventing travel times', () => {
  const first = recommend({ preferences: { parks: 1 } }).recommendations[0];
  const result = recommend({ preferences: { parks: 1 }, office: { latitude: first.latitude, longitude: first.longitude }, commuteWeight: 1 });
  assert.equal(result.recommendations[0].distance_km, 0);
  assert.equal(result.recommendations[0].score, 100);
  assert.ok(Math.abs(distanceKm(24, 54, 24, 54)) < 1e-10);
});

test('invalid or unsupported inputs cannot produce fake predictions', () => {
  for (const input of [null, [], { preferences: {} }, { preferences: { parks: NaN } }, { preferences: { parks: -1 } }, { preferences: { unknown: 1 } }, { limit: 1.5 }, { budget: 100000 }, { commuteWeight: .1 }, { office: { latitude: 200, longitude: 54 } }]) {
    assert.throws(() => recommend(input), TypeError);
  }
});

test('callers cannot mutate cached model metadata or result counts', () => {
  const meta = metadata(); meta.source.license = 'fake';
  assert.equal(metadata().source.license, 'ODbL-1.0');
  const first = recommend();
  first.recommendations[0].mapped_object_counts.parks = -100;
  assert.notEqual(recommend().recommendations[0].mapped_object_counts.parks, -100);
});
