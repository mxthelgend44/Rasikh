import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { CONTRACT_VERSION } from "../src/contract.js";
import { type Harness, type ToolBody, createHarness } from "./harness.js";

const GS = "gs_test";
const PASSPORT = { ref: "doc_passport_hire_demo_001", labels: ["passport"] };

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
});
afterEach(() => h.close());

function assertEnvelope(body: ToolBody): void {
  assert.equal(body.contract_version, CONTRACT_VERSION);
  assert.equal(body.mock, true);
}

function assertError(result: { body: ToolBody; isError: boolean }, code: string): void {
  assert.equal(result.isError, true);
  assertEnvelope(result.body);
  assert.equal(result.body.error?.code, code);
}

describe("tool surface", () => {
  it("exposes exactly the six contract tools", async () => {
    const { tools } = await h.client.listTools();
    assert.deepEqual(tools.map((tool) => tool.name).sort(), [
      "check_trade_name",
      "get_application_status",
      "get_service_requirements",
      "register_tenancy_tawtheeq",
      "search_services",
      "start_application",
    ]);
  });

  it("rejects a forged UAE PASS session on every tool", async () => {
    const forged = { uaepass_session: "uap_sim_forged" };
    const calls: [string, Record<string, unknown>][] = [
      ["search_services", { query: "visa", audience: "individual" }],
      ["get_service_requirements", { service_id: "svc_residency_visa" }],
      ["start_application", { service_id: "svc_emirates_id", applicant_ref: "hire_demo_001", documents: [], guard_session_id: GS }],
      ["get_application_status", { application_id: "app_rv_0001" }],
      ["check_trade_name", { name: "Northwind Analytics" }],
      ["register_tenancy_tawtheeq", { lease_ref: "lease_reem_2207", applicant_ref: "hire_demo_001", guard_session_id: GS }],
    ];
    for (const [name, args] of calls) {
      assertError(await h.call(name, { ...args, ...forged }), "unknown_session");
    }
    assert.equal(h.guard.requests.length, 0, "Guard is not consulted for unauthenticated calls");
  });
});

describe("search_services", () => {
  it("finds Tawtheeq for 'tenancy contract' with exactly the contract fields", async () => {
    const { body, isError } = await h.call("search_services", {
      query: "tenancy contract",
      audience: "individual",
      uaepass_session: h.login(),
    });
    assert.equal(isError, false);
    assertEnvelope(body);
    const results = body.results as Record<string, unknown>[];
    const { score, ...summary } = results[0] as Record<string, unknown> & { score: number };
    assert.deepEqual(summary, {
      service_id: "svc_tawtheeq_register",
      name: "Register a tenancy contract (Tawtheeq)",
      entity: "Abu Dhabi Municipality",
      audience: "individual",
      tags: ["housing"],
    });
    assert.ok(score > 0);
    assert.ok(results.every((result) => result.audience === "individual"));
  });

  it("returns only business services for a business search", async () => {
    const { body } = await h.call("search_services", {
      query: "trade name",
      audience: "business",
      uaepass_session: h.login("business", "company_demo_001"),
    });
    const results = body.results as { service_id: string; audience: string }[];
    assert.equal(results[0]?.service_id, "svc_trade_name");
    assert.ok(results.every((result) => result.audience === "business"));
  });
});

describe("get_service_requirements", () => {
  it("returns documents, dependencies and illustrative estimates", async () => {
    const { body, isError } = await h.call("get_service_requirements", {
      service_id: "svc_tawtheeq_register",
      uaepass_session: h.login(),
    });
    assert.equal(isError, false);
    assertEnvelope(body);
    assert.equal(body.service_id, "svc_tawtheeq_register");
    assert.deepEqual(body.depends_on, ["svc_residency_visa"]);
    assert.deepEqual(
      (body.required_documents as { label: string }[]).map((doc) => doc.label),
      ["passport", "emirates_id", "address"],
    );
    assert.equal((body.est_fee_aed as { illustrative: boolean }).illustrative, true);
    assert.equal((body.est_duration_days as { illustrative: boolean }).illustrative, true);
  });

  it("reports unknown_service", async () => {
    assertError(
      await h.call("get_service_requirements", { service_id: "svc_nope", uaepass_session: h.login() }),
      "unknown_service",
    );
  });
});

