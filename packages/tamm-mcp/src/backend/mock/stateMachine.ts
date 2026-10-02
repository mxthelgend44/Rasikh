/**
 * Application lifecycle for the mock backend.
 *
 * Every application follows its service's review script (illustrative). How far along the
 * script it is depends on the progression mode:
 * - `demo`: one step per status read, so a scripted demo is fully repeatable.
 * - `clock`: one step per `stepMs` of elapsed time since submission.
 */
import type { ApplicationStatus } from "../../contract.js";
import type { Application, StatusEvent } from "../types.js";

/** Legal next states for each status. `approved` and `rejected` are final. */
export const TRANSITIONS: Readonly<Record<ApplicationStatus, readonly ApplicationStatus[]>> = {
  submitted: ["under_review"],
  under_review: ["needs_info", "approved", "rejected"],
  needs_info: ["under_review"],
  approved: [],
  rejected: [],
};

export interface ScriptStep {
  status: ApplicationStatus;
  note: string;
}

export type Progression = { mode: "demo" } | { mode: "clock"; stepMs: number };

/** True if moving from `from` to `to` is a legal transition. */
export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** True if no further transition is possible. */
export function isFinal(status: ApplicationStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

/**
 * Checks that a review script is a legal path from `submitted` that ends in a final state.
 * Returns a description of the first problem, or `undefined` if the script is valid.
 */
export function validateScript(script: readonly ScriptStep[]): string | undefined {
  let current: ApplicationStatus = "submitted";
  for (const [index, step] of script.entries()) {
    if (!canTransition(current, step.status)) {
      return `step ${index}: ${current} -> ${step.status} is not a legal transition`;
    }
    current = step.status;
  }
  return isFinal(current) ? undefined : `script ends in non-final status ${current}`;
}

/** Mutable lifecycle record kept by the mock backend for one application. */
export interface TrackedApplication {
  application: Application;
  script: readonly ScriptStep[];
  /** Number of script steps already applied. */
  applied: number;
  submittedAtMs: number;
}

/** Creates a freshly submitted application. */
export function submit(
  applicationId: string,
  serviceId: string,
  script: readonly ScriptStep[],
  nowMs: number,
): TrackedApplication {
  const at = new Date(nowMs).toISOString();
  return {
    application: {
      application_id: applicationId,
      service_id: serviceId,
      status: "submitted",
      submitted_at: at,
      history: [{ status: "submitted", at, note: "Application received." }],
    },
    script,
    applied: 0,
    submittedAtMs: nowMs,
  };
}

/**
 * Advances `tracked` according to `progression` as of `nowMs`, called once per status read.
 * Never skips a step and never moves past a final state.
 */
export function advance(tracked: TrackedApplication, progression: Progression, nowMs: number): void {
  const target =
    progression.mode === "demo"
      ? tracked.applied + 1
      : Math.floor((nowMs - tracked.submittedAtMs) / progression.stepMs);
  while (tracked.applied < Math.min(target, tracked.script.length)) {
    const step = tracked.script[tracked.applied] as ScriptStep;
    applyStep(tracked.application, step, nowMs);
    tracked.applied += 1;
  }
}

function applyStep(application: Application, step: ScriptStep, nowMs: number): void {
  if (!canTransition(application.status, step.status)) {
    throw new Error(`illegal transition ${application.status} -> ${step.status} for ${application.application_id}`);
  }
  const event: StatusEvent = { status: step.status, at: new Date(nowMs).toISOString(), note: step.note };
  application.status = step.status;
  application.history.push(event);
}
