'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { currentStep, stepsOf } from '@/domain/selectors';
import { formatDate } from '@/lib/format';
import type { MessageKey } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/provider';
import { useNewcomer } from '@/store/person';
import { StepItem } from './step-item';

export function RoadmapView() {
  const { t, locale } = useI18n();
  const { state, hire } = useNewcomer();
  const steps = useMemo(() => (hire ? stepsOf(state, hire.id) : []), [state, hire]);
  if (!hire) return null;

  const done = steps.filter((step) => step.status === 'done').length;
  const current = currentStep(steps);
  const employer = state.employers[hire.employerId]?.name ?? '';
  const backed = hire.backing.status === 'backed';
  const company = hire.companyId ? state.companies[hire.companyId]?.name : undefined;

  return (
    <>
      <div>
        <h1 className="text-heading font-medium">{t('roadmap.title')}</h1>
        <p className="mt-0.5 text-body text-fg-tertiary" dir="auto">
          {hire.fullName} · {hire.role}
        </p>
      </div>

      <section aria-label={t('roadmap.title')} className="mt-5">
        <div className="flex items-center justify-between gap-3 text-body">
          <span className="font-medium text-fg">
            {t('roadmap.progress', { done, total: steps.length })}
          </span>
          <span className="text-fg-tertiary" dir="auto">
            {current
              ? t('roadmap.next', { step: t(`step.${current.key}.title` as MessageKey) })
              : t('roadmap.allDone')}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={done}
          className="mt-2 h-2 overflow-hidden rounded-full bg-track"
        >
          <div
            className="h-full rounded-full bg-solid transition-[width] duration-200"
            style={{ width: `${steps.length ? (done / steps.length) * 100 : 0}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge shape="pill" tone={backed ? 'accent' : 'neutral'}>
            {backed
              ? t('roadmap.backed', { employer: company ?? employer })
              : t('roadmap.notBacked')}
          </Badge>
          <span className="text-label text-fg-tertiary">
            {t('roadmap.startDate', { date: formatDate(hire.startDate, locale) })}
          </span>
        </div>
      </section>

      <ol className="mt-7">
        {steps.map((step, index) => (
          <StepItem
            key={step.id}
            step={step}
            steps={steps}
            current={step.id === current?.id}
            last={index === steps.length - 1}
          />
        ))}
      </ol>
    </>
  );
}
