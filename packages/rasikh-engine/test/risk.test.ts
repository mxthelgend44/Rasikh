import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTRACT_VERSION, DEMO_FIXTURES } from '@rasikh/shared';
import type { CaseState, RiskConfig } from '../src/types.js';
import { planRoadmap } from '../src/roadmap.js';
import { detectRisks } from '../src/index.js';

const start = '2026-10-01T00:00:00Z';
function state(overrides: Partial<CaseState> = {}): CaseState {
  return {
    input: { case_id: DEMO_FIXTURES.hire, journey: 'individual_relocation' },
    completed_step_ids: [],
    documents: [{ ref: DEMO_FIXTURES.passportDoc, labels: ['passport', 'employment'] }],
    as_of: '2026-10-02T00:00:00Z',
    ...overrides,
  };
}

test('the public API reports an ordinary initial dependency queue on track without premature downstream document risks', () => {
  const result = detectRisks(state());
  assert.equal(result.contract_version, CONTRACT_VERSION);
  assert.equal(result.illustrative, true);
  assert.equal(result.risk_level, 'on_track');
  assert.deepEqual(result.findings, []);
  assert.equal(result.reasons[0].explanation_key, 'risk.no_rule_matched');
});

test('missing documents on an actionable step identify exact labels and collection actions', () => {
  const result = detectRisks(state({ documents: [] }));
  assert.equal(result.risk_level, 'at_risk');
  const direct = result.findings.filter((finding) => finding.step_id === 'collect_documents');
  assert.deepEqual(
    direct.map((finding) => finding.next_action.document_label),
    ['passport', 'employment'],
  );
  assert.deepEqual(direct[0].reason, {
    criterion: 'document',
    value: { document_label: 'passport' },
    effect: 'blocked',
    explanation_key: 'risk.document_missing',
  });
  assert.deepEqual(direct[0].next_action, {
    action_key: 'collect_document',
    step_id: 'collect_documents',
    document_label: 'passport',
  });
});

test('missing dependency documents propagate transitively without duplicate join findings', () => {
  const result = detectRisks(state({ documents: [] }));
  const terminal = result.findings.filter((finding) => finding.step_id === 'fully_settled');
  assert.equal(terminal.length, 2);
  assert.deepEqual(terminal[0].reason.value, {
    dependency_id: 'collect_documents',
    document_label: 'passport',
  });
  assert.equal(terminal[0].reason.explanation_key, 'risk.dependency_document_missing');
  assert.deepEqual(terminal[0].next_action, {
    action_key: 'collect_document',
    step_id: 'collect_documents',
    dependency_id: 'collect_documents',
    document_label: 'passport',
  });
});

test('a downstream document becomes actionable after its dependencies are completed', () => {
  const result = detectRisks(
    state({ completed_step_ids: ['collect_documents', 'residency_visa', 'housing_search'] }),
  );
  const direct = result.findings.find((finding) => finding.step_id === 'tawtheeq_register');
  assert.equal(direct?.next_action.document_label, 'emirates_id');
  assert.equal(direct?.reason.explanation_key, 'risk.document_missing');
  assert.ok(!result.findings.some((finding) => finding.step_id === 'collect_documents'));
});

test('derived signals do not satisfy original-document risk checks', () => {
  const result = detectRisks(
    state({
      documents: [{ ref: 'fake-derived', labels: ['passport', 'employment'], derived: true }],
    }),
  );
  assert.equal(result.risk_level, 'at_risk');
});

test('per-person team document blockers retain the person in action and dependency ids', () => {
  const result = detectRisks(
    state({
      input: {
        case_id: DEMO_FIXTURES.company,
        journey: 'team_transfer',
        employee_ids: [...DEMO_FIXTURES.transferredHires],
      },
      documents_by_subject: {
        hire_demo_002: [],
        hire_demo_003: state().documents,
        hire_demo_004: state().documents,
      },
    }),
  );
  assert.ok(
    result.findings.some(
      (finding) =>
        finding.step_id === 'hire_demo_002:residency_visa' &&
        finding.next_action.dependency_id === 'hire_demo_002:collect_documents',
    ),
  );
  assert.ok(!result.findings.some((finding) => finding.step_id.startsWith('hire_demo_003:')));
});

