import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { sanitize } from "../src/redact.mjs";
import { createConsoleApp } from "../src/server.mjs";
import { close, deadUrl, readSse, SECRET_SENTINEL, startFakeGuard, startFakeTamm } from "./helpers/fakes.mjs";

async function boot({ tammOptions = {}, guardOptions = {}, guardUrl, tammMcpUrl } = {}) {
  const guard = await startFakeGuard(guardOptions);
  const tamm = await startFakeTamm({ guardUrl: guard.url, ...tammOptions });
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "tamm-live-"));
  const publicDir = path.join(dir, "public");
  await fs.mkdir(publicDir);
  await fs.writeFile(path.join(publicDir, "index.html"), "<!doctype html><title>x</title>");
  await fs.writeFile(path.join(publicDir, "app.css"), "body{}");
  await fs.writeFile(path.join(publicDir, "app.js"), "export {}");
  await fs.writeFile(path.join(dir, "secret.txt"), "TOP-SECRET-OUTSIDE-PUBLIC");
  const app = createConsoleApp({ guardUrl: guardUrl ?? guard.url, tammMcpUrl: tammMcpUrl ?? tamm.mcpUrl, publicDir, replayDir: path.join(dir, "replay"), heartbeatMs: 50 });
  await new Promise((r) => app.server.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${app.server.address().port}`;
  return { guard, tamm, url, dir, app, stop: async () => { await close(app.server); await close(guard.server); await close(tamm.server); await fs.rm(dir, { recursive: true, force: true }); } };
}
const run = (env, id, q = "") => readSse(`${env.url}/api/run/${id}${q}`);
const steps = (r) => r.events.filter((e) => e.event === "step").map((e) => e.data);

describe("scenario outcomes (fake Guard and TAMM)", () => {
  let env;
  before(async () => (env = await boot()));
  after(() => env.stop());

  it("tawtheeq: allowed, one application, submitted -> approved", async () => {
    const r = await run(env, "tawtheeq");
    const s = steps(r);
    assert.deepEqual(s.map((x) => x.kind), ["guard.session", "guard.observe", "tamm.login", "tamm.tool", "guard.check", "tamm.status", "tamm.advance", "tamm.status", "tamm.advance", "tamm.status"]);
    assert.deepEqual(s.map((x) => x.n), s.map((_, i) => i + 1));
    assert.equal(s.at(-1).status, "approved");
    assert.equal(s.find((x) => x.kind === "guard.check").decision.decision, "allow");
    assert.equal(r.events.at(-1).event, "done");
    assert.equal(r.events.at(-1).data.outcome, "allowed");
    assert.equal(env.tamm.created, 1);
    assert.ok(s.every((x) => x.mock === true && typeof x.atMs === "number" && typeof x.ms === "number"));
  });

  it("bank-statement: blocked, nothing created, the result carries denied and no application_id", async () => {
    const before = env.tamm.created;
    const r = await run(env, "bank-statement");
    const s = steps(r);
    const tool = s.find((x) => x.kind === "tamm.tool");
    assert.equal(tool.response.denied, true);
    assert.equal(tool.response.application_id, undefined);
    const check = s.find((x) => x.kind === "guard.check");
    assert.equal(check.decision.decision, "deny");
    assert.equal(check.decision.policy_rule, "bank_statement.tamm.denied");
    assert.deepEqual(check.decision.blocked_labels, ["bank_statement"]);
    assert.equal(r.events.at(-1).data.outcome, "blocked");
    assert.equal(env.tamm.created, before);
  });

  it("health-routing: mixed, denied for the visa then allowed for insurance", async () => {
    const before = env.tamm.created;
    const r = await run(env, "health-routing");
    const checks = steps(r).filter((x) => x.kind === "guard.check").map((x) => x.decision);
    assert.deepEqual(checks.map((c) => c.decision), ["deny", "allow"]);
    assert.equal(checks[0].policy_rule, "health.tamm.insurance_only");
    assert.equal(r.events.at(-1).data.outcome, "mixed");
    assert.equal(env.tamm.created, before + 1);
  });

  it("GET /api/scenarios lists all three with the contract fields", async () => {
    const list = await (await fetch(`${env.url}/api/scenarios`)).json();
    assert.deepEqual(list.map((s) => s.id), ["tawtheeq", "bank-statement", "health-routing"]);
    for (const s of list) for (const k of ["id", "title", "blurb", "expect", "labels", "service"]) assert.ok(s[k] !== undefined, `${s.id}.${k}`);
    assert.deepEqual(list.map((s) => s.expect), ["allowed", "blocked", "mixed"]);
  });

  it("unknown scenario ends with one fail event, not a crash", async () => {
    const r = await run(env, "nope");
    assert.deepEqual(r.events.map((e) => e.event), ["fail"]);
    assert.ok(r.events[0].data.message && r.events[0].data.hint);
  });

  it("POST /api/reset resets both services", async () => {
    const out = await (await fetch(`${env.url}/api/reset`, { method: "POST" })).json();
    assert.deepEqual(out, { ok: true, tamm: true, guard: true });
    assert.equal(env.tamm.resets, 1);
    assert.equal(env.guard.resets, 1);
  });
});

describe("SSE framing", () => {
  let env;
  before(async () => (env = await boot()));
  after(() => env.stop());
  it("uses event-stream headers and well-formed frames, and flushes a heartbeat-safe preamble", async () => {
    const r = await run(env, "bank-statement");
    assert.match(r.headers.get("content-type"), /^text\/event-stream/);
    assert.match(r.headers.get("cache-control"), /no-cache/);
    assert.equal(r.headers.get("x-accel-buffering"), "no");
    assert.ok(r.raw.startsWith("retry: "));
    for (const block of r.raw.split("\n\n").filter((b) => b.startsWith("event:"))) {
      assert.match(block, /^event: (step|done|fail)\ndata: \{.*\}$/s);
      assert.ok(!block.slice(block.indexOf("data:")).includes("\n"));
    }
    assert.equal(r.events.filter((e) => e.event === "done").length, 1);
  });
});

describe("redaction", () => {
  let env;
  before(async () => (env = await boot({ tammOptions: { echoPoison: true } })));
  after(() => env.stop());
  it("never leaks a raw value, a uaepass session or a full Guard session id into any step", async () => {
    for (const id of ["tawtheeq", "bank-statement", "health-routing"]) {
      const r = await run(env, id);
      const text = JSON.stringify(r.events);
      assert.ok(!text.includes(SECRET_SENTINEL), `${id}: raw value leaked`);
      assert.ok(!/uap_sim_[0-9a-f]{6,}/.test(text), `${id}: uaepass session leaked`);
      assert.ok(!/gs_[0-9a-f]{7,}/.test(text), `${id}: full guard session id leaked`);
      assert.ok(/gs_[0-9a-f]{3}…/.test(text), `${id}: masked guard id expected`);
    }
  });
  it("sanitize hides secret keys, masks session ids and replaces known secrets", () => {
    const out = sanitize({ uaepass_session: "uap_sim_abcdef12", session_id: "gs_1234567890", raw_value: "x", note: "hi gs_1234567890 bye", nested: [{ token: "t" }] }, [{ value: "gs_1234567890", replacement: "gs_123…" }]);
    assert.deepEqual(out, { uaepass_session: "(hidden)", session_id: "gs_123…", raw_value: "(hidden)", note: "hi gs_123… bye", nested: [{ token: "(hidden)" }] });
  });
});

describe("service down and fail closed", () => {
  it("Guard down: one fail event with the start command, TAMM is never called, status says so", async () => {
    const env = await boot({ guardUrl: await deadUrl() });
    const r = await run(env, "tawtheeq");
    assert.deepEqual(r.events.map((e) => e.event), ["fail"]);
    assert.match(r.events[0].data.message, /Guard/);
    assert.match(r.events[0].data.hint, /RASIKH_DEMO_MODE=1 cargo run/);
    assert.ok(!/at .*\.mjs|Error:/.test(r.raw), "no stack trace");
    assert.deepEqual(env.tamm.toolCalls, []);
    assert.equal(env.tamm.created, 0);
    const status = await (await fetch(`${env.url}/api/status`)).json();
    assert.equal(status.guard.ok, false);
    assert.equal(status.tamm.ok, true);
    assert.equal(status.tamm.mock, true);
    assert.equal(status.tamm.demoMode, true);
    assert.equal((await fetch(`${env.url}/api/status`)).status, 200, "server still alive");
    await env.stop();
  });
  it("TAMM down: one fail event naming the TAMM start command", async () => {
    const env = await boot({ tammMcpUrl: `${await deadUrl()}/mcp` });
    const r = await run(env, "bank-statement");
    assert.deepEqual(r.events.map((e) => e.event), ["fail"]);
    assert.match(r.events[0].data.hint, /npm run dev/);
    const status = await (await fetch(`${env.url}/api/status`)).json();
    assert.equal(status.tamm.ok, false);
    assert.equal(status.guard.ok, true);
    await env.stop();
  });
  it("both down: a single fail event, and reset reports false for both without crashing", async () => {
    const env = await boot({ guardUrl: await deadUrl(), tammMcpUrl: `${await deadUrl()}/mcp` });
    const r = await run(env, "tawtheeq");
    assert.deepEqual(r.events.map((e) => e.event), ["fail"]);
    assert.deepEqual(await (await fetch(`${env.url}/api/reset`, { method: "POST" })).json(), { ok: false, tamm: false, guard: false });
    await env.stop();
  });
  it("Guard fails after the health check: the run fails closed and TAMM is never called", async () => {
    const env = await boot({ guardOptions: { failSession: true } });
    const r = await run(env, "tawtheeq");
    assert.deepEqual(r.events.map((e) => e.event), ["fail"]);
    assert.deepEqual(env.tamm.toolCalls, []);
    await env.stop();
  });
  it("TAMM cannot reach Guard (guard_unavailable): fail event, nothing created", async () => {
    const env = await boot();
    const dead = await startFakeTamm({ guardUrl: await deadUrl() });
    const app = createConsoleApp({ guardUrl: env.guard.url, tammMcpUrl: dead.mcpUrl, publicDir: env.dir, replayDir: env.dir });
    await new Promise((r) => app.server.listen(0, "127.0.0.1", r));
    const r = await readSse(`http://127.0.0.1:${app.server.address().port}/api/run/tawtheeq`);
    assert.equal(r.events.at(-1).event, "fail");
    assert.match(r.events.at(-1).data.message, /Guard/);
    assert.equal(dead.created, 0);
    await close(app.server); await close(dead.server); await env.stop();
  });
  it("JSON (non-SSE) MCP answers work too", async () => {
    const env = await boot({ tammOptions: { sse: false } });
    const r = await run(env, "tawtheeq");
    assert.equal(r.events.at(-1).data.outcome, "allowed");
    await env.stop();
  });
});

