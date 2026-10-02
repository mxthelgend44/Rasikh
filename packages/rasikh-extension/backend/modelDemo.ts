// backend/modelDemo.ts
// The OFFLINE deterministic guide. Same interface as backend/model.ts (callModelStreaming), but it
// makes no network call: it plans the next coach step from the matched skillpack step. It points at
// the control, explains it, and then waits for the person. It never plans a mutating action.
import type { AgentAction, Language, PageModel, SkillPack, TaskGraph } from "../src/shared/types";
import { findControlByKey } from "../src/shared/findControl";

export interface DemoContext {
  pack: SkillPack;
  task: TaskGraph;
  stepIndex: number;
  model: PageModel;
  language: Language;
}
export interface ModelArgs {
  system: string;
  messages: any[];
  tools: any[];
  context?: DemoContext;
}

const STR = {
  en: {
    step: (i: number, n: number) => `Step ${i} of ${n}.`,
    tip: "Tip:",
    notFound: "I cannot see that control on this page yet. Scroll, open the section it sits in, or check you are on the right page.",
    personal: "This field holds personal details. I will not read it. You fill it in yourself.",
    you: "You do this one: I only point."
  },
  ar: {
    step: (i: number, n: number) => `الخطوة ${i} من ${n}.`,
    tip: "نصيحة:",
    notFound: "لا أرى هذا العنصر في الصفحة الآن. مرّر الصفحة أو افتح القسم الذي يوجد فيه، أو تأكد أنك في الصفحة الصحيحة.",
    personal: "هذا الحقل يحتوي بيانات شخصية. لن أقرأه، وأنت من يملؤه.",
    you: "أنت من ينفّذ هذه الخطوة، وأنا أشير فقط."
  }
} as const;

export function planStep(ctx: DemoContext): { message: string; tool: { name: string; input: any } } {
  const L = STR[ctx.language] ?? STR.en;
  const steps = ctx.task.steps;
  const idx = Math.max(0, Math.min(ctx.stepIndex, steps.length - 1));
  const step = steps[idx];
  const instruction = (ctx.language === "ar" ? step.instructionAr : undefined) ?? step.instruction;
  const tip = (ctx.language === "ar" ? step.tipAr : undefined) ?? step.pitfalls?.[0];
  const el = step.controlKey ? findControlByKey(ctx.pack, step.controlKey, ctx.model) : undefined;

  const parts = [L.step(idx + 1, steps.length), instruction];
  if (tip) parts.push(`${L.tip} ${tip}`);
  if (el?.sensitive) parts.push(L.personal);
  else if (el) parts.push(L.you);
  else if (step.controlKey) parts.push(L.notFound);
  const message = parts.join(" ");

  if (el) return { message, tool: { name: "highlight", input: { ref: el.ref, message: instruction } } };
  return { message, tool: { name: "explain", input: { message } } };
}

export async function callModelStreaming(
  args: ModelArgs,
  onText: (t: string) => void,
  onTool: (tc: { name: string; input: any }) => void
): Promise<{ text: string }> {
  if (!args.context) {
    const text = "Demo guide: no step is selected.";
    onText(text);
    onTool({ name: "explain", input: { message: text } });
    return { text };
  }
  const plan = planStep(args.context);
  onText(plan.message);
  onTool(plan.tool);
  return { text: plan.message };
}

export type { AgentAction };