test('case-level documents cannot hide missing documents for a transferred employee', () => {
  const result = detectRisks(
    state({
      input: {
        case_id: DEMO_FIXTURES.company,
        journey: 'team_transfer',
        employee_ids: ['hire_demo_002'],
      },
    }),
  );
  assert.equal(result.risk_level, 'at_risk');
  assert.ok(
    result.findings.some(
      (finding) =>
        finding.step_id === 'hire_demo_002:collect_documents' &&
        finding.next_action.document_label === 'passport',
    ),
  );
});

test('waiting and in_progress are at risk strictly after the illustrative window', () => {
  for (const status of ['waiting', 'in_progress'] as const) {
    const result = detectRisks(
      state({
        as_of: '2026-10-04T00:00:00Z',
        step_states: [{ step_id: 'collect_documents', status, since: start }],
      }),
    );
    assert.equal(result.risk_level, 'at_risk');
    assert.deepEqual(result.findings[0].reason.value, {
      status,
      elapsed_days: 3,
      illustrative_window_days: 2,
      stuck_after_days: 4,
    });
    assert.equal(result.findings[0].reason.explanation_key, 'risk.step_overdue');
    assert.deepEqual(result.findings[0].next_action, {
      action_key: 'follow_up_step',
      step_id: 'collect_documents',
    });
  }
});

test('exact window and stuck-window boundaries use strict comparisons', () => {
  const status = [{ step_id: 'collect_documents', status: 'waiting' as const, since: start }];
  assert.equal(
    detectRisks(state({ as_of: '2026-10-03T00:00:00Z', step_states: status })).risk_level,
    'on_track',
  );
  assert.equal(
    detectRisks(state({ as_of: '2026-10-05T00:00:00Z', step_states: status })).risk_level,
    'at_risk',
  );
  assert.equal(
    detectRisks(state({ as_of: '2026-10-05T00:00:00.001Z', step_states: status })).risk_level,
    'stuck',
  );
});

test('an overdue missing-document action takes priority over generic follow-up', () => {
  const result = detectRisks(
    state({
      documents: [],
      as_of: '2026-10-06T00:00:00Z',
      step_states: [
        { step_id: 'residency_visa', status: 'waiting', since: '2026-09-20T00:00:00Z' },
      ],
    }),
  );
  assert.equal(result.risk_level, 'stuck');
  const elapsed = result.findings.find(
    (finding) =>
      finding.step_id === 'residency_visa' && finding.reason.criterion === 'elapsed_days',
  )!;
  assert.equal(elapsed.next_action.action_key, 'collect_document');
  assert.equal(elapsed.next_action.step_id, 'collect_documents');
});

test('an overdue dependency wait identifies the unmet dependency when its documents exist', () => {
  const result = detectRisks(
    state({
      as_of: '2026-10-12T00:00:00Z',
      step_states: [{ step_id: 'residency_visa', status: 'waiting', since: start }],
    }),
  );
  assert.equal(result.risk_level, 'stuck');
  assert.deepEqual(result.findings[0].next_action, {
    action_key: 'complete_dependency',
    step_id: 'residency_visa',
    dependency_id: 'collect_documents',
  });
});

test('pending steps never acquire time risks, however long they have been pending', () => {
  assert.equal(
    detectRisks(
      state({
        as_of: '2026-12-01T00:00:00Z',
        step_states: [{ step_id: 'collect_documents', status: 'pending', since: start }],
      }),
    ).risk_level,
    'on_track',
  );
});

test('zero-day milestones use an illustrative one-day floor', () => {
  const input = { case_id: DEMO_FIXTURES.company, journey: 'company_setup' as const };
  const completed_step_ids = planRoadmap(input)
    .steps.map((step) => step.id)
    .filter((id) => id !== 'fully_operational');
  const initial = state({
    input,
    completed_step_ids,
    documents: [],
    as_of: '2026-10-02T00:00:00Z',
    step_states: [{ step_id: 'fully_operational', status: 'waiting', since: start }],
  });
  assert.equal(detectRisks(initial).risk_level, 'on_track');
  assert.equal(detectRisks({ ...initial, as_of: '2026-10-02T12:00:00Z' }).risk_level, 'at_risk');
  assert.equal(detectRisks({ ...initial, as_of: '2026-10-03T12:00:00Z' }).risk_level, 'stuck');
});

