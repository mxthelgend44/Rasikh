import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { SingleFlight, stableKey } from "../src/tools/singleFlight.js";
import { FakeGuard, createHarness, verdict } from "./harness.js";

const ok = (id: string): CallToolResult => ({ content: [], structuredContent: { id } });

describe("stableKey", () => {
  it("ignores key order and undefined fields, at every depth", () => {
    assert.equal(stableKey({ b: 1, a: { d: [1, { y: 2, x: 1 }], c: undefined } }), stableKey({ a: { d: [1, { x: 1, y: 2 }] }, b: 1 }));
    assert.notEqual(stableKey({ a: [1, 2] }), stableKey({ a: [2, 1] }));
  });
});

describe("SingleFlight", () => {
  it("runs identical concurrent calls once and gives both the same result", async () => {
    const flights = new SingleFlight();
    let runs = 0;
    const execute = async () => {
      runs += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return ok(`run_${runs}`);
    };
    const [a, b] = await Promise.all([flights.run("k", execute), flights.run("k", execute)]);
    assert.equal(runs, 1);
    assert.deepEqual(a, b);
  });

  it("replays a success inside the window, and runs again after it", async () => {
    let clock = 0;
    const flights = new SingleFlight(1000, () => clock);
    let runs = 0;
    const execute = async () => ok(`run_${++runs}`);
    await flights.run("k", execute);
    clock = 900;
    await flights.run("k", execute);
    assert.equal(runs, 1, "a double submit inside the window is a replay");
    clock = 2001;
    await flights.run("k", execute);
    assert.equal(runs, 2, "a deliberate repeat after the window runs");
  });

  it("never remembers errors or denials, so a retry runs", async () => {
    const flights = new SingleFlight();
    let runs = 0;
    const refuse = async (): Promise<CallToolResult> => {
      runs += 1;
      return { content: [], structuredContent: { denied: true } };
    };
    await flights.run("k", refuse);
    await flights.run("k", refuse);
    const fail = async (): Promise<CallToolResult> => {
      runs += 1;
      return { content: [], isError: true };
    };
    await flights.run("e", fail);
    await flights.run("e", fail);
    assert.equal(runs, 4);
  });
});

/** A Guard that answers only after `ms`, so concurrent calls overlap inside the check. */
class SlowGuard extends FakeGuard {
  constructor(private readonly ms: number) {
    super(() => verdict("allow"));
  }
  override async check(request: Parameters<FakeGuard["check"]>[0]) {
    await new Promise((resolve) => setTimeout(resolve, this.ms));
    return super.check(request);
  }
}

describe("data-sending tools under concurrent duplicates (release QA B2)", () => {
  it("two simultaneous identical start_application calls create one application", async () => {
    const guard = new SlowGuard(30);
    const h = await createHarness({ guard });
    const args = {
      service_id: "svc_emirates_id",
      applicant_ref: "hire_demo_001",
      documents: [{ ref: "doc_passport_hire_demo_001", labels: ["passport"] }],
      uaepass_session: h.login(),
      guard_session_id: "gs_1",
    };
    const [first, second] = await Promise.all([h.call("start_application", args), h.call("start_application", args)]);
    assert.equal(first.body.application_id, "app_eid_0001");
    assert.equal(second.body.application_id, "app_eid_0001");
    assert.equal(guard.requests.length, 1, "Guard is consulted once");
    assert.equal(await h.backend.getApplication("app_eid_0002", "hire_demo_001"), undefined, "no second application");
    await h.close();
  });

  it("five racing tenancy registrations register once", async () => {
    const h = await createHarness({ guard: new SlowGuard(20) });
    const args = { lease_ref: "lease_reem_2207", applicant_ref: "hire_demo_001", uaepass_session: h.login(), guard_session_id: "gs_1" };
    const results = await Promise.all(Array.from({ length: 5 }, () => h.call("register_tenancy_tawtheeq", args)));
    assert.deepEqual(new Set(results.map((r) => r.body.application_id)), new Set(["app_tw_0001"]));
    await h.close();
  });

  it("different applicants are never collapsed", async () => {
    const h = await createHarness({ guard: new SlowGuard(20) });
    const session = h.login("business", "company_demo_001");
    const call = (applicant: string) =>
      h.call("start_application", {
        service_id: "svc_residency_visa",
        applicant_ref: applicant,
        documents: [],
        uaepass_session: session,
        guard_session_id: "gs_1",
      });
    const results = await Promise.all([call("hire_demo_002"), call("hire_demo_003")]);
    assert.deepEqual(results.map((r) => r.body.application_id).sort(), ["app_rv_0001", "app_rv_0002"]);
    await h.close();
  });

  it("a refused call can be retried once Guard allows it", async () => {
    let allow = false;
    const h = await createHarness({ guard: new FakeGuard(() => verdict(allow ? "allow" : "needs_consent")) });
    const args = {
      service_id: "svc_emirates_id",
      applicant_ref: "hire_demo_001",
      documents: [{ ref: "doc_passport_hire_demo_001", labels: ["passport"] }],
      uaepass_session: h.login(),
      guard_session_id: "gs_1",
    };
    assert.equal((await h.call("start_application", args)).body.denied, true);
    allow = true;
    assert.equal((await h.call("start_application", args)).body.application_id, "app_eid_0001");
    await h.close();
  });
});
