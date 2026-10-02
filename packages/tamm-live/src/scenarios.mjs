/**
 * The three live scenarios: metadata plus the step logic. All use the shared demo fixtures
 * (INTEGRATION.md section 5). TAMM is a MOCK, UAE PASS is SIMULATED, and the Guard policy matrix is a
 * product default, not a legal statement. Summaries state only what happened in this run.
 */

const CASE = "hire_demo_001";
const LEASE = "lease_reem_2207";
const PASSPORT = { ref: "doc_passport_hire_demo_001", labels: ["passport"] };
const EMIRATES_ID = { ref: "doc_emirates_id_hire_demo_001", labels: ["emirates_id"] };
const LEASE_DOC = { ref: LEASE, labels: ["address"] };
const BANK_STATEMENT = { ref: "doc_bank_statement_hire_demo_001", labels: ["bank_statement"] };
const HEALTH = { ref: "doc_health_declaration_hire_demo_001", labels: ["health"] };

export const SCENARIOS = [
  {
    id: "tawtheeq",
    title: "Register the tenancy contract with TAMM",
    blurb:
      "The agent registers the Al Reem lease through the mock TAMM. Guard allows it (passport and Emirates ID may go to TAMM), the mock creates an application and moves it from submitted to approved.",
    expect: "allowed",
    labels: ["passport", "emirates_id", "address"],
    service: "svc_tawtheeq_register",
    async run(ctx) {
      await ctx.openSession({ caseId: CASE, caseType: "hire" });
      await ctx.observe([PASSPORT, EMIRATES_ID, LEASE_DOC], "The agent reads the passport, the Emirates ID and the lease (labels only)");
      await ctx.login(CASE, "individual");
      const r = await ctx.tool(
        "register_tenancy_tawtheeq",
        { lease_ref: LEASE, applicant_ref: CASE },
        { title: "Agent calls register_tenancy_tawtheeq on the TAMM mock", labels: ["passport", "emirates_id", "address"], serviceTags: ["housing"] },
      );
      if (r.denied || !r.applicationId) {
        return { outcome: r.denied ? "blocked" : "error", summary: `Guard decided ${r.decision?.decision} (${r.decision?.policy_rule ?? "no rule"}). Unexpected for this scenario.` };
      }
      const id = r.applicationId;
      await ctx.status(id, "Agent reads the application status");
      await ctx.advance(id, "Demo control: the mock moves the application forward");
      await ctx.status(id, "Agent reads the application status again");
      await ctx.advance(id, "Demo control: the mock moves the application forward again");
      const final = await ctx.status(id, "Agent reads the final status");
      const ok = final === "approved";
      return {
        outcome: ok ? "allowed" : "error",
        summary: ok
          ? `Guard allowed the call (${r.decision.policy_rule ?? "allow"}). The mock TAMM created ${id} and it went submitted, under_review, approved. All of this is mock data; no real TAMM request was made.`
          : `Guard allowed the call but the mock ended in status ${final}, not approved.`,
      };
    },
  },
  {
    id: "bank-statement",
    title: "The agent tries to attach a bank statement to a residency visa application",
    blurb:
      "The agent has read a bank statement and tries to send it to TAMM with a residency visa application. Guard denies it, so the mock TAMM backend is never called and nothing is created.",
    expect: "blocked",
    labels: ["bank_statement"],
    service: "svc_residency_visa",
    async run(ctx) {
      await ctx.openSession({ caseId: CASE, caseType: "hire" });
      await ctx.observe([BANK_STATEMENT], "The agent reads a bank statement (label only)");
      await ctx.login(CASE, "individual");
      const r = await ctx.tool(
        "start_application",
        { service_id: "svc_residency_visa", applicant_ref: CASE, documents: [BANK_STATEMENT] },
        { title: "Agent calls start_application (residency visa) with the bank statement attached", labels: ["bank_statement"], serviceTags: ["residency", "visa"] },
      );
      const blocked = r.denied && !r.applicationId;
      ctx.note("Proof that nothing was created in the mock TAMM", {
        denied: r.denied,
        application_id_in_result: Boolean(r.applicationId),
        meaning: blocked
          ? "The tool result carries denied: true and no application_id, because the mock backend is only called after Guard allows."
          : "Unexpected: the result did not look like a denial.",
      });
      if (blocked) {
        return {
          outcome: "blocked",
          summary: `Guard denied sending the bank statement to TAMM (${r.decision.policy_rule}). The tool result has denied: true and no application_id, so nothing was created in the mock.`,
        };
      }
      return {
        outcome: r.applicationId ? "allowed" : "error",
        summary: `Unexpected result: Guard decided ${r.decision?.decision}. This scenario is expected to be blocked.`,
      };
    },
  },
  {
    id: "health-routing",
    title: "Health data: refused for a visa, accepted for insurance",
    blurb:
      "The same health declaration is sent twice. For a residency visa Guard refuses it (health goes to TAMM for insurance services only). For health insurance enrolment Guard allows it.",
    expect: "mixed",
    labels: ["health"],
    service: "svc_residency_visa",
    services: ["svc_residency_visa", "svc_health_insurance"],
    async run(ctx) {
      await ctx.openSession({ caseId: CASE, caseType: "hire" });
      await ctx.observe([HEALTH], "The agent reads a health declaration (label only)");
      await ctx.login(CASE, "individual");
      const visa = await ctx.tool(
        "start_application",
        { service_id: "svc_residency_visa", applicant_ref: CASE, documents: [HEALTH] },
        { title: "Agent sends the health declaration with a residency visa application", labels: ["health"], serviceTags: ["residency", "visa"] },
      );
      const insurance = await ctx.tool(
        "start_application",
        { service_id: "svc_health_insurance", applicant_ref: CASE, documents: [HEALTH] },
        { title: "Agent sends the same health declaration with a health insurance application", labels: ["health"], serviceTags: ["health", "insurance"] },
      );
      if (insurance.applicationId) {
        await ctx.status(insurance.applicationId, "Agent reads the insurance application status");
      }
      const refused = visa.denied && !visa.applicationId;
      const accepted = !insurance.denied && Boolean(insurance.applicationId);
      if (refused && accepted) {
        return {
          outcome: "mixed",
          summary: `Refused for the residency visa (${visa.decision.policy_rule}), accepted for health insurance (${insurance.applicationId} created in the mock).`,
        };
      }
      return {
        outcome: "error",
        summary: `Unexpected: visa ${visa.decision?.decision}, insurance ${insurance.decision?.decision}. Expected deny then allow.`,
      };
    },
  },
];

export const findScenario = (id) => SCENARIOS.find((s) => s.id === id);

/** Public metadata only (no step logic) for GET /api/scenarios. */
export const scenarioList = () =>
  SCENARIOS.map(({ id, title, blurb, expect, labels, service, services }) => ({ id, title, blurb, expect, labels, service, ...(services ? { services } : {}) }));
