import type { PayloadRef } from '@rasikh/shared';
import {
  getBlockers,
  getCriticalPath,
  planRoadmap,
} from '../../../../../packages/rasikh-engine/src/index';
import type { CaseState } from '../../../../../packages/rasikh-engine/src/index';
import type { RoadmapEnginePort, RoadmapGrounding } from './types';

function stateFor(caseId: string, documents: PayloadRef[]): CaseState {
  return {
    input: { case_id: caseId, journey: 'individual_relocation' },
    completed_step_ids: [],
    documents,
  };
}

/** Thin adapter over the existing deterministic engine. No planning logic lives here. */
export const rasikhEngine: RoadmapEnginePort = {
  nextAction({ caseId, documents }): RoadmapGrounding | null {
    const state = stateFor(caseId, documents);
    const blockers = getBlockers(state).blockers;
    // Roadmap order is dependency order; the first step with only document gaps is actionable now.
    for (const step of planRoadmap(state.input).steps) {
      const blocker = blockers.find((b) => b.step_id === step.id);
      if (
        blocker &&
        blocker.unmet_dependencies.length === 0 &&
        blocker.missing_documents.length > 0
      )
        return {
          step_id: blocker.step_id,
          unmet_dependencies: [],
          missing_documents: blocker.missing_documents,
        };
    }
    return null;
  },
  estimateRemainingDays({ caseId, documents }) {
    return getCriticalPath(stateFor(caseId, documents)).estimated_remaining_days.value;
  },
};
