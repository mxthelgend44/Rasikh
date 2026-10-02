import type { Action } from '../actions';
import { DOCUMENT_NAMES, documentId, REQUIRED_DOCUMENTS } from '../documents';
import { nextId } from '../ids';
import type { AppState, Id } from '../types';
import { logAction, lookup, refreshUnlocks, type Context } from './shared';

type RecordAction = Extract<
  Action,
  { type: 'document.add' | 'agent.log' | 'grant.set' | 'guard.record' }
>;

/**
 * Once the passport, offer letter and degree are all verified the documents step is done and the
 * visa and housing steps open. Until then, the first upload puts the step in progress.
 */
function afterDocument(draft: AppState, hireId: Id, context: Context): void {
  const step = Object.values(draft.steps).find(
    (candidate) => candidate.hireId === hireId && candidate.key === 'documents',
  );
  if (!step || step.status === 'done') return;

  const allVerified = REQUIRED_DOCUMENTS.every(
    (kind) => draft.documents[documentId(kind, hireId)]?.status === 'verified',
  );
  if (!allVerified) {
    if (step.status === 'ready') step.status = 'in_progress';
    return;
  }

  step.status = 'done';
  step.completedAt = context.now;
  step.blockedReason = undefined;
  refreshUnlocks(draft, hireId);
  logAction(draft, context, {
    caseId: hireId,
    caseType: 'hire',
    kind: 'step_updated',
    summary: 'Verified your passport, offer letter and degree',
    reasoning:
      'Names, dates and role agree across all three, so the visa application and the housing search can start.',
    status: 'done',
    stepId: step.id,
  });
}

export function applyRecordAction(draft: AppState, action: RecordAction, context: Context): void {
  switch (action.type) {
    case 'document.add': {
      lookup(draft.hires, action.hireId, 'hire');
      const id = documentId(action.kind, action.hireId);
      draft.documents[id] = {
        id,
        hireId: action.hireId,
        kind: action.kind,
        fileName: action.fileName,
        uploadedAt: context.now,
        status: action.status ?? 'extracted',
        labels: action.labels,
        fields: action.fields,
        reasoning: action.reasoning,
      };
      logAction(draft, context, {
        caseId: action.hireId,
        caseType: 'hire',
        kind: 'document_extracted',
        summary: `Read your ${DOCUMENT_NAMES[action.kind]}`,
        reasoning: action.reasoning,
        status: 'done',
        tool: 'extract_document',
      });
      afterDocument(draft, action.hireId, context);
      return;
    }

    case 'agent.log':
      logAction(draft, context, action.entry);
      return;

    case 'grant.set': {
      lookup(draft.hires, action.hireId, 'hire');
      const existing = Object.values(draft.grants).find(
        (grant) =>
          grant.hireId === action.hireId &&
          grant.label === action.label &&
          grant.destination === action.destination,
      );
      if (action.granted && !existing) {
        const id = nextId(draft.counters, 'grant');
        draft.grants[id] = {
          id,
          hireId: action.hireId,
          label: action.label,
          destination: action.destination,
          grantedAt: context.now,
        };
      } else if (!action.granted && existing) {
        delete draft.grants[existing.id];
      }
      return;
    }

    case 'guard.record': {
      const id = nextId(draft.counters, 'chk');
      draft.guardChecks[id] = { id, at: context.now, ...action.check };
      return;
    }
  }
}
