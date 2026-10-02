#!/usr/bin/env node
/**
 * Capture a route of the running app as a PNG with headless Edge/Chrome over CDP.
 * Used for design comparison and QA passes. Needs Node 22 (global WebSocket).
 *
 *   node scripts/capture.mjs --path employer/hires --out shot.png
 *        [--theme light|dark] [--dir ltr|rtl] [--width 1512] [--height 949] [--dpr 1.27]
 *        [--base http://localhost:3000] [--wait 800]
 *
 * Defaults reproduce the reference captures: a 1512x949 viewport at 1.27x is 1920x1205 px.
 * Set BROWSER_PATH to override browser detection. Pass --path without a leading slash in Git Bash,
 * which rewrites arguments that start with one.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, token, index, all) => {
    if (token.startsWith('--')) pairs.push([token.slice(2), all[index + 1]]);
    return pairs;
  }, []),
);

const options = {
  base: args.base ?? 'http://localhost:3000',
  path: '/' + (args.path ?? '').replace(/^\/+/, ''),
  out: args.out ?? 'capture.png',
  theme: args.theme ?? 'light',
  dir: args.dir ?? 'ltr',
  width: Number(args.width ?? 1512),
  height: Number(args.height ?? 949),
  dpr: Number(args.dpr ?? 1.27),
  wait: Number(args.wait ?? 800),
};

const CANDIDATES = [
  process.env.BROWSER_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const browser = CANDIDATES.find((candidate) => existsSync(candidate));
if (!browser) {
  console.error('No Chromium-based browser found. Set BROWSER_PATH.');
  process.exit(1);
}

const port = 9300 + Math.floor(Math.random() * 500);
const child = spawn(
  browser,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${mkdtempSync(join(tmpdir(), 'rasikh-capture-'))}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function pageSocketUrl() {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const page = targets.find((target) => target.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      /* browser still starting */
    }
    await sleep(200);
  }
  throw new Error('Browser did not expose a debugging target');
}

try {
  const socket = new WebSocket(await pageSocketUrl());
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });

  let nextId = 0;
  const pending = new Map();
  const loadWaiters = [];
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'Page.loadEventFired')
      loadWaiters.splice(0).forEach((resolve) => resolve());
    else pending.get(message.id)?.(message);
  };
  const loaded = () => new Promise((resolve) => loadWaiters.push(resolve));
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, (message) =>
        message.error ? reject(new Error(message.error.message)) : resolve(message.result),
      );
      socket.send(JSON.stringify({ id, method, params }));
    });

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: options.width,
    height: options.height,
    deviceScaleFactor: options.dpr,
    mobile: options.width < 600,
  });

  const url = options.base + options.path;
  let ready = loaded();
  await send('Page.navigate', { url });
  await ready;
  await send('Runtime.evaluate', {
    expression: `localStorage.setItem('rasikh-theme', ${JSON.stringify(options.theme)}); true`,
  });
  ready = loaded();
  await send('Page.reload');
  await ready;
  await sleep(options.wait);
  if (options.dir === 'rtl') {
    await send('Runtime.evaluate', {
      expression: `document.documentElement.dir='rtl'; document.documentElement.lang='ar'; true`,
    });
    await sleep(150);
  }

  if (process.env.CAPTURE_DEBUG) {
    const state = await send('Runtime.evaluate', {
      expression:
        "JSON.stringify({ls: localStorage.getItem('rasikh-theme'), cls: document.documentElement.className})",
    });
    console.log(state.result.value);
  }
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(options.out, Buffer.from(data, 'base64'));
  console.log(
    `${options.out} (${Math.round(options.width * options.dpr)}x${Math.round(options.height * options.dpr)})`,
  );
  socket.close();
} finally {
  child.kill();
}
