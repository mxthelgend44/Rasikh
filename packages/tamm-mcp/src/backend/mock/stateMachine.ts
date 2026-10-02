/**
 * Application lifecycle for the mock backend (INTEGRATION.md 4.5).
 *
 * Every application follows its service's illustrative review script. How it moves along
 * the script depends on the progression mode:
 * - `demo`: only an explicit `advance` (from `POST /dev/advance`) moves it, so a scripted
 *   demo is fully deterministic.
 * - `timed`: each step becomes due a small random delay after the previous one and is
 *   applied the next time the application is read.
 */
import type { ApplicationStatus } from "../../contract.js";
import type { Application, NeedsInfo } from "../types.js";

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
  /** Required when `status` is `needs_info`, absent otherwise. */
  needs_info?: NeedsInfo;
}

export type Progression =
  | { mode: "demo" }
  | {
      mode: "timed";
      /** Minimum delay before each step. */
      baseDelayMs: number;
      /** Up to this much extra random delay per step. */
      jitterMs: number;
      /** Uniform random number in [0, 1); injectable for tests. */
      random?: () => number;
    };

/** True if moving from `from` to `to` is a legal transition. */
export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** True if no further transition is possible. */
export function isFinal(status: ApplicationStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

/**
 * Checks that a review script is a legal path from `submitted` to a final state, with
 * `needs_info` details exactly on `needs_info` steps. Returns the first problem found.
 */
export function validateScript(script: readonly ScriptStep[]): string | undefined {
  let current: ApplicationStatus = "submitted";
  for (const [index, step] of script.entries()) {
    if (!canTransition(current, step.status)) {
      return `step ${index}: ${current} -> ${step.status} is not a legal transition`;
    }
    if ((step.status === "needs_info") !== (step.needs_info !== undefined)) {
      return `step ${index}: needs_info details must be present exactly on needs_info steps`;
    }
    current = step.status;
  }
  return isFinal(current) ? undefined : `script ends in non-final status ${current}`;
}

/** Lifecycle record the mock backend keeps for one application. */
export interface TrackedApplication {
  application: Application;
  script: readonly ScriptStep[];
  /** Number of script steps already applied. */
  applied: number;
  /** When the next step becomes due in timed mode (ms since epoch). */
  nextDueMs: number;
}

/** Creates a freshly submitted application. */
export function submit(
  applicationId: string,
  serviceId: string,
  script: readonly ScriptStep[],
  progression: Progression,
  nowMs: number,
): TrackedApplication {
  return {
    application: {
      application_id: applicationId,
      service_id: serviceId,
      status: "submitted",
      history: [{ status: "submitted", at: new Date(nowMs).toISOString() }],
      needs_info: null,
    },
    script,
    applied: 0,
    nextDueMs: nowMs + stepDelay(progression),
  };
}

/** Applies the next scripted step. Returns false if the application is already final. */
export function advance(tracked: TrackedApplication, nowMs: number): boolean {
  const step = tracked.script[tracked.applied];
  if (!step) {
    return false;
  }
  const { application } = tracked;
  if (!canTransition(application.status, step.status)) {
    throw new Error(`illegal transition ${application.status} -> ${step.status} for ${application.application_id}`);
  }
  application.status = step.status;
  application.needs_info = step.needs_info ?? null;
  application.history.push({ status: step.status, at: new Date(nowMs).toISOString() });
  tracked.applied += 1;
  return true;
}

/** In timed mode, applies every step that has come due by `nowMs`. No-op in demo mode. */
export function catchUp(tracked: TrackedApplication, progression: Progression, nowMs: number): void {
  if (progression.mode === "demo") {
    return;
  }
  while (tracked.nextDueMs <= nowMs && advance(tracked, tracked.nextDueMs)) {
    tracked.nextDueMs += stepDelay(progression);
  }
}

function stepDelay(progression: Progression): number {
  if (progression.mode === "demo") {
    return Number.POSITIVE_INFINITY;
  }
  const random = progression.random ?? Math.random;
  return progression.baseDelayMs + Math.floor(random() * progression.jitterMs);
}
