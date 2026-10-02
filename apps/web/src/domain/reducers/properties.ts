import type { Action } from '../actions';
import { nextId } from '../ids';
import type { AppState, Property, Viewing } from '../types';
import { assertOwner, DomainError, lookup, type Context } from './shared';

type PropertyAction = Extract<
  Action,
  { type: 'property.create' | 'property.update' | 'viewing.create' | 'viewing.update' }
>;

function validateProperty(draft: AppState, property: Property): void {
  if (new Set(property.chequeOptions).size !== property.chequeOptions.length) {
    throw new DomainError('Cheque schedules must be unique');
  }
  if (
    Object.values(draft.properties).some(
      (other) =>
        other.id !== property.id &&
        (other.leaseRef === property.leaseRef ||
          (other.landlordId === property.landlordId &&
            other.name.trim().toLowerCase() === property.name.trim().toLowerCase() &&
            other.unit.trim().toLowerCase() === property.unit.trim().toLowerCase())),
    )
  ) {
    throw new DomainError('That lease or property unit already exists');
  }
  for (const decision of Object.values(draft.decisions)) {
    if (decision.outcome !== 'approved' || decision.terms?.cheques === undefined) continue;
    if (
      draft.applications[decision.applicationId]?.propertyId === property.id &&
      !property.chequeOptions.includes(decision.terms.cheques)
    ) {
      throw new DomainError('Keep cheque schedules used by existing approved applications');
    }
  }
}

function validateViewing(draft: AppState, viewing: Viewing, context: Context): void {
  const property = lookup(draft.properties, viewing.propertyId, 'property');
  assertOwner(property.landlordId, viewing.landlordId);
  if (viewing.applicationId) {
    const application = lookup(draft.applications, viewing.applicationId, 'application');
    if (
      application.kind !== 'rental' ||
      application.propertyId !== property.id ||
      application.partyId !== viewing.landlordId ||
      application.state === 'awaiting_approval'
    ) {
      throw new DomainError('Select a submitted rental application for this property');
    }
  }
  if (viewing.status !== 'planned') return;
  const start = Date.parse(viewing.startsAt);
  if (start <= Date.parse(context.now)) throw new DomainError('Choose a future viewing time');
  const end = start + viewing.durationMinutes * 60_000;
  if (
    Object.values(draft.viewings).some(
      (other) =>
        other.id !== viewing.id &&
        other.propertyId === viewing.propertyId &&
        other.status === 'planned' &&
        start < Date.parse(other.startsAt) + other.durationMinutes * 60_000 &&
        Date.parse(other.startsAt) < end,
    )
  ) {
    throw new DomainError('This property already has a viewing at that time');
  }
}

export function applyPropertyAction(
  draft: AppState,
  action: PropertyAction,
  context: Context,
): void {
  lookup(draft.landlords, action.landlordId, 'landlord');
  switch (action.type) {
    case 'property.create': {
      const id = action.id ?? nextId(draft.counters, 'prop', draft.properties);
      if (Object.hasOwn(draft.properties, id))
        throw new DomainError(`Property already exists: ${id}`);
      const property: Property = { ...action.property, id, landlordId: action.landlordId };
      validateProperty(draft, property);
      draft.properties[id] = property;
      return;
    }
    case 'property.update': {
      const existing = lookup(draft.properties, action.propertyId, 'property');
      assertOwner(existing.landlordId, action.landlordId);
      const property = { ...existing, ...action.patch };
      validateProperty(draft, property);
      draft.properties[property.id] = property;
      return;
    }
    case 'viewing.create': {
      const id = nextId(draft.counters, 'view', draft.viewings);
      const viewing: Viewing = {
        ...action.viewing,
        id,
        landlordId: action.landlordId,
        status: 'planned',
        createdAt: context.now,
      };
      validateViewing(draft, viewing, context);
      draft.viewings[id] = viewing;
      return;
    }
    case 'viewing.update': {
      const existing = lookup(draft.viewings, action.viewingId, 'viewing');
      assertOwner(existing.landlordId, action.landlordId);
      if (existing.status !== 'planned') throw new DomainError('This viewing is already closed');
      const viewing = { ...existing, ...action.patch };
      validateViewing(draft, viewing, context);
      draft.viewings[viewing.id] = viewing;
      return;
    }
  }
}
