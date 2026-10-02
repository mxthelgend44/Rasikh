import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadCatalogue, parseCatalogue } from "../src/backend/mock/catalogue.js";

const catalogue = loadCatalogue();
const byId = new Map(catalogue.services.map((service) => [service.service_id, service]));

describe("mock catalogue", () => {
  it("covers the minimum services of INTEGRATION.md 4.6", () => {
    const required = [
      "svc_residency_visa",
      "svc_emirates_id",
      "svc_tawtheeq_register",
      "svc_health_insurance",
      "svc_school_registration",
      "svc_trade_name",
      "svc_economic_license",
      "svc_adgm_setup",
      "svc_kezad_setup",
      "svc_masdar_setup",
      "svc_twofour54_setup",
      "svc_establishment_card",
      "svc_visa_quota",
    ];
    assert.deepEqual(required.filter((id) => !byId.has(id)), []);
  });

  it("tags health insurance enrolment as insurance", () => {
    assert.ok(byId.get("svc_health_insurance")?.tags.includes("insurance"));
  });

  it("uses the real entities named in the brief", () => {
    const entities = catalogue.services.map((service) => service.entity).join("\n");
    for (const entity of ["(ICP)", "Department of Economic Development", "ADGM", "KEZAD", "Masdar City Free Zone", "twofour54", "(ADEK)", "Department of Health"]) {
      assert.ok(entities.includes(entity), `missing entity ${entity}`);
    }
  });

  it("marks every fee, duration and document as illustrative", () => {
    for (const service of catalogue.services) {
      assert.equal(service.est_fee_aed.illustrative, true);
      assert.equal(service.est_duration_days.illustrative, true);
      assert.ok(service.required_documents.every((doc) => doc.illustrative));
    }
  });

  it("rejects a catalogue whose numbers are not marked illustrative", () => {
    const tampered = structuredClone(catalogue) as unknown as { services: { est_fee_aed: { illustrative: boolean } }[] };
    (tampered.services[0] as { est_fee_aed: { illustrative: boolean } }).est_fee_aed.illustrative = false;
    assert.throws(() => parseCatalogue(tampered));
  });

  it("rejects an illegal review script and an unknown dependency", () => {
    const badScript = structuredClone(catalogue);
    (badScript.services[0] as { review_script: unknown }).review_script = [{ status: "approved" }];
    assert.throws(() => parseCatalogue(badScript), /not a legal transition/);

    const badDependency = structuredClone(catalogue);
    (badDependency.services[0] as { depends_on: string[] }).depends_on = ["svc_missing"];
    assert.throws(() => parseCatalogue(badDependency), /unknown svc_missing/);
  });
});
