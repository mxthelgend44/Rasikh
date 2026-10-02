import { CONTRACT_VERSION } from '@rasikh/shared';
import areaData from '../data/areas.json' with { type: 'json' };
import weightConfig from '../config/weights.json' with { type: 'json' };
import type { StructuredReason } from './types.js';
import type {
  NeighborhoodCriterion,
  NeighborhoodInput,
  NeighborhoodMatchResult,
  NeighborhoodRecommendation,
  NeighborhoodWeights,
} from './recommendation-types.js';
import {
  assertEnum,
  assertNonemptyString,
  assertStringArray,
  compareRanked,
  isRecord,
  normalizeToken,
  resolveWeights,
  round,
  scoreFits,
} from './scoring.js';

/**
 * Pure illustrative matching, with no map/rental/school feed or network calls.
 * Defaults and partial weight overrides follow config/weights.json. Area scores,
 * budget bands, requirements and commute minutes in areas.json are illustrative.
 * Source links verify area identity/context only, not these numeric assumptions.
 *
 * Office names and ids match exact normalized aliases. Unknown locations receive
 * neutral commute fit (0.5), with explicit reasons and no invented travel time.
 * Known zones use the illustrative car-minute table, multiplied by 1.8 without
 * a car. Same-area travel is 5/12 minutes. Commute fit=max(0,1-minutes/90).
 * ADGM/Hub71 aliases resolve a broad central-islands zone, not a street address.
 * Family assumes school-age children; school fit is illustrative, not admission
 * or catchment advice. Preferences match explicit aliases; unknown preferences
 * receive neutral fit. Duplicate aliases count once. Empty preferences=0.5.
 */
export function matchNeighborhoods(
  input: NeighborhoodInput,
  weights?: Partial<NeighborhoodWeights>,
): NeighborhoodMatchResult {
  validateNeighborhoodInput(input);
  const effectiveWeights = resolveWeights<NeighborhoodCriterion>(
    weightConfig.neighborhood,
    weights,
  );
  const office = resolveOffice(input.office_location);
  const preferences = [...new Set(input.preferences.map(normalizeToken))].sort();
  const preferenceGroups = [...new Set(preferences.map(resolvePreference))].sort();
  const areas: NeighborhoodRecommendation[] = areaData.areas.map((area) => {
    const minutesByZone = area.commute_car_minutes as Record<string, number>;
    const carMinutes = office === null ? null : minutesByZone[office.zone];
    if (
      carMinutes !== null &&
      (typeof carMinutes !== 'number' || !Number.isFinite(carMinutes) || carMinutes < 0)
    ) {
      throw new TypeError(`invalid_commute_zone:${area.id}:${office?.zone}`);
    }
    const travelMinutes =
      carMinutes === null
        ? null
        : office?.area_id === area.id
          ? input.car
            ? areaData.commute_model.same_area_car_minutes
            : areaData.commute_model.same_area_no_car_minutes
          : carMinutes * (input.car ? 1 : areaData.commute_model.no_car_multiplier);
    const preferenceFits = area.preference_fit as Record<string, number>;
    const fits: Record<NeighborhoodCriterion, number> = {
      commute:
        travelMinutes === null
          ? 0.5
          : Math.max(0, 1 - travelMinutes / areaData.commute_model.score_zero_minutes),
      budget: area.budget_fit[input.budget_band],
      household: area.household_fit[input.household],
      mobility: area.mobility_fit[input.car ? 'car' : 'no_car'],
      preferences:
        preferenceGroups.length === 0
          ? 0.5
          : preferenceGroups.reduce(
              (sum, preference) => sum + (preferenceFits[preference] ?? 0.5),
              0,
            ) / preferenceGroups.length,
    };
    const scored = scoreFits(fits, effectiveWeights);
    const values: Record<NeighborhoodCriterion, StructuredReason['value']> = {
      commute: {
        office_location: input.office_location,
        office_zone: office?.zone ?? null,
        minutes: travelMinutes === null ? null : round(travelMinutes),
        mode: input.car ? 'car' : 'no_car',
        illustrative: true,
      },
      budget: { requested_band: input.budget_band, illustrative: true },
      household: {
        household: input.household,
        school_age_children_assumed: input.household === 'family',
        illustrative: true,
      },
      mobility: { car: input.car, illustrative: true },
      preferences: { preferences, groups: preferenceGroups, illustrative: true },
    };
    return {
      contract_version: CONTRACT_VERSION,
      id: area.id,
      name: area.name,
      rank: 0,
      ...scored,
      reasons: scored.score_breakdown.map((item) => ({
        criterion: item.criterion,
        value: values[item.criterion],
        effect: item.contribution,
        explanation_key:
          item.criterion === 'commute' && office === null
            ? 'neighborhood.commute.unknown_location_neutral_fit'
            : `neighborhood.${item.criterion}.illustrative_fit`,
      })),
      illustrative: true,
      requirements: {
        value: [
          ...area.requirements.value,
          ...(input.household === 'family' ? ['verify_school_availability_and_route'] : []),
        ],
        illustrative: true,
      },
      sources: [...area.sources],
    };
  });
  areas.sort(compareRanked);
  areas.forEach((area, index) => {
    area.rank = index + 1;
  });
  const reasons: StructuredReason[] = [
    {
      criterion: 'dataset',
      value: { illustrative: true, source_scope: 'area_identity' },
      effect: 'verify_current_conditions',
      explanation_key: 'neighborhood.illustrative_comparison',
    },
  ];
  if (office === null) {
    reasons.push({
      criterion: 'office_location',
      value: input.office_location,
      effect: 'neutral_commute_fit',
      explanation_key: 'neighborhood.office_location.unrecognized',
    });
  }
  const unmatchedPreferences = preferences.filter(
    (preference) => resolvePreference(preference) === 'unknown',
  );
  if (preferences.length === 0 || unmatchedPreferences.length > 0) {
    reasons.push({
      criterion: 'preferences',
      value: unmatchedPreferences,
      effect: 'neutral_fit',
      explanation_key: 'neighborhood.preferences.unrecognized_or_empty',
    });
  }
  return {
    contract_version: CONTRACT_VERSION,
    illustrative: true,
    areas,
    weights: effectiveWeights,
    reasons,
  };
}

function resolveOffice(location: string): { area_id: string | null; zone: string } | null {
  const token = normalizeToken(location);
  const area = areaData.areas.find(
    (candidate) =>
      normalizeToken(candidate.id) === token ||
      candidate.aliases.some((alias) => normalizeToken(alias) === token),
  );
  if (area) return { area_id: area.id, zone: area.office_zone };
  const office = areaData.office_locations.find(
    (candidate) =>
      normalizeToken(candidate.id) === token ||
      candidate.aliases.some((alias) => normalizeToken(alias) === token),
  );
  return office ? { area_id: null, zone: office.zone } : null;
}

function resolvePreference(token: string): string {
  for (const [preference, aliases] of Object.entries(areaData.preference_aliases)) {
    if (
      normalizeToken(preference) === token ||
      aliases.some((alias) => normalizeToken(alias) === token)
    )
      return preference;
  }
  return 'unknown';
}

function validateNeighborhoodInput(input: NeighborhoodInput): void {
  if (!isRecord(input)) throw new TypeError('input must be an object');
  assertNonemptyString(input.office_location, 'office_location');
  assertEnum(input.budget_band, ['low', 'medium', 'high'], 'budget_band');
  assertEnum(input.household, ['single', 'couple', 'family'], 'household');
  if (typeof input.car !== 'boolean') throw new TypeError('car must be a boolean');
  assertStringArray(input.preferences, 'preferences');
}
