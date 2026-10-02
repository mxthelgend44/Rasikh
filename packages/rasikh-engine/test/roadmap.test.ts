import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTRACT_VERSION, DEMO_FIXTURES } from '@rasikh/shared';
import { planRoadmap, getBlockers, getUnlocks, getCriticalPath } from '../src/index.js';
import { orderGraph } from '../src/graph.js';
import type { CaseInput, CaseState, StepDefinition } from '../src/types.js';

const input: CaseInput = { case_id: DEMO_FIXTURES.hire, journey: 'individual_relocation' };
const allDocuments = [{ ref: DEMO_FIXTURES.passportDoc, labels: ['passport', 'employment', 'emirates_id', 'family', 'address'] as const }];
function state(overrides: Partial<CaseState> = {}): CaseState {
  return { input, completed_step_ids: [], documents: allDocuments.map((document) => ({ ...document, labels: [...document.labels] })), ...overrides };
}
const individualIds = ['collect_documents', 'residency_visa', 'health_insurance', 'emirates_id', 'housing_search', 'tawtheeq_register', 'bank_account', 'fully_settled'];

test('individual roadmap has a stable order, typed shared version, and structured reasons', () => {
  const result = planRoadmap(input);
  assert.equal(result.contract_version, CONTRACT_VERSION);
  assert.deepEqual(result.steps.map((step) => step.id), individualIds);
  assert.equal(result.illustrative, true);
  for (const step of result.steps) {
    assert.equal(step.estimated_duration_days.illustrative, true);
    assert.equal(step.illustrative, true);
    assert.deepEqual(Object.keys(step.reasons[0]).sort(), ['criterion', 'effect', 'explanation_key', 'value']);
  }
});

test('every journey is an acyclic graph with dependencies before their dependants', () => {
  for (const journey of ['individual_relocation', 'family_relocation', 'company_setup', 'team_transfer'] as const) {
    const steps = planRoadmap({ case_id: 'synthetic', journey }).steps;
    const seen = new Set<string>();
    for (const step of steps) {
      assert.ok(step.depends_on.every((dependency) => seen.has(dependency)), step.id);
      seen.add(step.id);
    }
    assert.equal(steps.filter((step) => step.terminal).length, 1);
  }
});

test('family includes dependent residency and school before fully settled', () => {
  const steps = planRoadmap({ ...input, journey: 'family_relocation' }).steps;
  assert.deepEqual(steps.map((step) => step.id), [...individualIds.slice(0, -1), 'family_residency', 'school_registration', 'fully_settled']);
  assert.ok(steps.at(-1)!.depends_on.includes('school_registration'));
});

test('each setup path substitutes its real licensing authority', () => {
  const authorities = { mainland: 'Abu Dhabi Department of Economic Development (ADDED)', adgm: 'ADGM', kezad: 'KEZAD Group', masdar: 'Masdar City Free Zone', twofour54: 'twofour54' };
  for (const [setup_path, authority] of Object.entries(authorities)) {
    const steps = planRoadmap({ case_id: DEMO_FIXTURES.company, journey: 'company_setup', setup_path: setup_path as CaseInput['setup_path'] }).steps;
    assert.deepEqual(steps.find((step) => step.id === 'economic_license')!.parties, [authority]);
    assert.equal(steps.at(-1)!.id, 'fully_operational');
  }
});

test('team uses shared demo ids and enforces sponsorship before every employee residency', () => {
  const teamInput: CaseInput = { case_id: DEMO_FIXTURES.company, journey: 'team_transfer' };
  const steps = planRoadmap(teamInput).steps;
  const blockers = getBlockers(state({ input: teamInput }));
  for (const employee of DEMO_FIXTURES.transferredHires) {
    const residency = steps.find((step) => step.id === `${employee}:residency_visa`)!;
    assert.ok(residency.depends_on.includes('entity_can_sponsor'));
    assert.ok(blockers.blockers.find((step) => step.step_id === residency.id)!.unmet_dependencies.includes('entity_can_sponsor'));
  }
  assert.equal(steps.length, 32);
});

