/**
 * Console server for the TAMM MCP (mock) + Rasikh Guard live demo.
 * Node standard library only. Binds 127.0.0.1. TAMM is a MOCK, UAE PASS is SIMULATED, Guard
 * enforcement is UNVERIFIED (a historical evaluation allowed 12 of 25 forbidden synthetic flows).
 */
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { GuardClient, TammClient } from "./guard-client.mjs";
import { McpHttpClient } from "./mcp-client.mjs";
import { listReplays, loadReplay, saveReplay } from "./replay.mjs";
import { DEFAULT_HINTS, runScenario } from "./runner.mjs";
import { findScenario, scenarioList } from "./scenarios.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PKG = path.resolve(HERE, "..");

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon",
  ".woff2": "font/woff2", ".woff": "font/woff", ".txt": "text/plain; charset=utf-8", ".map": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};
const ALLOWED_HOSTNAMES = new Set(["127.0.0.1", "localhost", "[::1]"]);

const sleep = (ms, signal) =>
  new Promise((resolve) => {
    if (!ms || ms <= 0 || signal?.aborted) return resolve();
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => (clearTimeout(t), resolve()), { once: true });
  });

/** Resolves a URL path under `root`, or null for anything that could escape it. */
export function safeResolve(root, rawPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return null;
  }
  if (decoded.includes("\0") || decoded.includes("\\")) return null;
  const segments = decoded.split("/").filter((s) => s !== "");
  if (segments.some((s) => s === ".." || s.startsWith("."))) return null;
  const full = path.resolve(root, ...segments);
  return full === root || full.startsWith(root + path.sep) ? full : null;
}

