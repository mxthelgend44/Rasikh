import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { CONTRACT_VERSION } from "../src/contract.js";
import { type Harness, createHarness } from "./harness.js";

const GS = "gs_test";
const PASSPORT = { ref: "doc_passport_hire_demo_001", labels: ["passport"] };
const EMIRATES_ID = { ref: "doc_eid_hire_demo_001", labels: ["emirates_id"] };

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
});
afterEach(() => h.close());

function assertEnvelope(body: Record<string, unknown>): void {
  assert.equal(body.contract_version, CONTRACT_VERSION);
  assert.equal(body.mock, true);
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
});

describe("search_services", () => {
  it("finds Tawtheeq for a tenancy query, only within the audience", async () => {
    const { body, isError } = await h.call("search_services", {
      query: "tenancy contract",
      audience: "individual",
      uaepass_session: h.login(),
      guard_session_id: GS,
    });
    assert.equal(isError, false);
    assertEnvelope(body);
    const results = body.results as { service_id: string; audience: string }[];
    assert.equal(results[0]?.service_id, "svc_tawtheeq_registration");
    assert.ok(results.every((result) => result.audience === "individual"));
  });

  it("returns business services for a business query", async () => {
    const { body } = await h.call("search_services", {
      query: "trade name",
      audience: "business",
      uaepass_session: h.login("business"),
      guard_session_id: GS,
    });
    assert.equal((body.results as { service_id: string }[])[0]?.service_id, "svc_trade_name_reservation");
  });

  it("rejects an unknown UAE PASS session", async () => {
    const { body, isError } = await h.call("search_services", {
      query: "visa",
      audience: "individual",
      uaepass_session: "uap_sim_forged",
      guard_session_id: GS,
    });
    assert.equal(isError, true);
    assert.deepEqual((body.error as { code: string }).code, "invalid_uaepass_session");
  });
});

describe("get_service_requirements", () => {
  it("returns requirements with every fee, time and requirement marked illustrative", async () => {
    const { body, isError } = await h.call("get_service_requirements", {
      service_id: "svc_residency_visa_employment",
      uaepass_session: h.login(),
      guard_session_id: GS,
    });
    assert.equal(isError, false);
    assertEnvelope(body);
    assert.equal((body.fee as { illustrative: boolean }).illustrative, true);
    assert.equal((body.processing_time as { illustrative: boolean }).illustrative, true);
    const requirements = body.requirements as { illustrative: boolean }[];
    assert.ok(requirements.length > 0 && requirements.every((r) => r.illustrative));
  });

  it("returns not_found for an unknown service", async () => {
    const { body, isError } = await h.call("get_service_requirements", {
      service_id: "svc_nope",
      uaepass_session: h.login(),
      guard_session_id: GS,
    });
    assert.equal(isError, true);
    assert.equal((body.error as { code: string }).code, "not_found");
  });
});

describe("start_application", () => {
  it("submits and returns the Guard check id", async () => {
    const { body, isError } = await h.call("start_application", {
      service_id: "svc_emirates_id_new",
      uaepass_session: h.login(),
      guard_session_id: GS,
      payload_refs: [PASSPORT],
    });
    assert.equal(isError, false);
    assertEnvelope(body);
    assert.match(body.application_id as string, /^app_\d{4}$/);
    assert.equal(body.status, "submitted");
    assert.equal(body.guard_check_id, "chk_test_allow");
  });

  it("refuses a business service from an individual session", async () => {
    const { body, isError } = await h.call("start_application", {
      service_id: "svc_economic_license_new",
      uaepass_session: h.login("individual"),
      guard_session_id: GS,
      payload_refs: [],
    });
    assert.equal(isError, true);
    assert.equal((body.error as { code: string }).code, "audience_mismatch");
  });
});

describe("get_application_status", () => {
  it("reports status and history for the owner only", async () => {
    const owner = h.login("individual", "hire_demo_001");
    const started = await h.call("start_application", {
      service_id: "svc_emirates_id_new",
      uaepass_session: owner,
      guard_session_id: GS,
      payload_refs: [PASSPORT],
    });
    const applicationId = started.body.application_id as string;

    const { body, isError } = await h.call("get_application_status", {
      application_id: applicationId,
      uaepass_session: owner,
      guard_session_id: GS,
    });
    assert.equal(isError, false);
    assertEnvelope(body);
    assert.equal(body.status, "under_review");
    assert.deepEqual(
      (body.history as { status: string }[]).map((event) => event.status),
      ["submitted", "under_review"],
    );

    const stranger = await h.call("get_application_status", {
      application_id: applicationId,
      uaepass_session: h.login("individual", "someone_else"),
      guard_session_id: GS,
    });
    assert.equal(stranger.isError, true);
    assert.equal((stranger.body.error as { code: string }).code, "not_found");
  });
});

describe("check_trade_name", () => {
  it("reports an available name", async () => {
    const { body, isError } = await h.call("check_trade_name", {
      proposed_name: "Falcon Analytics",
      uaepass_session: h.login("business"),
      guard_session_id: GS,
    });
    assert.equal(isError, false);
    assertEnvelope(body);
    assert.equal(body.available, true);
    assert.equal(body.illustrative, true);
  });

  it("reports a taken name with available suggestions", async () => {
    const { body } = await h.call("check_trade_name", {
      proposed_name: "Falcon Trading",
      licensing_authority: "ded",
      uaepass_session: h.login("business"),
      guard_session_id: GS,
    });
    assert.equal(body.available, false);
    assert.deepEqual((body.issues as { code: string }[]).map((issue) => issue.code), ["name_taken"]);
    assert.ok((body.suggestions as string[]).length > 0);
  });

  it("needs a business session", async () => {
    const { body, isError } = await h.call("check_trade_name", {
      proposed_name: "Falcon Analytics",
      uaepass_session: h.login("individual"),
      guard_session_id: GS,
    });
    assert.equal(isError, true);
    assert.equal((body.error as { code: string }).code, "audience_mismatch");
  });
});

describe("register_tenancy_tawtheeq", () => {
  const tenancy = {
    guard_session_id: GS,
    property_ref: "unit_reem_1204",
    landlord_name: "Example Properties LLC",
    annual_rent_aed: 95000,
    start_date: "2026-11-01",
    end_date: "2027-10-31",
    payload_refs: [PASSPORT, EMIRATES_ID],
  };

  it("registers the tenancy as a Tawtheeq application", async () => {
    const { body, isError } = await h.call("register_tenancy_tawtheeq", { ...tenancy, uaepass_session: h.login() });
    assert.equal(isError, false);
    assertEnvelope(body);
    assert.equal(body.service_id, "svc_tawtheeq_registration");
    assert.equal(body.status, "submitted");
  });

  it("rejects an end date before the start date without calling Guard", async () => {
    const { body, isError } = await h.call("register_tenancy_tawtheeq", {
      ...tenancy,
      end_date: "2026-10-01",
      uaepass_session: h.login(),
    });
    assert.equal(isError, true);
    assert.equal((body.error as { code: string }).code, "invalid_request");
    assert.equal(h.guard.requests.length, 0);
  });
});