test('verified external sponsorship omits company setup and satisfies the gate', () => {
  const teamInput: CaseInput = { case_id: DEMO_FIXTURES.company, journey: 'team_transfer', sponsoring_entity_ready: true, employee_ids: ['hire_demo_002'] };
  const steps = planRoadmap(teamInput).steps;
  assert.equal(steps.length, 10);
  assert.equal(steps[0].external, true);
  const result = getBlockers(state({ input: teamInput, completed_step_ids: ['hire_demo_002:collect_documents'] }));
  assert.ok(!result.blockers.some((step) => step.step_id === 'hire_demo_002:residency_visa'));
});

test('planning does not mutate inputs or reuse mutable catalog results', () => {
  const teamInput: CaseInput = { case_id: 'company_demo_001', journey: 'team_transfer', employee_ids: ['hire_demo_003', 'hire_demo_002'] };
  const before = JSON.stringify(teamInput);
  const first = planRoadmap(teamInput);
  first.steps[0].depends_on.push('bad');
  assert.equal(JSON.stringify(teamInput), before);
  assert.deepEqual(planRoadmap(teamInput).steps[0].depends_on, []);
  assert.equal(planRoadmap(teamInput).steps[7].subject_ref, 'hire_demo_003');
});

test('invalid inputs fail with explicit stable errors', () => {
  assert.throws(() => planRoadmap({ ...input, case_id: '' }), /invalid_case_id/);
  assert.throws(() => planRoadmap({ ...input, journey: 'bad' } as unknown as CaseInput), /invalid_journey/);
  assert.throws(() => planRoadmap({ ...input, setup_path: 'bad' } as unknown as CaseInput), /invalid_setup_path/);
  for (const employee_ids of [[], ['same', 'same'], ['bad:id']]) assert.throws(() => planRoadmap({ ...input, employee_ids }), /invalid_employee_ids/);
});

test('blockers expose exact direct unmet dependencies and missing documents', () => {
  const result = getBlockers(state({ documents: [] }));
  assert.deepEqual(result.blockers.find((step) => step.step_id === 'collect_documents')!.missing_documents, ['passport', 'employment']);
  assert.deepEqual(result.blockers.find((step) => step.step_id === 'tawtheeq_register')!.unmet_dependencies, ['residency_visa', 'housing_search']);
  assert.deepEqual(result.blockers.find((step) => step.step_id === 'tawtheeq_register')!.missing_documents, ['passport', 'emirates_id']);
});

test('finishing a predecessor unlocks only ready steps, and completed steps are excluded', () => {
  const result = getBlockers(state({ completed_step_ids: ['collect_documents'] }));
  for (const id of ['collect_documents', 'residency_visa', 'health_insurance', 'housing_search']) assert.ok(!result.blockers.some((step) => step.step_id === id));
  assert.deepEqual(result.blockers.find((step) => step.step_id === 'emirates_id')!.unmet_dependencies, ['residency_visa']);
});

test('derived signals cannot substitute for original documents', () => {
  const result = getBlockers(state({ documents: [{ ref: 'synthetic_signal', labels: ['passport', 'employment'], derived: true }] }));
  assert.deepEqual(result.blockers[0].missing_documents, ['passport', 'employment']);
});

test('team subject document overrides prevent another person documents satisfying a requirement', () => {
  const teamInput: CaseInput = { case_id: DEMO_FIXTURES.company, journey: 'team_transfer', employee_ids: ['hire_demo_002', 'hire_demo_003'] };
  const result = getBlockers(state({ input: teamInput, documents_by_subject: { hire_demo_002: [] } }));
  assert.deepEqual(result.blockers.find((step) => step.step_id === 'hire_demo_002:collect_documents')!.missing_documents, ['passport', 'employment']);
  assert.ok(!result.blockers.some((step) => step.step_id === 'hire_demo_003:collect_documents'));
});

test('completed step state is supported and contradictory state fails', () => {
  const result = getBlockers(state({ step_states: [{ step_id: 'collect_documents', status: 'completed', since: '2026-10-01T00:00:00Z' }] }));
  assert.ok(!result.blockers.some((step) => step.step_id === 'residency_visa'));
  assert.throws(() => getBlockers(state({ completed_step_ids: ['collect_documents'], step_states: [{ step_id: 'collect_documents', status: 'waiting', since: '2026-10-01T00:00:00Z' }] })), /conflicting_step_status/);
});

