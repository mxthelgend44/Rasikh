import { Check, CircleAlert, Clock, Lock, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { BadgeTone } from '@/components/ui/badge';
import type { AgentAction, StepStatus } from '@/domain/types';

export const STEP_TONE: Record<StepStatus, BadgeTone> = {
  locked: 'neutral',
  ready: 'accent',
  in_progress: 'accent',
  waiting: 'warning',
  needs_approval: 'warning',
  blocked: 'danger',
  done: 'success',
};

export const FEED_TONE: Record<AgentAction['status'], BadgeTone> = {
  done: 'success',
  waiting: 'warning',
  needs_approval: 'warning',
  blocked: 'danger',
};

interface StepMarkerProps {
  status: StepStatus;
  /** The step the person is working on now. Gets the accent ring: the one place accent marks progress. */
  current: boolean;
}

const GLYPH: Partial<Record<StepStatus, LucideIcon>> = {
  done: Check,
  waiting: Clock,
  needs_approval: CircleAlert,
  blocked: TriangleAlert,
  locked: Lock,
};

/** Round marker on the roadmap rail. Shape and glyph carry the status, never colour alone. */
export function StepMarker({ status, current }: StepMarkerProps) {
  const Glyph = GLYPH[status];
  const base = 'flex size-7 shrink-0 items-center justify-center rounded-full';
  if (status === 'done') {
    return (
      <span className={`${base} bg-accent text-accent-fg`}>
        {Glyph ? <Glyph aria-hidden className="size-4" /> : null}
      </span>
    );
  }
  const ring = current
    ? 'border-2 border-accent bg-surface text-fg ring-4 ring-accent-soft'
    : 'border border-line-strong bg-surface text-fg-tertiary';
  return (
    <span className={`${base} ${ring}`}>
      {Glyph ? <Glyph aria-hidden className="size-3.5" /> : null}
      {!Glyph ? <span aria-hidden className="size-2 rounded-full bg-accent" /> : null}
    </span>
  );
}
