'use strict';
/* Rasikh live TAMM console. Vanilla JS, no framework, no CDN.
   Consumes the console API: /api/status, /api/scenarios, /api/run/:id (SSE), /api/replay/:id (SSE), POST /api/reset.
   Everything is written with textContent (no innerHTML for data). Request and response rows show labels, refs, ids and
   statuses only; as a second line of defence, values under secret-looking keys are masked here too. */

const $ = (sel, root = document) => root.querySelector(sel);
const REDUCED = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const RECORD = new URLSearchParams(location.search).has('record');
const PACE_MS = 700;
const FAST_MS = 60;
const FALLBACK_HINT = 'Start the console server again: npm start (inside packages/tamm-live), then press R to reset.';

const ICONS = {
  allow: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  needs_consent: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.01"/></svg>',
  deny: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  lock: '<svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/><path d="M12 14.5v2.5"/></svg>',
  warn: '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5L2.5 20h19L12 3.5z"/><path d="M12 10v4.5M12 17.5v.01"/></svg>',
};

const ACTOR = { agent: 'Agent', guard: 'Guard', tamm: 'TAMM · mock', app: 'App' };
const DECISION = { allow: 'Allowed', needs_consent: 'Needs consent', deny: 'Denied' };
const EXPECT = {
  allowed: 'Expected: allowed',
  blocked: 'Expected: blocked by Guard',
  mixed: 'Expected: one refused, one allowed',
};
const OUTCOME = {
  allowed: 'Allowed: the request passed Guard and reached the mock TAMM',
  blocked: 'Blocked by Guard: nothing was sent to TAMM',
  mixed: 'Mixed: one request refused, one allowed',
  error: 'The run ended with an error',
};
const STATUS_ORDER = ['submitted', 'under_review', 'approved'];

const S = {
  scenarios: [], replays: [], cards: {},
  es: null, queue: [], timer: null, lastAt: 0, token: 0,
  running: false, scenario: null, mode: 'live', gotTerminal: false, stepsSeen: 0,
  fast: false, hide: false, statusSeen: false,
};

/* ---------- tiny DOM helpers ---------- */
function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v; /* static icon strings only */
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null) e.append(kid);
  return e;
}
const icon = (name) => h('span', { html: ICONS[name], 'aria-hidden': 'true', class: 'ico' });

let liveTimer = null;
function announce(msg) {
  const live = $('#live');
  live.textContent = '';
  clearTimeout(liveTimer);
  liveTimer = setTimeout(() => { live.textContent = msg; }, 60);
}

/* ---------- theme ---------- */
function effectiveTheme() {
  const t = document.documentElement.getAttribute('data-theme');
  if (t === 'light' || t === 'dark') return t;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function syncThemeBtn() { $('#theme-btn').setAttribute('aria-pressed', String(effectiveTheme() === 'dark')); }
$('#theme-btn').addEventListener('click', () => {
  const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem('rasikh-theme', next); } catch (e) { /* storage may be blocked */ }
  syncThemeBtn();
});
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', syncThemeBtn);
syncThemeBtn();

/* ---------- health + status polling ---------- */
function setDot(id, state, text, where, detail) {
  const item = $(id);
  item.dataset.state = state;
  $('.st-text', item).textContent = text;
  $('.where', item).textContent = where || '';
  if (detail) item.setAttribute('title', detail); else item.removeAttribute('title');
}
const hostOf = (u) => { try { return new URL(u).host; } catch (e) { return u || ''; } };

function applyStatus(st) {
  const g = st.guard || {}, t = st.tamm || {};
  setDot('#h-guard', g.ok ? 'up' : 'down', g.ok ? 'up' : 'down', hostOf(g.url), g.ok ? '' : g.detail || 'Guard is not answering');
  const tw = hostOf(t.url) + (t.ok && t.demoMode === false ? ' · demo mode off' : '');
  setDot('#h-tamm', t.ok ? 'up' : 'down', t.ok ? 'up' : 'down', tw, t.ok ? '' : 'The mock TAMM is not answering');
  S.replays = Array.isArray(st.replays) ? st.replays : [];
  for (const [id, c] of Object.entries(S.cards)) c.replayWrap.hidden = !S.replays.includes(id);
}
async function pollStatus() {
  try {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 2500);
    const r = await fetch('/api/status', { signal: ctl.signal, cache: 'no-store' });
    clearTimeout(to);
    applyStatus(await r.json());
  } catch (e) {
    setDot('#h-guard', 'unknown', 'unknown', '', 'The console server is not answering');
    setDot('#h-tamm', 'unknown', 'unknown', '', 'The console server is not answering');
  }
  setTimeout(pollStatus, 3000);
}

