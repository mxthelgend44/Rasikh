/**
 * Mock trade name check. The rules here are illustrative stand-ins for the licensing
 * authority's naming rules, not the official rules.
 */
import type { TradeNameCheck, TradeNameIssue } from "../types.js";

const MIN_LENGTH = 3;
const MAX_LENGTH = 60;
const ALLOWED = /^[A-Za-z0-9 &'-]+$/;
const SUGGESTION_SUFFIXES = ["Solutions", "Group", "Ventures", "Partners"];

export interface TradeNameRules {
  takenNames: readonly string[];
  restrictedTerms: readonly string[];
}

const normalise = (name: string): string => name.trim().replace(/\s+/g, " ").toLowerCase();

/** Lists every rule a proposed name breaks. An empty list means the name is available. */
export function findIssues(proposedName: string, rules: TradeNameRules): TradeNameIssue[] {
  const name = proposedName.trim();
  const lower = normalise(name);
  const issues: TradeNameIssue[] = [];
  if (name.length < MIN_LENGTH) {
    issues.push({ code: "too_short", message: `Use at least ${MIN_LENGTH} characters.` });
  }
  if (name.length > MAX_LENGTH) {
    issues.push({ code: "too_long", message: `Use at most ${MAX_LENGTH} characters.` });
  }
  if (name.length > 0 && !ALLOWED.test(name)) {
    issues.push({ code: "invalid_characters", message: "Use only letters, numbers, spaces, &, ' and -." });
  }
  const restricted = rules.restrictedTerms.find((term) => new RegExp(`\\b${term}\\b`).test(lower));
  if (restricted) {
    issues.push({ code: "restricted_term", message: `The term "${restricted}" needs special approval.` });
  }
  if (rules.takenNames.some((taken) => normalise(taken) === lower)) {
    issues.push({ code: "name_taken", message: "This name is already registered." });
  }
  return issues;
}

/** Checks a proposed trade name and, if it is unavailable, suggests available variants. */
export function checkTradeName(proposedName: string, rules: TradeNameRules): TradeNameCheck {
  const issues = findIssues(proposedName, rules);
  const onlyTaken = issues.length > 0 && issues.every((issue) => issue.code === "name_taken");
  const suggestions = onlyTaken
    ? SUGGESTION_SUFFIXES.map((suffix) => `${proposedName.trim()} ${suffix}`).filter(
        (candidate) => findIssues(candidate, rules).length === 0,
      )
    : [];
  return { proposed_name: proposedName, available: issues.length === 0, issues, suggestions, illustrative: true };
}
