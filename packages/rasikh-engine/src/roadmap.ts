import { CONTRACT_VERSION, DATA_LABELS, DEMO_FIXTURES } from '@rasikh/shared';
import type { DataLabel, PayloadRef } from '@rasikh/shared';
import catalog from '../data/steps.json' with { type: 'json' };
import { orderGraph } from './graph.js';
import type {
  BlockersResult, CaseInput, CaseState, CriticalPathResult, RoadmapResult,
  StepDefinition, StructuredReason, UnlocksResult,
} from './types.js';

const journeys = ['individual_relocation', 'family_relocation', 'company_setup', 'team_transfer'];
const setupPaths = Object.keys(catalog.licensing_authorities);

export function reason(criterion: string, value: StructuredReason['value'], effect: StructuredReason['effect'], explanation_key: string): StructuredReason {
  return { criterion, value, effect, explanation_key };
}

function validateInput(input: CaseInput): void {
  if (!input || typeof input.case_id !== 'string' || !input.case_id.trim()) throw new TypeError('invalid_case_id');
  if (!journeys.includes(input.journey)) throw new TypeError('invalid_journey');
  if (input.setup_path !== undefined && !setupPaths.includes(input.setup_path)) throw new TypeError('invalid_setup_path');
  if (input.sponsoring_entity_ready !== undefined && typeof input.sponsoring_entity_ready !== 'boolean') throw new TypeError('invalid_sponsoring_entity_ready');
  if (input.employee_ids !== undefined && (!Array.isArray(input.employee_ids) || input.employee_ids.length === 0 || input.employee_ids.some((id) => typeof id !== 'string' || !id.trim() || id.includes(':')) || new Set(input.employee_ids).size !== input.employee_ids.length)) {
    throw new TypeError('invalid_employee_ids');
  }
}

type CatalogStep = {
  id: string; depends_on: string[]; required_documents: string[]; parties: string[];
  estimated_duration_days: { value: number; illustrative: boolean }; terminal?: boolean;
};

function makeStep(template: CatalogStep, input: CaseInput): StepDefinition {
  return {
    id: template.id,
    title_key: `roadmap.${template.id}`,
    depends_on: [...template.depends_on],
    required_documents: template.required_documents.map((label) => {
      if (!(DATA_LABELS as readonly string[]).includes(label)) throw new TypeError(`unknown_document_label:${label}`);
      return label as DataLabel;
    }),
    parties: template.parties.map((party) => party === 'licensing_authority' ? catalog.licensing_authorities[input.setup_path ?? 'mainland'] : party),
    estimated_duration_days: { value: template.estimated_duration_days.value, illustrative: true },
    illustrative: true,
    ...(template.terminal ? { terminal: true } : {}),
    reasons: [reason('journey', input.journey, 'included', 'roadmap.step_in_journey')],
  };
}

function individualSteps(input: CaseInput): StepDefinition[] {
  const steps = catalog.individual.map((template) => makeStep(template, input));
  const terminal = makeStep(catalog.terminals.fully_settled, input);
  if (input.journey === 'family_relocation') {
    steps.push(...catalog.family.map((template) => makeStep(template, input)));
    terminal.depends_on.push('school_registration');
  }
  return [...steps, terminal];
}

/** Illustrative graph, not a determination of legal requirements or eligibility. */
export function planRoadmap(input: CaseInput): RoadmapResult {
  validateInput(input);
  let steps: StepDefinition[];
  if (input.journey === 'company_setup' || input.journey === 'team_transfer') {
    steps = catalog.company.map((template) => makeStep(template, input));
    const terminal = makeStep(catalog.terminals.fully_operational, input);
    if (input.journey === 'team_transfer') {
      if (input.sponsoring_entity_ready) {
        const gate = steps.find((step) => step.id === 'entity_can_sponsor')!;
        gate.depends_on = [];
        gate.external = true;
        gate.reasons.push(reason('sponsoring_entity_ready', true, 'satisfied', 'roadmap.verified_external_sponsor'));
        steps = [gate];
        terminal.depends_on = ['entity_can_sponsor'];
      }
      for (const employeeId of input.employee_ids ?? [...DEMO_FIXTURES.transferredHires]) {
        const employeeSteps = individualSteps({ ...input, journey: 'individual_relocation' });
        for (const step of employeeSteps) {
          const baseId = step.id;
          step.id = `${employeeId}:${baseId}`;
          step.subject_ref = employeeId;
          step.depends_on = step.depends_on.map((dependency) => `${employeeId}:${dependency}`);
          step.terminal = false;
          if (baseId === 'residency_visa') {
            step.depends_on.push('entity_can_sponsor');
            step.reasons.push(reason('sponsoring_entity', 'entity_can_sponsor', 'required', 'roadmap.entity_before_employee_residency'));
          }
        }
        steps.push(...employeeSteps);
        terminal.depends_on.push(`${employeeId}:fully_settled`);
      }
    }
    steps.push(terminal);
  } else {
    steps = individualSteps(input);
  }
  return {
    contract_version: CONTRACT_VERSION, illustrative: true, case_id: input.case_id,
    journey: input.journey, steps: orderGraph(steps),
    reasons: [reason('requirements_status', catalog.requirements_status, 'illustrative', 'roadmap.verify_with_authority')],
  };
}

function validateDocuments(documents: PayloadRef[]): void {
  if (!Array.isArray(documents)) throw new TypeError('invalid_documents');
  for (const document of documents) {
    if (!document || typeof document.ref !== 'string' || !document.ref.trim() || !Array.isArray(document.labels) || document.labels.some((label) => !(DATA_LABELS as readonly string[]).includes(label)) || (document.derived !== undefined && typeof document.derived !== 'boolean')) {
      throw new TypeError('invalid_document_ref');
    }
  }
}

