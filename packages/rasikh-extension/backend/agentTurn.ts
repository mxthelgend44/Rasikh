// backend/agentTurn.ts
import { buildSystemPrompt } from "./prompt";
import { fetchLatestPack, fetchObjectiveRecord } from "./data";
import { selectProvider } from "./provider";
import { validateAction } from "./validate";
import { toolsForStep } from "./tools";
import { sanitizeServerSide, serializePageModel } from "./sanitize";
import { logTurn } from "./log";
import { checkCondition } from "../src/shared/conditions";
import { findControlByKey } from "../src/shared/findControl";
import type { StepInfo, TurnRequest } from "../src/shared/types";

export async function agentTurn(req: any, res: any) {
  const body = req.body as TurnRequest;
  if (!body || !body.pageModel || !Array.isArray(body.pageModel.elements)) {
    return res.status(400).json({ error: { code: "BAD_REQUEST", message: "pageModel.elements required" } });
  }
  let pack, objective;
  try {
    pack = await fetchLatestPack(body.skill);
    objective = await fetchObjectiveRecord(body.skill, body.objective);
  } catch {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Unknown guide or task" } });
  }
  const task = pack.tasks.find((t) => t.id === objective.taskId)!;
  const language = body.studentLanguage === "ar" ? "ar" : "en";
  const stepIndex = Math.max(0, Math.min(Number.isFinite(body.step) ? Math.floor(body.step) : 0, task.steps.length - 1));
  const step = task.steps[stepIndex];

  const cleanModel = sanitizeServerSide(body.pageModel); // second line of defense
  const tools = toolsForStep();
  const provider = selectProvider();

  const system = buildSystemPrompt({
    objective,
    packNotes: step.notes,
    stepInstruction: step.instruction,
    language,
    allowedTools: tools.map((t) => t.name)
  });
  const messages = [{ role: "user", content: serializePageModel(cleanModel, body.lastActionResult) }];

  // stream Server Sent Events: text chunks, then the validated action
  res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });

  let toolCall: { name: string; input: any } | undefined;
  let text = "";
  try {
    ({ text } = await provider.callModelStreaming(
      { system, messages, tools, context: { pack, task, stepIndex, model: cleanModel, language } },
      (chunk) => res.write(`event: chunk\ndata: ${JSON.stringify({ text: chunk })}\n\n`),
      (tc) => {
        toolCall = tc;
      }
    ));
  } catch {
    text = "";
  }

  let action;
  try {
    action = validateAction(toolCall, cleanModel, pack, step);
  } catch {
    action = { type: "explain" as const, message: "Let me reconsider the next step.", risk: "safe" as const };
  }
  const control = step.controlKey ? findControlByKey(pack, step.controlKey, cleanModel) : undefined;
  const info: StepInfo = {
    index: stepIndex,
    total: task.steps.length,
    id: step.id,
    title: (language === "ar" ? step.titleAr : undefined) ?? step.title ?? step.id,
    instruction: (language === "ar" ? step.instructionAr : undefined) ?? step.instruction,
    tip: (language === "ar" ? step.tipAr : undefined) ?? step.pitfalls?.[0],
    controlFound: !!control,
    complete: checkCondition(step.verify, cleanModel, pack)
  };
  const objectiveStatus = step.last || stepIndex === task.steps.length - 1 ? "last-step" : "in-progress";
  res.write(
    `event: action\ndata: ${JSON.stringify({ action, objectiveStatus, expectVerify: step.verify, provider: provider.name, step: info })}\n\n`
  );
  res.end();

  logTurn(body, text, action as any);
}