test('custom multipliers tune the stuck threshold without changing the at-risk window', () => {
  const waiting = state({
    as_of: '2026-10-06T00:00:00Z',
    step_states: [{ step_id: 'collect_documents', status: 'waiting', since: start }],
  });
  assert.equal(detectRisks(waiting).risk_level, 'stuck');
  assert.equal(detectRisks(waiting, { stuck_window_multiplier: 3 }).risk_level, 'at_risk');
  for (const value of [0, 1, -1, NaN, Infinity, '2', null])
    assert.throws(
      () => detectRisks(waiting, { stuck_window_multiplier: value } as RiskConfig),
      /invalid_stuck_window_multiplier/,
    );
  assert.throws(() => detectRisks(waiting, null as unknown as RiskConfig), /invalid_risk_config/);
  assert.throws(() => detectRisks(waiting, [] as unknown as RiskConfig), /invalid_risk_config/);
});

test('unknown risk config keys reject silent tuning typos', () => {
  assert.throws(
    () => detectRisks(state(), { stuck_window_multipler: 3 } as unknown as Partial<RiskConfig>),
    /unknown_risk_config_key:stuck_window_multipler/,
  );
  assert.throws(
    () =>
      detectRisks(state(), {
        stuck_window_multiplier: 3,
        minimum_window_days: 2,
      } as unknown as Partial<RiskConfig>),
    /unknown_risk_config_key:minimum_window_days/,
  );
  assert.throws(
    () => detectRisks(state(), { '': 2 } as unknown as Partial<RiskConfig>),
    /unknown_risk_config_key:/,
  );
  assert.equal(detectRisks(state(), {}).risk_level, 'on_track');
});

test('completed steps have no document or overdue risks, including completed status records', () => {
  const initial = state({
    completed_step_ids: planRoadmap(state().input).steps.map((step) => step.id),
    documents: [],
    as_of: '2026-12-01T00:00:00Z',
  });
  assert.deepEqual(detectRisks(initial).findings, []);
  const statuses = planRoadmap(initial.input).steps.map((step) => ({
    step_id: step.id,
    status: 'completed' as const,
    since: start,
  }));
  assert.equal(
    detectRisks({ ...initial, completed_step_ids: [], step_states: statuses }).risk_level,
    'on_track',
  );
});

test('explicit timezone timestamps use their actual instant, including minute precision', () => {
  const result = detectRisks(
    state({
      as_of: '2026-10-03T04:00+04:00',
      step_states: [{ step_id: 'collect_documents', status: 'waiting', since: start }],
    }),
  );
  assert.equal(result.risk_level, 'on_track');
});

test('missing timezone, calendar rollovers, invalid clock values and future since are rejected', () => {
  for (const as_of of [
    undefined,
    '',
    '2026-10-02',
    '2026-10-02T00:00:00',
    '2026-02-30T00:00:00Z',
    '2026-10-02T24:00:00Z',
    '2026-10-02T12:60:00Z',
    '2026-10-02T12:00:60Z',
    '2026-10-02T12:00:00+24:00',
    '2026-10-02T12:00:00+04:60',
  ]) {
    assert.throws(() => detectRisks(state({ as_of })), /invalid_as_of/);
  }
  assert.throws(
    () =>
      detectRisks(
        state({
          step_states: [
            { step_id: 'collect_documents', status: 'waiting', since: '2026-02-30T00:00:00Z' },
          ],
        }),
      ),
    /invalid_step_since/,
  );
  assert.throws(
    () =>
      detectRisks(
        state({
          step_states: [
            { step_id: 'collect_documents', status: 'waiting', since: '2026-10-03T00:00:00Z' },
          ],
        }),
      ),
    /future_step_since/,
  );
  assert.equal(detectRisks(state({ as_of: '2024-02-29T00:00:00Z' })).risk_level, 'on_track');
});

test('history evaluates the latest snapshot and preserves an unchanged wait timer', () => {
  const first = state({
    step_states: [{ step_id: 'collect_documents', status: 'waiting', since: start }],
  });
  const latest = { ...first, as_of: '2026-10-06T00:00:00Z' };
  assert.deepEqual(detectRisks([first, latest]), detectRisks(latest));
  assert.equal(detectRisks([first, latest]).risk_level, 'stuck');
  assert.equal(detectRisks([first, first]).risk_level, 'on_track');
});

