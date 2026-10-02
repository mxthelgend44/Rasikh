import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { loadCatalogue, parseCatalogue } from "../src/backend/mock/catalogue.js";
import { MockTammBackend } from "../src/backend/mock/mockBackend.js";
import { PrerequisiteCycleError, prerequisiteOrder } from "../src/planning.js";
import { type Harness, createHarness } from "./harness.js";

const backend = new MockTammBackend({ progression: { mode: "demo" } });

describe("prerequisite order", () => {
  it("lists every transitive prerequisite, each after its own prerequisites", async () => {
    assert.deepEqual(await prerequisiteOrder(backend, "svc_visa_quota"), [
      "svc_trade_name",
      "svc_economic_license",
      "svc_establishment_card",
    ]);
    assert.deepEqual(await prerequisiteOrder(backend, "svc_school_registration"), [
      "svc_residency_visa",
      "svc_tawtheeq_register",
    ]);
    assert.deepEqual(await prerequisiteOrder(backend, "svc_residency_visa"), []);
  });

  it("detects a cycle", async () => {
    const catalogue = structuredClone(loadCatalogue());
    const visa = catalogue.services.find((s) => s.service_id === "svc_residency_visa");
    assert.ok(visa);
    visa.depends_on = ["svc_tawtheeq_register"];
    const cyclic = new MockTammBackend({ progression: { mode: "demo" }, catalogue });
    await assert.rejects(prerequisiteOrder(cyclic, "svc_tawtheeq_register"), PrerequisiteCycleError);
    assert.throws(() => parseCatalogue(catalogue), /prerequisite cycle/);
  });
});

describe("get_service_requirements gap analysis", () => {
  let h: Harness;
  beforeEach(async () => {
    h = await createHarness();
  });
  afterEach(() => h.close());

  const ask = (extra: Record<string, unknown>) =>
    h.call("get_service_requirements", { service_id: "svc_tawtheeq_register", uaepass_session: h.login(), ...extra });

  it("with nothing on file, everything is missing", async () => {
    const { body } = await ask({});
    assert.deepEqual(body.prerequisite_order, ["svc_residency_visa"]);
    assert.deepEqual(body.missing_prerequisites, ["svc_residency_visa"]);
    assert.deepEqual(
      (body.missing_documents as { label: string }[]).map((d) => d.label),
      ["passport", "emirates_id", "address"],
    );
    assert.equal(body.ready_to_apply, false);
  });

  it("subtracts held documents and completed services", async () => {
    const { body } = await ask({
      documents_on_file: [{ ref: "doc_passport_hire_demo_001", labels: ["passport", "family"] }],
      completed_services: ["svc_residency_visa"],
    });
    assert.deepEqual(body.missing_prerequisites, []);
    assert.deepEqual(
      (body.missing_documents as { label: string }[]).map((d) => d.label),
      ["emirates_id", "address"],
    );
    assert.equal(body.ready_to_apply, false);
  });

  it("is ready when nothing is missing", async () => {
    const { body } = await ask({
      documents_on_file: [
        { ref: "doc_passport_hire_demo_001", labels: ["passport"] },
        { ref: "doc_emirates_id_hire_demo_001", labels: ["emirates_id"] },
        { ref: "lease_reem_2207", labels: ["address"] },
      ],
      completed_services: ["svc_residency_visa"],
    });
    assert.equal(body.ready_to_apply, true);
  });
});
