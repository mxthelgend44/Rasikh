/** In-process fake Guard and fake TAMM HTTP servers (random ports) plus an SSE reader. No real services needed. */
import http from "node:http";

export const SECRET_SENTINEL = "SENTINEL-RAW-DOCUMENT-VALUE-9f3a";

function listen(handler) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let raw = "";
      req.on("data", (c) => (raw += c));
      req.on("end", () => {
        let body = null;
        try { body = raw ? JSON.parse(raw) : null; } catch { body = null; }
        handler(req, res, body);
      });
    });
    server.listen(0, "127.0.0.1", () => resolve({ server, url: `http://127.0.0.1:${server.address().port}` }));
  });
}
const send = (res, status, obj) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };
export const close = (server) => new Promise((r) => { server.closeAllConnections?.(); server.close(() => r()); });

/** Mini policy: bank_statement to TAMM denied, health to TAMM only for insurance, everything else allowed. */
export async function startFakeGuard({ failSession = false } = {}) {
  const sessions = new Map();
  const state = { requests: [], resets: 0, failSession };
  const { server, url } = await listen((req, res, body) => {
    const route = `${req.method} ${req.url.split("?")[0]}`;
    state.requests.push(route);
    if (route === "GET /health") return send(res, 200, { status: "ok" });
    if (route === "POST /dev/reset") { state.resets++; sessions.clear(); return send(res, 200, { reset: true }); }
    if (route === "POST /session") {
      if (state.failSession) return send(res, 500, { error: { code: "internal", message: "boom" } });
      const id = `gs_${Math.random().toString(16).slice(2, 10)}abcdef`;
      sessions.set(id, []);
      return send(res, 200, { session_id: id });
    }
    if (route === "POST /observe") return send(res, 200, { recorded: true });
    if (route === "GET /log") {
      const id = new URL(req.url, "http://x").searchParams.get("session_id");
      return send(res, 200, { entries: [...(sessions.get(id) ?? [])].reverse() });
    }
    if (route === "POST /check") {
      const labels = body.data_labels ?? [];
      let decision = "allow", rule = `${labels[0] ?? "none"}.tamm.allowed`, reason = "Allowed.";
      if (labels.includes("bank_statement")) { decision = "deny"; rule = "bank_statement.tamm.denied"; reason = "Bank statements cannot go to TAMM."; }
      else if (labels.includes("health") && !(body.tool === "start_application" && (body.service_tags ?? []).includes("insurance"))) {
        decision = "deny"; rule = "health.tamm.insurance_only"; reason = "Health details can only be shared for insurance services.";
      }
      const entry = { check_id: `chk_${sessions.get(body.session_id)?.length ?? 0}`, at: "now", tool: body.tool, destination: "tamm", decision, reason, policy_rule: rule };
      sessions.get(body.session_id)?.push(entry);
      return send(res, 200, { check_id: entry.check_id, decision, reason, policy_rule: rule, blocked_labels: decision === "allow" ? [] : labels });
    }
    send(res, 404, { error: { code: "invalid_request", message: "no" } });
  });
  state.server = server; state.url = url;
  return state;
}

const TAGS = { svc_residency_visa: ["residency", "visa"], svc_health_insurance: ["health", "insurance"], svc_tawtheeq_register: ["housing"] };

