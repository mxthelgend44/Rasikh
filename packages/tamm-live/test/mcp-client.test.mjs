import assert from "node:assert/strict";
import http from "node:http";
import { describe, it } from "node:test";
import { McpHttpClient, McpError, parseMcpBody, parseSse } from "../src/mcp-client.mjs";
import { close, deadUrl } from "./helpers/fakes.mjs";

const result = { content: [{ type: "text", text: '{"mock":true,"x":1}' }], structuredContent: { mock: true, x: 1 } };

function serve(handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, "127.0.0.1", () => resolve({ server, url: `http://127.0.0.1:${server.address().port}/mcp` }));
  });
}

describe("MCP client body parsing", () => {
  it("parses a plain JSON body", () => {
    const reply = parseMcpBody("application/json", JSON.stringify({ jsonrpc: "2.0", id: 3, result }), 3);
    assert.deepEqual(reply.result, result);
  });
  it("parses an SSE body, skipping notifications, with CRLF and multi-line data", () => {
    const body = [
      "event: message", 'data: {"jsonrpc":"2.0","method":"notifications/progress","params":{}}', "",
      "event: message", 'data: {"jsonrpc":"2.0","id":7,', 'data: "result":{"ok":true}}', "", "",
    ].join("\r\n");
    assert.equal(parseSse(body).length, 2);
    assert.deepEqual(parseMcpBody("text/event-stream; charset=utf-8", body, 7).result, { ok: true });
  });
  it("rejects a body that is not JSON-RPC", () => {
    assert.throws(() => parseMcpBody("application/json", "<html>", 1), (e) => e instanceof McpError && e.kind === "bad_body");
    assert.throws(() => parseMcpBody("text/event-stream", "data: {}\n\n", 1), (e) => e.kind === "bad_body");
  });
});

describe("MCP client over HTTP", () => {
  it("sends the right headers and reads a JSON answer", async () => {
    let seen;
    const { server, url } = await serve((req, res) => {
      let raw = "";
      req.on("data", (c) => (raw += c));
      req.on("end", () => {
        seen = { headers: req.headers, body: JSON.parse(raw) };
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ jsonrpc: "2.0", id: seen.body.id, result }));
      });
    });
    const out = await new McpHttpClient({ url }).callTool("some_tool", { a: 1 });
    await close(server);
    assert.equal(seen.headers["content-type"], "application/json");
    assert.equal(seen.headers.accept, "application/json, text/event-stream");
    assert.deepEqual(seen.body.params, { name: "some_tool", arguments: { a: 1 } });
    assert.equal(seen.body.method, "tools/call");
    assert.deepEqual(out, { isError: false, structured: { mock: true, x: 1 }, text: '{"mock":true,"x":1}' });
  });
  it("reads an SSE answer", async () => {
    const { server, url } = await serve((req, res) => {
      let raw = "";
      req.on("data", (c) => (raw += c));
      req.on("end", () => {
        res.writeHead(200, { "content-type": "text/event-stream" });
        res.end(`event: message\ndata: ${JSON.stringify({ jsonrpc: "2.0", id: JSON.parse(raw).id, result })}\n\n`);
      });
    });
    const out = await new McpHttpClient({ url }).callTool("t", {});
    await close(server);
    assert.equal(out.structured.x, 1);
  });
  it("reports unreachable, timeout, HTTP and RPC errors clearly", async () => {
    await assert.rejects(new McpHttpClient({ url: `${await deadUrl()}/mcp` }).callTool("t", {}), (e) => e.kind === "unreachable");
    const slow = await serve(() => {});
    await assert.rejects(new McpHttpClient({ url: slow.url, timeoutMs: 150 }).callTool("t", {}), (e) => e.kind === "timeout");
    await close(slow.server);
    const bad = await serve((req, res) => { res.writeHead(500); res.end("no"); });
    await assert.rejects(new McpHttpClient({ url: bad.url }).callTool("t", {}), (e) => e.kind === "http" && e.status === 500);
    await close(bad.server);
    const rpc = await serve((req, res) => {
      let raw = "";
      req.on("data", (c) => (raw += c));
      req.on("end", () => { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ jsonrpc: "2.0", id: JSON.parse(raw).id, error: { code: -32602, message: "bad args" } })); });
    });
    await assert.rejects(new McpHttpClient({ url: rpc.url }).callTool("t", {}), (e) => e.kind === "rpc" && /bad args/.test(e.message));
    await close(rpc.server);
  });
});
