import type { DataLabel } from '@rasikh/shared';
import type { RoadmapAnswer } from '../types.ts';
import { record } from './http.ts';

const labels: readonly string[] = [
  'passport',
  'emirates_id',
  'salary',
  'bank_statement',
  'employment',
  'family',
  'address',
  'degree',
  'health',
];
export function roadmapAnswer(value: unknown): RoadmapAnswer {
  const answer = record(value, 'Roadmap answer');
  if (
    !Array.isArray(answer.step_ids) ||
    !answer.step_ids.every((id) => typeof id === 'string') ||
    !Array.isArray(answer.blockers)
  )
    throw new Error('Roadmap answer has invalid steps or blockers.');
  return {
    step_ids: answer.step_ids as string[],
    blockers: answer.blockers.map((item) => {
      const blocker = record(item, 'Roadmap blocker');
      if (
        typeof blocker.step_id !== 'string' ||
        !Array.isArray(blocker.unmet_dependencies) ||
        !blocker.unmet_dependencies.every((id) => typeof id === 'string') ||
        !Array.isArray(blocker.missing_documents) ||
        !blocker.missing_documents.every(
          (label) => typeof label === 'string' && labels.includes(label),
        )
      )
        throw new Error('Roadmap blocker is malformed.');
      return {
        step_id: blocker.step_id,
        unmet_dependencies: blocker.unmet_dependencies as string[],
        missing_documents: blocker.missing_documents as DataLabel[],
      };
    }),
  };
}
