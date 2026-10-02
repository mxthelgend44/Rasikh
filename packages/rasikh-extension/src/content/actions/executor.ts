// src/content/actions/executor.ts
// COACH, DO NOT DO. The only things this executor can do are non-mutating: show an overlay, scroll a
// control into view, clear overlays. There is no click, type, select, submit or navigate here, and
// an action type outside the allowlist is refused without touching the page.
// tests/safety/coachOnly.test.ts proves this at runtime and by scanning the source.
import { perceiveDom } from "../perception/build";
import { showCoachMark, clearOverlays } from "../overlays/coachMark";
import { resolveRef } from "../refMap";
import type { AgentAction, ActionResult } from "../../shared/types";

export const EXECUTABLE: ReadonlySet<string> = new Set([
  "explain",
  "ask",
  "checkUnderstanding",
  "highlight",
  "scrollTo",
  "clearOverlays",
  "waitFor",
  "recordProgress"
]);

export async function execute(a: AgentAction): Promise<ActionResult> {
  if (!EXECUTABLE.has(a?.type as string)) return fail(a, "ACTION_NOT_ALLOWED");
  try {
    switch (a.type) {
      case "highlight": {
        const el = a.ref ? resolveRef(a.ref) : undefined;
        if (!el) return fail(a, "TARGET_NOT_FOUND");
        showCoachMark(el, a.message ?? "");
        return ok(a);
      }
      case "scrollTo": {
        const el = a.ref ? resolveRef(a.ref) : undefined;
        if (!el) return fail(a, "TARGET_NOT_FOUND");
        el.scrollIntoView({ block: "center" });
        return ok(a);
      }
      case "clearOverlays":
        clearOverlays();
        return ok(a);
      default:
        return ok(a); // explain, ask, checkUnderstanding, waitFor, recordProgress: the panel shows the text
    }
  } catch (e) {
    return fail(a, (e as Error).message);
  }
}
async function ok(a: AgentAction): Promise<ActionResult> {
  return { action: a.type, ref: a.ref, ok: true, newModel: perceiveDom() };
}
async function fail(a: AgentAction, code: string): Promise<ActionResult> {
  return {
    action: (a?.type ?? "explain") as AgentAction["type"],
    ref: a?.ref,
    ok: false,
    failureCode: code,
    newModel: perceiveDom()
  };
}
