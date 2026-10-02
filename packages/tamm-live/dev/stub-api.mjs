// Throwaway stub of the console API, for building and testing public/ without the real server.
// Usage: node dev/stub-api.mjs [port]   (default 8791)   STUB_DOWN=guard|tamm|both simulates a down service,
// STUB_FAIL=1 makes every live run emit a "fail" event. Emits contract-shaped events only (mock data).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'public');
const port = Number(process.argv[2] || 8791);
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };

const scenarios = [
  { id: 'tawtheeq', title: 'Register the tenancy contract with TAMM', blurb: 'The agent registers a signed tenancy contract through TAMM. Guard allows it and the mock application moves from submitted to approved.', expect: 'allowed', labels: ['passport', 'emirates_id'], service: 'tamm.tawtheeq.register' },
  { id: 'bank-statement', title: 'The agent tries to attach a bank statement to a residency visa application', blurb: 'Guard refuses the call, so the TAMM backend is never contacted and no application is created.', expect: 'blocked', labels: ['bank_statement'], service: 'tamm.residency.visa' },
  { id: 'health-routing', title: 'Health data: refused for a visa, accepted for insurance', blurb: 'The same health document is refused for a residency visa and accepted for a health insurance application.', expect: 'mixed', labels: ['health'], service: 'tamm.residency.visa, tamm.health.insurance' },
];
const D = (decision, policy_rule, reason, blocked_labels) => ({ decision, policy_rule, reason, blocked_labels });
const step = (n, atMs, kind, title, actor, request, response, extra = {}) => ({ n, atMs, kind, title, actor, request, response, ms: extra.ms ?? 12, mock: true, ...extra.rest, ...(extra.decision ? { decision: extra.decision } : {}), ...(extra.status ? { status: extra.status } : {}) });

