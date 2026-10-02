import type { CONTRACT_VERSION } from '@rasikh/shared';
import type { StructuredReason } from './types.js';

export type SetupPathId = 'mainland' | 'adgm' | 'kezad' | 'masdar' | 'twofour54';
export type PhysicalSpace = 'none' | 'office' | 'warehouse';
export type ClientBase = 'uae' | 'international' | 'mixed';
export type RegulatoryProfile = 'standard' | 'financial' | 'industrial' | 'media' | 'healthcare';

export interface CompanySetupInput {
  activities: string[];
  industry: string;
  team_size: number;
  physical_space: PhysicalSpace;
  client_base: ClientBase;
  regulatory_profile: RegulatoryProfile;
}

export type SetupCriterion = keyof CompanySetupInput;
export type SetupWeights = Record<SetupCriterion, number>;
export type NeighborhoodCriterion = 'commute' | 'budget' | 'household' | 'mobility' | 'preferences';
export type NeighborhoodWeights = Record<NeighborhoodCriterion, number>;
export type BudgetBand = 'low' | 'medium' | 'high';
export type Household = 'single' | 'couple' | 'family';

export interface NeighborhoodInput {
  office_location: string;
  budget_band: BudgetBand;
  /** The family profile assumes school-age children, as in the product brief. */
  household: Household;
  car: boolean;
  preferences: string[];
}

export interface ScoreBreakdown<Criterion extends string> {
  criterion: Criterion;
  /** Illustrative fit in [0, 1], not a probability or an eligibility finding. */
  fit: number;
  /** Effective weight after merging overrides with config/weights.json. */
  weight: number;
  /** Contribution to the final score out of 100. */
  contribution: number;
  illustrative: true;
}

export interface SetupOptionRecommendation {
  contract_version: typeof CONTRACT_VERSION;
  id: SetupPathId;
  name: string;
  entity: string;
  rank: number;
  score: number;
  score_breakdown: ScoreBreakdown<SetupCriterion>[];
  reasons: StructuredReason[];
  illustrative: true;
  /** Planning checklist keys only; these are not confirmed legal requirements. */
  requirements: { value: string[]; illustrative: true };
  sources: string[];
}

export interface Hub71ReviewFlag {
  contract_version: typeof CONTRACT_VERSION;
  candidate_for_review: boolean;
  determination: 'not_assessed';
  reasons: StructuredReason[];
  sources: string[];
}

export interface SetupRecommendationResult {
  contract_version: typeof CONTRACT_VERSION;
  illustrative: true;
  options: SetupOptionRecommendation[];
  weights: SetupWeights;
  hub71_eligibility: Hub71ReviewFlag;
  reasons: StructuredReason[];
}

export interface NeighborhoodRecommendation {
  contract_version: typeof CONTRACT_VERSION;
  id: string;
  name: string;
  rank: number;
  score: number;
  score_breakdown: ScoreBreakdown<NeighborhoodCriterion>[];
  reasons: StructuredReason[];
  illustrative: true;
  requirements: { value: string[]; illustrative: true };
  sources: string[];
}

export interface NeighborhoodMatchResult {
  contract_version: typeof CONTRACT_VERSION;
  illustrative: true;
  areas: NeighborhoodRecommendation[];
  weights: NeighborhoodWeights;
  reasons: StructuredReason[];
}
