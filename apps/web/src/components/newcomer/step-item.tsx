'use client';

import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { Step } from '@/domain/types';
import type { MessageKey } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/provider';
import { STEP_TONE, StepMarker } from './status';
import { localizedRecord, translatedRecord } from './localized-record';

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
  const { t, locale } = useI18n();
  const byKey = new Map(steps.map((candidate) => [candidate.key, candidate]));
  const dependencies = step.dependsOn
    .map((key) => byKey.get(key))
    .filter((dependency): dependency is Step => dependency !== undefined);
  const owner = t(`owner.${step.owner}` as MessageKey);

  return (
    <li id={step.id} className="relative flex scroll-mt-24 gap-3 pb-6 last:pb-0">
      {last ? null : (
        <span
          aria-hidden
          className={
            step.status === 'done'
              ? 'absolute start-3.5 -ms-px top-8 bottom-0 w-0.5 bg-accent'
              : 'absolute start-3.5 top-8 bottom-0 w-0 border-s border-dashed border-line-strong'
          }
        />
      )}
      <StepMarker status={step.status} current={current} />

      <div
        className={`min-w-0 flex-1 ${current ? `-mt-1 rounded-xl px-3 pb-3 pt-1.5 ${step.status === 'blocked' ? 'bg-danger-soft' : 'bg-accent-soft'}` : 'pt-0.5'}`}
      >
        <div className="flex items-start justify-between gap-3">
          <h3
            className={`text-title font-medium ${step.status === 'locked' ? 'text-fg-secondary' : step.status === 'done' ? 'text-fg-secondary' : 'text-fg'}`}
          >
            {t(titleKey(step))}
          </h3>
          <Badge
            shape="pill"
            tone={STEP_TONE[step.status]}
            className={`mt-0.5 shrink-0 ${current ? 'bg-surface' : ''}`}
          >
            {t(`status.${step.status}` as MessageKey)}
          </Badge>
        </div>

        <p className="mt-0.5 text-body text-fg-tertiary">
          {step.status === 'locked' && dependencies.length > 0
            ? t(step.unlockAfter === 'applied' ? 'step.unlocksAfterApplied' : 'step.unlocksAfter', {
                steps: dependencies.map((dependency) => t(shortKey(dependency))).join(' · '),
              })
            : step.status === 'waiting' && step.waitingOn
              ? t('step.waitingOn', {
                  who: localizedRecord(step.waitingOn, locale),
                })
              : step.status === 'blocked' && step.blockedReason
                ? translatedRecord(step.blockedReason, locale)
                  ? localizedRecord(step.blockedReason, locale)
                  : locale === 'ar'
                    ? 'تحتاج هذه الخطوة إلى إجراء. راجع الملاحظة الأصلية أدناه.'
                    : step.blockedReason
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
            <p className="mt-1.5 text-label text-fg-tertiary">
              {locale === 'ar'
                ? 'مسار خدمة TAMM توضيحي في هذا العرض.'
                : 'Illustrative TAMM service route in this demo.'}
            </p>
          ) : null}
          {step.blockedReason && !translatedRecord(step.blockedReason, locale) ? (
            <p className="mt-2 text-label text-fg-secondary">
              {locale === 'ar' ? 'الملاحظة الأصلية: ' : 'Original note: '}
              <bdi dir="auto">{step.blockedReason}</bdi>
            </p>
          ) : null}
        </details>
        {step.key === 'documents' && step.status !== 'done' ? (
          <Link
            href="/newcomer/documents"
            className="mt-2 inline-flex min-h-11 items-center rounded-md border border-line-strong bg-surface px-3 text-body font-medium transition-colors hover:bg-hover active:bg-selected"
          >
            {t('nav.documents')}
          </Link>
        ) : step.status === 'needs_approval' ? (
          <Link
            href="/newcomer/agent"
            className="mt-2 inline-flex min-h-11 items-center rounded-md border border-line-strong bg-surface px-3 text-body font-medium transition-colors hover:bg-hover active:bg-selected"
          >
            {locale === 'ar' ? 'مراجعة القرار' : 'Review decision'}
          </Link>
        ) : null}
      </div>
    </li>
  );
}