/* ---------- scenarios ---------- */
function renderScenarios() {
  const box = $('#scenarios');
  box.replaceChildren();
  S.cards = {};
  S.scenarios.forEach((sc, i) => {
    const runBtn = h('button', { type: 'button', class: 'btn primary', 'data-run': sc.id }, 'Run live', ' ', h('kbd', { text: String(i + 1) }));
    runBtn.setAttribute('aria-label', 'Run live: ' + sc.title);
    const replayBtn = h('button', { type: 'button', class: 'btn quiet', 'data-replay': sc.id, title: 'Plays back an earlier recorded run. It is not a live call.', text: 'Replay recorded run' });
    replayBtn.setAttribute('aria-label', 'Replay recorded run: ' + sc.title);
    const replayWrap = h('div', { class: 'replay-wrap', hidden: true }, replayBtn);
    const card = h('article', { class: 'scn', 'data-id': sc.id },
      h('h3', {}, h('kbd', { text: String(i + 1), 'aria-hidden': 'true' }), h('span', { text: sc.title })),
      h('p', { class: 'blurb', text: sc.blurb }),
      h('div', { class: 'chips', 'aria-label': 'Data labels involved' },
        (sc.labels || []).map((l) => h('span', { class: 'chip', text: l })),
        sc.service ? h('span', { class: 'chip svc', text: 'service: ' + sc.service }) : null),
      h('span', { class: 'expect', 'data-expect': sc.expect, text: EXPECT[sc.expect] || 'Expected: ' + sc.expect }),
      h('div', { class: 'scn-actions' }, runBtn, replayWrap));
    runBtn.addEventListener('click', () => startRun(sc.id, 'live'));
    replayBtn.addEventListener('click', () => startRun(sc.id, 'replay'));
    box.append(card);
    S.cards[sc.id] = { card, runBtn, replayBtn, replayWrap };
  });
  setBusy(S.running);
}
async function loadScenarios() {
  try {
    const r = await fetch('/api/scenarios', { cache: 'no-store' });
    S.scenarios = await r.json();
    renderScenarios();
    pollStatusNow();
  } catch (e) {
    $('#scenarios').replaceChildren(h('p', { class: 'reset-msg', text: 'The console server is not answering, so scenarios could not load. Retrying.' }));
    setTimeout(loadScenarios, 3000);
  }
}
let pollStarted = false;
function pollStatusNow() { if (!pollStarted) { pollStarted = true; pollStatus(); } }

function setBusy(busy) {
  for (const c of Object.values(S.cards)) { c.runBtn.disabled = busy; c.replayBtn.disabled = busy; }
  $('#reset-btn').disabled = busy;
  $('#stop-btn').disabled = !busy;
}

/* ---------- value rendering ---------- */
const SECRET_KEY = /(^|[._-])(token|secret|password|authorization|uaepass_session|guard_session_id|session_id|session)$/i;
const RAW_KEY = /(raw_value|document_value|file_content|base64|raw_text)$/i;

function flatten(o, prefix = '', depth = 0, out = []) {
  if (o == null) return out;
  if (typeof o !== 'object') { out.push([prefix || 'value', o]); return out; }
  for (const [k, v] of Object.entries(o)) {
    const key = prefix ? prefix + '.' + k : k;
    if (v && typeof v === 'object' && !Array.isArray(v) && depth < 2 && Object.keys(v).length) flatten(v, key, depth + 1, out);
    else if (Array.isArray(v) && depth < 2 && v.length && v.every((x) => x && typeof x === 'object' && !Array.isArray(x))) v.forEach((x, i) => flatten(x, key + '[' + i + ']', depth + 1, out));
    else out.push([key, v]);
  }
  return out;
}
const isPrim = (v) => v == null || ['string', 'number', 'boolean'].includes(typeof v);

