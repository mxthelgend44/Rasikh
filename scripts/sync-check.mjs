#!/usr/bin/env node
/**
 * Proves live sync in real browsers: opens the Live state page in two tabs, changes a record in
 * one, and measures how long the other takes to show it. Exits non-zero if it never does.
 *
 *   node scripts/sync-check.mjs [--base http://localhost:3000] [--budget 2000]
 *
 * Resets the demo state at the start and at the end.
 */
import { launchBrowser, sleep } from './lib/browser.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, token, index, all) => {
    if (token.startsWith('--')) pairs.push([token.slice(2), all[index + 1]]);
    return pairs;
  }, []),
);
const base = args.base ?? 'http://localhost:3000';
const budgetMs = Number(args.budget ?? 2000);
const PAGE = `${base}/design-system/state`;

/** In-page helpers, injected as a string so they run in each tab. */
const HELPERS = `
  window.__rev = () => Number(document.querySelector('[data-testid="rev"]')?.textContent ?? NaN);
  window.__row = (name) => [...document.querySelectorAll('tbody tr')].find((tr) => tr.textContent.includes(name));
  window.__backing = (name) => window.__row(name)?.querySelectorAll('td')[3]?.textContent.trim();
  window.__stage = (name) => window.__row(name)?.querySelectorAll('td')[1]?.textContent.trim();
  window.__click = (name, label) => {
    const button = [...window.__row(name).querySelectorAll('button')].find((b) => b.textContent.trim() === label);
    button.click();
  };
  true;
`;

async function waitFor(page, expression, timeoutMs) {
  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    if (await page.evaluate(expression)) return performance.now() - start;
    await sleep(20);
  }
  return null;
}

function check(label, passed, detail = '') {
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`);
  if (!passed) process.exitCode = 1;
}

const browser = await launchBrowser();
try {
  const a = await browser.firstPage();
  await a.navigate(PAGE);
  const b = await browser.newPage(PAGE);
  await sleep(2500);
  for (const page of [a, b]) await page.evaluate(HELPERS);

  await a.evaluate(`fetch('/api/reset', { method: 'POST' }).then(() => true)`);
  await sleep(500);

  const NAME = 'Samuel Okoye';
  const rev0 = await b.evaluate('window.__rev()');
  check('both tabs are connected', (await a.evaluate('window.__rev()')) === rev0, `rev ${rev0}`);

  // 1. Change a record in tab A, expect tab B to show it.
  const before = await b.evaluate(`window.__backing(${JSON.stringify(NAME)})`);
  await a.evaluate(`window.__click(${JSON.stringify(NAME)}, 'Remove backing')`);
  const t1 = await waitFor(
    b,
    `window.__backing(${JSON.stringify(NAME)}) === 'Not backed'`,
    budgetMs,
  );
  check(
    'removing backing in tab A appears in tab B',
    t1 !== null,
    `${before} -> Not backed in ${t1?.toFixed(0)} ms`,
  );
  check('tab B revision rose', (await b.evaluate('window.__rev()')) > rev0);

  // 2. And the other way round.
  await b.evaluate(`window.__click(${JSON.stringify(NAME)}, 'Back this hire')`);
  const t2 = await waitFor(
    a,
    `window.__backing(${JSON.stringify(NAME)}) === 'Employer backed'`,
    budgetMs,
  );
  check('backing in tab B appears in tab A', t2 !== null, `${t2?.toFixed(0)} ms`);

  // 3. A change that cascades: completing a step moves the stage in the other tab.
  const stageBefore = await b.evaluate(`window.__stage('Tomasz Kowalski')`);
  await a.evaluate(`window.__click('Tomasz Kowalski', 'Complete step')`);
  const t3 = await waitFor(
    b,
    `window.__stage('Tomasz Kowalski') !== ${JSON.stringify(stageBefore)}`,
    budgetMs,
  );
  check(
    'completing a step in tab A moves the stage in tab B',
    t3 !== null,
    `${stageBefore} -> ${await b.evaluate(`window.__stage('Tomasz Kowalski')`)} in ${t3?.toFixed(0)} ms`,
  );

  // 4. Reset from tab B returns tab A to the seed.
  await b.evaluate(`fetch('/api/reset', { method: 'POST' }).then(() => true)`);
  const t4 = await waitFor(
    a,
    `window.__stage('Tomasz Kowalski') === ${JSON.stringify(stageBefore)}`,
    budgetMs,
  );
  check('reset in tab B restores tab A', t4 !== null, `${t4?.toFixed(0)} ms`);

  a.close();
  b.close();
} finally {
  browser.close();
}