export function createConsoleApp(options = {}) {
  const config = {
    guardUrl: options.guardUrl ?? process.env.RASIKH_GUARD_URL ?? "http://127.0.0.1:8787",
    tammMcpUrl: options.tammMcpUrl ?? process.env.TAMM_MCP_URL ?? "http://127.0.0.1:8790/mcp",
    publicDir: path.resolve(options.publicDir ?? path.join(PKG, "public")),
    replayDir: path.resolve(options.replayDir ?? process.env.RASIKH_REPLAY_DIR ?? path.join(PKG, "replay")),
    paceMs: options.paceMs ?? 0,
    heartbeatMs: options.heartbeatMs ?? 10000,
    hints: options.hints ?? DEFAULT_HINTS,
  };
  const guard = new GuardClient({ url: config.guardUrl, timeoutMs: options.guardTimeoutMs ?? 3000 });
  const tamm = new TammClient({
    mcpUrl: config.tammMcpUrl,
    timeoutMs: options.tammTimeoutMs ?? 4000,
    mcp: new McpHttpClient({ url: config.tammMcpUrl, timeoutMs: options.mcpTimeoutMs ?? 8000 }),
  });

  let chain = Promise.resolve();
  const enqueue = (fn) => {
    const p = chain.then(fn, fn);
    chain = p.catch(() => {});
    return p;
  };

  const json = (res, status, body) => {
    const text = JSON.stringify(body);
    res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "content-length": Buffer.byteLength(text) });
    res.end(text);
  };
  const errorBody = (code, message) => ({ error: { code, message } });

  function openSse(req, res) {
    req.socket.setNoDelay(true);
    res.writeHead(200, {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    });
    res.flushHeaders();
    // A long retry stops EventSource from silently re-running a scenario after the stream closes.
    res.write("retry: 3600000\n\n: connected\n\n");
    const timer = setInterval(() => {
      if (!res.writableEnded && !res.destroyed) res.write(": keep-alive\n\n");
    }, config.heartbeatMs);
    timer.unref?.();
    const ac = new AbortController();
    res.on("close", () => {
      clearInterval(timer);
      ac.abort();
    });
    return { signal: ac.signal, stop: () => clearInterval(timer) };
  }
  const send = (res, event, data) => {
    if (res.writableEnded || res.destroyed) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };
  const endSse = (res, sse) => {
    sse.stop();
    if (!res.writableEnded) res.end();
  };

  async function status() {
    const [g, t, replays] = await Promise.all([
      guard.health().then(() => ({ ok: true, url: config.guardUrl }), (e) => ({ ok: false, url: config.guardUrl, detail: `${e.message}. Start it: ${config.hints.guard}` })),
      tamm.health().then(
        async () => ({ ok: true, url: config.tammMcpUrl, mock: true, ...(await tamm.probeDemoMode().then((d) => (d === undefined ? {} : { demoMode: d }))) }),
        (e) => ({ ok: false, url: config.tammMcpUrl, mock: true, detail: `${e.message}. Start it: ${config.hints.tamm}` }),
      ),
      listReplays(config.replayDir),
    ]);
    return { guard: g, tamm: t, replays };
  }

  async function handleRun(req, res, id, query) {
    const sse = openSse(req, res);
    const scenario = findScenario(id);
    if (!scenario) {
      send(res, "fail", { message: `There is no scenario called "${id.slice(0, 40)}".`, hint: `Choose one of: ${scenarioList().map((s) => s.id).join(", ")}.` });
      return endSse(res, sse);
    }
    const record = query.get("record") === "1";
    const pace = Math.min(3000, Math.max(0, Number(query.get("pace") ?? config.paceMs) || 0));
    await enqueue(async () => {
      if (sse.signal.aborted) return;
      const steps = [];
      let final = null;
      await runScenario(scenario, { guard, tamm, hints: config.hints, paceMs: pace, signal: sse.signal }, (evt) => {
        if (evt.event === "step") steps.push(evt.data);
        else final = evt;
        send(res, evt.event, evt.data);
      });
      if (record && final?.event === "done" && final.data.outcome === scenario.expect) {
        try {
          await saveReplay(config.replayDir, scenario.id, steps, final.data);
        } catch (error) {
          console.error("[tamm-live] could not save the replay", error);
        }
      } else if (record) {
        console.error(`[tamm-live] not recording ${scenario.id}: the run did not end as expected (${final?.event}/${final?.data?.outcome})`);
      }
    });
    endSse(res, sse);
  }

  async function handleReplay(req, res, id, query) {
    const sse = openSse(req, res);
    const record = await loadReplay(config.replayDir, id);
    if (!record) {
      send(res, "fail", {
        message: `There is no recorded run for "${id.slice(0, 40)}" yet.`,
        hint: "Run the scenario live once with ?record=1 while Guard and the TAMM mock are running.",
      });
      return endSse(res, sse);
    }
    const fixedGap = query.has("gap") ? Math.max(0, Number(query.get("gap")) || 0) : null;
    const fast = query.get("fast") === "1";
    let prev = 0;
    for (const step of record.steps) {
      if (sse.signal.aborted) break;
      const delta = Math.max(0, (step.atMs ?? 0) - prev);
      prev = step.atMs ?? prev;
      await sleep(fast ? 0 : fixedGap ?? Math.min(1200, Math.max(300, delta)), sse.signal);
      send(res, "step", { ...step, replay: true });
    }
    send(res, "done", { ...record.done, replay: true });
    endSse(res, sse);
  }

  async function serveStatic(req, res, urlPath) {
    const target = safeResolve(config.publicDir, urlPath === "/" ? "/index.html" : urlPath);
    if (!target) return json(res, 400, errorBody("bad_path", "That path is not allowed."));
    let file = target;
    try {
      const st = await fs.stat(file);
      if (st.isDirectory()) file = path.join(file, "index.html");
      const data = await fs.readFile(file);
      res.writeHead(200, {
        "content-type": TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream",
        "content-length": data.length,
        "cache-control": "no-cache",
        "x-content-type-options": "nosniff",
      });
      res.end(req.method === "HEAD" ? undefined : data);
    } catch {
      json(res, 404, errorBody("not_found", "Nothing here."));
    }
  }

  async function handler(req, res) {
    try {
      const host = String(req.headers.host ?? "").toLowerCase();
      const hostname = host.startsWith("[") ? host.slice(0, host.indexOf("]") + 1) : host.split(":")[0];
      if (!ALLOWED_HOSTNAMES.has(hostname)) return json(res, 403, errorBody("bad_host", "This console only answers on localhost."));
      const origin = req.headers.origin;
      if (origin) {
        let originHost = "";
        try {
          originHost = new URL(origin).host.toLowerCase();
        } catch {
          /* leave empty: rejected below */
        }
        if (originHost !== host) return json(res, 403, errorBody("bad_origin", "Cross-origin requests are not allowed."));
      }
      const [rawPath, rawQuery = ""] = (req.url ?? "/").split("?");
      const query = new URLSearchParams(rawQuery);
      const method = req.method ?? "GET";

      if (rawPath.startsWith("/api/")) {
        const parts = rawPath.split("/").filter(Boolean).map((p) => { try { return decodeURIComponent(p); } catch { return p; } });
        const [, route, id] = parts;
        if (method === "GET" && route === "health" && parts.length === 2) return json(res, 200, { ok: true });
        if (method === "GET" && route === "status" && parts.length === 2) return json(res, 200, await status());
        if (method === "GET" && route === "scenarios" && parts.length === 2) return json(res, 200, scenarioList());
        if (method === "GET" && route === "run" && id && parts.length === 3) return await handleRun(req, res, id, query);
        if (method === "GET" && route === "replay" && id && parts.length === 3) return await handleReplay(req, res, id, query);
        if (method === "POST" && route === "reset" && parts.length === 2) {
          const [t, g] = await Promise.allSettled([tamm.reset(), guard.reset()]);
          const tOk = t.status === "fulfilled";
          const gOk = g.status === "fulfilled";
          return json(res, 200, { ok: tOk && gOk, tamm: tOk, guard: gOk });
        }
        return json(res, 404, errorBody("not_found", "No such API route."));
      }
      if (method !== "GET" && method !== "HEAD") return json(res, 405, errorBody("method_not_allowed", "Use GET."));
      return await serveStatic(req, res, rawPath);
    } catch (error) {
      console.error("[tamm-live] request failed", error);
      if (!res.headersSent) json(res, 500, errorBody("internal", "Something went wrong in the console server."));
      else res.end();
    }
  }

  const server = http.createServer((req, res) => void handler(req, res));
  server.requestTimeout = 0;
  return { server, config };
}

function parsePort(argv, env) {
  const i = argv.indexOf("--port");
  const raw = i >= 0 ? argv[i + 1] : env.PORT;
  const port = Number(raw ?? 8791);
  return Number.isInteger(port) && port >= 0 && port < 65536 ? port : 8791;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.on("uncaughtException", (e) => console.error("[tamm-live] uncaught", e));
  process.on("unhandledRejection", (e) => console.error("[tamm-live] unhandled", e));
  const port = parsePort(process.argv.slice(2), process.env);
  const { server, config } = createConsoleApp();
  server.on("error", (e) => {
    console.error(e.code === "EADDRINUSE" ? `Port ${port} is already in use. Start with --port <other> or stop the other program.` : `Could not start: ${e.message}`);
    process.exit(1);
  });
  server.listen(port, "127.0.0.1", () => {
    console.log(`Rasikh TAMM live console: http://127.0.0.1:${port}`);
    console.log(`  Guard ${config.guardUrl}   TAMM MCP ${config.tammMcpUrl}`);
    console.log("  TAMM is a MOCK, UAE PASS is simulated, end-to-end safety is not proven (an archived evaluation allowed 12 of 25 forbidden synthetic flows; the latest HTTP measurement denied 75 of 75).");
  });
}
