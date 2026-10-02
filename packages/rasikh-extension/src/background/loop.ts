// src/background/loop.ts
// The guide loop. One turn = perceive the page (structure only), ask the planner for the current
// step, show the coach mark and the explanation, then WAIT for the person. The loop never acts on the
// page and never advances by itself except when the step's structural verify condition holds.
import { loadState, saveState } from "./state";
import { sendToTab } from "../shared/bus";
import { pushToPanel } from "./panelPort";
import { postTurn } from "./orchestratorClient";
import { hasGrant } from "./sites";
import type { AgentAction, ActionResult, PageModel, TurnResponse } from "../shared/types";

const MAX_AUTO_ADVANCE = 8;

export async function onStartLesson(p: { skill: string; objective: string }) {
  const st = await loadState();
  st.lesson = { skill: p.skill, objective: p.objective, mode: "guide", step: 0, history: [], state: "starting" };
  await saveState(st);
  await runTurn();
}

export async function runTurn(autoAdvanced = 0): Promise<void> {
  const st = await loadState();
  if (!st.lesson) return;
  const tab = await activeTab();
  if (!tab?.id) return fail("NO_ACTIVE_TAB");
  if (!(await hasGrant(tab.url))) return fail("NO_SITE_GRANT");
  const tabId = tab.id;

  st.lesson.state = "awaiting-plan";
  await saveState(st);

  let model: PageModel;
  try {
    const res = await sendToTab<Record<string, never>, { model: PageModel }>(tabId, "perceive", {});
    model = res.model;
  } catch {
    return fail("PERCEPTION_FAILED");
  }

  let resp: TurnResponse;
  try {
    resp = await postTurn({
      sessionId: "local",
      turnId: crypto.randomUUID(),
      skill: st.lesson.skill,
      objective: st.lesson.objective,
      mode: "guide",
      step: st.lesson.step,
      studentLanguage: await getLanguage(),
      pageModel: model,
      history: st.lesson.history.slice(-6),
      learnerSnapshot: { level: "beginner", taskMastery: {} }
    });
  } catch {
    return fail("NETWORK_ERROR");
  }

  // the structural condition for this step already holds (for example the person moved on): follow
  if (resp.step.complete && st.lesson.step < resp.step.total - 1 && autoAdvanced < MAX_AUTO_ADVANCE) {
    st.lesson.step += 1;
    await saveState(st);
    return runTurn(autoAdvanced + 1);
  }

  st.lesson.total = resp.step.total;
  st.lesson.history.push({ role: "tutor", text: resp.message, ts: Date.now() });
  st.lesson.expectVerify = resp.expectVerify;
  st.lesson.state = "awaiting-student-action";
  await saveState(st);
  pushToPanel("guideStep", { step: resp.step, message: resp.message, provider: resp.provider });
  pushLessonState();

  // show the coach mark. The only actions that can reach the page are non-mutating ones.
  await sendToTab<{ action: AgentAction }, { result: ActionResult }>(tabId, "doAction", { action: resp.action }).catch(
    () => undefined
  );
}

export async function onNextStep() {
  const st = await loadState();
  if (!st.lesson) return;
  st.lesson.step = Math.min(st.lesson.step + 1, Math.max(0, (st.lesson.total ?? st.lesson.step + 1) - 1));
  await saveState(st);
  await runTurn();
}
export async function onPrevStep() {
  const st = await loadState();
  if (!st.lesson) return;
  st.lesson.step = Math.max(0, st.lesson.step - 1);
  await saveState(st);
  await runTurn();
}
export async function onRepeatStep() {
  await runTurn();
}
export async function onStopGuide() {
  const st = await loadState();
  const tab = await activeTab();
  if (tab?.id) {
    await sendToTab(tab.id, "doAction", { action: { type: "clearOverlays" } }).catch(() => undefined);
  }
  st.lesson = undefined;
  await saveState(st);
  pushToPanel("lessonState", { state: "idle", step: 0, objective: "" });
}

// the page moved (full navigation or single page app view change): re-perceive the same step
export async function onPageEvent(p: { kind: "navigation" | "mutationSettled" }) {
  const st = await loadState();
  if (!st.lesson || p.kind !== "navigation") return;
  await runTurn();
}

// the content script announced it is ready (after injection or a full navigation)
export async function onContentReady() {
  const st = await loadState();
  if (st.lesson && st.lesson.state === "awaiting-student-action") await runTurn();
}

function pushLessonState() {
  loadState().then((st) => {
    if (!st.lesson) return;
    pushToPanel("lessonState", { state: st.lesson.state, step: st.lesson.step, objective: st.lesson.objective });
  });
}

async function getLanguage(): Promise<"en" | "ar"> {
  try {
    const { lang } = await chrome.storage.local.get("lang");
    return lang === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
}

async function activeTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function fail(code: string) {
  const st = await loadState();
  if (st.lesson) {
    st.lesson.state = "paused";
    await saveState(st);
  }
  pushToPanel("error", { code, message: code });
}