function valueNodes(key, v) {
  const last = key.split('.').pop();
  if (RAW_KEY.test(last)) return [h('span', { class: 'v none', text: 'withheld' })];
  if (SECRET_KEY.test(last) && typeof v === 'string' && v && !/^\(.*\)$|…$/.test(v)) return [h('span', { class: 'v', text: v.slice(0, 6) + '…' })];
  if (Array.isArray(v)) {
    if (!v.length) return [h('span', { class: 'none', text: 'none' })];
    return v.map((x) => h('span', { class: 'vchip', text: isPrim(x) ? String(x) : JSON.stringify(x) }));
  }
  if (v && typeof v === 'object') return [h('span', { class: 'none', text: 'none' })];
  if (v == null) return [h('span', { class: 'none', text: 'none' })];
  if (typeof v === 'string' && !/^[a-z0-9_.:\-/]+$/i.test(v)) return [h('span', { class: 'v plain', text: v })];
  return [h('span', { class: 'v', text: String(v) })];
}
function kvList(obj, label) {
  const rows = flatten(obj);
  const dl = h('dl', { class: 'kv', 'aria-label': label });
  if (!rows.length) { dl.append(h('dt', { text: '' }), h('dd', {}, h('span', { class: 'none', text: 'nothing' }))); return dl; }
  for (const [k, v] of rows) dl.append(h('dt', { text: k }), h('dd', {}, valueNodes(k, v)));
  return dl;
}

/* ---------- step cards ---------- */
function stepCard(s) {
  const d = s.decision;
  const denied = (d && d.decision === 'deny') || (s.kind === 'tamm.tool' && s.response && s.response.denied === true && !d);
  const card = h('article', { class: 'step', 'data-actor': s.actor || 'app', 'data-n': String(s.n), 'data-deny': denied ? '1' : null });
  const head = h('div', { class: 'step-head' },
    h('span', { class: 'n', text: String(s.n).padStart(2, '0') }),
    h('span', { class: 'actor', 'data-actor': s.actor || 'app', text: ACTOR[s.actor] || s.actor || 'App' }),
    h('h3', { class: 'step-title', text: s.title || s.kind }),
    s.replay ? h('span', { class: 'tag-replay', text: 'replay' }) : null,
    h('span', { class: 'cost' }, h('strong', { text: (s.ms ?? 0) + ' ms' }), h('span', { class: 'at', text: 'at ' + ((s.atMs ?? 0) / 1000).toFixed(2) + ' s' })));
  card.append(head);

  if (d) {
    const dec = h('div', { class: 'decision', 'data-d': d.decision },
      h('div', { class: 'decision-row' },
        h('span', { class: 'dchip', 'data-d': d.decision }, icon(d.decision), DECISION[d.decision] || d.decision),
        d.policy_rule ? h('code', { class: 'rule', text: d.policy_rule }) : null),
      d.reason ? h('p', { class: 'reason', text: d.reason }) : null,
      d.blocked_labels && d.blocked_labels.length
        ? h('div', { class: 'blocked-labels' }, 'Blocked labels:', d.blocked_labels.map((l) => h('span', { class: 'chip', text: l })))
        : null);
    card.append(dec);
  }
  if (d && d.decision === 'deny') {
    card.append(h('div', { class: 'nothing-sent', role: 'note' }, icon('lock'),
      h('div', {}, 'Nothing was sent to TAMM', h('small', { text: 'Guard refused the call before the TAMM backend was reached, so nothing was created.' }))));
  }
  if (s.status) {
    card.append(h('div', { class: 'status-line' }, 'TAMM application status (mock):', h('span', { class: 'status-badge', text: s.status })));
  }
  card.append(h('div', { class: 'io' },
    h('div', {}, h('h4', { text: 'Request' }), kvList(s.request, 'Request')),
    h('div', {}, h('h4', { text: 'Response' }), kvList(s.response, 'Response'))));
  return card;
}

/* ---------- stepper ---------- */
function resetStepper() {
  for (const e of document.querySelectorAll('#stepper .st, #stepper .st-link')) e.dataset.state = 'todo';
  $('#stepper-extra').textContent = '';
  $('#stepper-note').textContent = 'No application yet.';
  S.statusSeen = false;
}
function updateStepper(s) {
  if (!s.status || !String(s.kind || '').startsWith('tamm.')) return;
  const status = s.status;
  const idx = STATUS_ORDER.indexOf(status);
  const extra = $('#stepper-extra');
  const appId = (s.response && s.response.application_id) || (s.request && s.request.application_id) || '';
  if (idx >= 0) {
    S.statusSeen = true;
    extra.textContent = '';
    const steps = document.querySelectorAll('#stepper .st');
    const links = document.querySelectorAll('#stepper .st-link');
    steps.forEach((e, i) => { e.dataset.state = i < idx ? 'done' : i === idx ? (idx === STATUS_ORDER.length - 1 ? 'done' : 'current') : 'todo'; });
    links.forEach((e, i) => { e.dataset.state = i < idx ? 'done' : 'todo'; });
    $('#stepper-note').textContent = (appId ? appId + ': ' : '') + status.replace('_', ' ');
  } else if (status === 'needs_info' || status === 'rejected') {
    S.statusSeen = true;
    extra.textContent = status === 'rejected' ? 'Rejected' : 'Needs more information';
    $('#stepper-note').textContent = (appId ? appId + ': ' : '') + status.replace('_', ' ');
  }
}

