import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { APPLICATION_STATUSES } from "../src/contract.js";
import {
  type Progression,
  type ScriptStep,
  TRANSITIONS,
  advance,
  canTransition,
  catchUp,
  isFinal,
  submit,
  validateScript,
} from "../src/backend/mock/stateMachine.js";

const NEEDS_INFO = { message: "Upload the contract.", required_labels: ["employment" as const] };
const SCRIPT: ScriptStep[] = [
  { status: "under_review" },
  { status: "needs_info", needs_info: NEEDS_INFO },
  { status: "under_review" },
  { status: "approved" },
];
const DEMO: Progression = { mode: "demo" };
const statuses = (tracked: ReturnType<typeof submit>) => tracked.application.history.map((event) => event.status);

describe("transitions (INTEGRATION.md 4.5)", () => {
  it("matches the contract diagram exactly", () => {
    const legal = APPLICATION_STATUSES.flatMap((from) =>
      APPLICATION_STATUSES.filter((to) => canTransition(from, to)).map((to) => `${from}->${to}`),
    );
    assert.deepEqual(legal.sort(), [
      "needs_info->under_review",
      "submitted->under_review",
      "under_review->approved",
      "under_review->needs_info",
      "under_review->rejected",
    ]);
  });

  it("treats only approved and rejected as final", () => {
    assert.deepEqual(
      APPLICATION_STATUSES.filter(isFinal),
      ["approved", "rejected"],
    );
    assert.equal(Object.keys(TRANSITIONS).length, APPLICATION_STATUSES.length);
  });
});

describe("validateScript", () => {
  it("accepts a legal path to a final state", () => {
    assert.equal(validateScript(SCRIPT), undefined);
  });

  it("rejects an illegal jump", () => {
    assert.match(validateScript([{ status: "approved" }]) ?? "", /submitted -> approved/);
  });

  it("rejects a script that does not finish", () => {
    assert.match(validateScript([{ status: "under_review" }]) ?? "", /non-final/);
  });

  it("requires needs_info details exactly on needs_info steps", () => {
    assert.ok(validateScript([{ status: "under_review" }, { status: "needs_info" }]));
    assert.ok(validateScript([{ status: "under_review", needs_info: NEEDS_INFO }, { status: "approved" }]));
  });
});

describe("demo mode", () => {
  it("moves only on explicit advance, one step at a time, deterministically", () => {
    const tracked = submit("app_x_0001", "svc_x", SCRIPT, DEMO, 0);
    catchUp(tracked, DEMO, Number.MAX_SAFE_INTEGER);
    assert.equal(tracked.application.status, "submitted", "time alone never moves a demo application");

    assert.equal(advance(tracked, 1000), true);
    assert.equal(advance(tracked, 2000), true);
    assert.equal(tracked.application.status, "needs_info");
    assert.deepEqual(tracked.application.needs_info, NEEDS_INFO);

    assert.equal(advance(tracked, 3000), true);
    assert.equal(tracked.application.needs_info, null, "needs_info clears when review resumes");
    assert.equal(advance(tracked, 4000), true);
    assert.equal(advance(tracked, 5000), false, "a final application does not move");
    assert.deepEqual(statuses(tracked), ["submitted", "under_review", "needs_info", "under_review", "approved"]);
  });
});

describe("timed mode", () => {
  const timed: Progression = { mode: "timed", baseDelayMs: 1000, jitterMs: 1000, random: () => 0.5 };

  it("applies steps as their delays come due", () => {
    const tracked = submit("app_x_0001", "svc_x", SCRIPT, timed, 0);
    catchUp(tracked, timed, 1499);
    assert.equal(tracked.application.status, "submitted");
    catchUp(tracked, timed, 1500);
    assert.equal(tracked.application.status, "under_review");
    catchUp(tracked, timed, 1_000_000);
    assert.deepEqual(statuses(tracked), ["submitted", "under_review", "needs_info", "under_review", "approved"]);
  });

  it("stamps each step at the time it came due, not the time it was read", () => {
    const tracked = submit("app_x_0001", "svc_x", SCRIPT, timed, 0);
    catchUp(tracked, timed, 1_000_000);
    assert.deepEqual(
      tracked.application.history.map((event) => Date.parse(event.at)),
      [0, 1500, 3000, 4500, 6000],
    );
  });
});
