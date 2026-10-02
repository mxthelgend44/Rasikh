// src/shared/messages.ts  (every message type that crosses a component boundary)
// Coach, do not do: there is no message that asks the page to click, type, select or submit.
import type { AgentAction, PageModel, ActionResult, Provider, StepInfo } from "./types";

// ----- panel -> worker (request/response over runtime messaging) -----
export interface Msg_StartGuide {
  type: "startLesson";
  payload: { skill: string; objective: string };
}
export interface Msg_StepNav {
  type: "nextStep" | "prevStep" | "repeatStep" | "stopGuide";
  payload: Record<string, never>;
}
export interface Msg_SetLanguage {
  type: "setLanguage";
  payload: { language: "en" | "ar" };
}
export interface Msg_RequestState {
  type: "requestState";
  payload: Record<string, never>;
}
export interface Msg_SiteAccess {
  type: "siteAccess";
  payload: Record<string, never>;
}
export interface Msg_EnableSite {
  type: "enableSite";
  payload: { origin: string };
}
export interface Msg_DisableSite {
  type: "disableSite";
  payload: { origin: string };
}

// ----- worker -> content (request/response over tabs messaging) -----
export interface Msg_Perceive {
  type: "perceive";
  payload: Record<string, never>;
}
export interface Msg_DoAction {
  type: "doAction";
  payload: { action: AgentAction };
}

// ----- content -> worker -----
export interface Msg_PerceiveRes {
  type: "perceive:res";
  payload: { model: PageModel };
}
export interface Msg_ActionRes {
  type: "doAction:res";
  payload: { result: ActionResult };
}
export interface Msg_PageEvent {
  type: "pageEvent";
  payload: { kind: "navigation" | "mutationSettled" };
}
export interface Msg_ContentReady {
  type: "contentReady";
  payload: { url: string };
}

// ----- worker -> panel (over the long lived Port) -----
export interface Push_GuideStep {
  type: "guideStep";
  payload: { step: StepInfo; message: string; provider: Provider };
}
export interface Push_LessonState {
  type: "lessonState";
  payload: { state: string; step: number; objective: string };
}
export interface Push_Error {
  type: "error";
  payload: { code: string; message: string };
}
