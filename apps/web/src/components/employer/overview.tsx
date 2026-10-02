'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  CircleAlert,
  Clock3,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { demoNow } from '@/domain/clock';
import { currentStep, employerMetrics, hireStatus, stepsOf } from '@/domain/selectors';
import { formatDate } from '@/lib/format';
import { useAppState } from '@/store/provider';
import {
  ActivityList,
  EmployerHeader,
  HireStatusBadge,
  Initials,
  JourneyArt,
  linkClass,
  Metric,
  NewcomerLink,
  Panel,
  Progress,
  useEmployerCopy,
} from './common';
import { NewHireDialog } from './new-hire';
import { EmployerScopePicker, useEmployerScope } from './scope';

export function EmployerOverview() {
  const state = useAppState();
  const { employerId, employer } = useEmployerScope();
  const { e, locale, record } = useEmployerCopy();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const now = demoNow(state);
  const hires = Object.values(state.hires).filter((hire) => hire.employerId === employerId);
  const hireIds = new Set(hires.map((hire) => hire.id));
  const companies = Object.values(state.companies).filter(
    (company) => company.employerId === employerId,
  );
  const metrics = employerMetrics(state, employerId, now);
  const pending = Object.values(state.approvals).filter(
    (approval) => hireIds.has(approval.hireId) && approval.status === 'pending',
  );
  const attention = hires
    .filter((hire) =>
      stepsOf(state, hire.id).some(
        (step) => step.status === 'blocked' || step.status === 'needs_approval',
      ),
    )
    .sort(
      (a, b) =>
        Number(hireStatus(stepsOf(state, b.id)) === 'blocked') -
        Number(hireStatus(stepsOf(state, a.id)) === 'blocked'),
    );
  const activity = Object.values(state.agentActions)
    .filter(
      (entry) =>
        hireIds.has(entry.caseId) || companies.some((company) => company.id === entry.caseId),
    )
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 4);
  const stageBuckets = [
    {
      label: e('Documents', 'المستندات'),
      keys: ['documents'],
      color: 'bg-warning',
      query: 'documents',
    },
    {
      label: e('Visa & identity', 'التأشيرة والهوية'),
      keys: ['residence_visa', 'emirates_id'],
      color: 'bg-accent',
      query: 'residence_visa',
    },
    {
      label: e('Home & banking', 'السكن والخدمات المصرفية'),
      keys: [
        'housing',
        'tenancy_registration',
        'bank_account',
        'health_insurance',
        'family_sponsorship',
        'school',
      ],
      color: 'bg-success',
      query: 'housing',
    },
    { label: e('Settled', 'مستقرون'), keys: [], color: 'bg-fg-secondary', query: 'settled' },
  ];
  return (
    <>
      <EmployerHeader
        eyebrow={e('People first. Everything connected.', 'الإنسان أولاً. كل الخطوات مترابطة.')}
        title={e('A clearer path to Abu Dhabi', 'طريق أوضح إلى أبوظبي')}
        description={e(
          'Your team’s move, from the first document to feeling at home.',
          'رحلة فريقك، من أول مستند إلى الشعور بالاستقرار.',
        )}
        actions={<EmployerScopePicker />}
      />
      <div className="space-y-6 p-5 sm:p-8">
        <section className="relative grid min-h-[240px] overflow-hidden rounded-[1.5rem] border border-accent/15 bg-accent-soft md:grid-cols-[1.2fr_1fr]">
          <div className="relative z-10 min-w-0 max-w-lg p-6 sm:p-8">
            <Badge tone="accent" shape="pill">
              {e('Employer workspace', 'مساحة صاحب العمل')} · {e('Demo', 'تجريبي')}
            </Badge>
            <h2 className="mt-4 text-[1.65rem] font-medium leading-tight tracking-tight text-fg">
              {hires.length
                ? e(
                    `${hires.length - metrics.settled} journeys underway.`,
                    `${hires.length - metrics.settled} رحلات قيد التنفيذ.`,
                  )
                : e('Your next chapter starts here.', 'فصلك القادم يبدأ هنا.')}
              <br />
              <span className="text-accent">
                {e('One place to keep them moving.', 'مكان واحد لمتابعة تقدمها.')}
              </span>
            </h2>
            <p className="mt-3 max-w-sm text-body leading-6 text-fg-secondary">
              {metrics.blocked
                ? e(
                    `${metrics.blocked} hire needs your attention. A small next step can unlock the rest of their journey.`,
                    `${metrics.blocked} موظف يحتاج إلى متابعتك. خطوة صغيرة قد تفتح بقية رحلته.`,
                  )
                : e(
                    'Bring your people, their tasks and your company setup together.',
                    'اجمع فريقك ومهامه وتأسيس شركتك في مكان واحد.',
                  )}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button size="lg" icon={<Plus />} onClick={() => setAdding(true)}>
                {e('Add a hire', 'إضافة موظف')}
              </Button>
              <Link
                href="/employer/expansion"
                className={`${linkClass} !min-h-10 border-accent/20 !bg-transparent`}
              >
                {e('Company setup', 'تأسيس الشركة')}
                <ArrowRight aria-hidden className="size-4 rtl:-scale-x-100" />
              </Link>
            </div>
          </div>
          <div className="min-h-[200px] min-w-0 md:self-stretch">
            <JourneyArt bleed />
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            title={e('People in motion', 'أشخاص في رحلة الانتقال')}
            value={metrics.hires - metrics.settled}
            detail={e(
              `${metrics.hires} total hires · ${metrics.settled} settled`,
              `${metrics.hires} موظفين إجمالاً · ${metrics.settled} مستقرين`,
            )}
            icon={Users}
          />
          <Metric
            title={e('Needs your attention', 'يحتاج إلى متابعتك')}
            value={metrics.blocked}
            detail={e('Blocked cases to help move forward', 'حالات متعثرة تحتاج إلى مساعدتك')}
            icon={CircleAlert}
            tone={metrics.blocked ? 'danger' : 'success'}
          />
          <Metric
            title={e('Avg. days to settle', 'متوسط أيام الاستقرار')}
            value={metrics.averageDaysToSettled ?? '—'}
            detail={e('Based on completed demo journeys', 'بناءً على رحلات تجريبية مكتملة')}
            icon={Clock3}
          />
          <Metric
            title={e('Awaiting hire approval', 'بانتظار موافقة الموظف')}
            value={pending.length}
            detail={e(
              'Personal data decisions stay with the hire',
              'قرارات مشاركة البيانات تعود إلى الموظف',
            )}
            icon={ShieldCheck}
            tone="warning"
          />
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[1.35fr_1fr]">
          <Panel
            title={e('A little help goes a long way', 'مساعدة بسيطة تصنع فرقاً')}
            description={e(
              'The next decisions that will move a journey forward.',
              'القرارات التالية التي ستدفع رحلة الانتقال إلى الأمام.',
            )}
            action={
              <Link
                href="/employer/hires?status=attention"
                className="whitespace-nowrap text-label text-accent hover:underline"
              >
                {e('View all', 'عرض الكل')}
              </Link>
            }
          >
            {attention.length ? (
              <ul className="divide-y divide-line">
                {attention.slice(0, 4).map((hire) => {
                  const steps = stepsOf(state, hire.id);
                  const flagged =
                    steps.find((step) => step.status === 'blocked') ??
                    steps.find((step) => step.status === 'needs_approval');
                  return (
                    <li key={hire.id} className="p-5">
                      <div className="flex items-start gap-3">
                        <Initials name={hire.fullName} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/employer/hires/${hire.id}`}
                              className="text-body font-medium text-fg hover:text-accent"
                            >
                              {hire.fullName}
                            </Link>
                            <HireStatusBadge status={hireStatus(steps)} />
                          </div>
                          <p className="mt-1 text-label text-fg-tertiary">
                            {hire.role} · {formatDate(hire.startDate, locale)}
                          </p>
                          <p className="mt-3 text-body leading-6 text-fg-secondary">
                            {flagged?.status === 'blocked'
                              ? record(flagged.blockedReason ?? flagged.title)
                              : record(
                                  Object.values(state.approvals).find(
                                    (approval) =>
                                      approval.stepId === flagged?.id &&
                                      approval.status === 'pending',
                                  )?.title ??
                                    flagged?.title ??
                                    e('A personal approval is pending.', 'موافقة شخصية معلقة.'),
                                )}
                          </p>
                          <Link
                            href={`/employer/hires/${hire.id}`}
                            className="mt-3 inline-flex min-h-8 items-center gap-1.5 text-label font-medium text-accent"
                          >
                            {e('Review next step', 'مراجعة الخطوة التالية')}
                            <ArrowRight aria-hidden className="size-3.5 rtl:-scale-x-100" />
                          </Link>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex items-center gap-3 p-6">
                <Sparkles aria-hidden className="size-5 text-accent" />
                <p className="text-body text-fg-secondary">
                  {e(
                    'No blocked or approval steps in this employer’s pipeline.',
                    'لا توجد خطوات متعثرة أو بانتظار الموافقة لدى صاحب العمل هذا.',
                  )}
                </p>
              </div>
            )}
          </Panel>

          <Panel
            title={e('Every stage, at a glance', 'كل مرحلة بنظرة واحدة')}
            description={e(
              'Current stage of each hire, including completed journeys.',
              'المرحلة الحالية لكل موظف، بما فيها الرحلات المكتملة.',
            )}
          >
            <div className="space-y-4 p-5">
              {stageBuckets.map((bucket) => {
                const count = hires.filter((hire) => {
                  const step = currentStep(stepsOf(state, hire.id));
                  return step ? bucket.keys.includes(step.key) : bucket.keys.length === 0;
                }).length;
                return (
                  <Link
                    key={bucket.query}
                    href={`/employer/hires?stageGroup=${bucket.query}`}
                    className="block rounded-lg p-1 transition-colors hover:bg-subtle"
                  >
                    <div className="mb-2 flex items-center justify-between text-label">
                      <span className="text-fg-secondary">{bucket.label}</span>
                      <span className="font-medium tabular-nums text-fg">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-track">
                      <div
                        className={`${bucket.color} h-full rounded-full`}
                        style={{
                          width: `${hires.length ? (count / hires.length) * 100 : 0}%`,
                          minWidth: count ? '8px' : 0,
                        }}
                      />
                    </div>
                  </Link>
                );
              })}
              <Link
                href="/employer/hires"
                className="inline-flex min-h-9 items-center gap-2 text-label font-medium text-accent"
              >
                {e('Explore the pipeline', 'استكشف مسار الموظفين')}
                <ArrowRight aria-hidden className="size-4 rtl:-scale-x-100" />
              </Link>
            </div>
          </Panel>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[1.35fr_1fr]">
          <Panel
            title={e('The work happening around you', 'ما يجري من عمل حولك')}
            description={e(
              'Recorded demo activity across this employer’s cases.',
              'نشاط تجريبي مسجل في حالات صاحب العمل هذا.',
            )}
            action={
              <Badge tone="accent" shape="pill">
                {e('Shared state', 'حالة مشتركة')}
              </Badge>
            }
          >
            {activity.length ? (
              <ActivityList entries={activity} />
            ) : (
              <p className="p-5 text-body text-fg-tertiary">
                {e('Add a hire to start their activity history.', 'أضف موظفاً لبدء سجل نشاطه.')}
              </p>
            )}
          </Panel>
          <div className="space-y-6">
            <Panel
              title={e('Company, then people', 'الشركة أولاً، ثم الفريق')}
              description={e(
                'Your company setup and team move are connected.',
                'تأسيس شركتك وانتقال فريقك مترابطان.',
              )}
            >
              <div className="p-5">
                {companies[0] ? (
                  <>
                    <p className="text-body font-medium">{companies[0].name}</p>
                    <p className="mb-4 mt-1 text-label text-fg-tertiary">
                      {companies[0].homeCountry} → {e('Abu Dhabi', 'أبوظبي')}
                    </p>
                    <Progress
                      done={
                        Object.values(state.setupSteps).filter(
                          (step) => step.companyId === companies[0].id && step.status === 'done',
                        ).length
                      }
                      total={
                        Object.values(state.setupSteps).filter(
                          (step) => step.companyId === companies[0].id,
                        ).length
                      }
                      label={e('Company setup', 'تأسيس الشركة')}
                    />
                  </>
                ) : (
                  <p className="text-body leading-6 text-fg-secondary">
                    {e(
                      'Describe your company and choose a setup path to begin.',
                      'عرّف شركتك واختر مسار التأسيس للبدء.',
                    )}
                  </p>
                )}
                <Link
                  href="/employer/expansion"
                  className="mt-4 inline-flex min-h-9 items-center gap-2 text-label font-medium text-accent"
                >
                  {e('Open setup roadmap', 'فتح خارطة التأسيس')}
                  <ArrowRight aria-hidden className="size-4 rtl:-scale-x-100" />
                </Link>
              </div>
            </Panel>
            <Panel title={e('Their decision, clearly explained', 'قرارهم، مع شرح واضح')}>
              <div className="p-5">
                {pending[0] && state.hires[pending[0].hireId] ? (
                  <>
                    <p className="text-body font-medium">
                      {state.hires[pending[0].hireId].fullName}
                    </p>
                    <p className="mb-4 mt-2 text-label leading-6 text-fg-secondary">
                      {record(pending[0].title)}
                    </p>
                    <NewcomerLink hireId={pending[0].hireId} />
                  </>
                ) : (
                  <p className="text-body leading-6 text-fg-secondary">
                    {e('No personal approvals pending.', 'لا توجد موافقات شخصية معلقة.')}
                  </p>
                )}
              </div>
            </Panel>
          </div>
        </div>
        <p className="flex flex-wrap items-center gap-2 text-caption text-fg-tertiary">
          <CalendarDays aria-hidden className="size-3.5" />
          {e('Demo clock', 'الوقت التجريبي')}: {formatDate(now, locale)} · {employer?.name} ·{' '}
          {e('Illustrative people and estimates', 'أشخاص وأرقام توضيحية')}
        </p>
      </div>
      {adding && (
        <NewHireDialog
          onClose={() => setAdding(false)}
          onCreated={(id) => {
            setAdding(false);
            router.push(`/employer/hires/${id}`);
          }}
        />
      )}
    </>
  );
}