const sess = [
  step(1, 0, 'guard.session', 'Guard opens a session for the newcomer', 'guard', { subject_ref: 'hire_demo_001', purpose: 'tamm_request' }, { session_id: 'gs_7c3e', ok: true }, { ms: 6 }),
  step(2, 40, 'guard.observe', 'The app tells Guard which documents it holds', 'app', { refs: ['doc_passport_hire_demo_001'], labels: ['passport', 'emirates_id'] }, { observed: 2 }, { ms: 5 }),
  step(3, 90, 'tamm.login', 'Simulated UAE PASS sign-in', 'tamm', { subject_ref: 'hire_demo_001', audience: 'individual' }, { uaepass_session: 'uap_sim_7c3e', simulated: true }, { ms: 9 }),
];
const scripts = {
  tawtheeq: [
    ...sess,
    step(4, 160, 'guard.check', 'Guard checks the request before any data leaves', 'guard', { destination: 'tamm', tool: 'register_tenancy_tawtheeq', labels: ['passport', 'emirates_id'] }, { ok: true }, { ms: 7, decision: D('allow', 'passport.tamm.allow', 'Passport and Emirates ID may go to TAMM under the default matrix.') }),
    step(5, 240, 'tamm.tool', 'Agent calls register_tenancy_tawtheeq', 'tamm', { tool: 'register_tenancy_tawtheeq', lease_ref: 'lease_reem_2207', applicant_ref: 'hire_demo_001', uaepass_session: 'uap_sim_7c3e', guard_session_id: 'gs_7c3e' }, { application_id: 'app_tw_0192', mock: true, fee: { amount: 250, illustrative: true } }, { ms: 31, status: 'submitted' }),
    step(6, 400, 'tamm.advance', 'Demo control moves the mock application forward', 'app', { application_id: 'app_tw_0192' }, { status: 'under_review' }, { ms: 8, status: 'under_review' }),
    step(7, 520, 'tamm.status', 'Agent reads get_application_status', 'tamm', { tool: 'get_application_status', application_id: 'app_tw_0192' }, { status: 'under_review', mock: true }, { ms: 11, status: 'under_review' }),
    step(8, 640, 'tamm.advance', 'Demo control moves the mock application forward', 'app', { application_id: 'app_tw_0192' }, { status: 'approved' }, { ms: 8, status: 'approved' }),
    step(9, 760, 'tamm.status', 'Agent reads get_application_status', 'tamm', { tool: 'get_application_status', application_id: 'app_tw_0192' }, { status: 'approved', mock: true }, { ms: 10, status: 'approved' }),
  ],
  'bank-statement': [
    sess[0],
    step(2, 40, 'guard.observe', 'The app tells Guard about the bank statement', 'app', { refs: ['doc_bank_hire_demo_001'], labels: ['bank_statement'] }, { observed: 1 }, { ms: 5 }),
    step(3, 90, 'tamm.login', 'Simulated UAE PASS sign-in', 'tamm', { subject_ref: 'hire_demo_001', audience: 'individual' }, { uaepass_session: 'uap_sim_7c3e', simulated: true }, { ms: 9 }),
    step(4, 160, 'guard.check', 'Guard checks the request before any data leaves', 'guard', { destination: 'tamm', tool: 'start_application', service_id: 'residency-visa', labels: ['bank_statement'] }, { ok: false }, { ms: 7, decision: D('deny', 'bank_statement.tamm.deny', 'Bank statements are never sent to TAMM under the default matrix.', ['bank_statement']) }),
    step(5, 240, 'tamm.tool', 'Agent calls start_application, TAMM refuses to act', 'tamm', { tool: 'start_application', service_id: 'residency-visa', documents: ['doc_bank_hire_demo_001'] }, { denied: true, application_id: null, mock: true }, { ms: 4 }),
  ],
  'health-routing': [
    sess[0],
    step(2, 40, 'guard.observe', 'The app tells Guard about the health document', 'app', { refs: ['doc_health_hire_demo_001'], labels: ['health'] }, { observed: 1 }, { ms: 5 }),
    step(3, 90, 'tamm.login', 'Simulated UAE PASS sign-in', 'tamm', { subject_ref: 'hire_demo_001', audience: 'individual' }, { uaepass_session: 'uap_sim_7c3e', simulated: true }, { ms: 9 }),
    step(4, 160, 'guard.check', 'First try: health data for a residency visa', 'guard', { destination: 'tamm', tool: 'start_application', service_id: 'residency-visa', labels: ['health'] }, { ok: false }, { ms: 7, decision: D('deny', 'health.tamm.insurance_only', 'Health data may only go to TAMM services tagged as insurance.', ['health']) }),
    step(5, 240, 'tamm.tool', 'Agent calls start_application for the visa', 'tamm', { tool: 'start_application', service_id: 'residency-visa' }, { denied: true, application_id: null, mock: true }, { ms: 4 }),
    step(6, 400, 'guard.check', 'Second try: the same document for health insurance', 'guard', { destination: 'tamm', tool: 'start_application', service_id: 'health-insurance', labels: ['health'] }, { ok: true }, { ms: 7, decision: D('allow', 'health.tamm.insurance_only', 'The service is tagged as insurance, so health data is allowed.') }),
    step(7, 480, 'tamm.tool', 'Agent calls start_application for health insurance', 'tamm', { tool: 'start_application', service_id: 'health-insurance', documents: ['doc_health_hire_demo_001'] }, { application_id: 'app_hi_0044', mock: true }, { ms: 28, status: 'submitted' }),
  ],
};
const outcomes = {
  tawtheeq: { outcome: 'allowed', ms: 140, summary: 'Guard allowed the call, the mock created application app_tw_0192 and it was approved after two demo advances.' },
  'bank-statement': { outcome: 'blocked', ms: 52, summary: 'Guard denied the bank statement under bank_statement.tamm.deny. No application was created.' },
  'health-routing': { outcome: 'mixed', ms: 100, summary: 'Health data was refused for the visa and accepted for health insurance.' },
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const replays = new Set(['bank-statement']);

async function sse(res, id, replay) {
  res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
  let closed = false; res.on('close', () => { closed = true; });
  const send = (ev, d) => !closed && res.write(`event: ${ev}\ndata: ${JSON.stringify(d)}\n\n`);
  if (!replay && process.env.STUB_FAIL) {
    await sleep(200);
    send('fail', { message: 'Rasikh Guard is not answering on 127.0.0.1:8787, so nothing was checked and nothing was sent.', hint: 'RASIKH_DEMO_MODE=1 C:/Users/maalh/Desktop/rasikh-guard-target/release/rasikh-guard.exe' });
    return res.end();
  }
  for (const s of scripts[id]) { await sleep(120); send('step', replay ? { ...s, replay: true } : s); }
  await sleep(120);
  send('done', outcomes[id]);
  res.end();
}

createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const json = (o) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };
  const down = process.env.STUB_DOWN || '';
  if (u.pathname === '/api/status') return json({ guard: { ok: !/guard|both/.test(down), url: 'http://127.0.0.1:8787', detail: 'connection refused' }, tamm: { ok: !/tamm|both/.test(down), url: 'http://127.0.0.1:8790', mock: true, demoMode: true }, replays: [...replays] });
  if (u.pathname === '/api/scenarios') return json(scenarios);
  if (u.pathname === '/api/reset' && req.method === 'POST') return json({ ok: true, tamm: true, guard: true });
  const m = u.pathname.match(/^\/api\/(run|replay)\/([\w-]+)$/);
  if (m && scripts[m[2]]) return sse(res, m[2], m[1] === 'replay');
  let p = u.pathname === '/' || !extname(u.pathname) ? '/index.html' : u.pathname;
  try {
    const f = join(root, normalize(p).replace(/^([/\\])+/, ''));
    if (!f.startsWith(root)) throw new Error('outside');
    const body = await readFile(f);
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch { res.writeHead(404); res.end('not found'); }
}).listen(port, '127.0.0.1', () => console.log(`stub on http://127.0.0.1:${port}`));
