import { CONTRACT_VERSION } from '@rasikh/shared';
import type { DataLabel } from '@rasikh/shared';
import rules from '../config/risk-rules.json' with { type: 'json' };
import { evaluateState, getBlockers, reason } from './roadmap.js';
import type {
  CaseState,
  RiskAction,
  RiskConfig,
  RiskFinding,
  RiskResult,
  StepDefinition,
  StepState,
} from './types.js';

const dayMilliseconds = 86_400_000;
const levels = { on_track: 0, at_risk: 1, stuck: 2 } as const;

/** Strict calendar validation also rejects Date.parse's silent February/day rollover. */
function timestamp(value: unknown, error: string): number {
  if (typeof value !== 'string') throw new TypeError(error);
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}:\d{2})$/.exec(
      value,
    );
  if (!match) throw new TypeError(error);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? 0);
  const zone = match[8]!;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > monthDays[month - 1]! ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    (zone !== 'Z' && (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4, 6)) > 59))
  ) {
    throw new TypeError(error);
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new TypeError(error);
  return parsed;
}

interface Snapshot {
  state: CaseState;
  asOf: number;
  steps: StepDefinition[];
  completed: Set<string>;
  statuses: Map<string, StepState>;
}

function snapshot(state: CaseState): Snapshot {
  const { steps, completed } = evaluateState(state);
  const asOf = timestamp(state.as_of, 'invalid_as_of');
  const statuses = new Map<string, StepState>();
  for (const status of state.step_states ?? []) {
    const since = timestamp(status.since, `invalid_step_since:${status.step_id}`);
    if (since > asOf) throw new TypeError(`future_step_since:${status.step_id}`);
    statuses.set(status.step_id, status);
  }
  return { state, asOf, steps, completed, statuses };
}

function validateHistory(snapshots: Snapshot[]): void {
  for (let index = 1; index < snapshots.length; index++) {
    const previous = snapshots[index - 1]!;
    const current = snapshots[index]!;
    if (current.state.input.case_id !== previous.state.input.case_id)
      throw new TypeError('history_case_changed');
    if (current.state.input.journey !== previous.state.input.journey)
      throw new TypeError('history_journey_changed');
    if (current.asOf < previous.asOf) throw new TypeError('history_time_reversed');
    for (const stepId of previous.completed) {
      if (!current.completed.has(stepId))
        throw new TypeError(`history_completed_step_reopened:${stepId}`);
    }
    for (const [stepId, previousStatus] of previous.statuses) {
      const currentStatus = current.statuses.get(stepId);
      if (!currentStatus) {
        if (!current.completed.has(stepId))
          throw new TypeError(`history_step_state_removed:${stepId}`);
        continue;
      }
      const before = timestamp(previousStatus.since, `invalid_step_since:${stepId}`);
      const after = timestamp(currentStatus.since, `invalid_step_since:${stepId}`);
      if (currentStatus.status === previousStatus.status) {
        if (after !== before)
          throw new TypeError(`history_unchanged_status_since_changed:${stepId}`);
      } else if (after < previous.asOf) {
        throw new TypeError(`history_transition_predates_snapshot:${stepId}`);
      }
    }
  }
}

interface DocumentCause {
  step_id: string;
  document_label: DataLabel;
}

/**
 * Explicit illustrative rules only. The latest snapshot determines risk; history
 * validates continuity. Durations use the caller's clock, with a one-day floor
 * for zero-day milestones. A long ordinary dependency queue alone is not a risk.
 */