export function evaluateState(state: CaseState): { steps: StepDefinition[]; completed: Set<string> } {
  if (!state || !Array.isArray(state.completed_step_ids)) throw new TypeError('invalid_case_state');
  const { steps } = planRoadmap(state.input);
  const ids = new Set(steps.map((step) => step.id));
  if (new Set(state.completed_step_ids).size !== state.completed_step_ids.length) throw new TypeError('duplicate_completed_step');
  for (const id of state.completed_step_ids) {
    if (!ids.has(id)) throw new TypeError(`unknown_completed_step:${id}`);
  }
  validateDocuments(state.documents);
  if (state.documents_by_subject !== undefined) {
    if (!state.documents_by_subject || typeof state.documents_by_subject !== 'object' || Array.isArray(state.documents_by_subject)) throw new TypeError('invalid_subject_documents');
    const subjects = new Set(steps.flatMap((step) => step.subject_ref ? [step.subject_ref] : []));
    for (const [subject, documents] of Object.entries(state.documents_by_subject)) {
      if (!subjects.has(subject)) throw new TypeError(`unknown_subject:${subject}`);
      validateDocuments(documents);
    }
  }
  const completed = new Set(state.completed_step_ids);
  if (state.step_states !== undefined) {
    if (!Array.isArray(state.step_states) || new Set(state.step_states.map((step) => step.step_id)).size !== state.step_states.length) throw new TypeError('invalid_step_states');
    for (const step of state.step_states) {
      if (!ids.has(step.step_id) || !['pending', 'in_progress', 'waiting', 'completed'].includes(step.status)) throw new TypeError('invalid_step_state');
      if (completed.has(step.step_id) && step.status !== 'completed') throw new TypeError(`conflicting_step_status:${step.step_id}`);
      if (step.status === 'completed') completed.add(step.step_id);
    }
  }
  if (state.input.journey === 'team_transfer' && state.input.sponsoring_entity_ready) completed.add('entity_can_sponsor');
  return { steps, completed };
}

export function getBlockers(state: CaseState): BlockersResult {
  const { steps, completed } = evaluateState(state);
  const blockers = steps.filter((step) => !completed.has(step.id)).flatMap((step) => {
    const documents = step.subject_ref ? state.documents_by_subject?.[step.subject_ref] ?? state.documents : state.documents;
    const availableLabels = new Set(documents.filter((document) => !document.derived).flatMap((document) => document.labels));
    const unmet_dependencies = step.depends_on.filter((id) => !completed.has(id));
    const missing_documents = step.required_documents.filter((label) => !availableLabels.has(label));
    if (!unmet_dependencies.length && !missing_documents.length) return [];
    return [{
      step_id: step.id, unmet_dependencies, missing_documents,
      reasons: [
        ...unmet_dependencies.map((id) => reason('dependency', id, 'blocked', 'roadmap.dependency_unmet')),
        ...missing_documents.map((label) => reason('document', label, 'blocked', 'roadmap.document_missing')),
      ],
    }];
  });
  return {
    contract_version: CONTRACT_VERSION, illustrative: true, case_id: state.input.case_id, blockers,
    reasons: [reason('blocked_step_count', blockers.length, blockers.length ? 'blocked' : 'ready', 'roadmap.blocker_count')],
  };
}

export function getUnlocks(stepId: string, input?: CaseInput): UnlocksResult {
  // Default context supports all unprefixed individual/family/company template IDs.
  const inferred: CaseInput = {
    case_id: DEMO_FIXTURES.hire,
    journey: catalog.company.some((step) => step.id === stepId) || stepId === 'fully_operational' ? 'company_setup' : 'family_relocation',
  };
  const { steps } = planRoadmap(input ?? inferred);
  if (!steps.some((step) => step.id === stepId)) throw new TypeError(`unknown_step:${stepId}`);
  const reachable = new Set([stepId]);
  const directly_enables = steps.filter((step) => step.depends_on.includes(stepId)).map((step) => step.id);
  for (const step of steps) {
    if (step.depends_on.some((id) => reachable.has(id))) reachable.add(step.id);
  }
  return {
    contract_version: CONTRACT_VERSION, illustrative: true, step_id: stepId, directly_enables,
    eventually_enables: steps.filter((step) => step.id !== stepId && reachable.has(step.id)).map((step) => step.id),
    reasons: [reason('completion', stepId, 'dependency_satisfied', 'roadmap.unlock_is_one_of_dependencies')],
  };
}

export function getCriticalPath(state: CaseState): CriticalPathResult {
  const { steps, completed } = evaluateState(state);
  const target = steps.find((step) => step.terminal)!;
  const paths = new Map<string, { days: number; ids: string[] }>();
  for (const step of steps) {
    if (completed.has(step.id)) {
      // Finished joins cut off their predecessors for remaining work.
      paths.set(step.id, { days: 0, ids: [] });
      continue;
    }
    let longest = { days: 0, ids: [] as string[] };
    for (const dependency of step.depends_on) {
      const path = paths.get(dependency)!;
      if (path.days > longest.days || (path.days === longest.days && path.ids.length > longest.ids.length)) longest = path;
    }
    paths.set(step.id, { days: longest.days + step.estimated_duration_days.value, ids: [...longest.ids, step.id] });
  }
  const path = paths.get(target.id)!;
  return {
    contract_version: CONTRACT_VERSION, illustrative: true, case_id: state.input.case_id,
    target_step_id: target.id, step_ids: path.ids,
    estimated_remaining_days: { value: path.days, illustrative: true },
    reasons: [reason('remaining_dependency_duration', path.days, 'critical_path', 'roadmap.longest_remaining_chain_illustrative')],
  };
}
