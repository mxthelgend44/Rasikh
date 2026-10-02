import type { AppState } from '../types';
import { seedApplications } from './applications';
import { seedExpansion, seedViewings } from './expansion';
import { actionsForSpec, documentsForSpec, HIRE_SPECS, hireFromSpec, stepsForSpec } from './hires';
import { BANKS, EMPLOYERS, LANDLORDS, PROPERTIES } from './parties';
import { SEED_ANCHOR } from './time';

function byId<T extends { id: string }>(items: T[]): Record<string, T> {
  if (new Set(items.map((item) => item.id)).size !== items.length)
    throw new Error('Duplicate seed record id');
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

/**
 * The initial state of the demo: a technology employer with nine hires at different stages,
 * a landlord and a bank with applications in their inboxes, and an illustrative expansion case.
 * Everything is illustrative mock data.
 */
export function createSeed(realNowMs: number = Date.now()): AppState {
  const counters: Record<string, number> = {};
  const hires = HIRE_SPECS.map(hireFromSpec);
  const specs = new Map(HIRE_SPECS.map((spec) => [spec.id, spec]));

  const steps = hires.flatMap((hire) => stepsForSpec(specs.get(hire.id)!, hire));
  const documents = hires.flatMap((hire) => documentsForSpec(specs.get(hire.id)!, hire));
  const agentActions = hires.flatMap((hire) =>
    actionsForSpec(
      specs.get(hire.id)!,
      hire,
      steps.filter((step) => step.hireId === hire.id),
      counters,
    ),
  );
  const { applications, decisions, approvals, grants, guardChecks } = seedApplications(counters);
  const expansion = seedExpansion(counters);
  const viewings = seedViewings(counters);

  return structuredClone({
    rev: 1,
    clock: { anchor: SEED_ANCHOR, resetAtMs: realNowMs },
    counters,
    employers: byId(EMPLOYERS),
    landlords: byId(LANDLORDS),
    banks: byId(BANKS),
    properties: byId(PROPERTIES),
    viewings: byId(viewings),
    hires: byId(hires),
    steps: byId(steps),
    documents: byId(documents),
    agentActions: byId([...agentActions, ...expansion.agentActions]),
    approvals: byId(approvals),
    applications: byId(applications),
    decisions: byId(decisions),
    grants: byId(grants),
    guardChecks: byId(guardChecks),
    companies: byId(expansion.companies),
    setupSteps: byId(expansion.setupSteps),
    teamMembers: byId(expansion.teamMembers),
  });
}
