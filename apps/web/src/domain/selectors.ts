import { daysBetween } from './clock';
import { stageLabel } from './roadmap';
import type { AppState, Hire, Id, IsoDateTime, Step } from './types';

export type HireStatus = 'on_track' | 'waiting' | 'blocked' | 'settled';

export function stepsOf(state: AppState, hireId: Id): Step[] {
  return Object.values(state.steps)
    .filter((step) => step.hireId === hireId)
    .sort((a, b) => a.order - b.order);
}

/** The earliest step that is not done: what the hire is working on now. */
export function currentStep(steps: Step[]): Step | undefined {
  return steps.find((step) => step.status !== 'done');
}

export function hireStage(steps: Step[]): string {
  const current = currentStep(steps);
  return current ? stageLabel(current.key) : 'Settled';
}

export function hireStatus(steps: Step[]): HireStatus {
  if (steps.length > 0 && steps.every((step) => step.status === 'done')) return 'settled';
  if (steps.some((step) => step.status === 'blocked')) return 'blocked';
  const current = currentStep(steps);
  if (current && (current.status === 'waiting' || current.status === 'needs_approval')) {
    return 'waiting';
  }
  return 'on_track';
}

export function settledAt(steps: Step[]): IsoDateTime | undefined {
  if (hireStatus(steps) !== 'settled') return undefined;
  return (
    steps
      .map((step) => step.completedAt ?? '')
      .sort()
      .at(-1) || undefined
  );
}

export function daysInRelocation(hire: Hire, steps: Step[], now: IsoDateTime): number {
  return daysBetween(hire.startedAt, settledAt(steps) ?? now);
}

/** Plain-language blockers and waits for the employer table. */
export function blockersOf(steps: Step[]): string[] {
  return steps.flatMap((step) => {
    if (step.status === 'blocked') return [step.blockedReason ?? `${step.title} is blocked`];
    if (step.status === 'waiting' && step.waitingOn) return [`Waiting on ${step.waitingOn}`];
    if (step.status === 'needs_approval') return [`${step.title} needs the hire's approval`];
    return [];
  });
}

export interface EmployerMetrics {
  hires: number;
  settled: number;
  blocked: number;
  onTrack: number;
  /** Null until at least one hire has settled. */
  averageDaysToSettled: number | null;
}

export function employerMetrics(
  state: AppState,
  employerId: Id,
  now: IsoDateTime,
): EmployerMetrics {
  const hires = Object.values(state.hires).filter((hire) => hire.employerId === employerId);
  const rows = hires.map((hire) => {
    const steps = stepsOf(state, hire.id);
    return { status: hireStatus(steps), days: daysInRelocation(hire, steps, now) };
  });
  const settled = rows.filter((row) => row.status === 'settled');
  return {
    hires: rows.length,
    settled: settled.length,
    blocked: rows.filter((row) => row.status === 'blocked').length,
    onTrack: rows.filter((row) => row.status === 'on_track' || row.status === 'waiting').length,
    averageDaysToSettled: settled.length
      ? Math.round(settled.reduce((sum, row) => sum + row.days, 0) / settled.length)
      : null,
  };
}