export function detectRisks(
  stateOrHistory: CaseState | readonly CaseState[],
  config: Partial<RiskConfig> = {},
): RiskResult {
  if (!config || typeof config !== 'object' || Array.isArray(config))
    throw new TypeError('invalid_risk_config');
  const unknownKey = Object.keys(config)
    .sort()
    .find((key) => key !== 'stuck_window_multiplier');
  if (unknownKey !== undefined) throw new TypeError(`unknown_risk_config_key:${unknownKey}`);
  const multiplier =
    config.stuck_window_multiplier === undefined
      ? rules.stuck_window_multiplier
      : config.stuck_window_multiplier;
  if (typeof multiplier !== 'number' || !Number.isFinite(multiplier) || multiplier <= 1)
    throw new TypeError('invalid_stuck_window_multiplier');
  const history: readonly CaseState[] = Array.isArray(stateOrHistory)
    ? stateOrHistory
    : [stateOrHistory as CaseState];
  if (history.length === 0) throw new TypeError('empty_case_history');
  const snapshots = Array.from(history, snapshot);
  validateHistory(snapshots);
  const current = snapshots[snapshots.length - 1]!;
  const blockers = getBlockers(current.state).blockers;
  const blockerById = new Map(blockers.map((blocker) => [blocker.step_id, blocker]));
  const stepById = new Map(current.steps.map((step) => [step.id, step]));
  const documentCauses = new Map<string, DocumentCause[]>();

  function causesFor(stepId: string): DocumentCause[] {
    const cached = documentCauses.get(stepId);
    if (cached) return cached;
    const causes: DocumentCause[] = [];
    if (!current.completed.has(stepId)) {
      const blocker = blockerById.get(stepId);
      if (blocker && blocker.unmet_dependencies.length === 0) {
        causes.push(
          ...blocker.missing_documents.map((document_label) => ({
            step_id: stepId,
            document_label,
          })),
        );
      }
      for (const dependency of stepById.get(stepId)!.depends_on)
        causes.push(...causesFor(dependency));
    }
    const unique = [
      ...new Map(
        causes.map((cause) => [`${cause.step_id}\u0000${cause.document_label}`, cause]),
      ).values(),
    ];
    documentCauses.set(stepId, unique);
    return unique;
  }

  function nextAction(stepId: string): RiskAction {
    const cause = causesFor(stepId)[0];
    if (cause)
      return {
        action_key: 'collect_document',
        step_id: cause.step_id,
        ...(cause.step_id !== stepId ? { dependency_id: cause.step_id } : {}),
        document_label: cause.document_label,
      };
    const unmet = blockerById.get(stepId)?.unmet_dependencies[0];
    if (unmet) return { action_key: 'complete_dependency', step_id: stepId, dependency_id: unmet };
    return { action_key: 'follow_up_step', step_id: stepId };
  }

  const findings: RiskFinding[] = [];
  for (const step of current.steps) {
    if (current.completed.has(step.id)) continue;
    for (const cause of causesFor(step.id)) {
      const direct = cause.step_id === step.id;
      findings.push({
        step_id: step.id,
        level: 'at_risk',
        reason: reason(
          direct ? 'document' : 'dependency_document',
          {
            ...(direct ? {} : { dependency_id: cause.step_id }),
            document_label: cause.document_label,
          },
          'blocked',
          direct ? 'risk.document_missing' : 'risk.dependency_document_missing',
        ),
        next_action: {
          action_key: 'collect_document',
          step_id: cause.step_id,
          ...(direct ? {} : { dependency_id: cause.step_id }),
          document_label: cause.document_label,
        },
      });
    }
    const status = current.statuses.get(step.id);
    if (!status || (status.status !== 'waiting' && status.status !== 'in_progress')) continue;
    const elapsedDays =
      (current.asOf - timestamp(status.since, `invalid_step_since:${step.id}`)) / dayMilliseconds;
    const windowDays = Math.max(
      rules.minimum_window_days.value,
      step.estimated_duration_days.value,
    );
    if (elapsedDays <= windowDays) continue;
    const level = elapsedDays > windowDays * multiplier ? 'stuck' : 'at_risk';
    findings.push({
      step_id: step.id,
      level,
      reason: reason(
        'elapsed_days',
        {
          status: status.status,
          elapsed_days: elapsedDays,
          illustrative_window_days: windowDays,
          stuck_after_days: windowDays * multiplier,
        },
        level,
        level === 'stuck' ? 'risk.step_stuck' : 'risk.step_overdue',
      ),
      next_action: nextAction(step.id),
    });
  }
  const riskLevel = findings.reduce<RiskResult['risk_level']>(
    (level, finding) => (levels[finding.level] > levels[level] ? finding.level : level),
    'on_track',
  );
  return {
    contract_version: CONTRACT_VERSION,
    illustrative: true,
    case_id: current.state.input.case_id,
    risk_level: riskLevel,
    findings,
    reasons: findings.length
      ? findings.map((finding) => finding.reason)
      : [reason('risk_level', 'on_track', 'on_track', 'risk.no_rule_matched')],
  };
}
