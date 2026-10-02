// src/background/machine.ts
import type { LessonState } from "../shared/types";

type Event =
  | "startLesson"
  | "contextReady"
  | "planTeaching"
  | "planStudentStep"
  | "planSafeAction"
  | "planRiskyAction"
  | "nextTurn"
  | "verifyMet"
  | "verifyTimeout"
  | "confirm"
  | "cancel"
  | "actionDone"
  | "objectiveMet"
  | "moreSteps"
  | "pause"
  | "resume"
  | "fatal";

const TRANSITIONS: Record<LessonState, Partial<Record<Event, LessonState>>> = {
  idle: { startLesson: "starting" },
  starting: { contextReady: "awaiting-plan", fatal: "failed" },
  "awaiting-plan": {
    planTeaching: "coaching",
    planStudentStep: "awaiting-student-action",
    planSafeAction: "acting",
    planRiskyAction: "awaiting-confirmation",
    pause: "paused",
    fatal: "failed"
  },
  coaching: { nextTurn: "awaiting-plan", pause: "paused", fatal: "failed" },
  "awaiting-student-action": {
    verifyMet: "verifying",
    verifyTimeout: "coaching",
    pause: "paused",
    fatal: "failed"
  },
  "awaiting-confirmation": { confirm: "acting", cancel: "coaching", pause: "paused", fatal: "failed" },
  acting: { actionDone: "verifying", pause: "paused", fatal: "failed" },
  verifying: { objectiveMet: "completed", moreSteps: "awaiting-plan", pause: "paused", fatal: "failed" },
  paused: { resume: "awaiting-plan", fatal: "failed" },
  completed: {},
  failed: {}
};

export class IllegalTransition extends Error {}

export function transition(from: LessonState, event: Event): LessonState {
  const next = TRANSITIONS[from]?.[event];
  if (!next) throw new IllegalTransition(`No transition from ${from} on ${event}`);
  return next;
}

// guards: conditions that must hold before certain transitions are allowed
export function canConfirm(state: LessonState, hasValidToken: boolean): boolean {
  return state === "awaiting-confirmation" && hasValidToken;
}
export function canAct(state: LessonState): boolean {
  return state === "acting";
}