test('history rejects empty input, reversed clock, different case and different journey', () => {
  const first = state();
  assert.throws(() => detectRisks([]), /empty_case_history/);
  assert.throws(() => detectRisks(new Array<CaseState>(1)), /invalid_case_state/);
  assert.throws(() => detectRisks([first, { ...first, as_of: start }]), /history_time_reversed/);
  assert.throws(
    () => detectRisks([first, { ...first, input: { ...first.input, case_id: 'different' } }]),
    /history_case_changed/,
  );
  assert.throws(
    () =>
      detectRisks([first, { ...first, input: { ...first.input, journey: 'family_relocation' } }]),
    /history_journey_changed/,
  );
});

test('history rejects laundering unchanged wait timers and retroactive status transitions', () => {
  const first = state({
    step_states: [{ step_id: 'collect_documents', status: 'waiting', since: start }],
  });
  assert.throws(
    () =>
      detectRisks([
        first,
        {
          ...first,
          as_of: '2026-10-06T00:00:00Z',
          step_states: [
            { step_id: 'collect_documents', status: 'waiting', since: '2026-10-05T00:00:00Z' },
          ],
        },
      ]),
    /history_unchanged_status_since_changed/,
  );
  assert.throws(
    () =>
      detectRisks([
        first,
        {
          ...first,
          as_of: '2026-10-06T00:00:00Z',
          step_states: [{ step_id: 'collect_documents', status: 'in_progress', since: start }],
        },
      ]),
    /history_transition_predates_snapshot/,
  );
});

test('history allows valid status changes and completion recorded through either representation', () => {
  const first = state({
    step_states: [{ step_id: 'collect_documents', status: 'waiting', since: start }],
  });
  const progressing = {
    ...first,
    as_of: '2026-10-03T00:00:00Z',
    step_states: [
      { step_id: 'collect_documents', status: 'in_progress' as const, since: first.as_of! },
    ],
  };
  assert.equal(detectRisks([first, progressing]).risk_level, 'on_track');
  const completed = {
    ...progressing,
    completed_step_ids: ['collect_documents'],
    step_states: [],
    as_of: '2026-10-04T00:00:00Z',
  };
  assert.equal(detectRisks([first, progressing, completed]).risk_level, 'on_track');
  const completedRecord = {
    ...progressing,
    as_of: '2026-10-04T00:00:00Z',
    step_states: [
      { step_id: 'collect_documents', status: 'completed' as const, since: progressing.as_of },
    ],
  };
  assert.equal(detectRisks([first, progressing, completedRecord]).risk_level, 'on_track');
});

test('history rejects reopened completion and disappearing unfinished statuses', () => {
  assert.throws(
    () => detectRisks([state({ completed_step_ids: ['collect_documents'] }), state()]),
    /history_completed_step_reopened/,
  );
  assert.throws(
    () =>
      detectRisks([
        state({ step_states: [{ step_id: 'collect_documents', status: 'waiting', since: start }] }),
        state(),
      ]),
    /history_step_state_removed/,
  );
});

test('history validates earlier timestamps too, even when the latest state is valid', () => {
  const first = state({ as_of: 'bad' });
  assert.throws(() => detectRisks([first, state()]), /invalid_as_of/);
  assert.throws(
    () =>
      detectRisks([
        state({
          step_states: [{ step_id: 'collect_documents', status: 'completed', since: 'bad' }],
        }),
        state(),
      ]),
    /invalid_step_since/,
  );
});

test('risk detection reuses roadmap state validation', () => {
  assert.throws(
    () => detectRisks(state({ completed_step_ids: ['unknown'] })),
    /unknown_completed_step/,
  );
  assert.throws(
    () =>
      detectRisks(
        state({ step_states: [{ step_id: 'unknown', status: 'waiting', since: start }] }),
      ),
    /invalid_step_state/,
  );
});

test('all reasons have exactly the structured fields and calls never mutate state or history', () => {
  const first = state({
    documents: [],
    step_states: [{ step_id: 'collect_documents', status: 'waiting', since: start }],
  });
  const latest = { ...first, as_of: '2026-10-06T00:00:00Z' };
  const history = [first, latest];
  const before = JSON.stringify(history);
  const result = detectRisks(history);
  for (const reason of result.reasons)
    assert.deepEqual(Object.keys(reason).sort(), [
      'criterion',
      'effect',
      'explanation_key',
      'value',
    ]);
  assert.equal(JSON.stringify(history), before);
  result.findings[0].next_action.document_label = 'degree';
  assert.equal(detectRisks(history).findings[0].next_action.document_label, 'passport');
});
