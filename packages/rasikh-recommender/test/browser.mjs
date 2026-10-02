import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { launchBrowser, sleep } from '../../../scripts/lib/browser.mjs';

const base = process.env.RASIKH_RECOMMENDER_URL ?? 'http://127.0.0.1:8795';
const meta = await (await fetch(`${base}/api/metadata`)).json();
assert.equal(meta.source.license, 'ODbL-1.0');
for (const [body, status] of [[{preferences:{parks:1}},200],[{budget:100000},400]]) {
  const response = await fetch(`${base}/api/recommend`, { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body) });
  assert.equal(response.status, status);
}
const forbidden = await fetch(`${base}/api/recommend`, {method:'POST',headers:{'Content-Type':'application/json',Origin:'https://example.com'},body:'{}'});
assert.equal(forbidden.status,403);
const browser = await launchBrowser();
const evidence = {base,source_sha256:meta.source.raw_sha256,checks:[]};
try {
  const page = await browser.firstPage();
  try {
    for (const [name,width,height] of [['desktop',1280,850],['phone',390,844]]) {
      await page.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:name==='phone'});
      await page.navigate(base);
      await page.evaluate("document.querySelector('#form').requestSubmit()");
      let count=0;
      for(let attempt=0;attempt<50;attempt++) { count=await page.evaluate("document.querySelectorAll('.result').length");if(count===6)break;await sleep(100); }
      assert.equal(count,6);
      const names = await page.evaluate("[...document.querySelectorAll('.result h2')].map(item => item.textContent.normalize('NFKC').trim().toLowerCase())");
      assert.equal(new Set(names).size, 6, 'Duplicate place names in recommendations');
      const layout = await page.evaluate('({viewport:innerWidth,width:document.documentElement.scrollWidth,attribution:document.querySelector("footer").textContent})');
      assert.ok(layout.width<=layout.viewport, `${name}: horizontal overflow`);
      assert.match(layout.attribution,/OpenStreetMap/);
      const shot=await page.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
      mkdirSync(new URL('../evidence/',import.meta.url),{recursive:true});
      writeFileSync(new URL(`../evidence/${name}.png`,import.meta.url),Buffer.from(shot.data,'base64'));
      evidence.checks.push({name,recommendations:count,horizontal_overflow:false});
    }
    await page.evaluate("for(const field of document.querySelectorAll('input[type=range]'))field.value=0;document.querySelector('#form').requestSubmit()");
    await sleep(200);
    assert.match(await page.evaluate("document.querySelector('#status').textContent"),/Choose at least one preference/);
    evidence.checks.push({name:'empty_preferences_error',passed:true});
  } finally { page.close(); }
} finally { browser.close(); }
evidence.observed_at=new Date().toISOString();
writeFileSync(new URL('../evidence/browser.json',import.meta.url),JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify(evidence));
