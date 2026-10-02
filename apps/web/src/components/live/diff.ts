import type {
  AgentAction,
  Application,
  ApplicationKind,
  ApplicationState,
  AppState,
  Approval,
  Id,
  Step,
  StepStatus,
} from '@/domain/types';
import type { Snapshot } from '@/store/snapshot';

/**
 * Pure logic behind the live toasts: what changed between two copies of the shared state, and
 * how many of those changes are worth interrupting someone for. No React, no clock, no DOM.
 */

export type ToastTone = 'success' | 'warning' | 'danger' | 'info';

export type LiveEventKind = 'agent' | 'application' | 'approval' | 'step' | 'reset' | 'overflow';

export interface LiveEvent {
  /** Stable identity of the change, used to drop repeats. */
  key: string;
  kind: LiveEventKind;
  /** The hire this is about. Absent for company, reset and overflow events. */
  hireId?: Id;
  companyId?: Id;
  applicationId?: Id;
  applicationKind?: ApplicationKind;
  /** First name of the hire, or the company name. Empty for reset and overflow events. */
  who: string;
  /** The app's own wording of what happened. Not translated. Empty for reset and overflow. */
  text: string;
  tone: ToastTone;
  /** Overflow events only: how many further updates were folded in. */
  count?: number;
}

/** How many toasts one state change may raise before the rest are folded into a count. */
export const MAX_PER_UPDATE = 3;

/**
 * Whether `next` is a reset or a new server rather than a normal step forward. After either the
 * old ids mean nothing, so the screen shows one "Demo reset" toast instead of diffing.
 */
export function isReset(prev: Snapshot, next: Snapshot): boolean {
  return (
    prev.epoch !== next.epoch ||
    next.state.rev < prev.state.rev ||
    next.state.clock.resetAtMs !== prev.state.clock.resetAtMs
  );
}

export function resetEvent(next: Snapshot): LiveEvent {
  return {
    key: `reset:${next.epoch}:${next.state.clock.resetAtMs}`,
    kind: 'reset',
    who: '',
    text: '',
    tone: 'info',
  };
}

const APPLICATION_STATE_WORDS: Record<ApplicationState, string> = {
  awaiting_approval: 'awaiting approval',
  submitted: 'submitted',
  under_review: 'under review',
  needs_info: 'needs more information',
  terms_offered: 'terms offered',
  approved: 'approved',
  declined: 'declined',
};

const APPLICATION_STATE_TONES: Record<ApplicationState, ToastTone> = {
  awaiting_approval: 'warning',
  submitted: 'info',
  under_review: 'info',
  needs_info: 'warning',
  terms_offered: 'warning',
  approved: 'success',
  declined: 'danger',
};

const STEP_STATUS_TONES: Record<StepStatus, ToastTone> = {
  locked: 'info',
  ready: 'info',
  in_progress: 'info',
  waiting: 'warning',
  needs_approval: 'warning',
  blocked: 'danger',
  done: 'success',
};

const AGENT_STATUS_TONES: Record<AgentAction['status'], ToastTone> = {
  done: 'success',
  waiting: 'info',
  needs_approval: 'warning',
  blocked: 'danger',
};

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function words(value: string): string {
  return value.replaceAll('_', ' ');
}

function hireName(state: AppState, hireId: Id): string {
  const hire = state.hires[hireId];
  return hire ? firstName(hire.fullName) : '';
}

function applicationLabel(application: Application): string {
  return application.kind === 'rental' ? 'Rental application' : 'Bank account application';
}

function agentEvent(state: AppState, action: AgentAction): LiveEvent {
  const isHire = action.caseType === 'hire';
  const application = action.applicationId ? state.applications[action.applicationId] : undefined;
  return {
    key: `agent:${action.id}`,
    kind: 'agent',
    hireId: isHire ? action.caseId : undefined,
    companyId: isHire ? undefined : action.caseId,
    applicationId: application?.id,
    applicationKind: application?.kind,
    who: isHire ? hireName(state, action.caseId) : (state.companies[action.caseId]?.name ?? ''),
    text: action.summary,
    tone: AGENT_STATUS_TONES[action.status],
  };
}

function applicationEvent(state: AppState, application: Application): LiveEvent {
  return {
    key: `application:${application.id}:${application.state}`,
    kind: 'application',
    hireId: application.hireId,
    applicationId: application.id,
    applicationKind: application.kind,
    who: hireName(state, application.hireId),
    text: `${applicationLabel(application)}: ${APPLICATION_STATE_WORDS[application.state]}`,
    tone: APPLICATION_STATE_TONES[application.state],
  };
}