/* ---------- timeline reveal ---------- */
function clearView() {
  $('#timeline').replaceChildren();
  $('#outcome').hidden = true;
  $('#outcome').replaceChildren();
  $('#empty').hidden = false;
  resetStepper();
  S.stepsSeen = 0;
}
function setBar(titleText, mode, stateText) {
  const t = $('#bar-title');
  t.replaceChildren(h('span', { text: titleText }));
  if (mode) t.append(h('span', { class: 'pill ' + mode, text: mode === 'replay' ? 'Replay of a recorded run' : 'Live run' }));
  if (RECORD && mode === 'live') t.append(h('span', { class: 'pill replay', text: 'Recording' }));
  if (stateText) t.append(h('span', { class: 'stepper-note', text: stateText }));
}
function bringIntoView(node) { node.scrollIntoView({ block: 'nearest', behavior: REDUCED() ? 'auto' : 'smooth' }); }

function reveal(item) {
  const tl = $('#timeline');
  if (item.type === 'step') {
    $('#empty').hidden = true;
    S.stepsSeen += 1;
    const card = stepCard(item.data);
    tl.append(card);
    updateStepper(item.data);
    bringIntoView(card);
  } else if (item.type === 'done') {
    showOutcome(item.data);
    endRun();
    const sc = S.scenarios.find((x) => x.id === S.scenario);
    setBar(sc ? sc.title : 'Run', S.mode, 'Finished: ' + (item.data.outcome || 'error'));
    announce((OUTCOME[item.data.outcome] || 'Run finished') + '. ' + (item.data.summary || ''));
  } else if (item.type === 'fail') {
    $('#empty').hidden = true;
    const f = item.data || {};
    const box = h('div', { class: 'fail', role: 'alert' },
      h('h3', {}, icon('warn'), h('span', { text: 'The run could not finish' })),
      h('p', { text: f.message || 'Something went wrong before the run could finish.' }),
      f.hint ? h('div', {}, h('div', { class: 'lbl', text: 'How to start it again' }), h('pre', { text: f.hint })) : null);
    tl.append(box);
    bringIntoView(box);
    endRun();
    const sc = S.scenarios.find((x) => x.id === S.scenario);
    setBar(sc ? sc.title : 'Run', S.mode, 'Stopped: service problem');
    announce('The run could not finish. ' + (f.message || ''));
  }
}
function showOutcome(d) {
  const out = $('#outcome');
  const o = ['allowed', 'blocked', 'mixed', 'error'].includes(d.outcome) ? d.outcome : 'error';
  out.dataset.outcome = o;
  out.replaceChildren(
    h('h3', { text: (S.mode === 'replay' ? 'Replay: ' : '') + OUTCOME[o] }),
    d.summary ? h('p', { class: 'sum', text: d.summary }) : null,
    h('p', { class: 'fine', text: (typeof d.ms === 'number' ? d.ms + ' ms of service time, not counting the pause between steps. ' : '') + 'One mock run: it shows a single policy decision and does not prove the agent is safe end to end.' }));
  out.hidden = false;
  if (!S.statusSeen) $('#stepper-note').textContent = 'No application was created in this run.';
  bringIntoView(out);
}

function delay() { return S.fast ? FAST_MS : PACE_MS; }
function pump() {
  if (S.timer || !S.queue.length) return;
  const wait = Math.max(0, S.lastAt + delay() - performance.now());
  const token = S.token;
  S.timer = setTimeout(() => {
    S.timer = null;
    if (token !== S.token) return;
    const item = S.queue.shift();
    if (!item) return;
    S.lastAt = performance.now();
    reveal(item);
    pump();
  }, wait);
}
function enqueue(type, data) { S.queue.push({ type, data }); pump(); }

/* ---------- run control ---------- */
function closeStream() { if (S.es) { S.es.close(); S.es = null; } }
function endRun() {
  S.running = false;
  closeStream();
  setBusy(false);
  for (const c of Object.values(S.cards)) c.card.removeAttribute('aria-current');
}

