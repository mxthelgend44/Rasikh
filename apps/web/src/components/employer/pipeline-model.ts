import { currentStep, daysInRelocation, hireStatus, stepsOf } from '@/domain/selectors';
import type { HireStatus } from '@/domain/selectors';
import type { AppState, Hire, IsoDateTime, Step, StepKey } from '@/domain/types';

export interface PipelineRow {
  hire: Hire;
  steps: Step[];
  current: Step | undefined;
  status: HireStatus;
  days: number;
  done: number;
}
export interface PipelineFilters {
  search: string;
  status: string;
  stage: string;
  stageGroup: string;
  backing: string;
  origin: string;
}

export function pipelineRows(state: AppState, employerId: string, now: IsoDateTime): PipelineRow[] {
  return Object.values(state.hires)
    .filter((hire) => hire.employerId === employerId)
    .map((hire) => {
      const steps = stepsOf(state, hire.id);
      return {
        hire,
        steps,
        current: currentStep(steps),
        status: hireStatus(steps),
        days: daysInRelocation(hire, steps, now),
        done: steps.filter((step) => step.status === 'done').length,
      };
    });
}

export function filterPipeline(rows: PipelineRow[], filters: PipelineFilters): PipelineRow[] {
  const groups: Record<string, StepKey[]> = {
    documents: ['documents'],
    residence_visa: ['residence_visa', 'emirates_id'],
    housing: [
      'housing',
      'tenancy_registration',
      'bank_account',
      'health_insurance',
      'family_sponsorship',
      'school',
    ],
  };
  const search = filters.search.trim().toLocaleLowerCase();
  return rows.filter((row) => {
    if (
      search &&
      ![
        row.hire.fullName,
        row.hire.role,
        row.hire.department,
        row.hire.originCountry,
        row.hire.originCity,
      ].some((value) => value.toLocaleLowerCase().includes(search))
    )
      return false;
    if (
      filters.status === 'attention' &&
      !row.steps.some((step) => step.status === 'blocked' || step.status === 'needs_approval')
    )
      return false;
    if (filters.status !== 'all' && filters.status !== 'attention' && row.status !== filters.status)
      return false;
    if (
      filters.stage !== 'all' &&
      (filters.stage === 'settled' ? Boolean(row.current) : row.current?.key !== filters.stage)
    )
      return false;
    if (
      filters.stageGroup &&
      (filters.stageGroup === 'settled'
        ? Boolean(row.current)
        : !row.current || !(groups[filters.stageGroup] ?? []).includes(row.current.key))
    )
      return false;
    if (filters.backing !== 'all' && row.hire.backing.status !== filters.backing) return false;
    if (filters.origin !== 'all' && row.hire.originCountry !== filters.origin) return false;
    return true;
  });
}

/** Escapes spreadsheet formulas as well as CSV separators in user-entered names and roles. */
export function csvCell(value: string | number): string {
  const safe =
    typeof value === 'string' && /^[=+@\-\t\r]/.test(value) ? `'${value}` : String(value);
  return `"${safe.replaceAll('"', '""')}"`;
}
