'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CircleAlert,
  FileCheck2,
  FileText,
  LockKeyhole,
  MapPin,
  MessageSquarePlus,
  Play,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { demoNow } from '@/domain/clock';
import { policyFor, PASSPORT_LABELS } from '@/domain/policy';
import { currentStep, daysInRelocation, hireStatus, stepsOf } from '@/domain/selectors';
import type { DocumentKind, Hire, Step } from '@/domain/types';
import { formatAed, formatDate } from '@/lib/format';
import { useAppState } from '@/store/provider';
import {
  ActivityList,
  EmployerHeader,
  Feedback,
  HireStatusBadge,
  Initials,
  inputClass,
  linkClass,
  Modal,
  NewcomerLink,
  Panel,
  Progress,
  StepBadge,
  useEmployerAction,
  useEmployerCopy,
} from './common';
import { EmployerScopePicker, useEmployerScope } from './scope';

const applicationLabels = {
  awaiting_approval: ['Awaiting personal approval', 'بانتظار الموافقة الشخصية'],
  submitted: ['Submitted', 'مقدم'],
  under_review: ['Under review', 'قيد المراجعة'],
  needs_info: ['More information needed', 'معلومات إضافية مطلوبة'],
  terms_offered: ['Terms offered', 'شروط مقترحة'],
  approved: ['Approved', 'موافق عليه'],
  declined: ['Declined', 'مرفوض'],
} as const;

