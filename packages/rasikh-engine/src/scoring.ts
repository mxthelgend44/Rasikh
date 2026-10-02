import type { ScoreBreakdown } from './recommendation-types.js';

/**
 * Shared pure scoring rules. Fits are in [0, 1]; weights are arbitrary relative
 * nonnegative numbers. Contributions = fit * weight / total_weight * 100.
 * Partial overrides merge into config defaults; all-zero weights are rejected.
 * Scores use six decimal places. Any contribution rounding remainder is applied
 * to the largest contribution, preserving the total and the [0, 100] bounds.
 * Ties resolve by stable ASCII option/area id.
 */
export function resolveWeights<Criterion extends string>(
  defaults: Record<Criterion, number>,
  overrides?: Partial<Record<Criterion, number>>,
): Record<Criterion, number> {
  if (overrides !== undefined && !isRecord(overrides)) {
    throw new TypeError('weights must be an object');
  }
  const result = { ...defaults };
  for (const [key, value] of Object.entries(overrides ?? {})) {
    if (!Object.hasOwn(defaults, key)) throw new TypeError(`Unknown weight criterion: ${key}`);
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new RangeError(`Weight ${key} must be a finite nonnegative number`);
    }
    result[key as Criterion] = value;
  }
  const total = Object.values<number>(result).reduce((sum, value) => sum + value, 0);
  if (!Number.isFinite(total) || total <= 0) {
    throw new RangeError('Total weight must be finite and greater than zero');
  }
  return result;
}

export function scoreFits<Criterion extends string>(
  fits: Record<Criterion, number>,
  weights: Record<Criterion, number>,
): { score: number; score_breakdown: ScoreBreakdown<Criterion>[] } {
  const totalWeight = Object.values<number>(weights).reduce((sum, weight) => sum + weight, 0);
  const score_breakdown = (Object.keys(weights) as Criterion[]).map((criterion) => ({
    criterion,
    fit: round(fits[criterion]),
    weight: weights[criterion],
    contribution: round(fits[criterion] * (weights[criterion] / totalWeight) * 100),
    illustrative: true as const,
  }));
  const score = round(
    Math.min(
      100,
      Math.max(
        0,
        (Object.keys(weights) as Criterion[]).reduce(
          (sum, criterion) => sum + fits[criterion] * (weights[criterion] / totalWeight) * 100,
          0,
        ),
      ),
    ),
  );
  const roundingRemainder = round(
    score - score_breakdown.reduce((sum, item) => sum + item.contribution, 0),
  );
  if (roundingRemainder !== 0) {
    const largest = score_breakdown.reduce((best, item) =>
      item.contribution > best.contribution ? item : best,
    );
    largest.contribution = round(largest.contribution + roundingRemainder);
  }
  return {
    score,
    score_breakdown,
  };
}

export function compareRanked(
  a: { id: string; score: number },
  b: { id: string; score: number },
): number {
  return b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

export function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function assertNonemptyString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a nonempty string`);
  }
}

export function assertStringArray(value: unknown, field: string): asserts value is string[] {
  if (!Array.isArray(value)) throw new TypeError(`${field} must be an array of nonempty strings`);
  for (const item of value) assertNonemptyString(item, field);
}

export function assertEnum(value: unknown, allowed: readonly string[], field: string): void {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new TypeError(`${field} must be one of: ${allowed.join(', ')}`);
  }
}