describe("start_application", () => {
  it("submits and returns the application id and status", async () => {
    const { body, isError } = await h.call("start_application", {
      service_id: "svc_tawtheeq_register",
      applicant_ref: "hire_demo_001",
      documents: [PASSPORT],
      uaepass_session: h.login(),
      guard_session_id: GS,
    });
    assert.equal(isError, false);
    assert.deepEqual(body, {
      contract_version: CONTRACT_VERSION,
      mock: true,
      application_id: "app_tw_0001",
      status: "submitted",
    });
  });

  it("reports unknown_service without calling Guard", async () => {
    assertError(
      await h.call("start_application", {
        service_id: "svc_nope",
        applicant_ref: "hire_demo_001",
        documents: [PASSPORT],
        uaepass_session: h.login(),
        guard_session_id: GS,
      }),
      "unknown_service",
    );
    assert.equal(h.guard.requests.length, 0);
  });
});

describe("get_application_status", () => {
  it("reports status, history and needs_info", async () => {
    const session = h.login();
    const started = await h.call("start_application", {
      service_id: "svc_residency_visa",
      applicant_ref: "hire_demo_001",
      documents: [PASSPORT],
      uaepass_session: session,
      guard_session_id: GS,
    });
    const applicationId = started.body.application_id as string;

    const fresh = await h.call("get_application_status", { application_id: applicationId, uaepass_session: session });
    assert.equal(fresh.isError, false);
    assertEnvelope(fresh.body);
    assert.equal(fresh.body.status, "submitted");
    assert.equal(fresh.body.needs_info, null);

    h.backend.advance(applicationId);
    h.backend.advance(applicationId);
    const { body } = await h.call("get_application_status", { application_id: applicationId, uaepass_session: session });
    assert.equal(body.status, "needs_info");
    assert.deepEqual(body.needs_info, {
      message: "Please upload the signed employment contract.",
      required_labels: ["employment"],
    });
    assert.deepEqual(
      (body.history as { status: string }[]).map((event) => event.status),
      ["submitted", "under_review", "needs_info"],
    );
  });

  it("hides an application from anyone but its submitter and applicant", async () => {
    const started = await h.call("start_application", {
      service_id: "svc_residency_visa",
      applicant_ref: "hire_demo_002",
      documents: [PASSPORT],
      uaepass_session: h.login("business", "company_demo_001"),
      guard_session_id: GS,
    });
    const applicationId = started.body.application_id as string;
    const read = (subject: string) =>
      h.call("get_application_status", { application_id: applicationId, uaepass_session: h.login("individual", subject) });
    assert.equal((await read("hire_demo_002")).isError, false, "the applicant can read it");
    assertError(await read("hire_demo_003"), "unknown_application");
  });

  it("reports unknown_application", async () => {
    assertError(
      await h.call("get_application_status", { application_id: "app_tw_9999", uaepass_session: h.login() }),
      "unknown_application",
    );
  });
});

describe("check_trade_name", () => {
  it("reports an available name with the contract fields", async () => {
    const { body, isError } = await h.call("check_trade_name", {
      name: "Northwind Analytics",
      uaepass_session: h.login("business", "company_demo_001"),
    });
    assert.equal(isError, false);
    assert.deepEqual(body, {
      contract_version: CONTRACT_VERSION,
      mock: true,
      name: "Northwind Analytics",
      available: true,
      notes: "Name appears available. Final approval happens during licensing.",
    });
  });

  it("reports a taken name as unavailable with a reason", async () => {
    const { body } = await h.call("check_trade_name", {
      name: "Falcon Trading",
      uaepass_session: h.login("business", "company_demo_001"),
    });
    assert.equal(body.available, false);
    assert.match(body.notes as string, /already registered/);
  });

  it("flags restricted terms", async () => {
    const { body } = await h.call("check_trade_name", {
      name: "Royal Falcon Analytics",
      uaepass_session: h.login("business", "company_demo_001"),
    });
    assert.equal(body.available, false);
    assert.match(body.notes as string, /special approval/);
  });
});

describe("register_tenancy_tawtheeq", () => {
  it("registers the lease as a Tawtheeq application", async () => {
    const { body, isError } = await h.call("register_tenancy_tawtheeq", {
      lease_ref: "lease_reem_2207",
      applicant_ref: "hire_demo_001",
      uaepass_session: h.login(),
      guard_session_id: GS,
    });
    assert.equal(isError, false);
    assert.deepEqual(body, {
      contract_version: CONTRACT_VERSION,
      mock: true,
      application_id: "app_tw_0001",
      status: "submitted",
    });
  });
});
