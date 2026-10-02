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
import { writeFileSync } from 'node:fs';
import { launchBrowser, sleep } from './lib/browser.mjs';

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

const browser = await launchBrowser();
try {
  const page = await browser.firstPage();
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: options.width,
    height: options.height,
    deviceScaleFactor: options.dpr,
    mobile: options.width < 600,
  });

  await page.navigate(options.base + options.path);
  await page.evaluate(`localStorage.setItem('rasikh-theme', ${JSON.stringify(options.theme)})`);
  await page.reload();
  await sleep(options.wait);
  if (options.dir === 'rtl') {
    await page.evaluate(
      `document.documentElement.dir = 'rtl'; document.documentElement.lang = 'ar'`,
    );
    await sleep(150);
  }

  const { data } = await page.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(options.out, Buffer.from(data, 'base64'));
  console.log(
    `${options.out} (${Math.round(options.width * options.dpr)}x${Math.round(options.height * options.dpr)})`,
  );
  page.close();
} finally {
  browser.close();
}
