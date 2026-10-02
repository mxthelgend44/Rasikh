/**
 * Minimal stateless Streamable HTTP MCP client over fetch.
 *
 * Each call is one POST of a JSON-RPC message. The server may answer with a plain JSON body or
 * with a text/event-stream body (the official TypeScript SDK answers with SSE); both are parsed.
 * No session, no initialize handshake: the tamm-mcp server is stateless.
 */

export class McpError extends Error {
  /** kind: "unreachable" | "timeout" | "http" | "bad_body" | "rpc" */
  constructor(kind, message, extra = {}) {
    super(message);
    this.name = "McpError";
    this.kind = kind;
    Object.assign(this, extra);
  }
}

/** Parses an SSE body into the JSON messages carried by its `data:` fields. */
export function parseSse(text) {
  const messages = [];
  for (const block of String(text).split(/\r?\n\r?\n/)) {
    const data = [];
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
    }
    if (data.length === 0) continue;
    try {
      messages.push(JSON.parse(data.join("\n")));
    } catch {
      /* a non-JSON data field is not a JSON-RPC message: ignore it */
    }
  }
  return messages;
}

/** Finds the JSON-RPC reply for `id` in a JSON or SSE response body. */
export function parseMcpBody(contentType, text, id) {
  const isSse = String(contentType || "").toLowerCase().includes("text/event-stream");
  let messages;
  if (isSse) {
    messages = parseSse(text);
  } else {
    try {
      const parsed = JSON.parse(text);
      messages = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      throw new McpError("bad_body", "The TAMM MCP answered with something that is not JSON.");
    }
  }
  const reply = messages.find((m) => m && typeof m === "object" && m.id === id && ("result" in m || "error" in m));
  if (!reply) throw new McpError("bad_body", "The TAMM MCP answer did not contain a reply to the request.");
  return reply;
}

export class McpHttpClient {
  constructor({ url, timeoutMs = 8000, fetchImpl = fetch } = {}) {
    if (!url) throw new Error("McpHttpClient needs a url");
    this.url = url;
    this.timeoutMs = timeoutMs;
    this.fetch = fetchImpl;
    this.nextId = 1;
  }

  /** Sends one JSON-RPC request and returns its `result`. */
  async request(method, params) {
    const id = this.nextId++;
    let response;
    let text;
    try {
      response = await this.fetch(this.url, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
        body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      text = await response.text();
    } catch (error) {
      const timedOut = error && (error.name === "TimeoutError" || error.name === "AbortError");
      throw new McpError(
        timedOut ? "timeout" : "unreachable",
        timedOut ? `The TAMM MCP did not answer within ${this.timeoutMs / 1000} s.` : "The TAMM MCP could not be reached.",
      );
    }
    if (!response.ok) {
      throw new McpError("http", `The TAMM MCP answered HTTP ${response.status}.`, { status: response.status });
    }
    const reply = parseMcpBody(response.headers.get("content-type"), text, id);
    if (reply.error) {
      throw new McpError("rpc", `The TAMM MCP refused the request: ${String(reply.error.message || "unknown error")}`, {
        code: reply.error.code,
      });
    }
    return reply.result;
  }

  /** Calls one tool. Returns { isError, structured, text }; `structured` is the parsed tool body or null. */
  async callTool(name, args) {
    const result = await this.request("tools/call", { name, arguments: args });
    const text = Array.isArray(result?.content) ? result.content.find((c) => c.type === "text")?.text ?? "" : "";
    let structured = result?.structuredContent ?? null;
    if (!structured && text) {
      try {
        structured = JSON.parse(text);
      } catch {
        structured = null;
      }
    }
    return { isError: result?.isError === true, structured, text };
  }
}
