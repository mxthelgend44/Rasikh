'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, FileCheck2, CircleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Illustration } from '@/components/ui/illustration';
import { REQUIRED_DOCUMENTS, documentId } from '@/domain/documents';
import { currentStep, stepsOf } from '@/domain/selectors';
import { formatDate } from '@/lib/format';
import { intlTag, type MessageKey } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/provider';
import { useNewcomer } from '@/store/person';
import { ProgressRing } from './progress-ring';
import { StepItem } from './step-item';
import { localizedRecord } from './localized-record';

const en = {
  welcome: 'Your next chapter in Abu Dhabi',
  needsYou: 'Waiting for you',
  next: 'Your next action',
  approvals: 'Review a request',
  approvalsHint: 'Check the recipient, details and current permissions before deciding.',
  docs: 'Complete your document review',
  docsHint: 'Add the missing copies or review the suggested fields before confirming.',
  waiting: 'See the latest activity',
  waitingHint:
    'Your case is waiting on another party. You can review activity and current consent.',
  underway: 'Review this step',
  underwayHint: 'See what is ready, what is waiting and why the step is here.',
  settled: 'You have completed your roadmap',
  settledHint: 'Your documents and current consent remain available whenever you need them.',
  passport: 'Review your trust passport',
  confirmed: 'Documents ready',
  pending: 'Pending requests',
  journey: 'Your relocation steps',
  originalRole: 'Role as entered',
  empty: 'Your journey starts with a hire',
  emptyHint: 'Add a hire from the employer view to create a personal relocation roadmap.',
  addHire: 'Open employer view',
};
const ar: Record<keyof typeof en, string> = {
  welcome: 'بداية جديدة في أبوظبي',
  needsYou: 'بانتظارك',
  next: 'الإجراء القادم',
  approvals: 'مراجعة طلب',
  approvalsHint: 'راجع الجهة المستلمة والتفاصيل والموافقات الحالية قبل اتخاذ القرار.',
  docs: 'أكمل مراجعة مستنداتك',
  docsHint: 'أضف النسخ الناقصة أو راجع الحقول المقترحة قبل تأكيدها.',
  waiting: 'متابعة آخر الأنشطة',
  waitingHint: 'تنتظر معاملتك إجراء جهة أخرى. يمكنك مراجعة النشاط والموافقات الحالية.',
  underway: 'مراجعة هذه الخطوة',
  underwayHint: 'اطّلع على الخطوات الجاهزة والمعلّقة وسبب ترتيبها.',
  settled: 'أكملت خطوات الاستقرار',
  settledHint: 'تبقى مستنداتك وموافقاتك الحالية متاحة متى احتجتها.',
  passport: 'مراجعة جواز الثقة',
  confirmed: 'مستندات جاهزة',
  pending: 'طلبات تنتظر قرارك',
  journey: 'خطوات انتقالك',
  originalRole: 'المسمى الوظيفي كما أُدخل',
  empty: 'تبدأ رحلتك بإضافة موظف',
  emptyHint: 'أضف موظفاً من واجهة جهة العمل لإنشاء خارطة انتقال شخصية.',
  addHire: 'فتح واجهة جهة العمل',
};