describe("replay", () => {
  let env;
  before(async () => (env = await boot()));
  after(() => env.stop());
  it("has no replay before recording, then records with ?record=1 and serves it flagged replay:true", async () => {
    let r = await readSse(`${env.url}/api/replay/bank-statement?fast=1`);
    assert.deepEqual(r.events.map((e) => e.event), ["fail"]);
    assert.deepEqual((await (await fetch(`${env.url}/api/status`)).json()).replays, []);
    await run(env, "bank-statement", "?record=1");
    await run(env, "tawtheeq");
    assert.ok((await fs.stat(path.join(env.dir, "replay", "bank-statement.json"))).isFile());
    await assert.rejects(fs.stat(path.join(env.dir, "replay", "tawtheeq.json")), "unrecorded runs are not saved");
    assert.deepEqual((await (await fetch(`${env.url}/api/status`)).json()).replays, ["bank-statement"]);
    r = await readSse(`${env.url}/api/replay/bank-statement?fast=1`);
    const s = steps(r);
    assert.ok(s.length >= 5 && s.every((x) => x.replay === true && x.mock === true));
    assert.equal(r.events.at(-1).event, "done");
    assert.equal(r.events.at(-1).data.outcome, "blocked");
    assert.ok(!/gs_[0-9a-f]{7,}/.test(r.raw));
  });
  it("a corrupt replay file fails politely", async () => {
    await fs.writeFile(path.join(env.dir, "replay", "health-routing.json"), "{not json");
    const r = await readSse(`${env.url}/api/replay/health-routing?fast=1`);
    assert.deepEqual(r.events.map((e) => e.event), ["fail"]);
  });
});

