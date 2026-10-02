'use client';

import { useMemo } from 'react';
import { currentStep, hireStatus, stepsOf, type HireStatus } from '@/domain/selectors';
import type { AppState, Locale } from '@/domain/types';
import { CATALOGS } from '@/lib/i18n';
import { useAppState } from '@/store/provider';

export interface HubPerson {
  id: string;
  /** Distinct link for this person, e.g. /newcomer?as=anders. */
  href: string;
  name: string;
  role: string;
  status: HireStatus;
  /** A decision is waiting on this person. */
  awaiting: boolean;
  /** The step they are on now, in the page language. Null when settled. */
  now: string | null;
}

export interface HubLive {
  journeys: number;
  approvals: number;
  inReview: number;
  guardChecks: number;
}

function slug(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** The short step name from the newcomer catalogs, falling back to the stored title. */
function stepName(locale: Locale, key: string, title: string): string {
  const catalog = CATALOGS[locale] as Record<string, string>;
  return catalog[`step.${key}.short`] ?? title;
}

export function buildHub(state: AppState, locale: Locale): { people: HubPerson[]; live: HubLive } {
  const pending = new Set(
    Object.values(state.approvals)
      .filter((approval) => approval.status === 'pending')
      .map((approval) => approval.hireId),
  );
  const anchor = Date.parse(state.clock.anchor);
  const hires = Object.values(state.hires);

  // PersonLink matches the first name; two people sharing one fall back to the hire id.
  const firstNames = new Map<string, number>();
  for (const hire of hires) {
    const first = slug(hire.fullName.split(' ')[0] ?? hire.id);
    firstNames.set(first, (firstNames.get(first) ?? 0) + 1);
  }

  const rows = hires.map((hire) => {
    const steps = stepsOf(state, hire.id);
    const current = currentStep(steps);
    const first = slug(hire.fullName.split(' ')[0] ?? hire.id);
    const key = (firstNames.get(first) ?? 0) > 1 ? slug(hire.id) : first;
    const created = Date.parse(hire.startedAt) >= anchor;
    const person: HubPerson = {
      id: hire.id,
      href: `/newcomer?as=${encodeURIComponent(key)}`,
      name: hire.fullName,
      role: hire.role,
      status: hireStatus(steps),
      awaiting: pending.has(hire.id),
      now: current ? stepName(locale, current.key, current.title) : null,
    };
    return { person, rank: person.awaiting ? 0 : created ? 1 : 2 };
  });
  // Stable sort: the person with a decision waiting first, then anyone created during this run.
  rows.sort((a, b) => a.rank - b.rank);
  const people = rows.map((row) => row.person);

  const applications = Object.values(state.applications);
  return {
    people,
    live: {
      journeys: people.filter((person) => person.status !== 'settled').length,
      approvals: pending.size,
      inReview: applications.filter(
        (application) => application.state === 'submitted' || application.state === 'under_review',
      ).length,
      guardChecks: Object.keys(state.guardChecks).length,
    },
  };
}

export function useHub(locale: Locale): { people: HubPerson[]; live: HubLive } {
  const state = useAppState();
  return useMemo(() => buildHub(state, locale), [state, locale]);
}
