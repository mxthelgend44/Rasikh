/**
 * Client for the Rasikh Guard sidecar (INTEGRATION.md 3.3) and for the TAMM mock's HTTP helpers.
 * Both fail with a typed error; the runner turns those into plain-language "fail" events.
 */

export class ServiceError extends Error {
  /** kind: "unreachable" | "timeout" | "http" | "bad_body" */
  constructor(service, kind, message, extra = {}) {
    super(message);
    this.name = "ServiceError";
    this.service = service;
    this.kind = kind;
    Object.assign(this, extra);
  }
}

async function call(service, fetchImpl, timeoutMs, url, method, body) {
  let response;
  let text;
  try {
    response = await fetchImpl(url, {
      method,
      headers: body === undefined ? {} : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    text = await response.text();
  } catch (error) {
    const timedOut = error && (error.name === "TimeoutError" || error.name === "AbortError");
    throw new ServiceError(service, timedOut ? "timeout" : "unreachable", `${service} ${timedOut ? "timed out" : "could not be reached"}`);
  }
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!response.ok) {
    throw new ServiceError(service, "http", `${service} answered HTTP ${response.status}`, {
      status: response.status,
      code: json?.error?.code,
    });
  }
  if (json === null) throw new ServiceError(service, "bad_body", `${service} returned a body that is not JSON`);
  return json;
}

export class GuardClient {
  constructor({ url = "http://127.0.0.1:8787", timeoutMs = 3000, fetchImpl = fetch } = {}) {
    this.url = url.replace(/\/+$/, "");
    this.timeoutMs = timeoutMs;
    this.fetch = fetchImpl;
  }
  #call(method, path, body, timeoutMs = this.timeoutMs) {
    return call("Guard", this.fetch, timeoutMs, `${this.url}${path}`, method, body);
  }
  health() {
    return this.#call("GET", "/health", undefined, Math.min(this.timeoutMs, 1500));
  }
  openSession(caseId, caseType) {
    return this.#call("POST", "/session", { case_id: caseId, case_type: caseType });
  }
  observe(sessionId, source, payloadRefs) {
    return this.#call("POST", "/observe", { session_id: sessionId, source, payload_refs: payloadRefs });
  }
  /** Fails closed: any error is thrown, so callers treat the action as denied. */
  check(request) {
    return this.#call("POST", "/check", request);
  }
  consent(request) {
    return this.#call("POST", "/consent", request);
  }
  log(sessionId) {
    return this.#call("GET", `/log?session_id=${encodeURIComponent(sessionId)}`);
  }
  reset() {
    return this.#call("POST", "/dev/reset", {});
  }
}

export class TammClient {
  constructor({ mcpUrl = "http://127.0.0.1:8790/mcp", timeoutMs = 4000, fetchImpl = fetch, mcp } = {}) {
    this.mcpUrl = mcpUrl;
    this.base = new URL(mcpUrl).origin;
    this.timeoutMs = timeoutMs;
    this.fetch = fetchImpl;
    this.mcp = mcp;
  }
  #call(method, path, body, timeoutMs = this.timeoutMs) {
    return call("TAMM", this.fetch, timeoutMs, `${this.base}${path}`, method, body);
  }
  health() {
    return this.#call("GET", "/health", undefined, Math.min(this.timeoutMs, 1500));
  }
  login(subjectRef, audience) {
    return this.#call("POST", "/dev/uaepass/login", { subject_ref: subjectRef, audience });
  }
  advance(applicationId) {
    return this.#call("POST", "/dev/advance", { application_id: applicationId });
  }
  reset() {
    return this.#call("POST", "/dev/reset", {});
  }
  /** Harmless probe: demo mode answers unknown_application, normal mode answers demo_mode_only. */
  async probeDemoMode() {
    try {
      await this.advance("app_probe_none");
      return true;
    } catch (error) {
      if (error instanceof ServiceError && error.kind === "http") return error.code === "unknown_application";
      return undefined;
    }
  }
  callTool(name, args) {
    return this.mcp.callTool(name, args);
  }
}
