'use client';

import { useMemo, useState } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import type { NewHire } from '@/domain/actions';
import { demoNow } from '@/domain/clock';
import {
  currentStep,
  daysInRelocation,
  hireStage,
  hireStatus,
  stepsOf,
  type HireStatus,
} from '@/domain/selectors';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { useAppState, useConnection, useStore } from '@/store/provider';

const STATUS_TONE: Record<HireStatus, BadgeTone> = {
  on_track: 'accent',
  waiting: 'warning',
  blocked: 'danger',
  settled: 'success',
};

const STATUS_LABEL: Record<HireStatus, string> = {
  on_track: 'On track',
  waiting: 'Waiting',
  blocked: 'Blocked',
  settled: 'Settled',
};

/** Sample people for the "Add hire" button. Illustrative mock data. */
const SAMPLE_HIRES: NewHire[] = [
  {
    employerId: 'emp_gulf_meridian',
    fullName: 'Priya Menon',
    nationality: 'Indian',
    role: 'Senior data engineer',
    department: 'Analytics',
    email: 'priya.menon@mail.example',
    originCity: 'Bengaluru',
    originCountry: 'India',
    estMonthlySalaryAed: 32_000,
    preferredArea: 'Al Reem Island',
    startDate: '2026-11-02',
  },
  {
    employerId: 'emp_gulf_meridian',
    fullName: 'Daniel Okafor',
    nationality: 'Ghanaian',
    role: 'Security engineer',
    department: 'Platform',
    email: 'daniel.okafor@mail.example',
    originCity: 'Accra',
    originCountry: 'Ghana',
    estMonthlySalaryAed: 26_000,
    preferredArea: 'Khalifa City',
    startDate: '2026-11-09',
  },
  {
    employerId: 'emp_gulf_meridian',
    fullName: 'Yuki Tanaka',
    nationality: 'Japanese',
    role: 'Machine learning engineer',
    department: 'Analytics',
    email: 'yuki.tanaka@mail.example',
    originCity: 'Osaka',
    originCountry: 'Japan',
    estMonthlySalaryAed: 34_000,
    preferredArea: 'Al Maryah Island',
    startDate: '2026-11-16',
  },
];

export default function LiveStatePage() {
  const state = useAppState();
  const connection = useConnection();
  const store = useStore();
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(0);

  const now = demoNow(state);
  const rows = useMemo(
    () =>
      Object.values(state.hires).map((hire) => {
        const steps = stepsOf(state, hire.id);
        return {
          hire,
          step: currentStep(steps),
          stage: hireStage(steps),
          status: hireStatus(steps),
          days: daysInRelocation(hire, steps, now),
        };
      }),
    [state, now],
  );
  const feed = useMemo(
    () =>
      Object.values(state.agentActions)
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 5),
    [state.agentActions],
  );

  const run = async (task: () => Promise<void>) => {
    setError(null);
    try {
      await task();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Something went wrong');
    }
  };

  return (
    <>
      <PageHeader
        title="Live state"
        actions={
          <>
            <Button
              variant="secondary"
              icon={<RotateCcw />}
              onClick={() => run(() => store.reset())}
            >
              Reset demo
            </Button>
            <Button
              icon={<Plus />}
              onClick={() => {
                const sample = SAMPLE_HIRES[added % SAMPLE_HIRES.length];
                if (!sample) return;
                setAdded((count) => count + 1);
                void run(() =>
                  store.dispatch({
                    type: 'hire.create',
                    hire: sample,
                    id: added === 0 ? undefined : `hire_live_${added}`,
                  }),
                );
              }}
            >
              Add hire
            </Button>
          </>
        }
      />
      <div className="px-6 py-5">
        <dl className="flex flex-wrap items-center gap-x-8 gap-y-2 text-label text-fg-secondary">
          <div className="flex items-center gap-2">
            <dt>Connection</dt>
            <dd>
              <Badge
                tone={
                  connection === 'live'
                    ? 'success'
                    : connection === 'offline'
                      ? 'danger'
                      : 'neutral'
                }
              >
                {connection}
              </Badge>
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt>Revision</dt>
            <dd className="font-mono text-fg tabular-nums" data-testid="rev">
              {state.rev}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt>Hires</dt>
            <dd className="text-fg tabular-nums">{rows.length}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt>Demo clock</dt>
            <dd className="font-mono text-fg">{now}</dd>
          </div>
        </dl>
        {error ? (
          <p role="alert" className="mt-3 text-body text-danger">
            {error}
          </p>
        ) : null}
      </div>

      <div className="overflow-hidden border-y border-edge">
        <Table>
          <caption className="sr-only">Hires and where each one is now</caption>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Stage</Th>
              <Th>Status</Th>
              <Th>Backing</Th>
              <Th align="end">Days</Th>
              <Th align="end">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ hire, step, stage, status, days }) => (
              <Tr key={hire.id}>
                <Td>
                  <span className="font-medium">{hire.fullName}</span>
                  <span className="ms-2 font-mono text-caption text-fg-tertiary">{hire.id}</span>
                </Td>
                <Td>
                  <Badge>{stage}</Badge>
                </Td>
                <Td>
                  <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
                </Td>
                <Td>
                  <Badge tone={hire.backing.status === 'backed' ? 'accent' : 'neutral'}>
                    {hire.backing.status === 'backed' ? 'Employer backed' : 'Not backed'}
                  </Badge>
                </Td>
                <Td align="end" className="tabular-nums">
                  {days}
                </Td>
                <Td align="end">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        run(() =>
                          store.dispatch({
                            type: 'hire.back',
                            hireId: hire.id,
                            backed: hire.backing.status !== 'backed',
                            by: 'Layla Haddad',
                          }),
                        )
                      }
                    >
                      {hire.backing.status === 'backed' ? 'Remove backing' : 'Back this hire'}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!step || step.status === 'locked' || step.status === 'blocked'}
                      onClick={() =>
                        step &&
                        run(() =>
                          store.dispatch({
                            type: 'step.set_status',
                            stepId: step.id,
                            status: 'done',
                          }),
                        )
                      }
                    >
                      Complete step
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </div>

      <section className="px-6 py-6">
        <h2 className="mb-3 text-body font-medium text-fg">Agent feed, newest first</h2>
        <ul className="divide-y divide-line rounded-lg border border-edge">
          {feed.map((entry) => (
            <li key={entry.id} className="px-4 py-3">
              <p className="text-body text-fg">{entry.summary}</p>
              <p className="mt-0.5 text-label text-fg-tertiary">{entry.reasoning}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
