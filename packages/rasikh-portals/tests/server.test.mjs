// node --test tests/   (starts its own server on a random port; stops only that server)
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createPortalServer, resolveSafe } from "../server.mjs";

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
let server, base;
before(async () => {
  server = createPortalServer();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const raw = (path) => new Promise((resolve, reject) => {
  import("node:http").then(({ request }) => {
    const u = new URL(base);
    const req = request({ host: u.hostname, port: u.port, path, method: "GET" }, (res) => { let b = ""; res.on("data", (d) => (b += d)); res.on("end", () => resolve({ status: res.statusCode, body: b, headers: res.headers })); });
    req.on("error", reject); req.end();
  });
});

test("serves the index and all three portals", async () => {
  for (const p of ["/", "/icp/", "/utilities/", "/bank/", "/icp/signin.html", "/icp/apply.html", "/utilities/apply.html", "/bank/apply.html"]) {
    const r = await raw(p); assert.equal(r.status, 200, p);
  }
});
test("directory without trailing slash redirects", async () => { const r = await raw("/icp"); assert.equal(r.status, 301); assert.equal(r.headers.location, "/icp/"); });
test("no directory traversal", async () => {
  for (const p of ["/../server.mjs", "/..%2fserver.mjs", "/%2e%2e/server.mjs", "/icp/..%2f..%2fpackage.json", "/%00", "/icp/..\\..\\package.json", "/%5c..%5cserver.mjs"]) {
    const r = await raw(p); assert.ok(r.status === 400 || r.status === 404, `${p} -> ${r.status}`); assert.ok(!/createPortalServer/.test(r.body), p);
  }
  assert.equal(resolveSafe("/../server.mjs"), null);
});
test("only GET and HEAD", async () => {
  const { request } = await import("node:http"); const u = new URL(base);
  const status = await new Promise((res) => { const q = request({ host: u.hostname, port: u.port, path: "/", method: "POST" }, (r) => { r.resume(); res(r.statusCode); }); q.end(); });
  assert.equal(status, 405);
});
test("unknown path is a labelled 404 page", async () => { const r = await raw("/nope"); assert.equal(r.status, 404); assert.match(r.body, /MOCK PORTAL for the Rasikh demo/); });
test("server binds to 127.0.0.1 only", () => assert.equal(server.address().address, "127.0.0.1"));

function htmlFiles(dir) { return readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? htmlFiles(p) : p.endsWith(".html") ? [p] : []; }); }
test("every page carries the persistent MOCK banner, in HTML, with no external resources", () => {
  for (const f of htmlFiles(PUBLIC)) {
    const t = readFileSync(f, "utf8");
    assert.match(t, /class="mock-banner"[^>]*>[\s\S]*MOCK PORTAL for the Rasikh demo, not a real government or bank site/, f);
    assert.ok(!/(src|href)="https?:\/\//.test(t), `${f} loads an external resource`);
    assert.match(t, /<html lang="en" dir="ltr">/, f);
  }
});
