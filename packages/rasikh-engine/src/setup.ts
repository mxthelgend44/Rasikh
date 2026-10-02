import { CONTRACT_VERSION } from '@rasikh/shared';
import setupData from '../data/setup-options.json' with { type: 'json' };
import weightConfig from '../config/weights.json' with { type: 'json' };
import type { StructuredReason } from './types.js';
import type {
  CompanySetupInput,
  SetupCriterion,
  SetupOptionRecommendation,
  SetupPathId,
  SetupRecommendationResult,
  SetupWeights,
} from './recommendation-types.js';
import {
  assertEnum,
  assertNonemptyString,
  assertStringArray,
  compareRanked,
  isRecord,
  normalizeToken,
  resolveWeights,
  scoreFits,
} from './scoring.js';

/**
 * Deterministic illustrative comparison, not legal, tax, licensing or programme
 * eligibility advice. No network, file writes or LLM calls occur here.
 *
 * Defaults live in config/weights.json; partial overrides merge into them.
 * Activity/industry aliases are exact normalized matches from setup-options.json.
 * Unknown groups receive neutral 0.5 fit. Repeated activities are counted once.
 * Team bands are illustrative: micro <=5, small <=20, growing >20 people.
 * All five routes remain in the output, regardless of their score. KEZAD's
 * comparison models its free-zone route; KEZAD also has domestic-zone offerings.
 * Hub71's flag identifies a technology candidate for review, never admission or
 * licence eligibility. Programme stage/traction/innovation are not in this input.
 * Official source URLs establish entity/ecosystem context, not fit numbers.
 */
export function recommendSetupPaths(
  companyInput: CompanySetupInput,
  weights?: Partial<SetupWeights>,
): SetupRecommendationResult {
  validateCompanyInput(companyInput);
  const effectiveWeights = resolveWeights<SetupCriterion>(weightConfig.setup, weights);
  const activities = [...new Set(companyInput.activities.map(normalizeToken))].sort();
  const activityGroups = [...new Set(activities.map(findGroup))].sort();
  const industryGroup = findGroup(normalizeToken(companyInput.industry));
  const teamBand =
    companyInput.team_size <= 5 ? 'micro' : companyInput.team_size <= 20 ? 'small' : 'growing';

  const options: SetupOptionRecommendation[] = setupData.options.map((option) => {
    const activityFits = option.activity_fit as Record<string, number>;
    const industryFits = option.industry_fit as Record<string, number>;
    const fits: Record<SetupCriterion, number> = {
      activities:
        activityGroups.length === 0
          ? 0.5
          : activityGroups.reduce((sum, group) => sum + (activityFits[group] ?? 0.5), 0) /
            activityGroups.length,
      industry: industryFits[industryGroup] ?? 0.5,
      team_size: option.team_size_fit[teamBand],
      physical_space: option.physical_space_fit[companyInput.physical_space],
      client_base: option.client_base_fit[companyInput.client_base],
      regulatory_profile: option.regulatory_profile_fit[companyInput.regulatory_profile],
    };
    const scored = scoreFits(fits, effectiveWeights);
    const values: Record<SetupCriterion, StructuredReason['value']> = {
      activities: { activities, groups: activityGroups, illustrative: true },
      industry: { industry: companyInput.industry, group: industryGroup, illustrative: true },
      team_size: { team_size: companyInput.team_size, band: teamBand, illustrative: true },
      physical_space: { requested: companyInput.physical_space, illustrative: true },
      client_base: { requested: companyInput.client_base, illustrative: true },
      regulatory_profile: {
        requested: companyInput.regulatory_profile,
        determination: 'not_assessed',
        illustrative: true,
      },
    };
    return {
      contract_version: CONTRACT_VERSION,
      id: option.id as SetupPathId,
      name: option.name,
      entity: option.entity,
      rank: 0,
      ...scored,
      reasons: scored.score_breakdown.map((item) => ({
        criterion: item.criterion,
        value: values[item.criterion],
        effect: item.contribution,
        explanation_key: `setup.${item.criterion}.illustrative_fit`,
      })),
      illustrative: true,
      requirements: { value: [...option.requirements.value], illustrative: true },
      sources: [...option.sources],
    };
  });
  options.sort(compareRanked);
  options.forEach((option, index) => {
    option.rank = index + 1;
  });

  const candidateForReview =
    activityGroups.includes('technology') || industryGroup === 'technology';
  const reasons: StructuredReason[] = [
    {
      criterion: 'dataset',
      value: { illustrative: true, source_scope: 'entity_and_ecosystem' },
      effect: 'review_required',
      explanation_key: 'setup.illustrative_comparison',
    },
  ];
  const unmatchedActivities = activities.filter((activity) => findGroup(activity) === 'unknown');
  if (activities.length === 0 || unmatchedActivities.length > 0) {
    reasons.push({
      criterion: 'activities',
      value: unmatchedActivities,
      effect: 'neutral_fit',
      explanation_key: 'setup.activities.unrecognized_or_empty',
    });
  }
  if (industryGroup === 'unknown') {
    reasons.push({
      criterion: 'industry',
      value: companyInput.industry,
      effect: 'neutral_fit',
      explanation_key: 'setup.industry.unrecognized',
    });
  }
  return {
    contract_version: CONTRACT_VERSION,
    illustrative: true,
    options,
    weights: effectiveWeights,
    hub71_eligibility: {
      contract_version: CONTRACT_VERSION,
      candidate_for_review: candidateForReview,
      determination: 'not_assessed',
      reasons: [
        {
          criterion: 'technology_focus',
          value: candidateForReview,
          effect: candidateForReview ? 'candidate_for_review' : 'no_technology_signal',
          explanation_key: 'hub71.technology_candidate',
        },
        {
          criterion: 'programme_review',
          value: {
            missing_inputs: [
              'stage',
              'traction',
              'innovation',
              'growth_potential',
              'founder_commitment',
            ],
          },
          effect: 'review_required',
          explanation_key: 'hub71.not_an_eligibility_determination',
        },
      ],
      sources: [...setupData.hub71_sources],
    },
    reasons,
  };
}

function findGroup(token: string): string {
  for (const [group, aliases] of Object.entries(setupData.activity_aliases)) {
    if (normalizeToken(group) === token || aliases.some((alias) => normalizeToken(alias) === token))
      return group;
  }
  return 'unknown';
}

function validateCompanyInput(input: CompanySetupInput): void {
  if (!isRecord(input)) throw new TypeError('companyInput must be an object');
  assertStringArray(input.activities, 'activities');
  assertNonemptyString(input.industry, 'industry');
  if (!Number.isSafeInteger(input.team_size) || input.team_size <= 0) {
    throw new RangeError('team_size must be a positive safe integer');
  }
  assertEnum(input.physical_space, ['none', 'office', 'warehouse'], 'physical_space');
  assertEnum(input.client_base, ['uae', 'international', 'mixed'], 'client_base');
  assertEnum(
    input.regulatory_profile,
    ['standard', 'financial', 'industrial', 'media', 'healthcare'],
    'regulatory_profile',
  );
}
