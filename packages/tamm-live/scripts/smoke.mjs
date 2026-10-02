#!/usr/bin/env node
// Smoke test for the Rasikh live TAMM demo. Node 22, zero dependencies.
//
//   node scripts/smoke.mjs [--record] [--repeat N] [--no-reset]
//
// What it does, in order:
//   1. checks Guard, the mock TAMM and the console are up
//   2. POST /api/reset
//   3. controls: talks to Guard directly (not through the console) and asserts two decisions,
//      so a console that simply printed "denied" would still be caught
//   4. runs each scenario through GET /api/run/:id, parses the SSE stream and asserts the exact outcomes
//   5. checks every trace step for raw values, tokens and full session ids (a tripwire, not a proof)
//   6. replays any recorded scenario and checks it matches and is flagged replay:true
//   7. POST /api/reset again, prints a PASS/FAIL table, exits 0 only if everything passed
//
// Rule ids are the real Guard ids (<label>.<destination>.<effect>): bank_statement.tamm.denied, health.tamm.insurance_only.
// Exit codes: 0 all passed, 1 an assertion failed, 2 a service is not reachable.
//
// TAMM is a MOCK, UAE PASS is SIMULATED, the policy matrix is a product default, and Guard enforcement is
// UNVERIFIED (a historical evaluation allowed 12 of 25 forbidden synthetic flows). A green smoke test means the
// demo path behaves as scripted. It does not prove the agent is safe.

const args = process.argv.slice(2);
const RECORD = args.includes("--record");
const NO_RESET = args.includes("--no-reset");
const repeatIdx = args.indexOf("--repeat");
const REPEAT = repeatIdx >= 0 ? Math.max(1, Number(args[repeatIdx + 1]) || 1) : 1;

const CONSOLE = (process.env.TAMM_LIVE_URL || "http://127.0.0.1:8791").replace(/\/+$/, "");
const GUARD = (process.env.RASIKH_GUARD_URL || "http://127.0.0.1:8787").replace(/\/+$/, "");
const TAMM = (() => {
  try {
    return new URL(process.env.TAMM_MCP_URL || "http://127.0.0.1:8790/mcp").origin;
  } catch {
    return "http://127.0.0.1:8790";
  }
})();

const RUN_TIMEOUT_MS = 60_000;
const SLOW_MS = 30_000;
const KINDS = new Set([
  "guard.session", "guard.observe", "tamm.login", "tamm.tool", "guard.check", "tamm.advance", "tamm.status", "note",
]);
const ACTORS = new Set(["agent", "guard", "tamm", "app"]);

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code, s) => (useColor ? `\u001b[${code}m${s}\u001b[0m` : s);
const green = (s) => paint("32", s);
const red = (s) => paint("31", s);
const dim = (s) => paint("2", s);
const bold = (s) => paint("1", s);

/** rows: {group, name, ok, detail} */
const rows = [];
function record(group, name, ok, detail = "") {
  rows.push({ group, name, ok: Boolean(ok), detail: String(detail ?? "") });
  return Boolean(ok);
}
function expectThat(group, name, cond, detail = "") {
  return record(group, name, cond, cond ? "" : detail);
}

async function http(method, url, { body, timeoutMs = 8000, headers = {} } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: ctl.signal,
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = undefined;
    }
    return { status: res.status, ok: res.ok, text, json };
  } finally {
    clearTimeout(timer);
  }
}

