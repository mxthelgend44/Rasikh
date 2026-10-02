import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const runtime = JSON.parse(readFileSync(new URL('./evaluation/runtime-model.json', import.meta.url), 'utf8'));
const features = Object.freeze([...runtime.features]);
const limitations = Object.freeze([
  'Experimental amenity matching; no customer preference or satisfaction validation.',
  'Mapped OSM objects are incomplete and may include multiple representations of one facility.',
  'Place markers and 1.5 km circles are not official neighborhood boundaries.',
  'Circle densities differ in spatial support from occupied 1 km training cells; named-area rankings have no holdout validation.',
  'No rent, available listing, school quality, traffic, journey-time, safety or official housing predictions.',
  'Preference targets, similarity index and distance tradeoff are explicit heuristics, not learned user outcomes.',
  'Spatial holdout blocks have no buffer or future-time validation.',
]);

function number(value, minimum, maximum, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new TypeError(`${name} must be a finite number between ${minimum} and ${maximum}`);
  }
  return value;
}
function object(value, name, accepted) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${name} must be an object`);
  if (Object.keys(value).some(key => !accepted.includes(key))) throw new TypeError(`Unsupported ${name} field`);
  return value;
}
function layers(values, network) {
  return network.reduce((input, layer) => layer.weight.map((row, index) => {
    const affine = row.reduce((sum, weight, i) => sum + weight * input[i], layer.bias[index]);
    if (layer.activation === 'tanh') return Math.tanh(affine);
    if (layer.activation === 'relu') return Math.max(0, affine);
    return affine;
  }), values);
}
function standardized(values) {
  return values.map((value, index) => (Math.log1p(value) - runtime.preprocessing.mean[index]) / runtime.preprocessing.scale[index]);
}
function encodedStandardized(values) {
  return layers(values, runtime.encoder);
}

export function metadata() {
  return structuredClone({
    experimental: true,
    scope: 'descriptive_amenity_matching',
    features,
    area_candidates: runtime.areas.length,
    model: structuredClone(runtime.model),
    evaluation: runtime.evaluation,
    provenance: runtime.provenance,
    artifact_sha256: runtime.artifact_sha256,
    ranking_validation: 'No user outcome labels or named-area ranking validation',
    limitations,
  });
}

// Useful for inference parity and descriptive inspection; values are mapped
// object counts per approximately one km², not preference outcome labels.
export function encodeAmenities(counts) {
  if (!Array.isArray(counts) || counts.length !== features.length) throw new TypeError('Provide six amenity values in metadata feature order');
  return encodedStandardized(standardized(counts.map((v, i) => number(v, 0, 1e9, features[i]))));
}

export function reconstructAmenities(counts) {
  if (!Array.isArray(counts) || counts.length !== features.length) throw new TypeError('Provide six amenity values in metadata feature order');
  const z = standardized(counts.map((v, i) => number(v, 0, 1e9, features[i])));
  return layers(encodedStandardized(z), runtime.decoder);
}

export function distanceKm(latitude, longitude, otherLatitude, otherLongitude) {
  [latitude, otherLatitude].forEach(value => number(value, -90, 90, 'latitude'));
  [longitude, otherLongitude].forEach(value => number(value, -180, 180, 'longitude'));
  const radians = value => value * Math.PI / 180;
  const a = radians(latitude), b = radians(otherLatitude);
  const h = Math.sin((b - a) / 2) ** 2 + Math.cos(a) * Math.cos(b) * Math.sin(radians(otherLongitude - longitude) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

export function recommend(input) {
  object(input, 'recommendation', ['preferences', 'office', 'commuteWeight', 'limit']);
  const preferences = object(input.preferences, 'preferences', features);
  const weights = features.map(name => number(preferences[name] ?? 0, 0, 1, name));
  if (weights.every(weight => weight === 0)) throw new TypeError('Choose at least one amenity preference');
  const limit = number(input.limit ?? 6, 1, 20, 'limit');
  if (!Number.isInteger(limit)) throw new TypeError('limit must be an integer');
  let office;
  if (input.office !== undefined) {
    object(input.office, 'office', ['latitude', 'longitude']);
    office = { latitude: number(input.office.latitude, -90, 90, 'office.latitude'), longitude: number(input.office.longitude, -180, 180, 'office.longitude') };
  }
  const distanceWeight = number(input.commuteWeight ?? (office ? .25 : 0), 0, 1, 'commuteWeight');
  if (!office && distanceWeight !== 0) throw new TypeError('Office coordinates are required for a distance weight');
  const target = runtime.preprocessing.mean.map((mean, index) => mean + weights[index] * Math.max(0, runtime.target_log_features[index] - mean));
  const targetEmbedding = encodedStandardized(target.map((v, index) => (v - runtime.preprocessing.mean[index]) / runtime.preprocessing.scale[index]));
  const recommendations = runtime.areas.map(area => {
    const embedding = encodeAmenities(area.density_per_km2);
    const gap = Math.sqrt(embedding.reduce((sum, value, index) => sum + ((value - targetEmbedding[index]) / runtime.latent_scale[index]) ** 2, 0) / embedding.length);
    const amenityIndex = 100 / (1 + gap);
    const distance = office ? distanceKm(area.latitude, area.longitude, office.latitude, office.longitude) : null;
    const distanceIndex = distance === null ? 0 : 100 / (1 + distance / 10);
    const score = (1 - distanceWeight) * amenityIndex + distanceWeight * distanceIndex;
    const reasons = features.filter((_, i) => weights[i] > 0).map(name => `${area.mapped_object_counts[name]} mapped ${name} objects within ${area.observation_radius_km} km of the OSM place marker`);
    if (distance !== null) reasons.push(`${distance.toFixed(1)} km straight-line distance to selected office; journey time is unknown`);
    return {
      id: area.osm_id, name: area.name, name_ar: area.name_ar ?? null,
      latitude: area.latitude, longitude: area.longitude,
      score: Math.round(score * 100) / 100,
      amenity_matching_index: Math.round(amenityIndex * 100) / 100,
      straight_line_distance_km: distance === null ? null : Math.round(distance * 100) / 100,
      mapped_object_counts: { ...area.mapped_object_counts },
      observation_radius_km: area.observation_radius_km, reasons,
      _sort_score: score,
    };
  }).sort((a, b) => b._sort_score - a._sort_score || a.id.localeCompare(b.id)).slice(0, limit).map(({ _sort_score, ...item }) => item);
  return {
    experimental: true,
    model: structuredClone(runtime.model),
    scope: 'OSM mapped amenity similarity around place markers',
    score_scope: 'Heuristic ranking index; not a probability, quality rating or measured satisfaction',
    preference_weights: Object.fromEntries(features.map((name, index) => [name, weights[index]])),
    distance_weight: distanceWeight,
    recommendations,
    attribution: runtime.provenance.attribution,
    source_url: runtime.provenance.source_url,
    license: runtime.provenance.license,
    license_url: runtime.provenance.license_url,
    source_sha256: runtime.provenance.raw_sha256,
    derived_dataset_sha256: runtime.provenance.derived_dataset_sha256,
    checkpoint_sha256: runtime.model.checkpoint_sha256,
    limitations: [...limitations],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(recommend({ preferences: { schools: .8, healthcare: .7, groceries: 1, parks: .8, transit: .6 }, office: { latitude: 24.4539, longitude: 54.3773 }, limit: 3 }), null, 2));
}
