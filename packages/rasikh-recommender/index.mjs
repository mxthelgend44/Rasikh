import { readFileSync } from 'node:fs';

const load = name => JSON.parse(readFileSync(new URL(`./models/${name}.json`, import.meta.url), 'utf8'));
const model = load('osm-pca');
const areas = load('osm-areas');
const provenance = load('osm-provenance');
const evaluation = load('osm-evaluation');
const features = model.features;

export function metadata() {
  return structuredClone({ features, areas: areas.length, source: provenance, evaluation, prediction_scope: 'descriptive_amenity_similarity', ranking_validation: 'no user-outcome validation', rents_supported: false });
}

function standardize(values) {
  return values.map((value, i) => (value - model.mean[i]) / model.scale[i]);
}
function project(values) {
  return model.components.map(component => component.reduce((sum, weight, i) => sum + weight * values[i], 0));
}
export function distanceKm(latitude, longitude, otherLatitude, otherLongitude) {
  const rad = value => value * Math.PI / 180;
  const a = rad(latitude), b = rad(otherLatitude);
  const h = Math.sin((b - a) / 2) ** 2 + Math.cos(a) * Math.cos(b) * Math.sin(rad(otherLongitude - longitude) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}
function finite(value, min, max, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new TypeError(`${name} must be a number between ${min} and ${max}`);
  return value;
}

export function recommend(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Input must be an object');
  const accepted = ['preferences', 'office', 'commuteWeight', 'limit'];
  if (Object.keys(input).some(key => !accepted.includes(key))) throw new TypeError('Unsupported recommendation input; rent/budget predictions are not enabled');
  const preferences = input.preferences ?? { schools: .5, healthcare: .5, groceries: .7, parks: .7, dining: .3, transit: .5 };
  if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) throw new TypeError('Preferences must be an object');
  if (Object.keys(preferences).some(key => !features.includes(key))) throw new TypeError('Unknown preference');
  const weights = features.map(name => finite(preferences[name] ?? 0, 0, 1, name));
  if (weights.every(weight => weight === 0)) throw new TypeError('Choose at least one preference');
  const limit = finite(input.limit ?? 6, 1, 20, 'limit');
  if (!Number.isInteger(limit)) throw new TypeError('limit must be an integer');
  let office = null;
  if (input.office !== undefined) {
    if (!input.office || typeof input.office !== 'object' || Array.isArray(input.office) || Object.keys(input.office).some(key => !['latitude', 'longitude'].includes(key))) throw new TypeError('Office must have latitude and longitude only');
    office = { latitude: finite(input.office.latitude, -90, 90, 'office.latitude'), longitude: finite(input.office.longitude, -180, 180, 'office.longitude') };
  }
  const commuteWeight = finite(input.commuteWeight ?? (office ? .25 : 0), 0, 1, 'commuteWeight');
  if (!office && commuteWeight !== 0) throw new TypeError('Office coordinates are required for a commute weight');
  // Explicit product target, not a learned preference label. The projection is
  // learned from public mapped-object densities, not fictional user feedback.
  const target = model.mean.map((mean, i) => mean + weights[i] * Math.max(0, model.target_log_features[i] - mean));
  const targetEmbedding = project(standardize(target));
  const seenNames = new Set();
  const selected = areas.map(area => {
    const values = standardize(area.density_per_km2.map(Math.log1p));
    const embedding = project(values);
    const gap = Math.sqrt(embedding.reduce((sum, value, i) => sum + (value - targetEmbedding[i]) ** 2, 0) / embedding.length);
    const similarity = 100 / (1 + gap);
    const distance = office ? distanceKm(area.latitude, area.longitude, office.latitude, office.longitude) : null;
    const commuteScore = distance === null ? 0 : 100 / (1 + distance / 10);
    const score = (1 - commuteWeight) * similarity + commuteWeight * commuteScore;
    const reasons = features.filter((_, i) => weights[i] > 0).map((name, i) => `${area.mapped_object_counts[name]} mapped ${name} objects within ${area.observation_radius_km} km of the place marker`);
    if (distance !== null) reasons.push(`${distance.toFixed(1)} km straight-line distance to the selected office; traffic and journey time are unknown`);
    return { id: area.osm_id, name: area.name, name_ar: area.name_ar, latitude: area.latitude, longitude: area.longitude, score: Math.round(score * 100) / 100, learned_similarity_index: Math.round(similarity * 100) / 100, distance_km: distance === null ? null : Math.round(distance * 100) / 100, cluster_id: area.cluster_id, mapped_object_counts: { ...area.mapped_object_counts }, observation_radius_km: area.observation_radius_km, reasons };
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).filter(area => {
    const name = area.name.normalize('NFKC').trim().toLocaleLowerCase('en');
    if (seenNames.has(name)) return false;
    seenNames.add(name);
    return true;
  }).slice(0, limit);
  return { model: 'OSM-trained PCA amenity representation + KMeans profiles', score_scope: 'ranking index, not a probability or measured satisfaction', preference_weights: Object.fromEntries(features.map((name, i) => [name, weights[i]])), commute_weight: commuteWeight, recommendations: selected, attribution: provenance.attribution, source_url: provenance.source_url, license: provenance.license, trained_on_source_sha256: provenance.raw_sha256, limitations: evaluation.limitations };
}
