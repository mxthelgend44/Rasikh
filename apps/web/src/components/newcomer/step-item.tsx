'use client';

import { Badge } from '@/components/ui/badge';
import type { Step } from '@/domain/types';
import type { MessageKey } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/provider';
import { STEP_TONE, StepMarker } from './status';

const titleKey = (step: Pick<Step, 'key'>) => `step.${step.key}.title` as MessageKey;
const shortKey = (step: Pick<Step, 'key'>) => `step.${step.key}.short` as MessageKey;
const reasonKey = (step: Pick<Step, 'key'>) => `step.${step.key}.reason` as MessageKey;

export interface StepItemProps {
  step: Step;
  /** Every step of this hire, to name what a locked step is waiting for. */
  steps: Step[];
  current: boolean;
  last: boolean;
}

export function StepItem({ step, steps, current, last }: StepItemProps) {
  const { t } = useI18n();
  const byKey = new Map(steps.map((candidate) => [candidate.key, candidate]));
  const dependencies = step.dependsOn
    .map((key) => byKey.get(key))
    .filter((dependency): dependency is Step => dependency !== undefined);
  const owner = t(`owner.${step.owner}` as MessageKey);

  return (
    <li className="relative flex gap-3 pb-6 last:pb-0">
      {last ? null : (
        <span aria-hidden className="absolute start-3.5 top-8 bottom-0 w-px bg-line-strong" />
      )}
      <StepMarker status={step.status} current={current} />

      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-start justify-between gap-3">
          <h3
            className={`text-title font-medium ${step.status === 'locked' ? 'text-fg-secondary' : 'text-fg'}`}
          >
            {t(titleKey(step))}
          </h3>
          <Badge shape="pill" tone={STEP_TONE[step.status]} className="mt-0.5 shrink-0">
            {t(`status.${step.status}` as MessageKey)}
          </Badge>
        </div>

        <p className="mt-0.5 text-body text-fg-tertiary">
          {step.status === 'locked' && dependencies.length > 0
            ? t(step.unlockAfter === 'applied' ? 'step.unlocksAfterApplied' : 'step.unlocksAfter', {
                steps: dependencies.map((dependency) => t(shortKey(dependency))).join(' · '),
              })
            : step.status === 'waiting' && step.waitingOn
              ? t('step.waitingOn', { who: step.waitingOn })
              : step.status === 'blocked' && step.blockedReason
                ? step.blockedReason
                : owner}
        </p>

        <details className="group mt-1.5">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-label text-fg-secondary hover:text-fg [&::-webkit-details-marker]:hidden">
            {t('step.why')}
            <span
              aria-hidden
              className="transition-transform group-open:rotate-90 rtl:group-open:-rotate-90"
            >
              ›
            </span>
          </summary>
          <p className="mt-1.5 text-body text-fg-secondary">{t(reasonKey(step))}</p>
          {step.tammServiceId ? (
            <p className="mt-1.5 text-label text-fg-tertiary">{t('step.tamm')}</p>
          ) : null}
        </details>
      </div>
    </li>
  );
}
