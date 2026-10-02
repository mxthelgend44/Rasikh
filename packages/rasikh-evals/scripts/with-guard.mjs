import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { createConnection } from 'node:net';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const packageDirectory = fileURLToPath(new URL('..', import.meta.url));
const runtimeDirectory = resolve(packageDirectory, '.runtime');
const expectedContractVersion = '1.0.0'; // Active INTEGRATION.md/runtime contract; proposals are not active.

export function parseLauncherArguments(args) {
  let baseUrl = process.env.RASIKH_GUARD_URL ?? 'http://localhost:8787';
  let reuseOnly = false;
  let command = [];
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--') {
      command = args.slice(index + 1);
      break;
    }
    if (arg === '--reuse-only') reuseOnly = true;
    else if (arg === '--url' && args[index + 1]) baseUrl = args[++index];
    else
      throw new Error(
        'Usage: node scripts/with-guard.mjs [--url URL] [--reuse-only] [-- command args...]',
      );
  }
  const url = new URL(baseUrl);
  if (
    url.protocol !== 'http:' ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  )
    throw new Error(
      'Guard URL must be an HTTP origin without credentials, path, query or fragment.',
    );
  return { baseUrl: url.origin, reuseOnly, command };
}

async function health(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/health`, {
      signal: AbortSignal.timeout(1000),
      redirect: 'error',
    });
    if (!response.ok) return null;
    const value = await response.json();
    return value.contract_version === expectedContractVersion &&
      value.status === 'ok' &&
      /^[a-f0-9]{40}$/i.test(value.upstream_commit ?? '')
      ? value
      : null;
  } catch {
    return null;
  }
}

async function listening(host, port) {
  return new Promise((resolveListening) => {
    const socket = createConnection({ host, port });
    let settled = false;
    function finish(value) {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolveListening(value);
    }
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.setTimeout(500, () => finish(false));
  });
}

function waitForExit(child) {
  return new Promise((resolveExit, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolveExit({ code: code ?? 1, signal }));
  });
}

async function stopOwned(child) {
  if (!child || child.pid === undefined || child.exitCode !== null || child.signalCode !== null)
    return;
  const exit = waitForExit(child);
  child.kill('SIGTERM');
  const stopped = await Promise.race([exit.then(() => true), delay(3000).then(() => false)]);
  if (!stopped && child.exitCode === null && child.signalCode === null) {
    child.kill('SIGKILL');
    await exit;
  }
}

/** A child PID is the only process ever terminated; healthy reused services are left untouched. */
export async function withGuard(options) {
  await mkdir(runtimeDirectory, { recursive: true });
  let owned;
  let requested;
  let activeBuild;
  let interrupted = false;
  let initialHealth;
  const provenance = {
    service_source: 'reused_healthy',
    base_url: options.baseUrl,
    service_owned: false,
    demo_mode: 'unknown',
  };
  const onSignal = () => {
    interrupted = true;
    requested?.kill('SIGTERM');
    activeBuild?.kill('SIGTERM');
    owned?.kill('SIGTERM');
  };
  process.once('SIGINT', onSignal);
  process.once('SIGTERM', onSignal);
  try {
    initialHealth = await health(options.baseUrl);
    if (interrupted) throw new Error('Guard evaluation interrupted.');
    if (!initialHealth) {
      if (options.reuseOnly)
        throw new Error('No healthy contract-compatible Guard to reuse; action remains blocked.');
      const url = new URL(options.baseUrl);
      if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
        throw new Error(
          'An unavailable remote Guard cannot be launched locally; action remains blocked.',
        );
      const port = Number(url.port || 80);
      if ((await listening('127.0.0.1', port)) || (await listening('::1', port)))
        throw new Error(
          'Guard port is occupied by an unhealthy or incompatible service. No existing service is stopped or reset.',
        );
      const cargo = resolve(
        homedir(),
        '.cargo',
        'bin',
        process.platform === 'win32' ? 'cargo.exe' : 'cargo',
      );
      const targetDirectory = resolve(runtimeDirectory, 'guard-target');
      activeBuild = spawn(
        cargo,
        [
          'build',
          '--locked',
          '--manifest-path',
          resolve(packageDirectory, '../rasikh-guard/Cargo.toml'),
          '-p',
          'rasikh-guard',
        ],
        {
          cwd: packageDirectory,
          env: { ...process.env, CARGO_TARGET_DIR: targetDirectory },
          stdio: 'inherit',
          windowsHide: true,
        },
      );
      const built = await waitForExit(activeBuild);
      activeBuild = undefined;
      if (built.code !== 0)
        throw new Error('Locked native Guard build failed. No live result is claimed.');
      if (interrupted) throw new Error('Guard evaluation interrupted.');
      const executable = resolve(
        targetDirectory,
        'debug',
        process.platform === 'win32' ? 'rasikh-guard.exe' : 'rasikh-guard',
      );
      owned = spawn(executable, [], {
        cwd: packageDirectory,
        env: {
          ...process.env,
          RASIKH_DEMO_MODE: '0',
          RASIKH_GUARD_BIND: `127.0.0.1:${port},[::1]:${port}`,
        },
        stdio: ['ignore', 'inherit', 'inherit'],
        windowsHide: true,
      });
      let startupError;
      owned.once('error', (error) => {
        startupError = error;
      });
      const deadline = Date.now() + 15000;
      while (!(initialHealth = await health(options.baseUrl))) {
        if (
          interrupted ||
          startupError ||
          owned.exitCode !== null ||
          owned.signalCode !== null ||
          Date.now() > deadline
        )
          throw new Error('Owned Guard failed its health check; action remains blocked.');
        await delay(100);
      }
      Object.assign(provenance, {
        service_source: 'native_launched',
        service_owned: true,
        demo_mode: 'off',
        pid: owned.pid,
        executable,
        build: 'cargo_locked',
      });
    }
    const provenancePath = resolve(runtimeDirectory, `guard-provenance-${randomUUID()}.json`);
    await writeFile(
      provenancePath,
      `${JSON.stringify({ ...provenance, health: initialHealth }, null, 2)}\n`,
    );
    process.stdout.write(
      `Guard: ${provenance.service_source} at ${options.baseUrl}; ${provenance.service_owned ? `owned PID ${provenance.pid}` : 'existing service left running'}.\n`,
    );
    const command = options.command.length
      ? options.command
      : [process.execPath, '--import', 'tsx', 'src/guard-conformance.ts'];
    if (interrupted) throw new Error('Guard evaluation interrupted.');
    requested = spawn(command[0], command.slice(1), {
      cwd: packageDirectory,
      env: {
        ...process.env,
        RASIKH_GUARD_URL: options.baseUrl,
        RASIKH_GUARD_PROVENANCE: provenancePath,
      },
      stdio: 'inherit',
      windowsHide: true,
    });
    return (await waitForExit(requested)).code;
  } finally {
    process.removeListener('SIGINT', onSignal);
    process.removeListener('SIGTERM', onSignal);
    await stopOwned(requested);
    await stopOwned(owned);
    await stopOwned(activeBuild);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = await withGuard(parseLauncherArguments(process.argv.slice(2)));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : 'Guard launch failed.'}\n`);
    process.exitCode = 1;
  }
}