/** Reads a text/event-stream and returns every event as {event, data}. Ends on "done", "fail" or stream end. */
async function readSse(url, timeoutMs = RUN_TIMEOUT_MS) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  const events = [];
  let httpStatus = 0;
  let contentType = "";
  try {
    const res = await fetch(url, { headers: { accept: "text/event-stream" }, signal: ctl.signal });
    httpStatus = res.status;
    contentType = res.headers.get("content-type") || "";
    if (!res.ok || !res.body) {
      return { events, httpStatus, contentType, error: `HTTP ${res.status}` };
    }
    const decoder = new TextDecoder();
    let buffer = "";
    const flush = (block) => {
      let event = "message";
      const data = [];
      for (const rawLine of block.split("\n")) {
        const line = rawLine.replace(/\r$/, "");
        if (!line || line.startsWith(":")) continue;
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
      }
      if (!data.length && event === "message") return;
      const joined = data.join("\n");
      let parsed;
      try {
        parsed = JSON.parse(joined);
      } catch {
        parsed = { _unparsed: joined };
      }
      events.push({ event, data: parsed });
    };
    let finished = false;
    for await (const chunk of res.body) {
      buffer += decoder.decode(chunk, { stream: true });
      buffer = buffer.replace(/\r\n/g, "\n");
      let idx;
      while ((idx = buffer.indexOf("\n\n")) >= 0) {
        flush(buffer.slice(0, idx));
        buffer = buffer.slice(idx + 2);
      }
      if (events.some((e) => e.event === "done" || e.event === "fail")) {
        finished = true;
        break;
      }
    }
    if (!finished && buffer.trim()) flush(buffer);
    return { events, httpStatus, contentType };
  } catch (err) {
    return { events, httpStatus, contentType, error: err?.name === "AbortError" ? `timed out after ${timeoutMs / 1000} s` : String(err?.message || err) };
  } finally {
    clearTimeout(timer);
    ctl.abort();
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Leak tripwire: request and response of every step may hold only labels, refs, ids, service ids, decisions, statuses.
// ---------------------------------------------------------------------------------------------------------------
const FORBIDDEN_KEYS = /^(raw|value|values|content|contents|document_text|text_content|passport_number|id_number|iban|account_number|password|secret|token|access_token|authorization|api_key|cookie)$/i;
const LEAK_PATTERNS = [
  [/uap_sim_[0-9a-f]/i, "a UAE PASS session id (uap_sim_...)"],
  [/\bgs_[0-9a-f]{4,}/i, "a Guard session id longer than its 6-character mask"],
  [/\b784-?\d{4}-?\d{7}-?\d\b/, "an Emirates ID number"],
  [/\b[A-Z]{1,2}\d{7,9}\b/, "a passport-number-like value"],
  [/\bAE\d{2}\s?\d{3}\s?\d{16}\b/i, "an IBAN"],
  [/\d{10,}/, "a run of 10 or more digits"],
  [/bearer\s+[a-z0-9._-]{8,}/i, "a bearer token"],
];

function walkKeys(value, path, hits) {
  if (value && typeof value === "object") {
    for (const [key, v] of Object.entries(value)) {
      if (FORBIDDEN_KEYS.test(key)) hits.push(`key "${path}${key}"`);
      // A session id may appear under its own key only in masked form.
      if (/^(uaepass_session|guard_session_id|session_id)$/i.test(key) && typeof v === "string" && v !== "(hidden)" && v.length > 7) {
        hits.push(`key "${path}${key}" holds ${v.length} characters (mask to 6, or hide)`);
      }
      walkKeys(v, `${path}${key}.`, hits);
    }
  }
}

function leakFindings(step) {
  const hits = [];
  walkKeys({ request: step.request, response: step.response }, "", hits);
  const text = JSON.stringify({ request: step.request, response: step.response, title: step.title });
  for (const [re, what] of LEAK_PATTERNS) if (re.test(text)) hits.push(what);
  return hits;
}

function shapeFindings(step, prevN) {
  const bad = [];
  if (typeof step.n !== "number") bad.push("n is not a number");
  else if (prevN !== undefined && step.n <= prevN) bad.push(`n ${step.n} does not follow ${prevN}`);
  if (typeof step.atMs !== "number") bad.push("atMs is not a number");
  if (!KINDS.has(step.kind)) bad.push(`unknown kind ${JSON.stringify(step.kind)}`);
  if (typeof step.title !== "string" || !step.title) bad.push("no title");
  if (!ACTORS.has(step.actor)) bad.push(`unknown actor ${JSON.stringify(step.actor)}`);
  if (!step.request || typeof step.request !== "object") bad.push("request is not an object");
  if (!step.response || typeof step.response !== "object") bad.push("response is not an object");
  if (typeof step.ms !== "number") bad.push("ms is not a number");
  if (step.mock !== true) bad.push("mock is not true");
  if (step.kind === "guard.check" && !step.decision) bad.push("guard.check without a decision");
  return bad;
}

// ---------------------------------------------------------------------------------------------------------------
// Helpers over a list of steps
// ---------------------------------------------------------------------------------------------------------------
const flat = (o) => JSON.stringify(o ?? {});
const checks = (steps) => steps.filter((s) => s.kind === "guard.check");
const appIds = (steps) => [...new Set(steps.map((s) => s?.response?.application_id ?? s?.request?.application_id).filter(Boolean))];
const statuses = (steps) =>
  steps
    .filter((s) => s.kind === "tamm.tool" || s.kind === "tamm.advance" || s.kind === "tamm.status")
    .map((s) => s.status ?? s?.response?.status)
    .filter(Boolean);

function isSubsequence(want, got) {
  let i = 0;
  for (const g of got) if (g === want[i]) i += 1;
  return i === want.length;
}

// ---------------------------------------------------------------------------------------------------------------
// Scenario assertions
// ---------------------------------------------------------------------------------------------------------------
const SCENARIOS = {
  tawtheeq: { expect: "allowed", assert: assertTawtheeq },
  "bank-statement": { expect: "blocked", assert: assertBankStatement },
  "health-routing": { expect: "mixed", assert: assertHealthRouting },
};

function assertTawtheeq(g, steps) {
  const gc = checks(steps);
  expectThat(g, "Guard allowed the register_tenancy_tawtheeq call", gc.length >= 1 && gc.every((c) => c.decision.decision === "allow"), `decisions: ${gc.map((c) => c.decision.decision).join(", ") || "none"}`);
  const ids = appIds(steps);
  expectThat(g, "exactly one application was created", ids.length === 1, `application ids seen: ${ids.length}`);
  const st = statuses(steps);
  expectThat(g, "status went submitted, under_review, approved", isSubsequence(["submitted", "under_review", "approved"], st), `statuses: ${st.join(" > ") || "none"}`);
  expectThat(g, "last status is approved", st[st.length - 1] === "approved", `last: ${st[st.length - 1] ?? "none"}`);
  expectThat(g, "the tool call named the lease and the applicant by ref", steps.some((s) => s.kind === "tamm.tool" && flat(s.request).includes("lease_reem_2207") && flat(s.request).includes("hire_demo_001")), "no tamm.tool step with lease_reem_2207 and hire_demo_001");
}

const toolStep = (steps, svc) => steps.find((s) => s.kind === "tamm.tool" && flat(s.request).includes(svc));
const tagsOf = (c) => (Array.isArray(c?.request?.service_tags) ? c.request.service_tags : []);

function assertBankStatement(g, steps) {
  const gc = checks(steps);
  const denied = gc.find((c) => c.decision.decision === "deny");
  expectThat(g, "Guard denied the bank statement", Boolean(denied), `decisions: ${gc.map((c) => c.decision.decision).join(", ") || "none"}`);
  expectThat(g, "policy rule is bank_statement.tamm.denied", denied?.decision.policy_rule === "bank_statement.tamm.denied", `rule: ${denied?.decision.policy_rule ?? "none"}`);
  expectThat(g, "blocked label is bank_statement", (denied?.decision.blocked_labels ?? []).includes("bank_statement"), `blocked: ${JSON.stringify(denied?.decision.blocked_labels ?? null)}`);
  expectThat(g, "the check was for a residency visa call (service tag visa)", tagsOf(denied).includes("visa"), `service_tags: ${JSON.stringify(tagsOf(denied))}`);
  const tool = toolStep(steps, "svc_residency_visa");
  expectThat(g, "the TAMM tool call was start_application for svc_residency_visa with the bank statement label", Boolean(tool) && flat(tool.request).includes("start_application") && flat(tool.request).includes("bank_statement"), "no such tamm.tool step");
  expectThat(g, "no check was allowed", gc.every((c) => c.decision.decision !== "allow"), "an allow decision appeared");
  expectThat(g, "the TAMM tool result carries denied:true", tool?.response?.denied === true, `denied=${tool?.response?.denied}`);
  expectThat(g, "the tool result carries no application_id", Boolean(tool) && !tool.response?.application_id, `application_id=${tool?.response?.application_id}`);
  expectThat(g, "no application was created (no application_id anywhere)", appIds(steps).length === 0, `ids: ${appIds(steps).join(", ")}`);
  expectThat(g, "no status step shows a created application", statuses(steps).filter((s) => ["submitted", "under_review", "approved"].includes(s)).length === 0, `statuses: ${statuses(steps).join(" > ")}`);
}

function assertHealthRouting(g, steps) {
  const gc = checks(steps);
  const visaTool = toolStep(steps, "svc_residency_visa");
  const insTool = toolStep(steps, "svc_health_insurance");
  const visaCheck = gc.find((c) => tagsOf(c).includes("visa"));
  const insCheck = gc.find((c) => tagsOf(c).includes("insurance"));
  expectThat(g, "two tool calls ran, visa then insurance", Boolean(visaTool) && Boolean(insTool) && steps.indexOf(visaTool) < steps.indexOf(insTool), `visa tool: ${Boolean(visaTool)}, insurance tool: ${Boolean(insTool)}`);
  expectThat(g, "health refused for the residency visa", visaCheck?.decision.decision === "deny", `decision: ${visaCheck?.decision.decision ?? "none"}`);
  expectThat(g, "policy rule is health.tamm.insurance_only", visaCheck?.decision.policy_rule === "health.tamm.insurance_only", `rule: ${visaCheck?.decision.policy_rule ?? "none"}`);
  expectThat(g, "blocked label is health", (visaCheck?.decision.blocked_labels ?? []).includes("health"), `blocked: ${JSON.stringify(visaCheck?.decision.blocked_labels ?? null)}`);
  expectThat(g, "health accepted for health insurance", insCheck?.decision.decision === "allow", `decision: ${insCheck?.decision.decision ?? "none"}`);
  expectThat(g, "the visa tool result carries denied:true and no application_id", visaTool?.response?.denied === true && !visaTool?.response?.application_id, `denied=${visaTool?.response?.denied} application_id=${visaTool?.response?.application_id}`);
  expectThat(g, "the insurance tool result carries an application_id", Boolean(insTool?.response?.application_id), "no application_id on the insurance call");
  const ids = appIds(steps);
  expectThat(g, "exactly one application was created (insurance only)", ids.length === 1 && ids[0] === insTool?.response?.application_id, `ids: ${ids.join(", ") || "none"}`);
}

// ---------------------------------------------------------------------------------------------------------------
// Steps of the smoke test
// ---------------------------------------------------------------------------------------------------------------
async function checkServices() {
  const g = "services";
  let fatal = false;
  const probes = [
    ["Rasikh Guard", `${GUARD}/health`, (r) => r.ok && r.json?.status === "ok", "start it with scripts/start.ps1 or scripts/start.sh"],
    ["TAMM mock", `${TAMM}/health`, (r) => r.ok && r.json?.status === "ok" && r.json?.mock === true, "start it with scripts/start.ps1 or scripts/start.sh"],
    ["Console", `${CONSOLE}/api/status`, (r) => r.ok && r.json && r.json.guard?.ok === true && r.json.tamm?.ok === true, "the console is not running, or it cannot reach Guard or TAMM"],
  ];
  for (const [name, url, ok, hint] of probes) {
    try {
      const r = await http("GET", url, { timeoutMs: 4000 });
      const pass = ok(r);
      record(g, `${name} is up`, pass, pass ? "" : `${url} answered ${r.status}. ${hint}`);
      if (!pass) fatal = true;
      if (name === "Console" && r.json) {
        expectThat(g, "console reports the TAMM side as a mock", r.json.tamm?.mock === true, "status.tamm.mock is not true");
        if (r.json.tamm?.demoMode === false) record(g, "TAMM mock runs in demo mode", false, "demoMode false: /dev/advance and /dev/reset will not work. Restart with RASIKH_DEMO_MODE=1");
        services.replays = Array.isArray(r.json.replays) ? r.json.replays : [];
      }
    } catch (err) {
      record(g, `${name} is up`, false, `${url} did not answer (${err?.message || err}). ${hint}`);
      fatal = true;
    }
  }
  return !fatal;
}
const services = { replays: [] };

async function doReset(label) {
  const g = "reset";
  try {
    const r = await http("POST", `${CONSOLE}/api/reset`, { body: {}, timeoutMs: 10_000 });
    const pass = r.ok && r.json?.ok === true && r.json?.tamm === true && r.json?.guard === true;
    record(g, label, pass, pass ? "" : `status ${r.status} ${r.text.slice(0, 120)}`);
    return pass;
  } catch (err) {
    record(g, label, false, String(err?.message || err));
    return false;
  }
}

async function guardControls() {
  const g = "guard direct";
  try {
    const sess = await http("POST", `${GUARD}/session`, { body: { case_id: "hire_demo_001", case_type: "hire" } });
    const sid = sess.json?.session_id;
    if (!sid) return record(g, "open a Guard session", false, `status ${sess.status}`);
    await http("POST", `${GUARD}/observe`, {
      body: { session_id: sid, source: "newcomer", payload_refs: [{ ref: "doc_bank_statement_hire_demo_001", labels: ["bank_statement"] }] },
    });
    const deny = await http("POST", `${GUARD}/check`, {
      body: {
        session_id: sid, tool: "start_application", destination: "tamm", data_labels: ["bank_statement"],
        payload_refs: [{ ref: "doc_bank_statement_hire_demo_001", labels: ["bank_statement"] }],
        service_tags: ["residency", "visa"],
      },
    });
    expectThat(g, "bank_statement to tamm is denied", deny.json?.decision === "deny" && deny.json?.policy_rule === "bank_statement.tamm.denied", `got ${deny.json?.decision} ${deny.json?.policy_rule}`);

    const sess2 = await http("POST", `${GUARD}/session`, { body: { case_id: "hire_demo_001", case_type: "hire" } });
    const sid2 = sess2.json?.session_id;
    await http("POST", `${GUARD}/observe`, {
      body: { session_id: sid2, source: "newcomer", payload_refs: [{ ref: "doc_health_hire_demo_001", labels: ["health"] }] },
    });
    const visa = await http("POST", `${GUARD}/check`, {
      body: {
        session_id: sid2, tool: "start_application", destination: "tamm", data_labels: ["health"],
        payload_refs: [{ ref: "doc_health_hire_demo_001", labels: ["health"] }], service_tags: ["residency", "visa"],
      },
    });
    expectThat(g, "health to tamm for a visa is denied", visa.json?.decision === "deny" && visa.json?.policy_rule === "health.tamm.insurance_only", `got ${visa.json?.decision} ${visa.json?.policy_rule}`);
    const ins = await http("POST", `${GUARD}/check`, {
      body: {
        session_id: sid2, tool: "start_application", destination: "tamm", data_labels: ["health"],
        payload_refs: [{ ref: "doc_health_hire_demo_001", labels: ["health"] }], service_tags: ["health", "insurance"],
      },
    });
    expectThat(g, "health to tamm for insurance is allowed", ins.json?.decision === "allow", `got ${ins.json?.decision} ${ins.json?.policy_rule ?? ""}`);
  } catch (err) {
    record(g, "talk to Guard directly", false, String(err?.message || err));
  }
}

/** Direct MCP call: proves the mock TAMM backend is not reached when Guard denies, independent of the console. */
async function mcpCall(name, argumentsObj) {
  const res = await http("POST", `${TAMM}/mcp`, {
    body: { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: argumentsObj } },
    headers: { accept: "application/json, text/event-stream" },
    timeoutMs: 10_000,
  });
  const dataLine = res.text.split("\n").find((l) => l.startsWith("data:"));
  const payload = dataLine ? JSON.parse(dataLine.slice(5)) : res.json;
  const content = payload?.result?.content?.[0]?.text;
  return content ? JSON.parse(content) : (payload?.result?.structuredContent ?? payload);
}

