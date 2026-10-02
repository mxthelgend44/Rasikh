import assert from "node:assert/strict";
import { type Server, createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";
import { CONTRACT_VERSION } from "../src/contract.js";
import { HttpGuardClient } from "../src/guard/client.js";
import { FakeGuard, createHarness, verdict } from "./harness.js";

const GS = "gs_8f2a1c";
const PASSPORT = { ref: "doc_passport_hire_demo_001", labels: ["passport"] };
const HEALTH = { ref: "doc_health_hire_demo_001", labels: ["health"] };

const startApplication = (session: string, serviceId: string, documents: unknown[]) => ({
  service_id: serviceId,
  applicant_ref: "hire_demo_001",
  documents,
  uaepass_session: session,
  guard_session_id: GS,
});

describe("Guard integration (data-sending tools)", () => {
  it("start_application sends tool, destination tamm, labels, refs and service tags to Guard", async () => {
    const h = await createHarness();
    await h.call("start_application", startApplication(h.login(), "svc_health_insurance", [PASSPORT, HEALTH]));
    assert.deepEqual(h.guard.requests, [
      {
        session_id: GS,
        tool: "start_application",
        destination: "tamm",
        data_labels: ["passport", "health"],
        payload_refs: [PASSPORT, HEALTH],
        service_tags: ["health", "insurance"],
      },
    ]);
    await h.close();
  });

  it("register_tenancy_tawtheeq sends the lease and the tenant's ID documents to Guard", async () => {
    const h = await createHarness();
    await h.call("register_tenancy_tawtheeq", {
      lease_ref: "lease_reem_2207",
      applicant_ref: "hire_demo_001",
      uaepass_session: h.login(),
      guard_session_id: GS,
    });
    assert.equal(h.guard.requests.length, 1);
    const request = h.guard.requests[0];
    assert.equal(request?.tool, "register_tenancy_tawtheeq");
    assert.equal(request?.destination, "tamm");
    assert.deepEqual(request?.data_labels, ["passport", "emirates_id", "address"]);
    assert.deepEqual(request?.payload_refs, [
      { ref: "doc_passport_hire_demo_001", labels: ["passport"] },
      { ref: "doc_emirates_id_hire_demo_001", labels: ["emirates_id"] },
      { ref: "lease_reem_2207", labels: ["address"] },
    ]);
    await h.close();
  });

  for (const decision of ["deny", "needs_consent"] as const) {
    for (const tool of ["start_application", "register_tenancy_tawtheeq"]) {
      it(`${tool}: Guard ${decision} returns the contract denial and creates nothing`, async () => {
        const h = await createHarness({ guard: new FakeGuard(() => verdict(decision, "health.tamm.insurance_only")) });
        const session = h.login();
        const args =
          tool === "start_application"
            ? startApplication(session, "svc_residency_visa", [HEALTH])
            : { lease_ref: "lease_reem_2207", applicant_ref: "hire_demo_001", uaepass_session: session, guard_session_id: GS };
        const { body, isError } = await h.call(tool, args);
        assert.equal(isError, false);
        assert.deepEqual(body, {
          contract_version: CONTRACT_VERSION,
          mock: true,
          denied: true,
          guard: { decision, reason: "Not allowed.", policy_rule: "health.tamm.insurance_only" },
        });
        assert.equal(await h.backend.getApplication("app_rv_0001", "hire_demo_001"), undefined);
        assert.equal(await h.backend.getApplication("app_tw_0001", "hire_demo_001"), undefined);
        await h.close();
      });
    }
  }

  it("fails closed with guard_unavailable when Guard cannot answer", async () => {
    const h = await createHarness({ guard: new FakeGuard(() => ({ kind: "unavailable", detail: "down" })) });
    const { body, isError } = await h.call("start_application", startApplication(h.login(), "svc_emirates_id", [PASSPORT]));
    assert.equal(isError, true);
    assert.equal(body.error?.code, "guard_unavailable");
    assert.equal(await h.backend.getApplication("app_eid_0001", "hire_demo_001"), undefined);
    await h.close();
  });

  it("read-only tools do not call Guard (they take no guard_session_id, INTEGRATION.md 4.3)", async () => {
    const h = await createHarness();
    const session = h.login();
    await h.call("search_services", { query: "visa", audience: "individual", uaepass_session: session });
    await h.call("get_service_requirements", { service_id: "svc_residency_visa", uaepass_session: session });
    await h.call("check_trade_name", { name: "Northwind Analytics", uaepass_session: session });
    await h.call("get_application_status", { application_id: "app_rv_0001", uaepass_session: session });
    assert.equal(h.guard.requests.length, 0);
    await h.close();
  });
});

describe("HttpGuardClient", () => {
  let server: Server;
  let baseUrl: string;
  let respond: (body: string) => { status: number; body: string } = () => ({ status: 200, body: "{}" });
  let received: unknown;

  before(async () => {
    server = createServer((req, res) => {
      let raw = "";
      req.on("data", (chunk: Buffer) => (raw += chunk.toString()));
      req.on("end", () => {
        received = { method: req.method, url: req.url, body: JSON.parse(raw) };
        const answer = respond(raw);
        res.writeHead(answer.status, { "content-type": "application/json" }).end(answer.body);
      });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  after(() => new Promise<void>((resolve) => server.close(() => resolve())));

  const request = {
    session_id: GS,
    tool: "start_application",
    destination: "tamm" as const,
    data_labels: ["passport" as const],
    payload_refs: [{ ref: "doc_passport_hire_demo_001", labels: ["passport" as const] }],
  };

  it("POSTs the request to /check and returns Guard's verdict", async () => {
    const guardAnswer = {
      contract_version: CONTRACT_VERSION,
      check_id: "chk_19b0",
      decision: "needs_consent",
      reason: "Your passport has not been shared with landlords yet.",
      policy_rule: "passport.landlord.requires_consent",
      blocked_labels: ["passport"],
      consent_request: { label: "passport", destination: "landlord" },
    };
    respond = () => ({ status: 200, body: JSON.stringify(guardAnswer) });
    const outcome = await new HttpGuardClient(baseUrl).check(request);
    assert.deepEqual(received, { method: "POST", url: "/check", body: request });
    assert.deepEqual(outcome, { kind: "verdict", verdict: guardAnswer });
  });

  it("fails closed on a non-200 answer", async () => {
    respond = () => ({ status: 500, body: "{}" });
    assert.equal((await new HttpGuardClient(baseUrl).check(request)).kind, "unavailable");
  });

  it("fails closed on a malformed answer", async () => {
    respond = () => ({ status: 200, body: JSON.stringify({ decision: "allow" }) });
    assert.equal((await new HttpGuardClient(baseUrl).check(request)).kind, "unavailable");
  });

  it("fails closed when Guard is unreachable", async () => {
    assert.equal((await new HttpGuardClient("http://127.0.0.1:9", 500).check(request)).kind, "unavailable");
  });
});