export function EmployerHireDetail({ hireId }: { hireId: string }) {
  const state = useAppState();
  const { employerId, employer } = useEmployerScope();
  const { e, locale, t, record } = useEmployerCopy();
  const [tab, setTab] = useState('journey');
  const [taskStep, setTaskStep] = useState<Step | null>(null);
  const action = useEmployerAction();
  const hire = state.hires[hireId];
  if (!hire || hire.employerId !== employerId)
    return (
      <>
        <EmployerHeader
          title={e('Hire unavailable in this employer', 'الموظف غير متاح لدى صاحب العمل هذا')}
          description={e(
            'Choose the employer that owns this hire or return to your pipeline.',
            'اختر صاحب العمل الذي يتبع له هذا الموظف أو عد إلى المسار.',
          )}
          actions={<EmployerScopePicker />}
        />
        <div className="p-8">
          <Link href="/employer/hires" className={linkClass}>
            <ArrowLeft aria-hidden className="size-4 rtl:-scale-x-100" />
            {e('Back to hires', 'العودة إلى الموظفين')}
          </Link>
        </div>
      </>
    );
  const steps = stepsOf(state, hireId);
  const current = currentStep(steps);
  const done = steps.filter((step) => step.status === 'done').length;
  const flagged = steps.find((step) => step.status === 'blocked');
  const approvals = Object.values(state.approvals).filter(
    (approval) => approval.hireId === hireId && approval.status === 'pending',
  );
  const documents = Object.values(state.documents).filter(
    (document) =>
      document.hireId === hireId &&
      document.labels.every((label) => policyFor(label, 'employer') === 'allow'),
  );
  const applications = Object.values(state.applications).filter(
    (application) => application.hireId === hireId,
  );
  const activity = Object.values(state.agentActions)
    .filter((entry) => entry.caseId === hireId)
    .sort((a, b) => b.at.localeCompare(a.at));
  const tabs = [
    { id: 'journey', label: e('Journey', 'الرحلة') },
    { id: 'documents', label: e('Documents', 'المستندات') },
    { id: 'activity', label: e('Activity & tasks', 'النشاط والمهام') },
    { id: 'trust', label: e('Trust passport', 'جواز الثقة') },
  ];
  const updateStep = (step: Step, status: 'in_progress' | 'done') =>
    action.run(
      [
        { type: 'step.set_status', stepId: step.id, employerId, status },
        {
          type: 'agent.log',
          entry: {
            caseId: hire.id,
            caseType: 'hire',
            kind: 'step_updated',
            summary: `${status === 'done' ? 'Completed' : 'Started'} demo task: ${step.title}`,
            reasoning: `Recorded by ${employer?.hrContact.name ?? 'the employer'} in the demo workspace. This does not submit to or confirm an external authority.`,
            status: status === 'done' ? 'done' : 'waiting',
            stepId: step.id,
          },
        },
      ],
      e(
        'Demo step updated across the shared workspace.',
        'تم تحديث الخطوة التجريبية في المساحة المشتركة.',
      ),
    );
  async function replaceAttestation() {
    const existing = state.documents[`doc_degree_${hireId}`];
    await action.run(
      {
        type: 'document.add',
        source: 'demo',
        hireId,
        kind: 'degree',
        fileName: 'attested-degree-demo.pdf',
        labels: ['degree'],
        fields: existing?.fields ?? [],
        reasoning:
          'Illustrative attested replacement accepted for this demo. No real certificate, attestation or authority verification was performed.',
        status: 'verified',
      },
      e(
        'Demo replacement saved. Document dependencies have been refreshed.',
        'تم حفظ النسخة التجريبية وتحديث اعتماد الخطوات على المستندات.',
      ),
    );
  }
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3 sm:px-8">
        <Link
          href="/employer/hires"
          className="inline-flex min-h-8 items-center gap-2 text-label text-fg-secondary hover:text-accent"
        >
          <ArrowLeft aria-hidden className="size-4 rtl:-scale-x-100" />
          {e('All hires', 'كل الموظفين')}
        </Link>
        <EmployerScopePicker />
      </div>
      <EmployerHeader
        eyebrow={e('A person behind every step', 'إنسان وراء كل خطوة')}
        title={hire.fullName}
        description={`${hire.role} · ${hire.department} · ${hire.originCity} → ${e('Abu Dhabi', 'أبوظبي')}`}
        actions={<NewcomerLink hireId={hireId} />}
      />
      <div className="space-y-6 p-5 sm:p-8">
        <section className="grid gap-5 rounded-2xl border border-edge bg-subtle p-5 lg:grid-cols-[1fr_1.1fr]">
          <div className="flex items-start gap-4">
            <Initials name={hire.fullName} className="size-16 rounded-2xl text-heading" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <HireStatusBadge status={hireStatus(steps)} />
                <Badge shape="pill" tone={hire.backing.status === 'backed' ? 'accent' : 'neutral'}>
                  {hire.backing.status === 'backed'
                    ? e('Employer backed', 'مدعوم من صاحب العمل')
                    : e('Not backed yet', 'لم يحصل على الدعم')}
                </Badge>
              </div>
              <p className="mt-3 inline-flex items-center gap-1.5 text-label text-fg-secondary">
                <MapPin aria-hidden className="size-3.5" />
                {hire.preferredArea}
              </p>
              <p className="mt-1 text-label text-fg-secondary">
                {e('Starts work', 'يبدأ العمل')}: {formatDate(hire.startDate, locale)}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <Progress
              done={done}
              total={steps.length}
              label={e(
                `${done} of ${steps.length} steps complete`,
                `${done} من ${steps.length} خطوات مكتملة`,
              )}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-label text-fg-secondary">
              <span>
                {daysInRelocation(hire, steps, demoNow(state))}{' '}
                {e('days in relocation', 'يوماً في الانتقال')}
              </span>
              <span>
                {current ? (
                  <>
                    {e('Next', 'التالي')}: {t(`step.${current.key}.short`)}
                  </>
                ) : (
                  e('All steps complete', 'كل الخطوات مكتملة')
                )}
              </span>
            </div>
          </div>
        </section>
        <Feedback action={action} />
        {flagged && (
          <section className="rounded-2xl border border-danger/20 bg-danger-soft p-5">
            <div className="flex items-start gap-3">
              <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-danger" />
              <div className="min-w-0 flex-1">
                <h2 className="text-title font-medium text-danger">
                  {e('One step needs a hand', 'خطوة تحتاج إلى مساعدتك')}
                </h2>
                <p className="mt-2 text-body leading-6 text-danger">
                  {record(flagged.blockedReason ?? `${flagged.title} needs attention`)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    icon={<MessageSquarePlus />}
                    onClick={() => setTaskStep(flagged)}
                  >
                    {e('Log a follow-up', 'تسجيل مهمة متابعة')}
                  </Button>
                  {flagged.key === 'documents' && (
                    <Button
                      disabled={action.busy}
                      icon={<FileCheck2 />}
                      onClick={() => void replaceAttestation()}
                    >
                      {e('Use attested sample · demo', 'استخدام شهادة مصدّقة تجريبية')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
        {approvals.length > 0 && (
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-warning/20 bg-warning-soft p-5">
            <div className="max-w-xl">
              <h2 className="text-body font-medium text-warning">
                {e('A personal approval is waiting', 'موافقة شخصية بانتظار الموظف')}
              </h2>
              <p className="mt-1 text-label leading-6 text-warning">
                {e(
                  'The hire reviews the proposed sharing and makes this decision in their own view.',
                  'يراجع الموظف البيانات المقترح مشاركتها ويقرر بنفسه في شاشته.',
                )}
              </p>
            </div>
            <NewcomerLink hireId={hireId}>
              {e('Review as the hire · demo', 'المراجعة بصفة الموظف · تجريبي')}
            </NewcomerLink>
          </section>
        )}
        <div
          className="flex flex-wrap gap-1 border-b border-line"
          aria-label={e('Journey sections', 'أقسام الرحلة')}
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`min-h-11 border-b-2 px-4 text-body font-medium transition-colors ${tab === item.id ? 'border-accent text-accent' : 'border-transparent text-fg-secondary hover:text-fg'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {tab === 'journey' && (
          <div className="grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
            <Panel
              title={e('An ordered path forward', 'مسار مرتب نحو الاستقرار')}
              description={e(
                'Steps open as their dependencies are completed.',
                'تفتح الخطوات عندما تكتمل متطلباتها السابقة.',
              )}
            >
              <ol className="p-3 sm:p-4">
                {steps.map((step, index) => {
                  const actionable =
                    (step.owner === 'employer' || step.owner === 'agent') &&
                    ['ready', 'in_progress'].includes(step.status);
                  const isCurrent = step.id === current?.id;
                  return (
                    <li key={step.id} className="relative flex gap-3 pb-2 last:pb-0">
                      {index < steps.length - 1 && (
                        <span
                          aria-hidden
                          className={`absolute -bottom-4 start-[27px] top-12 w-0.5 rounded-full ${step.status === 'done' ? 'bg-accent' : 'bg-line-strong/40'}`}
                        />
                      )}
                      <div className="flex w-full gap-3">
                        <span
                          aria-hidden
                          className={`relative z-10 ms-3 mt-4 flex size-8 shrink-0 items-center justify-center rounded-full text-caption font-medium ${step.status === 'done' ? 'bg-accent text-accent-fg' : step.status === 'locked' ? 'bg-track text-fg-tertiary' : 'border border-accent/30 bg-accent-soft text-accent'}`}
                        >
                          {step.status === 'done' ? (
                            <Check className="size-4" />
                          ) : step.status === 'locked' ? (
                            <LockKeyhole className="size-3.5" />
                          ) : (
                            index + 1
                          )}
                        </span>
                        <div
                          className={`min-w-0 flex-1 rounded-xl border p-4 ${isCurrent ? 'border-accent/30 bg-accent-soft/50' : 'border-transparent'}`}
                          aria-current={isCurrent ? 'step' : undefined}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-body font-medium">{t(`step.${step.key}.title`)}</h3>
                            <StepBadge status={step.status} />
                          </div>
                          <p className="mt-2 text-label leading-6 text-fg-secondary">
                            {t(`step.${step.key}.reason`)}
                          </p>
                          <p className="mt-2 text-caption text-fg-tertiary">
                            {e('Owner', 'المسؤول')}: {t(`owner.${step.owner}`)}
                            {step.status === 'locked' &&
                              ` · ${e('Depends on', 'يعتمد على')}: ${step.dependsOn.map((key) => t(`step.${key}.short`)).join(' · ')}`}
                            {step.waitingOn &&
                              ` · ${e('Waiting on', 'بانتظار')}: ${step.waitingOn}`}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {actionable && (
                              <>
                                {step.status === 'ready' && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={action.busy}
                                    icon={<Play />}
                                    onClick={() => void updateStep(step, 'in_progress')}
                                  >
                                    {e('Start demo task', 'بدء مهمة تجريبية')}
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={action.busy}
                                  icon={<Check />}
                                  onClick={() => void updateStep(step, 'done')}
                                >
                                  {e('Complete demo task', 'إكمال مهمة تجريبية')}
                                </Button>
                              </>
                            )}
                            {['blocked', 'waiting', 'in_progress'].includes(step.status) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                icon={<MessageSquarePlus />}
                                onClick={() => setTaskStep(step)}
                              >
                                {e('Log follow-up', 'تسجيل متابعة')}
                              </Button>
                            )}
                            {step.status === 'needs_approval' && (
                              <NewcomerLink
                                hireId={hireId}
                                className="inline-flex min-h-8 items-center gap-1.5 text-label font-medium text-accent"
                              />
                            )}
                            {step.status === 'ready' && step.owner === 'newcomer' && (
                              <NewcomerLink
                                hireId={hireId}
                                className="inline-flex min-h-8 items-center gap-1.5 text-label font-medium text-accent"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Panel>
            <div className="space-y-6">
              <HireContext hire={hire} />
              <Panel title={e('Employer backing', 'دعم صاحب العمل')}>
                <div className="p-5">
                  <ShieldCheck aria-hidden className="mb-3 size-6 text-accent" />
                  <p className="text-body leading-6 text-fg-secondary">
                    {e(
                      'Attach your backing to the hire’s applications. This is recorded in the demo and visible to the partner dashboards.',
                      'أرفق دعمك بطلبات الموظف. يُسجّل ذلك في العرض التجريبي ويظهر في لوحات الشركاء.',
                    )}
                  </p>
                  <Button
                    className="mt-4"
                    variant="secondary"
                    disabled={action.busy}
                    onClick={() =>
                      void action.run(
                        {
                          type: 'hire.back',
                          hireId,
                          employerId,
                          backed: hire.backing.status !== 'backed',
                          by: employer?.hrContact.name ?? 'Employer',
                        },
                        e('Employer backing updated.', 'تم تحديث دعم صاحب العمل.'),
                      )
                    }
                  >
                    {hire.backing.status === 'backed'
                      ? e('Remove backing', 'إزالة الدعم')
                      : e('Back this hire', 'دعم هذا الموظف')}
                  </Button>
                </div>
              </Panel>
              <Panel title={e('Connected applications', 'الطلبات المرتبطة')}>
                <div className="divide-y divide-line">
                  {applications.map((application) => (
                    <div key={application.id} className="p-5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-body font-medium">
                          {application.kind === 'rental'
                            ? e('Home application', 'طلب السكن')
                            : e('Bank account', 'حساب مصرفي')}
                        </p>
                        <Badge tone={application.state === 'approved' ? 'success' : 'neutral'}>
                          {e(
                            applicationLabels[application.state][0],
                            applicationLabels[application.state][1],
                          )}
                        </Badge>
                      </div>
                      <p className="mt-2 text-label text-fg-tertiary">
                        {state.landlords[application.partyId]?.name ??
                          state.banks[application.partyId]?.name}
                      </p>
                      <Link
                        href={application.kind === 'rental' ? '/landlord' : '/bank'}
                        className="mt-3 inline-flex min-h-8 items-center gap-2 text-label text-accent"
                      >
                        {e('Open partner workspace', 'فتح مساحة الشريك')}
                        <ArrowRight aria-hidden className="size-3.5 rtl:-scale-x-100" />
                      </Link>
                    </div>
                  ))}
                  {!applications.length && (
                    <p className="p-5 text-body text-fg-tertiary">
                      {e(
                        'Applications appear as their steps open.',
                        'ستظهر الطلبات عندما تفتح خطواتها.',
                      )}
                    </p>
                  )}
                </div>
              </Panel>
            </div>
          </div>
        )}
        {tab === 'documents' && (
          <Panel
            title={e('Documents available to your employer', 'المستندات المتاحة لصاحب العمل')}
            description={e(
              'Only document categories allowed by the demo employer policy appear here.',
              'تظهر هنا فقط فئات المستندات التي تسمح بها سياسة صاحب العمل التجريبية.',
            )}
          >
            <ul className="divide-y divide-line">
              {documents.map((document) => (
                <li key={document.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <FileText aria-hidden className="mt-1 size-5 text-accent" />
                      <div>
                        <h3 className="text-body font-medium">
                          {t(`documents.kind.${document.kind}` as `documents.kind.${DocumentKind}`)}
                        </h3>
                        <p className="mt-1 text-label text-fg-tertiary">
                          {document.fileName} · {formatDate(document.uploadedAt, locale)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      tone={
                        document.status === 'verified'
                          ? 'success'
                          : document.status === 'rejected'
                            ? 'danger'
                            : 'neutral'
                      }
                    >
                      {t(`documents.status.${document.status}`)}
                    </Badge>
                  </div>
                  <p className="mt-3 text-label leading-6 text-fg-secondary">
                    {record(document.reasoning)}
                  </p>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-label font-medium text-accent">
                      {e('View extracted fields', 'عرض الحقول المستخرجة')}
                    </summary>
                    <dl className="mt-3 grid gap-3 rounded-xl bg-subtle p-4 sm:grid-cols-2">
                      {document.fields.map((field) => (
                        <div key={field.key}>
                          <dt className="text-caption text-fg-tertiary">
                            {t(`documents.field.${field.key}` as 'documents.field.name') ??
                              field.label}
                          </dt>
                          <dd className="mt-1 text-body text-fg">{field.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                </li>
              ))}
            </ul>
            {!documents.length && (
              <p className="p-5 text-body text-fg-tertiary">
                {e(
                  'No employer-visible documents recorded yet.',
                  'لا توجد مستندات مسجلة متاحة لصاحب العمل بعد.',
                )}
              </p>
            )}
            <div className="border-t border-line p-5">
              <NewcomerLink hireId={hireId}>
                {e('Manage documents in newcomer view', 'إدارة المستندات في شاشة الموظف')}
              </NewcomerLink>
            </div>
          </Panel>
        )}
        {tab === 'activity' && (
          <Panel
            title={e('Recorded activity and follow-ups', 'النشاط المسجل ومهام المتابعة')}
            description={e(
              'Internal demo tasks are logged here. No email or external notification is sent.',
              'تسجل هنا مهام المتابعة التجريبية الداخلية. لا يتم إرسال بريد أو إشعار خارجي.',
            )}
            action={
              <Button
                size="sm"
                variant="secondary"
                icon={<MessageSquarePlus />}
                onClick={() => setTaskStep(current ?? steps[0])}
              >
                {e('Log a task', 'تسجيل مهمة')}
              </Button>
            }
          >
            <ActivityList entries={activity} />
          </Panel>
        )}
        {tab === 'trust' && (
          <Panel
            title={e('A clear boundary around personal data', 'حدود واضحة حول البيانات الشخصية')}
            description={e(
              'Demo policy defaults for employer access. Consent for other destinations belongs to the newcomer.',
              'الإعدادات الافتراضية التجريبية لوصول صاحب العمل. موافقة المشاركة مع الجهات الأخرى تخص الموظف.',
            )}
          >
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {PASSPORT_LABELS.map((label) => {
                const allowed = policyFor(label, 'employer') === 'allow';
                return (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-2 rounded-xl border border-edge p-4"
                  >
                    <p className="text-body">{t(`passport.label.${label}`)}</p>
                    <Badge tone={allowed ? 'accent' : 'neutral'} shape="pill">
                      {allowed
                        ? e('Employer access', 'متاح لصاحب العمل')
                        : e('Restricted', 'مقيّد')}
                    </Badge>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-5">
              <p className="max-w-xl text-label leading-6 text-fg-secondary">
                {e(
                  'Bank statements and health details are restricted from employer access. The Guard log records demo checks; it is separate from evaluation evidence.',
                  'كشف الحساب والتفاصيل الصحية غير متاحة لصاحب العمل. يسجل سجل الحماية عمليات التحقق التجريبية بشكل منفصل عن أدلة التقييم.',
                )}
              </p>
              <Link href={`/employer/guard?hire=${hireId}`} className={linkClass}>
                {e('View Guard log', 'عرض سجل الحماية')}
              </Link>
            </div>
          </Panel>
        )}
      </div>
      {taskStep && <TaskDialog hire={hire} step={taskStep} onClose={() => setTaskStep(null)} />}
    </>
  );
}

function HireContext({ hire }: { hire: Hire }) {
  const { e, locale } = useEmployerCopy();
  return (
    <Panel title={e('The person behind the move', 'الإنسان وراء الانتقال')}>
      <dl className="space-y-4 p-5">
        <div>
          <dt className="flex items-center gap-2 text-caption text-fg-tertiary">
            <BriefcaseBusiness aria-hidden className="size-3.5" />
            {e('Role & department', 'الوظيفة والقسم')}
          </dt>
          <dd className="mt-1 text-body">
            {hire.role} · {hire.department}
          </dd>
        </div>
        <div>
          <dt className="text-caption text-fg-tertiary">
            {e('Est. monthly salary', 'الراتب الشهري التقديري')}
          </dt>
          <dd className="mt-1 text-body">{formatAed(hire.estMonthlySalaryAed, locale)}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-2 text-caption text-fg-tertiary">
            <Users aria-hidden className="size-3.5" />
            {e('Moving household', 'الأسرة المنتقلة')}
          </dt>
          <dd className="mt-1 text-body">
            {hire.family.spouse || hire.family.children
              ? e(
                  `Hire${hire.family.spouse ? ' + spouse' : ''}${hire.family.children ? ` + ${hire.family.children} children` : ''}`,
                  `الموظف${hire.family.spouse ? ' + الزوج أو الزوجة' : ''}${hire.family.children ? ` + ${hire.family.children} أطفال` : ''}`,
                )
              : e('Moving solo', 'ينتقل بمفرده')}
          </dd>
        </div>
        <div>
          <dt className="text-caption text-fg-tertiary">{e('Contact', 'التواصل')}</dt>
          <dd dir="ltr" className="mt-1 break-all text-start text-body">
            {hire.email}
          </dd>
        </div>
      </dl>
    </Panel>
  );
}

function TaskDialog({ hire, step, onClose }: { hire: Hire; step: Step; onClose: () => void }) {
  const { e } = useEmployerCopy();
  const { employer } = useEmployerScope();
  const [title, setTitle] = useState(`Follow up: ${step.title}`);
  const [note, setNote] = useState(step.blockedReason ?? step.waitingOn ?? '');
  const action = useEmployerAction();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await action.run(
      {
        type: 'agent.log',
        entry: {
          caseId: hire.id,
          caseType: 'hire',
          kind: 'employer_notified',
          summary: `Internal task for ${employer?.hrContact.name ?? 'HR'}: ${title.trim()}`,
          reasoning: `${note.trim()} · Demo task recorded only. No notification was sent.`,
          status: 'waiting',
          stepId: step.id,
        },
      },
      e(
        'Follow-up recorded in the shared activity log.',
        'تم تسجيل المتابعة في سجل النشاط المشترك.',
      ),
    );
    if (ok) onClose();
  }
  return (
    <Modal
      title={e('Give the next step an owner', 'حدد مسؤولاً للخطوة التالية')}
      description={e(
        `Record an internal follow-up for ${hire.fullName}. No external notification is sent.`,
        `سجل متابعة داخلية للموظف ${hire.fullName}. لن يتم إرسال إشعار خارجي.`,
      )}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <fieldset disabled={action.busy} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-label font-medium">{e('Task', 'المهمة')}</span>
            <input
              required
              maxLength={180}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-label font-medium">
              {e('Context and next action', 'السياق والإجراء التالي')}
            </span>
            <textarea
              required
              maxLength={1200}
              rows={4}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className={`${inputClass} !h-auto py-3`}
            />
          </label>
          <p className="rounded-xl bg-subtle p-3 text-label text-fg-secondary">
            {e('Owner', 'المسؤول')}: {employer?.hrContact.name}
          </p>
          <Feedback action={action} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={onClose}>
              {e('Cancel', 'إلغاء')}
            </Button>
            <Button type="submit" disabled={action.busy}>
              {e('Record follow-up', 'تسجيل المتابعة')}
            </Button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