function startRun(id, mode) {
  if (S.running) { announce('A run is in progress. Press Escape to stop it first.'); return; }
  const sc = S.scenarios.find((x) => x.id === id);
  if (!sc) return;
  if (mode === 'replay' && !S.replays.includes(id)) { announce('No recorded run for this scenario.'); return; }
  clearTimeout(S.timer); S.timer = null; S.queue = []; S.token += 1;
  clearView();
  S.running = true; S.scenario = id; S.mode = mode; S.gotTerminal = false; S.lastAt = 0;
  setBusy(true);
  S.cards[id].card.setAttribute('aria-current', 'true');
  setBar(sc.title, mode === 'replay' ? 'replay' : 'live', 'Running');
  announce((mode === 'replay' ? 'Replaying recorded run: ' : 'Running live: ') + sc.title);
  const token = S.token;
  const url = (mode === 'replay' ? '/api/replay/' : '/api/run/') + encodeURIComponent(id) + (mode === 'live' && RECORD ? '?record=1' : '');
  const es = new EventSource(url);
  S.es = es;
  const parse = (e) => { try { return JSON.parse(e.data); } catch (x) { return null; } };
  es.addEventListener('step', (e) => { if (token !== S.token) return; const d = parse(e); if (d) enqueue('step', d); });
  es.addEventListener('done', (e) => { if (token !== S.token) return; S.gotTerminal = true; closeStream(); enqueue('done', parse(e) || { outcome: 'error', summary: 'The run finished but its result could not be read.' }); });
  es.addEventListener('fail', (e) => { if (token !== S.token) return; S.gotTerminal = true; closeStream(); enqueue('fail', parse(e) || { message: 'The run failed.', hint: '' }); });
  es.onerror = () => {
    if (token !== S.token || S.gotTerminal) return;
    S.gotTerminal = true; closeStream();
    enqueue('fail', {
      message: S.stepsSeen || S.queue.length
        ? 'The connection to the console server dropped before the run finished.'
        : 'The console could not reach its own server, so the run did not start.',
      hint: FALLBACK_HINT,
    });
  };
}

function stopRun() {
  if (!S.running) return;
  S.token += 1;
  clearTimeout(S.timer); S.timer = null; S.queue = [];
  const sc = S.scenarios.find((x) => x.id === S.scenario);
  endRun();
  const out = $('#outcome');
  out.dataset.outcome = 'stopped';
  out.replaceChildren(h('h3', { text: 'Stopped by the presenter' }), h('p', { class: 'sum', text: 'The run was cut short after ' + S.stepsSeen + ' step' + (S.stepsSeen === 1 ? '' : 's') + '. Reset the demo before the next live run.' }));
  out.hidden = false;
  setBar(sc ? sc.title : 'Run', S.mode, 'Stopped');
  announce('Run stopped.');
}

async function resetDemo() {
  if (S.running) { announce('A run is in progress. Press Escape to stop it first.'); return; }
  const msg = $('#reset-msg');
  const btn = $('#reset-btn');
  btn.disabled = true;
  msg.textContent = 'Resetting.';
  let text;
  try {
    const r = await fetch('/api/reset', { method: 'POST' });
    const j = await r.json();
    text = j.ok ? 'Demo reset: mock TAMM and Guard are back to their starting state.'
      : 'Reset incomplete: TAMM ' + (j.tamm ? 'reset' : 'not reset') + ', Guard ' + (j.guard ? 'reset' : 'not reset') + '.';
  } catch (e) {
    text = 'Reset failed: the console server did not answer.';
  }
  clearView();
  setBar('No run yet');
  msg.textContent = text;
  announce(text);
  btn.disabled = S.running;
}

/* ---------- wiring ---------- */
$('#reset-btn').addEventListener('click', resetDemo);
$('#stop-btn').addEventListener('click', stopRun);
$('#fast-btn').addEventListener('click', (e) => {
  S.fast = !S.fast;
  e.currentTarget.setAttribute('aria-pressed', String(S.fast));
  pump();
});
$('#details-btn').addEventListener('click', (e) => {
  S.hide = !S.hide;
  e.currentTarget.setAttribute('aria-pressed', String(S.hide));
  $('#timeline').classList.toggle('hide-details', S.hide);
});

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const tag = (e.target && e.target.tagName) || '';
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
  if (e.key === 'Escape') { if (S.running) { e.preventDefault(); stopRun(); } return; }
  if (e.key === 'r' || e.key === 'R') { e.preventDefault(); resetDemo(); return; }
  if (/^[1-9]$/.test(e.key)) {
    const sc = S.scenarios[Number(e.key) - 1];
    if (sc) { e.preventDefault(); startRun(sc.id, 'live'); }
  }
});

loadScenarios();