test('state rejects unknown steps, labels, duplicate statuses, and subjects', () => {
  assert.throws(() => getBlockers(state({ completed_step_ids: ['bogus'] })), /unknown_completed_step/);
  assert.throws(() => getBlockers(state({ completed_step_ids: ['collect_documents', 'collect_documents'] })), /duplicate_completed_step/);
  assert.throws(() => getBlockers(state({ documents: [{ ref: 'x', labels: ['bogus'] }] } as unknown as Partial<CaseState>)), /invalid_document_ref/);
  assert.throws(() => getBlockers(state({ documents_by_subject: { bogus: [] } })), /unknown_subject/);
});

test('fully completed journeys have no blockers', () => {
  for (const journey of ['individual_relocation', 'family_relocation', 'company_setup', 'team_transfer'] as const) {
    const caseInput = { case_id: 'synthetic', journey };
    assert.deepEqual(getBlockers(state({ input: caseInput, documents: [], completed_step_ids: planRoadmap(caseInput).steps.map((step) => step.id) })).blockers, []);
  }
});

test('unlocks distinguish direct and eventual dependants', () => {
  const result = getUnlocks('collect_documents', input);
  assert.deepEqual(result.directly_enables, ['residency_visa', 'health_insurance', 'housing_search']);
  assert.ok(result.eventually_enables.includes('fully_settled'));
  assert.ok(!result.directly_enables.includes('fully_settled'));
  assert.equal(result.reasons[0].explanation_key, 'roadmap.unlock_is_one_of_dependencies');
});

test('unlocks include employee residency when the company sponsorship gate completes', () => {
  const result = getUnlocks('entity_can_sponsor', { case_id: DEMO_FIXTURES.company, journey: 'team_transfer' });
  for (const employee of DEMO_FIXTURES.transferredHires) assert.ok(result.directly_enables.includes(`${employee}:residency_visa`));
  assert.deepEqual(getUnlocks('fully_settled', input).eventually_enables, []);
  assert.throws(() => getUnlocks('bogus', input), /unknown_step/);
});

test('single argument unlocks infer individual family or company context', () => {
  assert.ok(getUnlocks('family_residency').directly_enables.includes('school_registration'));
  assert.ok(getUnlocks('economic_license').directly_enables.includes('establishment_card'));
});

test('critical path is longest weighted remaining dependency chain', () => {
  const result = getCriticalPath(state());
  assert.deepEqual(result.step_ids, ['collect_documents', 'residency_visa', 'emirates_id', 'bank_account', 'fully_settled']);
  assert.equal(result.estimated_remaining_days.value, 14);
  assert.equal(result.estimated_remaining_days.illustrative, true);
});

test('critical paths cover family company and cross-company team dependencies', () => {
  for (const [journey, days] of [['family_relocation', 15], ['company_setup', 16], ['team_transfer', 28]] as const) {
    const result = getCriticalPath(state({ input: { case_id: 'synthetic', journey } }));
    assert.equal(result.estimated_remaining_days.value, days, journey);
  }
});

test('completed joins cut off completed work from the remaining critical path', () => {
  assert.equal(getCriticalPath(state({ completed_step_ids: ['collect_documents', 'residency_visa'] })).estimated_remaining_days.value, 7);
  assert.deepEqual(getCriticalPath(state({ completed_step_ids: ['fully_settled'] })).step_ids, []);
});

test('graph validation rejects duplicates, unknown dependencies and cycles', () => {
  const step = planRoadmap(input).steps[0];
  assert.throws(() => orderGraph([step, step]), /duplicate_step_id/);
  assert.throws(() => orderGraph([{ ...step, depends_on: ['unknown'] }]), /unknown_dependency/);
  assert.throws(() => orderGraph([{ ...step, depends_on: [step.id] }]), /cyclic_dependency_graph/);
  assert.throws(() => orderGraph([{ ...step, depends_on: [step.id, step.id] }]), /duplicate_dependency/);
  assert.deepEqual(orderGraph([] as StepDefinition[]), []);
});
