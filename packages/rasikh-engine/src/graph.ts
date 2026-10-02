import type { StepDefinition } from './types.js';

/** Stable Kahn traversal: ties preserve the catalog's order. Also validates the graph. */
export function orderGraph(steps: StepDefinition[]): StepDefinition[] {
  const ids = new Set(steps.map((step) => step.id));
  if (ids.size !== steps.length) throw new TypeError('duplicate_step_id');
  for (const step of steps) {
    if (new Set(step.depends_on).size !== step.depends_on.length) {
      throw new TypeError(`duplicate_dependency:${step.id}`);
    }
    for (const dependency of step.depends_on) {
      if (!ids.has(dependency)) throw new TypeError(`unknown_dependency:${dependency}`);
    }
  }
  const ordered: StepDefinition[] = [];
  const visited = new Set<string>();
  while (ordered.length < steps.length) {
    const next = steps.find(
      (step) => !visited.has(step.id) && step.depends_on.every((id) => visited.has(id)),
    );
    if (!next) throw new TypeError('cyclic_dependency_graph');
    visited.add(next.id);
    ordered.push(next);
  }
  return ordered;
}
