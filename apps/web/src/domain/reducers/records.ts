import type { Action } from '../actions';
import {
  DOCUMENT_NAMES,
  documentId,
  documentLabelsForKind,
  REQUIRED_DOCUMENTS,
} from '../documents';
import { nextId } from '../ids';
import type { AppState, Id } from '../types';
import { DomainError, logAction, lookup, refreshUnlocks, type Context } from './shared';

type RecordAction = Extract<
  Action,
  { type: 'document.add' | 'document.review' | 'agent.log' | 'grant.set' | 'guard.record' }
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
      if (!documentLabelsForKind(action.kind).every((label) => action.labels.includes(label))) {
        throw new DomainError('The document is missing its required data labels');
      }
      if (new Set(action.fields.map((field) => field.key)).size !== action.fields.length) {
        throw new DomainError('Document field keys must be unique');
      }
      if (action.status === 'verified' && action.fields.length === 0) {
        throw new DomainError('Verify the document fields before marking it verified');
      }
      if (action.source !== 'vertex' && action.fields.some((field) => field.confidence === null)) {
        throw new DomainError('Only live extraction fields can have unavailable confidence');
      }
      const id = documentId(action.kind, action.hireId);
      const version = (draft.documents[id]?.version ?? (draft.documents[id] ? 1 : 0)) + 1;
      draft.documents[id] = {
        id,
        hireId: action.hireId,
        kind: action.kind,
        fileName: action.fileName,
        uploadedAt: context.now,
        version,
        source: action.source ?? 'demo',
        status: action.status ?? 'extracted',
        labels: action.labels,
        fields: action.fields,
        reasoning: action.reasoning,
      };
      logAction(draft, context, {
        caseId: action.hireId,
        caseType: 'hire',
        kind: 'document_extracted',
        summary:
          action.source === 'vertex'
            ? `Read your ${DOCUMENT_NAMES[action.kind]}`
            : `Prepared demo fields for your ${DOCUMENT_NAMES[action.kind]}`,
        reasoning: action.reasoning,
        status:
          action.status === 'rejected'
            ? 'blocked'
            : action.status === 'uploaded'
              ? 'waiting'
              : 'done',
        tool: 'extract_document',
        documentId: id,
      });
      afterDocument(draft, action.hireId, context);
      return;
    }

    case 'document.review': {
      lookup(draft.hires, action.hireId, 'hire');
      const document = lookup(draft.documents, action.documentId, 'document');
      if (document.hireId !== action.hireId)
        throw new DomainError('This document belongs to another hire');
      if (
        action.expectedVersion !== undefined &&
        action.expectedVersion !== (document.version ?? 1)
      ) {
        throw new DomainError(
          'This document was replaced. Review the latest fields before confirming',
        );
      }
      if (document.status === 'uploaded')
        throw new DomainError('Wait for document fields before reviewing');
      const fields = action.fields ?? document.fields;
      if (new Set(fields.map((field) => field.key)).size !== fields.length) {
        throw new DomainError('Document field keys must be unique');
      }
      if (action.accept && fields.length === 0)
        throw new DomainError('There are no document fields to confirm');
      if (action.fields) document.fields = action.fields;
      document.status = action.accept ? 'verified' : 'rejected';
      document.reviewedAt = context.now;
      if (!action.accept && REQUIRED_DOCUMENTS.includes(document.kind)) {
        const step = Object.values(draft.steps).find(
          (candidate) => candidate.hireId === action.hireId && candidate.key === 'documents',
        );
        if (step) {
          step.status = 'blocked';
          step.completedAt = undefined;
          step.waitingOn = undefined;
          step.blockedReason = `Your ${DOCUMENT_NAMES[document.kind]} needs review`;
        }
      }
      logAction(draft, context, {
        caseId: action.hireId,
        caseType: 'hire',
        kind: 'step_updated',
        summary: `${action.accept ? 'Confirmed' : 'Rejected'} your ${DOCUMENT_NAMES[document.kind]} fields`,
        reasoning:
          'Your review is recorded locally. The document keeps its original upload time and extraction source.',
        status: action.accept ? 'done' : 'blocked',
        documentId: document.id,
      });
      afterDocument(draft, action.hireId, context);
      return;
    }

    case 'agent.log': {
      lookup<{ id: Id }>(
        action.entry.caseType === 'hire' ? draft.hires : draft.companies,
        action.entry.caseId,
        'case',
      );
      if (action.entry.stepId) {
        const caseId =
          action.entry.caseType === 'hire'
            ? lookup(draft.steps, action.entry.stepId, 'step').hireId
            : lookup(draft.setupSteps, action.entry.stepId, 'step').companyId;
        if (caseId !== action.entry.caseId)
          throw new DomainError('The step belongs to another case');
      }
      for (const [recordId, records, label] of [
        [action.entry.approvalId, draft.approvals, 'approval'],
        [action.entry.applicationId, draft.applications, 'application'],
        [action.entry.documentId, draft.documents, 'document'],
      ] as const) {
        if (!recordId) continue;
        const record = lookup<{ hireId: Id }>(records, recordId, label);
        if (record.hireId !== action.entry.caseId || action.entry.caseType !== 'hire') {
          throw new DomainError(`This ${label} belongs to another case`);
        }
      }
      logAction(draft, context, action.entry);
      return;
    }

    case 'grant.set': {
      lookup(draft.hires, action.hireId, 'hire');
      const existing = Object.values(draft.grants).find(
        (grant) =>
          grant.hireId === action.hireId &&
          grant.label === action.label &&
          grant.destination === action.destination,
      );
      if (action.granted && !existing) {
        const id = nextId(draft.counters, 'grant', draft.grants);
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
      if (
        !Object.hasOwn(draft.hires, action.check.caseId) &&
        !Object.hasOwn(draft.companies, action.check.caseId)
      ) {
        throw new DomainError(`Unknown case: ${action.check.caseId}`);
      }
      const id = nextId(draft.counters, 'chk', draft.guardChecks);
      draft.guardChecks[id] = { ...action.check, id, at: context.now };
      return;
    }
  }
}