function approvalEvent(state: AppState, approval: Approval): LiveEvent {
  const application = approval.applicationId
    ? state.applications[approval.applicationId]
    : undefined;
  const lead =
    approval.status === 'pending'
      ? 'Approval needed'
      : approval.status === 'approved'
        ? 'Approved'
        : 'Declined';
  return {
    key: `approval:${approval.id}:${approval.status}`,
    kind: 'approval',
    hireId: approval.hireId,
    applicationId: application?.id,
    applicationKind: application?.kind,
    who: hireName(state, approval.hireId),
    text: `${lead}: ${approval.title}`,
    tone:
      approval.status === 'pending'
        ? 'warning'
        : approval.status === 'approved'
          ? 'success'
          : 'danger',
  };
}

function stepEvent(state: AppState, step: Step): LiveEvent {
  return {
    key: `step:${step.id}:${step.status}`,
    kind: 'step',
    hireId: step.hireId,
    who: hireName(state, step.hireId),
    text: `${step.title}: ${words(step.status)}`,
    tone: STEP_STATUS_TONES[step.status],
  };
}

function sortedByTime<T extends { id: Id }>(items: T[], at: (item: T) => string): T[] {
  return [...items].sort((a, b) => at(a).localeCompare(at(b)) || a.id.localeCompare(b.id));
}

/**
 * What a person would want to hear about between `prev` and `next`, oldest first.
 *
 * One action in the app usually touches several records at once: approving a draft adds a feed
 * entry, moves the application, closes the approval and changes a step. Telling the same story four
 * times would bury it, so a feed entry is the narrative for its hire, and the other changes only
 * speak for a hire that has no feed entry in this update. Even then a hire gets one event, chosen
 * from application, approval and step in that order.
 */
export function diffStates(prev: AppState, next: AppState): LiveEvent[] {
  if (prev === next) return [];
  const events: LiveEvent[] = [];
  const told = new Set<Id>();

  const entries = Object.values(next.agentActions).filter(
    (action) => !(action.id in prev.agentActions),
  );
  for (const action of sortedByTime(entries, (item) => item.at)) {
    events.push(agentEvent(next, action));
    if (action.caseType === 'hire') told.add(action.caseId);
  }

  const quiet = new Map<Id, LiveEvent>();
  const offer = (hireId: Id, event: LiveEvent) => {
    if (!told.has(hireId) && !quiet.has(hireId)) quiet.set(hireId, event);
  };

  for (const application of Object.values(next.applications)) {
    const before = prev.applications[application.id];
    if (before && before.state !== application.state)
      offer(application.hireId, applicationEvent(next, application));
  }

  for (const approval of Object.values(next.approvals)) {
    const before = prev.approvals[approval.id];
    if (!before ? approval.status === 'pending' : before.status !== approval.status)
      offer(approval.hireId, approvalEvent(next, approval));
  }

  // Dependent steps unlock and re-lock as a side effect of the step someone actually changed.
  const changedSteps = Object.values(next.steps)
    .filter((step) => {
      const before = prev.steps[step.id];
      if (!before || before.status === step.status) return false;
      return step.status !== 'locked' && !(before.status === 'locked' && step.status === 'ready');
    })
    .sort((a, b) => a.order - b.order);
  for (const step of changedSteps) offer(step.hireId, stepEvent(next, step));

  return [...events, ...quiet.values()];
}

/** The first `max - 1` events and one overflow event standing for the rest. */
export function foldEvents(events: LiveEvent[], max: number = MAX_PER_UPDATE): LiveEvent[] {
  if (events.length <= max) return events;
  const shown = events.slice(0, max - 1);
  const hidden = events.length - shown.length;
  return [
    ...shown,
    {
      key: `overflow:${events[0]?.key ?? ''}:${hidden}`,
      kind: 'overflow',
      who: '',
      text: '',
      tone: 'info',
      count: hidden,
    },
  ];
}

export type Surface = 'newcomer' | 'dashboard';

export function surfaceOf(pathname: string): Surface {
  return pathname === '/newcomer' || pathname.startsWith('/newcomer/') ? 'newcomer' : 'dashboard';
}

/**
 * Whether the person at this screen should hear about `event`. A phone belongs to one newcomer, so
 * it only shows that person's events; the dashboards show everything.
 */
export function isRelevant(
  event: LiveEvent,
  surface: Surface,
  viewedHireId: Id | undefined,
): boolean {
  if (event.kind === 'reset' || surface === 'dashboard') return true;
  return viewedHireId !== undefined && event.hireId === viewedHireId;
}

export type Audience = 'newcomer' | 'employer' | 'landlord' | 'bank' | 'presenter';

export function audienceOf(pathname: string): Audience {
  const inside = (root: string) => pathname === root || pathname.startsWith(`${root}/`);
  if (inside('/newcomer')) return 'newcomer';
  if (inside('/employer')) return 'employer';
  if (inside('/landlord')) return 'landlord';
  if (inside('/bank')) return 'bank';
  return 'presenter';
}