/** Fake TAMM: dev endpoints plus a JSON-RPC /mcp that asks the fake Guard before it creates anything. */
export async function startFakeTamm({ guardUrl, sse = true, demo = true, echoPoison = false } = {}) {
  const apps = new Map();
  const state = { toolCalls: [], created: 0, resets: 0 };
  const rpc = (res, id, result) => {
    const payload = JSON.stringify({ jsonrpc: "2.0", id, result });
    if (sse) { res.writeHead(200, { "content-type": "text/event-stream" }); res.end(`event: message\ndata: ${payload}\n\n`); }
    else { res.writeHead(200, { "content-type": "application/json" }); res.end(payload); }
  };
  const toolResult = (body, isError = false) => ({ content: [{ type: "text", text: JSON.stringify(body) }], structuredContent: body, ...(isError ? { isError: true } : {}) });
  const { server, url } = await listen(async (req, res, body) => {
    const route = `${req.method} ${req.url}`;
    if (route === "GET /health") return send(res, 200, { status: "ok", mock: true });
    if (route === "POST /dev/uaepass/login") return send(res, 200, { uaepass_session: `uap_sim_${Math.random().toString(16).slice(2, 10)}`, simulated: true });
    if (route === "POST /dev/reset") { state.resets++; apps.clear(); return send(res, 200, { reset: true }); }
    if (route === "POST /dev/advance") {
      if (!demo) return send(res, 404, { error: { code: "demo_mode_only", message: "off" } });
      const a = apps.get(body.application_id);
      if (!a) return send(res, 404, { error: { code: "unknown_application", message: "none" } });
      a.status = a.status === "submitted" ? "under_review" : "approved"; a.history.push({ status: a.status });
      return send(res, 200, { application_id: a.id, status: a.status, history: a.history });
    }
    if (route === "POST /mcp") {
      const { id, params } = body;
      const { name, arguments: args } = params;
      state.toolCalls.push(name);
      if (name === "get_application_status") {
        const a = apps.get(args.application_id);
        return rpc(res, id, toolResult({ mock: true, application_id: a.id, status: a.status, history: a.history, needs_info: null, ...(echoPoison ? { raw_value: SECRET_SENTINEL, uaepass_session: args.uaepass_session, note: `echo ${args.uaepass_session}` } : {}) }));
      }
      const serviceId = name === "register_tenancy_tawtheeq" ? "svc_tawtheeq_register" : args.service_id;
      const labels = name === "register_tenancy_tawtheeq" ? ["passport", "emirates_id", "address"] : (args.documents ?? []).flatMap((d) => d.labels);
      let verdict;
      try {
        const r = await fetch(`${guardUrl}/check`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ session_id: args.guard_session_id, tool: name, destination: "tamm", data_labels: labels, payload_refs: [], service_tags: TAGS[serviceId] }) });
        verdict = await r.json();
      } catch {
        return rpc(res, id, toolResult({ mock: true, error: { code: "guard_unavailable", message: "The privacy check could not be completed, so nothing was sent." } }, true));
      }
      if (verdict.decision !== "allow") return rpc(res, id, toolResult({ mock: true, denied: true, guard: { decision: verdict.decision, reason: verdict.reason, policy_rule: verdict.policy_rule } }));
      state.created++;
      const a = { id: `app_${state.created}`, status: "submitted", history: [{ status: "submitted" }] };
      apps.set(a.id, a);
      return rpc(res, id, toolResult({ mock: true, application_id: a.id, status: "submitted", ...(echoPoison ? { raw_value: SECRET_SENTINEL, uaepass_session: args.uaepass_session } : {}) }));
    }
    send(res, 404, { error: { code: "invalid_request", message: "no" } });
  });
  state.server = server; state.url = url; state.mcpUrl = `${url}/mcp`;
  return state;
}

/** Reads an SSE response fully. Returns { status, headers, raw, events: [{event, data}] }. */
export async function readSse(url, init = {}) {
  const res = await fetch(url, init);
  const raw = await res.text();
  const events = [];
  for (const block of raw.split("\n\n")) {
    const ev = /^event: (.+)$/m.exec(block);
    const data = /^data: (.+)$/m.exec(block);
    if (ev && data) events.push({ event: ev[1], data: JSON.parse(data[1]) });
  }
  return { status: res.status, headers: res.headers, raw, events };
}

/** A port nothing is listening on. */
export async function deadUrl() {
  const { server, url } = await listen(() => {});
  await close(server);
  return url;
}
