import type { Action } from '../actions';
import { nextId } from '../ids';
import type { AppState } from '../types';
import { logAction, lookup, type Context } from './shared';

type RecordAction = Extract<
  Action,
  { type: 'document.add' | 'agent.log' | 'grant.set' | 'guard.record' }
>;

export function applyRecordAction(draft: AppState, action: RecordAction, context: Context): void {
  switch (action.type) {
    case 'document.add': {
      lookup(draft.hires, action.hireId, 'hire');
      const id = `doc_${action.kind}_${action.hireId}`;
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