/** Applications that moved into a state their recipient is allowed to know about. */
function releasedApplicationEvents(
  prev: AppState,
  next: AppState,
  kind: ApplicationKind,
): LiveEvent[] {
  return Object.values(next.applications)
    .filter((application) => {
      if (application.kind !== kind) return false;
      // A draft is private until the newcomer approves it: its recipient hears nothing about it.
      if (application.state === 'awaiting_approval') return false;
      return prev.applications[application.id]?.state !== application.state;
    })
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((application) => applicationEvent(next, application));
}

/**
 * What THIS screen's audience may hear about between `prev` and `next`. A toast is a disclosure,
 * so each audience sees only what its own screen already shows:
 * - a phone shows its own person's events;
 * - a landlord or bank hears only that an application reached them or moved on, never a draft, an
 *   approval, a consent or an agent note about the person;
 * - an employer hears that a journey moved, with no detail of what the agent or the person
 *   decided, plus its own company-setup events;
 * - everything else (the hub, the presenter tools) hears only about a reset.
 */
export function audienceEvents(
  prev: AppState,
  next: AppState,
  audience: Audience,
  viewedHireId: Id | undefined,
): LiveEvent[] {
  if (audience === 'presenter') return [];
  if (audience === 'landlord') return releasedApplicationEvents(prev, next, 'rental');
  if (audience === 'bank') return releasedApplicationEvents(prev, next, 'bank_account');
  const events = diffStates(prev, next);
  if (audience === 'newcomer')
    return events.filter((event) => viewedHireId !== undefined && event.hireId === viewedHireId);
  return events.flatMap((event): LiveEvent[] => {
    if (event.kind === 'approval' || event.kind === 'application') return [];
    if (event.kind === 'agent' && event.hireId)
      return [
        {
          ...event,
          key: `employer:${event.key}`,
          text: 'Journey updated',
          applicationId: undefined,
          applicationKind: undefined,
          tone: 'info',
        },
      ];
    return [event];
  });
}

/** Where "View" goes, or undefined when nothing sensible is left to open. */
export function routeFor(event: LiveEvent, surface: Surface): string | undefined {
  if (event.kind === 'reset' || event.kind === 'overflow') return undefined;
  if (surface === 'newcomer')
    return event.kind === 'agent' || event.kind === 'approval' ? '/newcomer/agent' : '/newcomer';
  if (event.applicationId && event.applicationKind === 'rental')
    return `/landlord/applications/${event.applicationId}`;
  if (event.applicationId && event.applicationKind === 'bank_account')
    return `/bank/applications/${event.applicationId}`;
  if (event.hireId) return `/employer/hires/${event.hireId}`;
  if (event.companyId) return '/employer/expansion';
  return undefined;
}

/**
 * Drops repeats and caps the rate. A change that was already shown within `dedupeMs` is ignored,
 * and no more than `limit` toasts pass in any `windowMs`, so a burst of changes cannot flood the
 * screen. Time comes in as an argument, which keeps this testable.
 */
export class ToastGate {
  private readonly seen = new Map<string, number>();
  private accepted: number[] = [];

  constructor(
    private readonly options: {
      dedupeMs: number;
      windowMs: number;
      limit: number;
    } = {
      dedupeMs: 15_000,
      windowMs: 10_000,
      limit: 8,
    },
  ) {}

  accept(event: LiveEvent, nowMs: number): boolean {
    for (const [key, at] of this.seen)
      if (nowMs - at >= this.options.dedupeMs) this.seen.delete(key);
    this.accepted = this.accepted.filter((at) => nowMs - at < this.options.windowMs);
    // The same words about the same person are one toast, even when two records produced them.
    const echo = `${event.who}|${event.text}`;
    if (this.seen.has(event.key) || (event.text && this.seen.has(echo))) return false;
    if (event.kind !== 'reset' && this.accepted.length >= this.options.limit) return false;
    this.seen.set(event.key, nowMs);
    if (event.text) this.seen.set(echo, nowMs);
    this.accepted.push(nowMs);
    return true;
  }

  /** Forget everything, for example after a reset. */
  clear(): void {
    this.seen.clear();
    this.accepted = [];
  }
}

export interface ToastItem {
  id: string;
  event: LiveEvent;
}

/** Appends `item`, replacing one with the same event key, and keeps only the newest `max`. */
export function pushToast(list: ToastItem[], item: ToastItem, max = 3): ToastItem[] {
  const next = [...list.filter((entry) => entry.event.key !== item.event.key), item];
  return next.length > max ? next.slice(next.length - max) : next;
}
