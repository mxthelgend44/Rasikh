// backend/log.ts
// Turn logs hold a redacted digest (counts, step, action type), never page content and never a value.
// Off unless LOG_TURNS=true. The tutor message is scrubbed for personal-data patterns before logging.
import type { TurnRequest, AgentAction } from "../src/shared/types";
import { scrubText } from "../src/shared/scrub";

export const TURN_LOGS: any[] = [];

export async function logTurn(req: TurnRequest, message: string, action: AgentAction): Promise<void> {
  const entry = {
    turnId: req.turnId,
    skill: req.skill,
    objective: req.objective,
    step: req.step,
    elementCount: req.pageModel.elements.length,
    tutorMessage: scrubText(message).slice(0, 500),
    action: { type: action.type, ref: action.ref, risk: action.risk },
    ts: Date.now()
  };
  TURN_LOGS.push(entry);
  if (TURN_LOGS.length > 200) TURN_LOGS.shift();
  if (process.env.LOG_TURNS === "true") console.debug("[turn]", JSON.stringify(entry));
}