async function tammDirectControl() {
  const g = "tamm direct";
  try {
    const login = await http("POST", `${TAMM}/dev/uaepass/login`, { body: { subject_ref: "hire_demo_001", audience: "individual" } });
    const uap = login.json?.uaepass_session;
    const sess = await http("POST", `${GUARD}/session`, { body: { case_id: "hire_demo_001", case_type: "hire" } });
    const sid = sess.json?.session_id;
    if (!uap || !sid) return record(g, "log in (simulated UAE PASS) and open a Guard session", false, "no session ids");
    await http("POST", `${GUARD}/observe`, {
      body: { session_id: sid, source: "newcomer", payload_refs: [{ ref: "doc_bank_statement_hire_demo_001", labels: ["bank_statement"] }] },
    });
    const out = await mcpCall("start_application", {
      service_id: "svc_residency_visa",
      applicant_ref: "hire_demo_001",
      documents: [{ ref: "doc_bank_statement_hire_demo_001", labels: ["bank_statement"] }],
      uaepass_session: uap,
      guard_session_id: sid,
    });
    expectThat(g, "MCP start_application with a bank statement returns denied:true", out?.denied === true && out?.guard?.policy_rule === "bank_statement.tamm.denied", `got ${JSON.stringify(out).slice(0, 160)}`);
    expectThat(g, "that denial carries no application_id and mock:true", !out?.application_id && out?.mock === true, `application_id=${out?.application_id} mock=${out?.mock}`);
  } catch (err) {
    record(g, "call the TAMM MCP directly", false, String(err?.message || err));
  }
}

