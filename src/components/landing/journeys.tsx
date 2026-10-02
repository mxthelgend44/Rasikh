'use client';

import { useState } from 'react';

type Journey = {
  id: string;
  label: string;
  arabic: string;
  steps: { title: string; detail: string; who: string }[];
};

const journeys: Journey[] = [
  {
    id: 'job',
    label: 'Starting a new job',
    arabic: 'عمل جديد',
    steps: [
      {
        title: 'Your route, confirmed',
        detail: 'Your employer confirms the work and residence path that applies to you.',
        who: 'You · employer',
      },
      {
        title: 'Residence and Emirates ID',
        detail: 'Each official step shows what it needs and what is already on file.',
        who: 'Official services',
      },
      {
        title: 'A home, registered',
        detail: 'Landlords see a verified, employer-backed application, and only what you allow.',
        who: 'You · landlord',
      },
      {
        title: 'Banking and utilities',
        detail: 'Accounts follow your registered tenancy, in the right order.',
        who: 'Bank · provider',
      },
    ],
  },
  {
    id: 'family',
    label: 'Moving with family',
    arabic: 'مع العائلة',
    steps: [
      {
        title: 'One plan for the household',
        detail: 'Everyone’s documents in one place, with nothing asked for twice.',
        who: 'You · family',
      },
      {
        title: 'Housing that fits',
        detail: 'Housing evidence is ready before family residence asks for it.',
        who: 'You · landlord',
      },
      {
        title: 'Family residence',
        detail: 'Sponsorship steps in order, each with what is still missing.',
        who: 'Official services',
      },
      {
        title: 'School places',
        detail: 'Schools receive the records they need, and nothing more.',
        who: 'Family · school',
      },
    ],
  },
  {
    id: 'team',
    label: 'Bringing a team',
    arabic: 'فريق عمل',
    steps: [
      {
        title: 'The right setup path',
        detail: 'Mainland or free zone, with the trade-offs for your activity in plain words.',
        who: 'Founder',
      },
      {
        title: 'Licence to sponsor',
        detail: 'Trade name, licence, establishment card and visa quota, each unlocking the next.',
        who: 'Company · official services',
      },
      {
        title: 'Hires flow in',
        detail: 'When the quota lands, your first hires start their relocation on their own.',
        who: 'HR · new hires',
      },
      {
        title: 'Everyone settled',
        detail: 'One dashboard shows setup progress and every move in flight.',
        who: 'HR',
      },
    ],
  },
];

/** Three journeys, one timeline. Switching redraws the line and re-staggers the steps. */
export function Journeys() {
  const [active, setActive] = useState(journeys[0]?.id ?? 'job');
  const journey = journeys.find((item) => item.id === active) ?? journeys[0];
  if (!journey) return null;

  return (
    <div className="lp-journeys">
      <div className="lp-tabs" role="tablist" aria-label="Choose a journey">
        {journeys.map((item) => (
          <button
            key={item.id}
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={item.id === active}
            aria-controls="journey-panel"
            className={`lp-tab ${item.id === active ? 'is-active' : ''}`}
            onClick={() => setActive(item.id)}
          >
            {item.label}
            <span lang="ar">{item.arabic}</span>
          </button>
        ))}
      </div>
      <ol
        id="journey-panel"
        role="tabpanel"
        aria-labelledby={`tab-${journey.id}`}
        className="lp-timeline"
        key={journey.id}
      >
        {journey.steps.map((step, index) => (
          <li key={step.title} style={{ animationDelay: `${index * 110}ms` }}>
            <span className="lp-step-index">{String(index + 1).padStart(2, '0')}</span>
            <h3>{step.title}</h3>
            <p>{step.detail}</p>
            <span className="lp-step-who">{step.who}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
