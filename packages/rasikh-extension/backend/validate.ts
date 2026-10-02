// backend/validate.ts  (the authoritative enforcement point on the server side)
// COACH, DO NOT DO: only non-mutating teaching actions pass. click, type, setValue, navigate, submit
// and anything else are refused here even if a model or a tampered pack asks for them.
import type { PageModel, SkillPack, TaskStep, AgentAction } from "../src/shared/types";
import { scrubText } from "../src/shared/scrub";

class ValidationError extends Error {}

export const ALLOWED_ACTIONS = new Set(["explain", "highlight", "ask", "checkUnderstanding", "scrollTo", "waitFor"]);

export function validateAction(
  toolCall: { name: string; input: any } | undefined,
  model: PageModel,
  _pack?: SkillPack,
  _step?: TaskStep
): AgentAction {
  if (!toolCall) return { type: "explain", message: "Let me think about the next step.", risk: "safe" };
  const t = toolCall.name as AgentAction["type"];
  const inp = toolCall.input ?? {};

  if (!ALLOWED_ACTIONS.has(t)) throw new ValidationError("ACTION_NOT_ALLOWED");
  if (inp.ref && !model.elements.some((e) => e.ref === inp.ref)) throw new ValidationError("REF_NOT_PRESENT");

  const action: AgentAction = { type: t, risk: "safe" };
  if (typeof inp.ref === "string") action.ref = inp.ref;
  if (typeof inp.message === "string") action.message = scrubText(inp.message).slice(0, 600);
  if (typeof inp.prompt === "string") action.prompt = scrubText(inp.prompt).slice(0, 600);
  if (typeof inp.question === "string") action.question = scrubText(inp.question).slice(0, 400);
  if (typeof inp.verify === "string") action.verify = inp.verify.slice(0, 200);
  if (Array.isArray(inp.choices)) action.choices = inp.choices.slice(0, 6).map((c: unknown) => scrubText(String(c)).slice(0, 120));
  return action;
}
