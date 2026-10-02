/**
 * Minimal Chrome DevTools Protocol client for the QA scripts. Needs Node 22 (global WebSocket)
 * and a Chromium-based browser. Set BROWSER_PATH to override detection.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CANDIDATES = [
  process.env.BROWSER_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function launchBrowser() {
  const path = CANDIDATES.find((candidate) => existsSync(candidate));
  if (!path) throw new Error('No Chromium-based browser found. Set BROWSER_PATH.');
  const port = 9300 + Math.floor(Math.random() * 500);
  const child = spawn(
    path,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${mkdtempSync(join(tmpdir(), 'rasikh-qa-'))}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  async function targets() {
    for (let attempt = 0; attempt < 50; attempt++) {
      try {
        return await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      } catch {
        await sleep(200);
      }
    }
    throw new Error('Browser did not expose a debugging endpoint');
  }

  return {
    /** The first (blank) tab. */
    async firstPage() {
      const page = (await targets()).find((target) => target.type === 'page');
      return connectPage(page.webSocketDebuggerUrl);
    },
    /** A new tab, like opening a second window. */
    async newPage(url = 'about:blank') {
      const response = await fetch(`http://127.0.0.1:${port}/json/new?${url}`, { method: 'PUT' });
      const page = await response.json();
      return connectPage(page.webSocketDebuggerUrl);
    },
    close() {
      child.kill();
    },
  };
}

export async function connectPage(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });

  let nextId = 0;
  const pending = new Map();
  const loadWaiters = [];
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'Page.loadEventFired') loadWaiters.splice(0).forEach((done) => done());
    else pending.get(message.id)?.(message);
  };

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, (message) =>
        message.error ? reject(new Error(message.error.message)) : resolve(message.result),
      );
      socket.send(JSON.stringify({ id, method, params }));
    });
  const loaded = () => new Promise((resolve) => loadWaiters.push(resolve));
  await send('Page.enable');

  return {
    send,
    async navigate(url) {
      const ready = loaded();
      await send('Page.navigate', { url });
      await ready;
    },
    async reload() {
      const ready = loaded();
      await send('Page.reload');
      await ready;
    },
    /** Runs an expression in the page and returns its value. */
    async evaluate(expression) {
      const { result, exceptionDetails } = await send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      if (exceptionDetails)
        throw new Error(exceptionDetails.exception?.description ?? 'evaluate failed');
      return result.value;
    },
    close() {
      socket.close();
    },
  };
}
