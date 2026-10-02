/** End to end over real HTTP: dev endpoints and the Streamable HTTP MCP transport. */
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { MockTammBackend } from "../src/backend/mock/mockBackend.js";
import { CONTRACT_VERSION } from "../src/contract.js";
import { createHttpApp } from "../src/http.js";
import { SingleFlight } from "../src/tools/singleFlight.js";
import { SimulatedUaePass } from "../src/uaepass.js";
import { FakeGuard } from "./harness.js";

async function serve(demo: boolean): Promise<{ url: string; server: Server }> {
  const backend = new MockTammBackend({ progression: { mode: "demo" } });
  const uaepass = new SimulatedUaePass();
  const app = createHttpApp(
    { backend, guard: new FakeGuard(), uaepass, flights: new SingleFlight() },
    { host: "127.0.0.1", mcpPath: "/mcp", ...(demo ? { demo: backend, resetSessions: () => uaepass.reset() } : {}) },
  );
  const server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
  });
  return { url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, server };
}

const post = async (url: string, body: unknown) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
};

describe("HTTP in demo mode", () => {
  let url: string;
  let server: Server;
  before(async () => ({ url, server } = await serve(true)));
  after(() => new Promise<void>((resolve) => server.close(() => resolve())));

  it("answers a malformed or oversized body with a plain JSON error and never a stack trace", async () => {
    const bad = [
      ["malformed JSON", "{not json", 400],
      ["oversized body", JSON.stringify({ subject_ref: "x".repeat(300_000), audience: "individual" }), 413],
    ] as const;
    for (const [label, body, status] of bad) {
      for (const path of ["/dev/uaepass/login", "/dev/advance", "/mcp"]) {
        const response = await fetch(`${url}${path}`, {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
          body,
        });
        const text = await response.text();
        assert.equal(response.status, status, `${label} on ${path}`);
        assert.match(response.headers.get("content-type") ?? "", /application\/json/, `${label} on ${path}`);
        const parsed = JSON.parse(text) as { error?: { code?: string } };
        assert.equal(parsed.error?.code, "invalid_request", `${label} on ${path}`);
        assert.doesNotMatch(text, /node_modules|\.ts:|\.js:|at \w+.*\(|SyntaxError|C:\|\/Users\//, `${label} on ${path} leaked internals`);
      }
    }
  });

  it("GET /health reports ok, mock and the contract version", async () => {
    const body = await (await fetch(`${url}/health`)).json();
    assert.deepEqual(body, { contract_version: CONTRACT_VERSION, status: "ok", mock: true });
  });

  it("simulated UAE PASS login, MCP over Streamable HTTP, /dev/advance and /dev/reset", async () => {
    const login = await post(`${url}/dev/uaepass/login`, { subject_ref: "hire_demo_001", audience: "individual" });
    assert.equal(login.status, 200);
    assert.equal(login.body.simulated, true);
    assert.match(login.body.uaepass_session as string, /^uap_sim_[0-9a-f]+$/);
    const session = login.body.uaepass_session as string;

    const client = new Client({ name: "http-test", version: "0.0.0" });
    await client.connect(new StreamableHTTPClientTransport(new URL(`${url}/mcp`)));
    const started = await client.callTool({
      name: "register_tenancy_tawtheeq",
      arguments: { lease_ref: "lease_reem_2207", applicant_ref: "hire_demo_001", uaepass_session: session, guard_session_id: "gs_1" },
    });
    const applicationId = (started.structuredContent as { application_id: string }).application_id;
    assert.equal(applicationId, "app_tw_0001");

    const advanced = await post(`${url}/dev/advance`, { application_id: applicationId });
    assert.equal(advanced.status, 200);
    assert.equal(advanced.body.status, "under_review");

    const status = await client.callTool({
      name: "get_application_status",
      arguments: { application_id: applicationId, uaepass_session: session },
    });
    assert.equal((status.structuredContent as { status: string }).status, "under_review");
    await client.close();

    assert.equal((await post(`${url}/dev/reset`, {})).status, 200);
    const afterReset = await post(`${url}/dev/advance`, { application_id: applicationId });
    assert.equal(afterReset.status, 404);
    assert.equal((afterReset.body.error as { code: string }).code, "unknown_application");
  });

  it("rejects a malformed login", async () => {
    const { status, body } = await post(`${url}/dev/uaepass/login`, { subject_ref: "x", audience: "robot" });
    assert.equal(status, 400);
    assert.equal((body.error as { code: string }).code, "invalid_request");
  });
});

describe("HTTP with demo mode off", () => {
  let url: string;
  let server: Server;
  before(async () => ({ url, server } = await serve(false)));
  after(() => new Promise<void>((resolve) => server.close(() => resolve())));

  for (const route of ["/dev/advance", "/dev/reset"]) {
    it(`${route} answers 404 demo_mode_only`, async () => {
      const { status, body } = await post(`${url}${route}`, { application_id: "app_tw_0001" });
      assert.equal(status, 404);
      assert.equal((body.error as { code: string }).code, "demo_mode_only");
    });
  }
});
