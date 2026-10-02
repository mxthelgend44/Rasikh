/**
 * Application planning over any `TammBackend` (contract 1.2.0): the prerequisite order for a
 * service and what the applicant is still missing. Backend-agnostic: it only reads
 * `getServiceRequirements`.
 */
import type { PayloadRef } from "./contract.js";
import type { RequiredDocument, ServiceRequirements, TammBackend } from "./backend/types.js";

export class PrerequisiteCycleError extends Error {
  constructor(readonly cycle: readonly string[]) {
    super(`prerequisite cycle: ${cycle.join(" -> ")}`);
  }
}

/**
 * Every transitive prerequisite of `serviceId`, each after its own prerequisites (a
 * depth-first post-order). Unknown prerequisite ids are kept in place, since the service
 * still requires them. Throws `PrerequisiteCycleError` on a cycle.
 */
export async function prerequisiteOrder(backend: TammBackend, serviceId: string): Promise<string[]> {
  const order: string[] = [];
  const done = new Set<string>();
  const path: string[] = [];

  const visit = async (id: string): Promise<void> => {
    if (done.has(id)) {
      return;
    }
    if (path.includes(id)) {
      throw new PrerequisiteCycleError([...path.slice(path.indexOf(id)), id]);
    }
    path.push(id);
    const requirements = await backend.getServiceRequirements(id);
    for (const dependency of requirements?.depends_on ?? []) {
      await visit(dependency);
    }
    path.pop();
    done.add(id);
    if (id !== serviceId) {
      order.push(id);
    }
  };

  await visit(serviceId);
  return order;
}

export interface Readiness {
  prerequisite_order: string[];
  missing_prerequisites: string[];
  missing_documents: RequiredDocument[];
  ready_to_apply: boolean;
}

/** Compares a service's requirements with what the applicant already has. */
export async function assessReadiness(
  backend: TammBackend,
  requirements: ServiceRequirements,
  documentsOnFile: readonly PayloadRef[],
  completedServices: readonly string[],
): Promise<Readiness> {
  const order = await prerequisiteOrder(backend, requirements.service_id);
  const completed = new Set(completedServices);
  const held = new Set(documentsOnFile.flatMap((document) => document.labels));
  const missingPrerequisites = order.filter((id) => !completed.has(id));
  const missingDocuments = requirements.required_documents.filter((document) => !held.has(document.label));
  return {
    prerequisite_order: order,
    missing_prerequisites: missingPrerequisites,
    missing_documents: missingDocuments,
    ready_to_apply: missingPrerequisites.length === 0 && missingDocuments.length === 0,
  };
}
