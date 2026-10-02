// One command for the real-browser suite: node scripts/e2e-run.mjs   (or: npm run e2e:run)
//   1. builds the extension if dist/ is missing (set E2E_BUILD=1 to force a rebuild)
//   2. starts the mock portals (8793) and the demo-mode backend (8796) unless they already answer;
//      it only stops what IT started, never a server that was already running
//   3. runs the Playwright suite in tests/e2e against the unpacked dist/ in a real Chromium
//   4. stops what it started and exits with the suite's exit code
// Options (env): E2E_BROWSER=chromium|msedge, E2E_SHOTS=<dir>, E2E_BUILD=1
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const portalsDir = path.resolve(root, "..", "rasikh-portals");
const logDir = path.join(root, "test-results");
fs.mkdirSync(logDir, { recursive: true });
const BACKEND_LOG = path.join(logDir, "e2e-backend.log");
const PORTALS_LOG = path.join(logDir, "e2e-portals.log");
const isWin = process.platform === "win32";
const started = [];

async function up(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return r.status < 500;
  } catch {
    return false;
  }
}
async function waitUp(url, ms = 30000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await up(url)) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}
function start(name, cmd, args, cwd, logFile, env = {}) {
  fs.writeFileSync(logFile, "");
  const out = fs.openSync(logFile, "a");
  const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, stdio: ["ignore", out, out], shell: isWin, windowsHide: true });
  started.push({ name, child });
  console.log(`[e2e-run] started ${name} (pid ${child.pid}), log ${logFile}`);
  return child;
}
function stopAll() {
  for (const { name, child } of started.reverse()) {
    try {
      if (isWin) spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
      else child.kill("SIGTERM");
      console.log(`[e2e-run] stopped ${name}`);
    } catch {
      /* already gone */
    }
  }
}
process.on("SIGINT", () => { stopAll(); process.exit(130); });

let code = 1;
try {
  if (process.env.E2E_BUILD === "1" || !fs.existsSync(path.join(root, "dist", "manifest.json"))) {
    console.log("[e2e-run] building the extension");
    const b = spawnSync("npm", ["run", "build"], { cwd: root, stdio: "inherit", shell: isWin });
    if (b.status !== 0) throw new Error("build failed");
  }

  let portalsOwned = false;
  if (!(await up("http://127.0.0.1:8793/"))) {
    start("portals", "node", ["server.mjs"], portalsDir, PORTALS_LOG);
    portalsOwned = true;
  }
  let backendOwned = false;
  if (!(await up("http://127.0.0.1:8796/health")) && !(await up("http://127.0.0.1:8796/"))) {
    // demo mode: no model key, nothing leaves the machine
    start("backend", "npx", ["tsx", "backend/server.local.ts"], root, BACKEND_LOG, { PORT: "8796", ANTHROPIC_KEY: "", ANTHROPIC_API_KEY: "" });
    backendOwned = true;
  }
  if (!(await waitUp("http://127.0.0.1:8793/"))) throw new Error("portals did not come up on 8793");
  // the backend is optional for the offline walkthrough; wait a little, then carry on
  if (backendOwned) await waitUp("http://127.0.0.1:8796/health", 15000);

  const env = { ...process.env, E2E_BACKEND_LOG: backendOwned ? BACKEND_LOG : "", E2E_PORTALS_OWNED: portalsOwned ? "1" : "" };
  const r = spawnSync("npx", ["playwright", "test", "-c", "tests/e2e/playwright.e2e.config.ts", ...process.argv.slice(2)], {
    cwd: root, env, stdio: "inherit", shell: isWin
  });
  code = r.status ?? 1;
} catch (e) {
  console.error("[e2e-run] " + (e instanceof Error ? e.message : String(e)));
} finally {
  stopAll();
}
process.exit(code);
