// Release QA reproducer. Synthetic data only; live-provider disclosure is not acknowledged.
// Usage: node docs/qa/repro/concurrent-approval.mjs http://127.0.0.1:3107 [runs] [output.json]
// The tested app must use deterministic demo mode and a running real Guard sidecar.
import { writeFile } from 'node:fs/promises';

const baseUrl = (process.argv[2] ?? 'http://127.0.0.1:3107').replace(/\/$/, '');
const runs = Number(process.argv[3] ?? 1);
if (!Number.isInteger(runs) || runs < 1 || runs > 5) throw new Error('runs must be 1 to 5');
const endpoint = `${baseUrl}/api/agent/journey`;
async function post(body) {
  const response = await fetch(endpoint, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(15000),
  });
  return { http_status: response.status, body: await response.json() };
}
const results = [];
for (let run = 1; run <= runs; run++) {
  const extract = await post({ action: 'extract', case_id: 'synthetic_release_qa', document: {
    ref: `synthetic_release_qa_passport_${run}`, kind: 'passport',
    text: 'Full name: Layla Haddad\nPassport number: FAKE-P-001\nNationality: Jordanian\nDate of birth: 1991-04-12\nExpiry date: 2031-04-11',
  } });
  if (extract.body.provenance?.live_model_call !== false || extract.body.status !== 'awaiting_review') {
    throw new Error(`Requires an allowed deterministic extraction: HTTP ${extract.http_status}, status ${extract.body.status}`);
  }
  const confirm = await post({ action: 'confirm', journey_id: extract.body.id, confirmed_by: 'newcomer' });
  if (confirm.body.status !== 'awaiting_approval' || !confirm.body.proposal) throw new Error('Review did not return an approval proposal');
  const proposal = confirm.body.proposal;
  const approval = { action: 'decide', journey_id: extract.body.id, proposal_id: proposal.proposal_id,
    digest: proposal.digest, approved: true, approved_by: 'newcomer' };
  const responses = await Promise.all([post(approval), post(approval)]);
  const replies = responses.map(({ http_status, body }) => ({
    http_status, status: body.status, error: body.error?.code,
    reference: body.action_result?.reference,
    action_executed_audit_count: body.audit?.filter((entry) => entry.event === 'action_executed').length ?? 0,
    guard_decisions: body.audit?.filter((entry) => entry.event === 'action_checked').map((entry) => entry.decision) ?? [],
  }));
  const executions = Math.max(...replies.map((reply) => reply.action_executed_audit_count));
  results.push({ run, expected_maximum_action_executions: 1, observed_action_executions: executions,
    duplicated: executions > 1, responses: replies });
}
const evidence = { at: new Date().toISOString(), endpoint, synthetic: true,
  mode: 'deterministic-demo; no live model call', downstream: 'mock in-memory employer request', results };
const serialized = JSON.stringify(evidence, null, 2) + '\n';
if (process.argv[4]) await writeFile(process.argv[4], serialized);
process.stdout.write(serialized);
process.exitCode = results.some((result) => result.duplicated) ? 1 : 0;