export function RoadmapView() {
  const { t, locale } = useI18n();
  const copy = locale === 'ar' ? ar : en;
  const { state, hire } = useNewcomer();
  const steps = useMemo(() => (hire ? stepsOf(state, hire.id) : []), [state, hire]);
  if (!hire)
    return (
      <EmptyState
        illustration={<Illustration variant="journey" />}
        title={copy.empty}
        description={copy.emptyHint}
        action={
          <Link
            href="/employer/hires"
            className="inline-flex min-h-11 items-center rounded-md bg-solid px-4 text-body font-medium text-solid-fg"
          >
            {copy.addHire}
          </Link>
        }
      />
    );

  const done = steps.filter((step) => step.status === 'done').length;
  const current = currentStep(steps);
  const employer = state.employers[hire.employerId]?.name ?? '';
  const backed = hire.backing.status === 'backed';
  const company = hire.companyId ? state.companies[hire.companyId]?.name : undefined;
  const approvals = Object.values(state.approvals).filter(
    (approval) => approval.hireId === hire.id && approval.status === 'pending',
  );
  const offeredTerms = Object.values(state.applications).filter(
    (application) =>
      application.hireId === hire.id &&
      application.state === 'terms_offered' &&
      !approvals.some(
        (approval) => approval.applicationId === application.id && approval.kind === 'terms',
      ),
  );
  const pendingRequests = approvals.length + offeredTerms.length;
  const required = REQUIRED_DOCUMENTS.map((kind) => state.documents[documentId(kind, hire.id)]);
  const confirmed = required.filter((document) => document?.status === 'verified').length;
  const documentsStep = steps.find((step) => step.key === 'documents');
  const documentsNeedReview =
    Boolean(documentsStep && documentsStep.status !== 'done') ||
    required.some((document) => !document || document.status !== 'verified');
  const actionable = steps.find(
    (step) => step.status === 'ready' || step.status === 'in_progress' || step.status === 'blocked',
  );
  const nextAction = pendingRequests
    ? {
        title: copy.approvals,
        hint: copy.approvalsHint,
        href: '/newcomer/agent',
      }
    : documentsNeedReview
      ? { title: copy.docs, hint: copy.docsHint, href: '/newcomer/documents' }
      : !current
        ? {
            title: copy.settled,
            hint: copy.settledHint,
            href: '/newcomer/passport',
          }
        : actionable
          ? {
              title: t(`step.${actionable.key}.title` as MessageKey),
              hint: copy.underwayHint,
              href: `/newcomer#${actionable.id}`,
            }
          : {
              title: copy.waiting,
              hint: copy.waitingHint,
              href: '/newcomer/agent',
            };
  const actionLabel = pendingRequests
    ? copy.approvals
    : documentsNeedReview
      ? t('nav.documents')
      : !current
        ? copy.passport
        : actionable
          ? copy.underway
          : copy.waiting;

  const number = (value: number) => new Intl.NumberFormat(intlTag(locale)).format(value);
  const progressLabel = t('roadmap.progress', { done, total: steps.length });

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-label text-accent">{copy.welcome}</p>
          <h1 className="text-heading font-medium">{t('roadmap.title')}</h1>
          <p className="mt-1 break-words text-body text-fg-secondary">
            <bdi dir="auto">{hire.fullName}</bdi> ·{' '}
            <bdi dir="auto">{localizedRecord(hire.role, locale)}</bdi>
          </p>
        </div>
        <Illustration
          variant={current ? 'arrival' : 'fully-settled'}
          className="max-w-[6rem] shrink-0 rounded-lg"
          priority
        />
      </div>

      <section
        aria-labelledby="next-action-title"
        className="mt-5 rounded-xl border border-line-strong bg-raised p-4"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-label text-fg-tertiary">{copy.next}</p>
          {pendingRequests ? (
            <Badge shape="pill" tone="warning">
              {copy.needsYou}
            </Badge>
          ) : null}
        </div>
        <h2 id="next-action-title" className="mt-1 text-title font-medium">
          {nextAction.title}
        </h2>
        <p className="mt-1 text-body text-fg-secondary">{nextAction.hint}</p>
        <Link
          href={nextAction.href}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-solid px-4 py-2 text-body font-medium text-solid-fg transition-colors hover:bg-solid/90 active:bg-solid/80 sm:w-auto"
        >
          {actionLabel}
          <ArrowRight aria-hidden className="size-4 shrink-0 rtl:rotate-180" />
        </Link>
      </section>

      <section aria-label={t('roadmap.title')} className="mt-4 rounded-xl border border-line p-4">
        <div className="flex items-center gap-4">
          <ProgressRing
            done={done}
            total={steps.length}
            center={`${number(done)}/${number(steps.length)}`}
            label={progressLabel}
          />
          <div className="min-w-0 flex-1">
            <p className="text-title font-medium">{progressLabel}</p>
            <p className="mt-0.5 text-body text-fg-secondary">
              {current
                ? t('roadmap.next', {
                    step: t(`step.${current.key}.title` as MessageKey),
                  })
                : t('roadmap.allDone')}
            </p>
            <p className="mt-1 text-label text-fg-tertiary">
              {t('roadmap.startDate', {
                date: formatDate(hire.startDate, locale),
              })}
            </p>
          </div>
        </div>
        <Badge
          shape="pill"
          tone={backed ? 'accent' : 'neutral'}
          className="mt-3 h-auto min-h-5 max-w-full whitespace-normal break-words py-0.5"
        >
          {backed ? t('roadmap.backed', { employer: company ?? employer }) : t('roadmap.notBacked')}
        </Badge>
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success">
              <FileCheck2 aria-hidden className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-title font-medium leading-5">
                {number(confirmed)} / {number(REQUIRED_DOCUMENTS.length)}
              </p>
              <p className="text-label text-fg-secondary">{copy.confirmed}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${pendingRequests ? 'bg-warning-soft text-warning' : 'bg-track text-fg-secondary'}`}
            >
              <CircleAlert aria-hidden className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-title font-medium leading-5">{number(pendingRequests)}</p>
              <p className="text-label text-fg-secondary">{copy.pending}</p>
            </div>
          </div>
        </div>
      </section>

      <h2 className="mt-7 text-title font-medium">{copy.journey}</h2>
      <ol className="mt-4">
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
