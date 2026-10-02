/**
 * Mock trade name check. The rules here are illustrative stand-ins for the licensing
 * authority's naming rules, not the official rules.
 */
import type { TradeNameCheck } from "../types.js";

const MIN_LENGTH = 3;
const MAX_LENGTH = 60;
const ALLOWED = /^[A-Za-z0-9 &'-]+$/;
const FINAL_APPROVAL = "Final approval happens during licensing.";

export interface TradeNameRules {
  takenNames: readonly string[];
  restrictedTerms: readonly string[];
}

const normalise = (name: string): string => name.trim().replace(/\s+/g, " ").toLowerCase();

/** Returns the first rule a proposed name breaks, in plain language, or `undefined` if none. */
export function findProblem(name: string, rules: TradeNameRules): string | undefined {
  const trimmed = name.trim();
  const lower = normalise(trimmed);
  if (trimmed.length < MIN_LENGTH || trimmed.length > MAX_LENGTH) {
    return `Names must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters.`;
  }
  if (!ALLOWED.test(trimmed)) {
    return "Names may use only letters, numbers, spaces, &, ' and -.";
  }
  const restricted = rules.restrictedTerms.find((term) => new RegExp(`\\b${term}\\b`).test(lower));
  if (restricted) {
    return `The term "${restricted}" needs special approval.`;
  }
  if (rules.takenNames.some((taken) => normalise(taken) === lower)) {
    return "This name is already registered.";
  }
  return undefined;
}

/** Checks a proposed trade name against the illustrative rules and the mock registry. */
export function checkTradeName(name: string, rules: TradeNameRules): TradeNameCheck {
  const problem = findProblem(name, rules);
  return {
    name,
    available: problem === undefined,
    notes: problem ? `${problem} ${FINAL_APPROVAL}` : `Name appears available. ${FINAL_APPROVAL}`,
  };
}