async function runScenario(id, spec, pass) {
  const g = `${id}${REPEAT > 1 ? ` #${pass}` : ""}`;
  const url = `${CONSOLE}/api/run/${encodeURIComponent(id)}${RECORD && pass === REPEAT ? "?record=1" : ""}`;
  const t0 = Date.now();
  const { events, error, httpStatus, contentType } = await readSse(url);
  const wall = Date.now() - t0;
  if (error && !events.length) {
    record(g, "run streamed", false, error);
    return null;
  }
  expectThat(g, "stream is text/event-stream", /text\/event-stream/.test(contentType), `content-type ${contentType || "none"}, status ${httpStatus}`);
  const fail = events.find((e) => e.event === "fail");
  if (fail) {
    record(g, "run finished without a fail event", false, `${fail.data?.message ?? ""} ${fail.data?.hint ? `(${fail.data.hint})` : ""}`);
    return null;
  }
  const steps = events.filter((e) => e.event === "step").map((e) => e.data);
  const done = events.find((e) => e.event === "done")?.data;
  expectThat(g, "run ended with a done event", Boolean(done), error || "no done event");
  expectThat(g, `run produced steps`, steps.length >= 4, `${steps.length} steps`);
  expectThat(g, `outcome is ${spec.expect}`, done?.outcome === spec.expect, `outcome: ${done?.outcome ?? "none"}`);
  expectThat(g, `finished in under ${SLOW_MS / 1000} s`, wall < SLOW_MS, `${wall} ms`);

  let prevN;
  const shapeBad = [];
  const leaks = [];
  for (const s of steps) {
    for (const b of shapeFindings(s, prevN)) shapeBad.push(`step ${s.n}: ${b}`);
    prevN = s.n;
    for (const h of leakFindings(s)) leaks.push(`step ${s.n}: ${h}`);
  }
  expectThat(g, "every step has the TraceStep shape and mock:true", shapeBad.length === 0, shapeBad.slice(0, 3).join("; "));
  expectThat(g, "no raw value, token or full session id in any step", leaks.length === 0, leaks.slice(0, 3).join("; "));
  expectThat(g, "no live step is flagged replay", steps.every((s) => !s.replay), "a live step carries replay:true");

  spec.assert(g, steps);
  return { steps, done, wall };
}