describe("static files and request hygiene", () => {
  let env;
  before(async () => (env = await boot()));
  after(() => env.stop());
  const raw = (pathAndQuery, headers = {}, method = "GET") =>
    new Promise((resolve, reject) => {
      const u = new URL(env.url);
      const req = http.request({ host: u.hostname, port: u.port, path: pathAndQuery, method, headers }, (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
      });
      req.on("error", reject);
      req.end();
    });

  it("serves public files with correct content types", async () => {
    const html = await raw("/");
    assert.equal(html.status, 200);
    assert.match(html.headers["content-type"], /^text\/html/);
    assert.match((await raw("/app.css")).headers["content-type"], /^text\/css/);
    assert.match((await raw("/app.js")).headers["content-type"], /^text\/javascript/);
    assert.equal((await raw("/missing.png")).status, 404);
  });
  it("rejects path traversal in every encoding", async () => {
    for (const p of ["/../secret.txt", "/..%2fsecret.txt", "/%2e%2e/secret.txt", "/%2e%2e%2fsecret.txt", "/..%5csecret.txt", "/%5c..%5csecret.txt", "/a/../../secret.txt", "/%00", "/.%2e/secret.txt", "//..//secret.txt"]) {
      const r = await raw(p);
      assert.ok(r.status >= 400, `${p} -> ${r.status}`);
      assert.ok(!r.body.includes("TOP-SECRET"), `${p} leaked`);
    }
  });
  it("only answers on localhost hosts and same-origin, so a web page cannot reset the demo", async () => {
    assert.equal((await raw("/api/status", { host: "evil.example" })).status, 403);
    const before = env.guard.resets;
    const r = await raw("/api/reset", { origin: "http://evil.example" }, "POST");
    assert.equal(r.status, 403);
    assert.equal(env.guard.resets, before);
  });
  it("only GET and HEAD for static, unknown API routes are JSON 404", async () => {
    assert.equal((await raw("/", {}, "POST")).status, 405);
    const r = await raw("/api/nothing");
    assert.equal(r.status, 404);
    assert.equal(JSON.parse(r.body).error.code, "not_found");
  });
});