async function checkReplays(live) {
  const g = "replay";
  const ids = (services.replays || []).filter((id) => SCENARIOS[id]);
  if (!ids.length) {
    record(g, "recorded replays", true, "none recorded yet (run with --record to create them)");
    rows[rows.length - 1].note = "skipped";
    return;
  }
  for (const id of ids) {
    const { events, error } = await readSse(`${CONSOLE}/api/replay/${encodeURIComponent(id)}`, 20_000);
    const steps = events.filter((e) => e.event === "step").map((e) => e.data);
    const done = events.find((e) => e.event === "done")?.data;
    const grp = `replay ${id}`;
    expectThat(grp, "replay streams steps and a done event", steps.length > 0 && Boolean(done), error || `${steps.length} steps`);
    expectThat(grp, "every step is flagged replay:true", steps.length > 0 && steps.every((s) => s.replay === true), "a step is not flagged replay:true");
    expectThat(grp, `outcome is ${SCENARIOS[id].expect}`, done?.outcome === SCENARIOS[id].expect, `outcome: ${done?.outcome}`);
    const leaks = steps.flatMap((s) => leakFindings(s).map((h) => `step ${s.n}: ${h}`));
    expectThat(grp, "no raw value, token or full session id", leaks.length === 0, leaks.slice(0, 3).join("; "));
    if (live[id]) expectThat(grp, "same number of steps as the live run", live[id].steps.length === steps.length || RECORD, `live ${live[id].steps.length}, replay ${steps.length}`);
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------------------------------------------
function printTable() {
  const width = Math.min(process.stdout.columns || 110, 120);
  console.log("");
  console.log(bold("Rasikh live TAMM demo: smoke test") + dim("   (mock TAMM, simulated UAE PASS, end-to-end safety not proven)"));
  console.log("");
  let lastGroup = "";
  for (const r of rows) {
    if (r.group !== lastGroup) {
      console.log(bold(r.group));
      lastGroup = r.group;
    }
    const tag = r.note === "skipped" ? dim("SKIP") : r.ok ? green("PASS") : red("FAIL");
    const detail = r.detail ? dim(`  ${r.detail}`.slice(0, Math.max(20, width - r.name.length - 12))) : "";
    console.log(`  ${tag}  ${r.name}${detail}`);
  }
  const failed = rows.filter((r) => !r.ok);
  console.log("");
  if (failed.length) {
    console.log(red(bold(`FAILED: ${failed.length} of ${rows.length} checks`)));
    for (const f of failed) console.log(red(`  [${f.group}] ${f.name}: ${f.detail}`));
  } else {
    console.log(green(bold(`PASSED: ${rows.length} of ${rows.length} checks`)));
    console.log(dim("This shows the demo path behaves as scripted against the mock TAMM. It does not prove the agent is safe."));
  }
  console.log("");
}

async function main() {
  const up = await checkServices();
  if (!up) {
    printTable();
    console.log(red("A service is not reachable, so the scenarios were not run."));
    process.exit(2);
  }
  let live = {};
  try {
    const sc = await http("GET", `${CONSOLE}/api/scenarios`);
    const list = Array.isArray(sc.json) ? sc.json : [];
    for (const id of Object.keys(SCENARIOS)) {
      const found = list.find((s) => s.id === id);
      expectThat("scenarios", `${id} is listed with expect=${SCENARIOS[id].expect}`, found?.expect === SCENARIOS[id].expect, found ? `expect=${found.expect}` : "not listed");
    }
    for (let pass = 1; pass <= REPEAT; pass += 1) {
      if (pass === 1) {
        await guardControls();
        await tammDirectControl();
      }
      if (!NO_RESET) await doReset(REPEAT > 1 ? `reset before pass ${pass}` : "reset before the scenarios");
      for (const [id, spec] of Object.entries(SCENARIOS)) {
        const out = await runScenario(id, spec, pass);
        if (out) live[id] = out;
      }
    }
    if (!NO_RESET) await doReset("reset after the scenarios (before replay checks)");
    if (RECORD) {
      const st = await http("GET", `${CONSOLE}/api/status`);
      services.replays = Array.isArray(st.json?.replays) ? st.json.replays : services.replays;
    }
    await checkReplays(live);
  } catch (err) {
    record("smoke", "ran to the end", false, String(err?.stack || err));
  } finally {
    if (!NO_RESET) await doReset("final reset (clean state for the demo)");
  }
  printTable();
  process.exit(rows.every((r) => r.ok) ? 0 : 1);
}

main();
