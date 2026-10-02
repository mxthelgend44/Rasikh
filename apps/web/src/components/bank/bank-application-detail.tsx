'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  CircleAlert,
  EyeOff,
  FileText,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { DATA_LABELS } from '@rasikh/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { policyFor } from '@/domain/policy';
import type { Decision, DocumentKind, Locale } from '@/domain/types';
import { formatAed, formatDate } from '@/lib/format';
import { useI18n } from '@/lib/i18n/provider';
import { useAppState, useConnection, useStore } from '@/store/provider';
import {
  applicationLabel,
  applicationTone,
  BANK_ID,
  bankText,
  consentGaps,
  dataLabel,
  documentAccess,
  documentLabel,
  initials,
  labelAccess,
  latestBankCheck,
  latestDecision,
  OPEN_STATES,
} from './bank-data';
import { BankHeader } from './bank-header';
import { BankModal } from './bank-modal';

const CHECKLIST: DocumentKind[] = [
  'passport',
  'offer_letter',
  'emirates_id',
  'salary_certificate',
  'bank_statement',
];
type ReviewMode = 'approved' | 'info_requested' | 'declined';

export function BankApplicationDetail({ applicationId }: { applicationId: string }) {
  const state = useAppState();
  const store = useStore();
  const connection = useConnection();
  const { locale } = useI18n();
  const text = (en: string, ar: string) => bankText(locale, en, ar);
  const application = state.applications[applicationId];
  const hire = application ? state.hires[application.hireId] : undefined;
  const [mode, setMode] = useState<ReviewMode | null>(null);
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [requestKind, setRequestKind] = useState<DocumentKind>('emirates_id');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  if (
    !application ||
    application.kind !== 'bank_account' ||
    application.partyId !== BANK_ID ||
    application.state === 'awaiting_approval' ||
    !hire
  ) {
    return (
      <>
        <BankHeader title={text('Application unavailable', 'الطلب غير متاح')} />
        <div className="flex flex-col items-start gap-3 p-7">
          <LockKeyhole aria-hidden className="size-8 text-fg-tertiary" />
          <p className="text-body text-fg-secondary">
            {text(
              'This application is not in this bank’s submitted queue, or it is still awaiting newcomer permission.',
              'هذا الطلب ليس في قائمة البنك المقدمة أو لا يزال ينتظر إذن الوافد.',
            )}
          </p>
          <Link
            href="/bank/applications"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-line-strong px-3 hover:bg-subtle"
          >
            <ArrowLeft aria-hidden className="size-4 rtl:-scale-x-100" />
            {text('Back to applications', 'العودة إلى الطلبات')}
          </Link>
        </div>
      </>
    );
  }
  const employer = state.employers[hire.employerId];
  const open = OPEN_STATES.includes(application.state);
  const gaps = consentGaps(state, application);
  const check = latestBankCheck(state, hire.id);
  const guardBlocked = check !== undefined && check.decision !== 'allow';
  const canApprove =
    open &&
    application.state !== 'submitted' &&
    !gaps.length &&
    !guardBlocked &&
    connection !== 'offline';
  const documents = Object.values(state.documents).filter(
    (document) => document.hireId === hire.id,
  );
  const preview = previewId ? state.documents[previewId] : undefined;
  const previewAllowed = preview && documentAccess(state, application, preview);
  const decision = latestDecision(state, application.id);
  const bankStep = Object.values(state.steps).find(
    (step) => step.hireId === hire.id && step.key === 'bank_account',
  );
  const requestNote = text(
    `Please provide your ${documentLabel(requestKind, 'en').toLowerCase()} through Rasikh. Share it with the bank only after reviewing its permission scope.`,
    `يرجى توفير ${documentLabel(requestKind, 'ar')} عبر راسخ. شاركه مع البنك بعد مراجعة نطاق الإذن.`,
  );

  function beginReview(nextMode: ReviewMode) {
    setError('');
    setConfirmed(false);
    setMode(nextMode);
    setNote(
      nextMode === 'approved'
        ? text(
            'Approved after reviewing the disclosed employment evidence, employer backing and current bank permissions. This is a demo decision.',
            'تم الاعتماد بعد مراجعة أدلة التوظيف المفصح عنها ودعم جهة العمل والأذونات البنكية الحالية. هذا قرار تجريبي.',
          )
        : '',
    );
  }
  async function startReview() {
    setBusy(true);
    setError('');
    try {
      await store.dispatch({
        type: 'application.start_review',
        applicationId: application!.id,
        partyId: BANK_ID,
      });
      setNotice(
        text(
          'Review started in the shared demo. The employer and newcomer can see the updated status.',
          'بدأت المراجعة في العرض المشترك. يمكن لجهة العمل والوافد رؤية الحالة المحدثة.',
        ),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : text('The review could not be started.', 'تعذر بدء المراجعة.'),
      );
    } finally {
      setBusy(false);
    }
  }
  async function recordDecision() {
    if (!mode || busy || !confirmed || (mode === 'approved' && !canApprove)) return;
    const writtenNote =
      mode === 'info_requested'
        ? `${requestNote}${note.trim() ? ` ${note.trim()}` : ''}`
        : note.trim();
    if (writtenNote.length < 12) {
      setError(
        text(
          'Add a clear reason of at least 12 characters.',
          'أضف سبباً واضحاً لا يقل عن 12 حرفاً.',
        ),
      );
      return;
    }
    setBusy(true);
    setError('');
    try {
      await store.dispatch({
        type: 'application.decide',
        applicationId: application!.id,
        outcome: mode,
        note: writtenNote,
        decidedBy: 'Priya Nair',
        partyId: BANK_ID,
      });
      setMode(null);
      setNotice(
        mode === 'approved'
          ? text(
              'Approval recorded in the shared demo. The newcomer’s bank step is complete; no real bank account was opened.',
              'تم تسجيل الاعتماد في العرض المشترك. اكتملت خطوة البنك للوافد؛ لم يُفتح حساب بنكي فعلي.',
            )
          : mode === 'info_requested'
            ? text(
                'Information request recorded. The newcomer and employer can see the reason in Rasikh. No external message was sent.',
                'تم تسجيل طلب المعلومات. يمكن للوافد وجهة العمل رؤية السبب في راسخ. لم تُرسل رسالة خارجية.',
              )
            : text(
                'Decline recorded with your reason in the shared demo.',
                'تم تسجيل الرفض وسببه في العرض المشترك.',
              ),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : text('The decision could not be recorded.', 'تعذر تسجيل القرار.'),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <BankHeader
        title={text('Application review', 'مراجعة الطلب')}
        description={text(
          'Evidence, permission and a decision the applicant can understand.',
          'أدلة وأذونات وقرار يمكن للمتقدم فهمه.',
        )}
        actions={
          <Link
            href="/bank/applications"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-line-strong px-3 text-body hover:bg-subtle"
          >
            <ArrowLeft aria-hidden className="size-4 rtl:-scale-x-100" />
            {text('All applications', 'جميع الطلبات')}
          </Link>
        }
      />
      <div className="space-y-6 p-5 sm:p-7">
        {notice ? (
          <p
            role="status"
            className="rounded-lg border border-success/20 bg-success-soft px-4 py-3 text-body text-success"
          >
            {notice}
          </p>
        ) : null}
        {error && !mode ? (
          <p role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-body text-danger">
            {error}
          </p>
        ) : null}
        <section
          className="rounded-xl border border-line bg-subtle/60 p-5 sm:p-6"
          aria-label={text('Applicant summary', 'ملخص المتقدم')}
        >
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex min-w-0 items-center gap-4">
              <span
                aria-hidden
                className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-title font-semibold text-accent"
              >
                {initials(hire.fullName)}
              </span>
              <div className="min-w-0">
                <h2 className="text-heading font-medium">{hire.fullName}</h2>
                <p className="mt-1 text-body text-fg-secondary">
                  {hire.role} · {employer?.name}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={applicationTone(application.state)}>
                {applicationLabel(application.state, locale)}
              </Badge>
              {application.employerBacked ? (
                <Badge tone="accent">
                  <ShieldCheck aria-hidden className="me-1 size-3" />
                  {text('Employer backed', 'بدعم جهة العمل')}
                </Badge>
              ) : null}
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-3 xl:grid-cols-5">
            <div>
              <dt className="text-caption text-fg-tertiary">
                {text('Received', 'تاريخ الاستلام')}
              </dt>
              <dd className="mt-1 text-body font-medium">
                {application.submittedAt
                  ? formatDate(application.submittedAt, locale)
                  : text('Date unavailable', 'التاريخ غير متاح')}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-fg-tertiary">{text('Reference', 'المرجع')}</dt>
              <dd className="mt-1 break-all text-body font-medium">
                <bdi>{application.id}</bdi>
              </dd>
            </div>
            <div>
              <dt className="text-caption text-fg-tertiary">
                {text('Account type', 'نوع الحساب')}
              </dt>
              <dd className="mt-1 text-body font-medium">
                {text('Current account · payroll onboarding', 'حساب جارٍ · تهيئة الراتب')}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-fg-tertiary">
                {text('Estimated monthly salary', 'الراتب الشهري التقديري')}
              </dt>
              <dd className="mt-1 text-body font-medium">
                {labelAccess(state, application, 'salary') ? (
                  formatAed(hire.estMonthlySalaryAed, locale)
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-fg-secondary">
                    <LockKeyhole aria-hidden className="size-3.5" />
                    {text('Current permission required', 'يتطلب إذناً حالياً')}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-fg-tertiary">
                {text('Employer backing', 'دعم جهة العمل')}
              </dt>
              <dd className="mt-1 text-body font-medium">
                {application.employerBacked
                  ? text('Attached to this application', 'مرفق بهذا الطلب')
                  : text('Not attached', 'غير مرفق')}
              </dd>
            </div>
          </dl>
        </section>
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
          <div className="space-y-6">
            <section
              className="rounded-lg border border-line p-5"
              aria-labelledby="bank-risk-title"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 id="bank-risk-title" className="text-title font-medium">
                  {text('Written risk summary', 'ملخص المخاطر المكتوب')}
                </h2>
                {application.risk && !gaps.length && !guardBlocked ? (
                  <Badge
                    tone={
                      application.risk.level === 'low'
                        ? 'success'
                        : application.risk.level === 'elevated'
                          ? 'danger'
                          : 'warning'
                    }
                  >
                    {application.risk.level === 'low'
                      ? text('Low risk', 'مخاطر منخفضة')
                      : application.risk.level === 'moderate'
                        ? text('Moderate risk', 'مخاطر متوسطة')
                        : text('Elevated risk', 'مخاطر مرتفعة')}
                  </Badge>
                ) : (
                  <Badge>{text('Officer review', 'مراجعة الموظف')}</Badge>
                )}
              </div>
              {application.risk && !gaps.length && !guardBlocked ? (
                <>
                  <p className="text-body leading-6 text-fg-secondary">
                    {!labelAccess(state, application, 'emirates_id') &&
                    application.risk.headline ===
                      'Low risk. Employment is verified and the Emirates ID application is already in.'
                      ? text(
                          'Low risk in the seeded employment summary. Emirates ID evidence is outside the current bank disclosure and still needs officer review.',
                          'مخاطر منخفضة في ملخص التوظيف الأولي. أدلة الهوية الإماراتية خارج الإفصاح البنكي الحالي وتحتاج إلى مراجعة الموظف.',
                        )
                      : riskCopy(application.risk.headline, locale)}
                  </p>
                  <div className="mt-5 divide-y divide-line">
                    {application.risk.points.map((point) => (
                      <div key={point.label} className="flex items-start gap-3 py-3 first:pt-0">
                        <span
                          className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${point.effect === 'positive' ? 'bg-success-soft text-success' : point.effect === 'concern' ? 'bg-warning-soft text-warning' : 'bg-track text-fg-secondary'}`}
                        >
                          {point.effect === 'positive' ? (
                            <Check aria-hidden className="size-3.5" />
                          ) : (
                            <CircleAlert aria-hidden className="size-3.5" />
                          )}
                        </span>
                        <div>
                          <h3 className="text-body font-medium">{riskCopy(point.label, locale)}</h3>
                          <p className="mt-1 text-label leading-5 text-fg-secondary">
                            {point.label === 'Emirates ID' &&
                            !labelAccess(state, application, 'emirates_id')
                              ? text(
                                  'Identity evidence is outside the current disclosure. Request permissioned evidence if needed; no card details are visible.',
                                  'أدلة الهوية خارج الإفصاح الحالي. اطلب الأدلة المصرح بها عند الحاجة؛ لا تظهر تفاصيل البطاقة.',
                                )
                              : riskCopy(point.reason, locale)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-caption text-fg-tertiary">
                    {text(
                      application.risk.generatedBy === 'demo'
                        ? 'Seeded demo reasoning · An officer records the decision.'
                        : 'AI-generated reasoning · An officer records the decision.',
                      application.risk.generatedBy === 'demo'
                        ? 'أسباب العرض الأولية · يسجل الموظف القرار.'
                        : 'أسباب مولدة بالذكاء الاصطناعي · يسجل الموظف القرار.',
                    )}
                  </p>
                </>
              ) : (
                <div className="rounded-md bg-subtle p-4">
                  <p className="text-body font-medium">
                    {gaps.length || guardBlocked
                      ? text(
                          'Current permission scope needs attention',
                          'نطاق الإذن الحالي يحتاج إلى متابعة',
                        )
                      : text('No automated summary on file', 'لا يوجد ملخص آلي مسجل')}
                  </p>
                  <p className="mt-2 text-body leading-6 text-fg-secondary">
                    {gaps.length || guardBlocked
                      ? text(
                          'The risk summary and document contents stay hidden while permission is incomplete or a Guard check is blocked. A historical decision does not restore access.',
                          'يبقى ملخص المخاطر ومحتوى المستندات مخفياً عندما تكون الأذونات غير مكتملة أو عند حظر Guard. لا يعيد القرار السابق حق الوصول.',
                        )
                      : text(
                          'Review the disclosed evidence and record your own written reason. A missing summary does not imply low risk.',
                          'راجع الأدلة المفصح عنها وسجل أسبابك المكتوبة. لا يعني غياب الملخص أن المخاطر منخفضة.',
                        )}
                  </p>
                </div>
              )}
            </section>
            <section
              className="overflow-hidden rounded-lg border border-line"
              aria-labelledby="bank-documents-title"
            >
              <div className="border-b border-line p-5">
                <h2 id="bank-documents-title" className="text-title font-medium">
                  {text('Document checklist', 'قائمة المستندات')}
                </h2>
                <p className="mt-1 text-label text-fg-secondary">
                  {text(
                    'Readiness checks for this demo. A missing document can be requested with a written reason.',
                    'فحوص جاهزية لهذا العرض. يمكن طلب مستند مفقود مع سبب مكتوب.',
                  )}
                </p>
              </div>
              <div className="divide-y divide-line">
                {CHECKLIST.map((kind) => {
                  const document = documents.find((item) => item.kind === kind);
                  const accessible = document
                    ? documentAccess(state, application, document)
                    : false;
                  const optional = kind === 'bank_statement';
                  return (
                    <div
                      key={kind}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 ${accessible && document?.status === 'verified' ? 'text-success' : 'text-fg-tertiary'}`}
                        >
                          {accessible ? (
                            <FileText aria-hidden className="size-4" />
                          ) : (
                            <LockKeyhole aria-hidden className="size-4" />
                          )}
                        </span>
                        <div>
                          <h3 className="text-body font-medium">
                            {documentLabel(kind, locale)}
                            {optional ? (
                              <span className="ms-2 text-caption font-normal text-fg-tertiary">
                                {text('Optional context', 'سياق اختياري')}
                              </span>
                            ) : null}
                          </h3>
                          <p className="mt-0.5 text-caption text-fg-tertiary">
                            {accessible
                              ? document!.fileName
                              : document
                                ? text(
                                    'Contents restricted by current permission',
                                    'المحتوى مقيّد بالإذن الحالي',
                                  )
                                : text('No shared document on file', 'لا يوجد مستند مشترك مسجل')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {accessible ? (
                          <>
                            <Badge
                              tone={
                                document!.status === 'verified'
                                  ? 'success'
                                  : document!.status === 'rejected'
                                    ? 'danger'
                                    : 'warning'
                              }
                            >
                              {document!.status === 'verified'
                                ? text('Verified', 'تم التحقق')
                                : document!.status === 'rejected'
                                  ? text('Rejected', 'مرفوض')
                                  : text('Needs verification', 'يحتاج إلى تحقق')}
                            </Badge>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setPreviewId(document!.id)}
                            >
                              {text('View details', 'عرض التفاصيل')}
                            </Button>
                          </>
                        ) : open ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setRequestKind(kind);
                              beginReview('info_requested');
                            }}
                          >
                            {text('Request information', 'طلب معلومات')}
                          </Button>
                        ) : (
                          <Badge>{text('Not available', 'غير متاح')}</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="border-t border-line bg-subtle px-5 py-3 text-caption text-fg-tertiary">
                {text(
                  'A letter containing salary needs both employment disclosure and salary permission. Restricted file names, extracted fields and reasoning are hidden together.',
                  'تحتاج الرسالة التي تحتوي على راتب إلى إفصاح التوظيف وإذن الراتب معاً. تُحجب أسماء الملفات والحقول المستخرجة والأسباب معاً.',
                )}
              </p>
            </section>
            <section className="rounded-lg border border-line p-5">
              <h2 className="text-title font-medium">{text('Decision history', 'سجل القرارات')}</h2>
              {Object.values(state.decisions)
                .filter((item) => item.applicationId === application.id)
                .reverse()
                .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt))
                .map((item) => (
                  <DecisionEntry
                    key={item.id}
                    decision={item}
                    locale={locale}
                    detailsAllowed={!gaps.length && !guardBlocked}
                  />
                ))}
              {!decision ? (
                <p className="mt-3 text-body text-fg-secondary">
                  {text(
                    'No decision recorded yet. Your reason will appear here and in the shared relocation record.',
                    'لم يُسجل قرار بعد. سيظهر سبب قرارك هنا وفي سجل الانتقال المشترك.',
                  )}
                </p>
              ) : null}
            </section>
          </div>
          <aside className="space-y-5">
            <section
              className="rounded-lg border border-accent/25 bg-accent-soft/40 p-5"
              aria-labelledby="bank-scope-title"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck aria-hidden className="size-5 text-accent" />
                <h2 id="bank-scope-title" className="text-title font-medium">
                  {text('Permission scope', 'نطاق الإذن')}
                </h2>
              </div>
              <p className="mt-2 text-label leading-5 text-fg-secondary">
                {text(
                  'The newcomer controls permission. This bank review cannot extend it.',
                  'يتحكم الوافد في الإذن. لا تستطيع هذه المراجعة البنكية توسيعه.',
                )}
              </p>
              <h3 className="mt-4 text-caption font-medium text-fg-secondary">
                {text('The bank may see', 'يمكن للبنك الاطلاع على')}
              </h3>
              <ul className="mt-2 divide-y divide-line rounded-md border border-line bg-surface">
                {application.disclosed.map((disclosure) => {
                  const allowed = !gaps.some((gap) => gap.label === disclosure.label);
                  return (
                    <li
                      key={disclosure.label}
                      className="flex items-center justify-between gap-2 px-3 py-2 text-label"
                    >
                      <span>
                        {dataLabel(disclosure.label, locale)}
                        {disclosure.derived ? text(' · derived result', ' · نتيجة مشتقة') : ''}
                      </span>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 ${allowed ? 'text-success' : 'text-warning'}`}
                      >
                        {allowed ? (
                          <Check aria-hidden className="size-3.5" />
                        ) : (
                          <LockKeyhole aria-hidden className="size-3.5" />
                        )}
                        {allowed
                          ? policyFor(disclosure.label, 'bank') === 'allow'
                            ? text('Policy allows', 'تسمح السياسة')
                            : text('Permission active', 'إذن ساري')
                          : text('Restricted', 'مقيّد')}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <h3 className="mt-4 text-caption font-medium text-fg-secondary">
                {text('The bank cannot see', 'لا يمكن للبنك الاطلاع على')}
              </h3>
              <ul className="mt-2 divide-y divide-line rounded-md border border-line bg-surface">
                {DATA_LABELS.filter(
                  (label) => !application.disclosed.some((item) => item.label === label),
                )
                  .sort(
                    (a, b) =>
                      Number(policyFor(a, 'bank') === 'deny') -
                      Number(policyFor(b, 'bank') === 'deny'),
                  )
                  .map((label) => (
                    <li
                      key={label}
                      className="flex items-center justify-between gap-2 px-3 py-2 text-label"
                    >
                      <span>{dataLabel(label, locale)}</span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-fg-tertiary">
                        <EyeOff aria-hidden className="size-3.5" />
                        {policyFor(label, 'bank') === 'deny'
                          ? text('Not available to banks', 'غير متاحة للبنوك')
                          : text('Not disclosed here', 'غير مفصح عنها هنا')}
                      </span>
                    </li>
                  ))}
              </ul>
            </section>
            <section className="rounded-lg border border-line p-5">
              <h2 className="text-title font-medium">
                {open
                  ? text('Record a decision', 'تسجيل القرار')
                  : text('Decision recorded', 'تم تسجيل القرار')}
              </h2>
              <p className="mt-2 text-label leading-5 text-fg-secondary">
                {text(
                  'A recorded decision updates the applicant’s bank step and the employer workspace. It does not open a real account or send an external message.',
                  'يحدث القرار المسجل خطوة البنك ومساحة جهة العمل. لا يفتح حساباً فعلياً ولا يرسل رسالة خارجية.',
                )}
              </p>
              {open ? (
                <ul
                  className="mt-4 space-y-2 text-label"
                  aria-label={text('Readiness to approve', 'الجاهزية للاعتماد')}
                >
                  {[
                    {
                      ok: application.state !== 'submitted',
                      yes: text('Review started', 'بدأت المراجعة'),
                      no: text('Review not started', 'لم تبدأ المراجعة'),
                    },
                    {
                      ok: !gaps.length,
                      yes: text('Disclosed permissions are current', 'الأذونات المفصح عنها سارية'),
                      no: text('A disclosed permission is not current', 'إذن مفصح عنه غير ساري'),
                    },
                    {
                      ok: !guardBlocked,
                      yes: text('No blocking Guard event recorded', 'لا يوجد حظر Guard مسجل'),
                      no: text('A Guard event is blocking', 'يوجد حظر من Guard'),
                    },
                  ].map((item) => (
                    <li
                      key={item.yes}
                      className={`flex items-center gap-2 ${item.ok ? 'text-fg-secondary' : 'text-warning'}`}
                    >
                      <span
                        aria-hidden
                        className={`flex size-5 shrink-0 items-center justify-center rounded-full ${item.ok ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'}`}
                      >
                        {item.ok ? (
                          <Check className="size-3" />
                        ) : (
                          <CircleAlert className="size-3" />
                        )}
                      </span>
                      {item.ok ? item.yes : item.no}
                    </li>
                  ))}
                </ul>
              ) : null}
              {open ? (
                <div className="mt-4 space-y-2">
                  <Button
                    className="w-full"
                    icon={<CheckCheck />}
                    disabled={
                      busy ||
                      connection === 'offline' ||
                      (application.state !== 'submitted' && !canApprove)
                    }
                    onClick={() =>
                      application.state === 'submitted' ? startReview() : beginReview('approved')
                    }
                  >
                    {text(
                      application.state === 'submitted' ? 'Start review' : 'Approve application',
                      application.state === 'submitted' ? 'بدء المراجعة' : 'اعتماد الطلب',
                    )}
                  </Button>
                  <Button
                    className="w-full"
                    variant="secondary"
                    icon={<FileText />}
                    disabled={busy || connection === 'offline'}
                    onClick={() => beginReview('info_requested')}
                  >
                    {text('Request information', 'طلب معلومات')}
                  </Button>
                  <Button
                    className="w-full text-danger"
                    variant="ghost"
                    disabled={busy || connection === 'offline'}
                    onClick={() => beginReview('declined')}
                  >
                    {text('Decline with a reason', 'رفض مع ذكر السبب')}
                  </Button>
                  {!canApprove ? (
                    <p className="pt-1 text-caption leading-5 text-warning">
                      {connection === 'offline'
                        ? text(
                            'Reconnect before recording a decision.',
                            'أعد الاتصال قبل تسجيل القرار.',
                          )
                        : application.state === 'submitted'
                          ? text(
                              'Start the review before recording an approval.',
                              'ابدأ المراجعة قبل تسجيل الاعتماد.',
                            )
                          : text(
                              'Approval is unavailable until current permissions and Guard blocks are resolved.',
                              'الاعتماد غير متاح حتى تُحل الأذونات الحالية وعمليات حظر Guard.',
                            )}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-4 flex items-center gap-2 text-body text-success">
                  <CheckCheck aria-hidden className="size-4" />
                  {bankStep?.status === 'done'
                    ? text('Bank step complete in the demo', 'خطوة البنك مكتملة في العرض')
                    : applicationLabel(application.state, locale)}
                </p>
              )}
            </section>
            <section className="rounded-lg border border-line p-5">
              <h2 className="text-title font-medium">
                {text('Recorded Guard check', 'فحص Guard المسجل')}
              </h2>
              {check ? (
                <>
                  <Badge
                    className="mt-3"
                    tone={
                      check.decision === 'allow'
                        ? 'success'
                        : check.decision === 'deny'
                          ? 'danger'
                          : 'warning'
                    }
                  >
                    {check.decision === 'allow'
                      ? text('Recorded allow', 'سماح مسجل')
                      : check.decision === 'deny'
                        ? text('Recorded block', 'حظر مسجل')
                        : text('Recorded consent request', 'طلب إذن مسجل')}
                  </Badge>
                  <p className="mt-3 text-caption text-fg-tertiary">
                    {text(
                      'Historical recorded event; live enforcement is unverified.',
                      'حدث سابق مسجل؛ لم يُتحقق من التنفيذ المباشر.',
                    )}
                  </p>
                  <p className="mt-3 text-label leading-5 text-fg-secondary">
                    {riskCopy(check.reason, locale)}
                  </p>
                  <p className="mt-2 text-caption text-fg-tertiary">
                    {formatDate(check.at, locale)}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-label leading-5 text-fg-secondary">
                  {text(
                    'No bank Guard event on file. The local permission checklist is a demo view, and does not prove a live outbound check.',
                    'لا يوجد حدث Guard بنكي مسجل. قائمة الأذونات المحلية عرض تجريبي ولا تثبت إجراء فحص مشاركة مباشر.',
                  )}
                </p>
              )}
              <p className="mt-3 border-t border-line pt-3 text-caption text-fg-tertiary">
                {text(
                  'The intended live sharing path is fail-closed. This demo uses recorded checks and current local permissions; live enforcement and production prompt parity remain unverified.',
                  'مسار المشاركة المباشر المقصود مغلق عند الفشل. يستخدم هذا العرض فحوصاً مسجلة وأذونات محلية حالية؛ لم يُتحقق من التنفيذ المباشر أو تطابق تعليمات الإنتاج.',
                )}
              </p>
            </section>
          </aside>
        </div>
      </div>
      <BankModal
        open={mode !== null}
        onClose={() => {
          if (!busy) setMode(null);
        }}
        title={
          mode === 'approved'
            ? text('Approve this application?', 'هل تعتمد هذا الطلب؟')
            : mode === 'declined'
              ? text('Decline this application?', 'هل ترفض هذا الطلب؟')
              : text('Request more information', 'طلب معلومات إضافية')
        }
        description={text(
          `Record a decision for ${hire.fullName} in the shared demo.`,
          `سجل قراراً بشأن ${hire.fullName} في العرض المشترك.`,
        )}
        footer={
          <>
            <Button variant="secondary" disabled={busy} onClick={() => setMode(null)}>
              {text('Cancel', 'إلغاء')}
            </Button>
            <Button
              variant={mode === 'declined' ? 'destructive' : 'primary'}
              disabled={
                busy ||
                !confirmed ||
                !open ||
                (mode === 'approved' && !canApprove) ||
                (mode !== 'info_requested' && note.trim().length < 12)
              }
              onClick={recordDecision}
            >
              {busy
                ? text('Recording…', 'جارٍ التسجيل…')
                : mode === 'approved'
                  ? text('Record approval', 'تسجيل الاعتماد')
                  : mode === 'declined'
                    ? text('Record decline', 'تسجيل الرفض')
                    : text('Record request', 'تسجيل الطلب')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {mode === 'info_requested' ? (
            <>
              <label className="flex flex-col gap-2 text-body font-medium">
                {text('Requested document', 'المستند المطلوب')}
                <select
                  value={requestKind}
                  onChange={(event) => setRequestKind(event.target.value as DocumentKind)}
                  className="h-10 rounded-md border border-line-strong bg-surface px-3 font-normal"
                >
                  {CHECKLIST.map((kind) => (
                    <option key={kind} value={kind}>
                      {documentLabel(kind, locale)}
                    </option>
                  ))}
                </select>
              </label>
              <p className="rounded-md bg-subtle p-3 text-label leading-5 text-fg-secondary">
                {requestNote}
              </p>
            </>
          ) : null}
          <label className="flex flex-col gap-2 text-body font-medium">
            {text(
              mode === 'info_requested'
                ? 'Additional context (optional)'
                : 'Written decision reason',
              mode === 'info_requested' ? 'سياق إضافي (اختياري)' : 'سبب القرار المكتوب',
            )}
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              className="w-full resize-y rounded-md border border-line-strong bg-surface p-3 text-body font-normal"
              placeholder={text(
                'Explain the evidence and next step clearly.',
                'وضح الأدلة والخطوة التالية.',
              )}
            />
          </label>
          <label className="flex items-start gap-3 text-label leading-5 text-fg-secondary">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-0.5 size-4 accent-[rgb(var(--accent))]"
            />
            <span>
              {mode === 'approved'
                ? text(
                    'I reviewed the disclosed evidence and current bank permissions. I understand this records a demo approval.',
                    'راجعت الأدلة المفصح عنها والأذونات البنكية الحالية. أفهم أن هذا يسجل اعتماداً تجريبياً.',
                  )
                : text(
                    'I reviewed the reason and understand this records a shared demo decision without an external message.',
                    'راجعت السبب وأفهم أن هذا يسجل قراراً تجريبياً مشتركاً دون إرسال رسالة خارجية.',
                  )}
            </span>
          </label>
          {mode === 'approved' && !canApprove ? (
            <p role="alert" className="text-label text-warning">
              {text(
                'Permission changed while this dialog was open. Resolve the current scope before approving.',
                'تغير الإذن أثناء فتح هذه النافذة. عالج النطاق الحالي قبل الاعتماد.',
              )}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="text-label text-danger">
              {error}
            </p>
          ) : null}
        </div>
      </BankModal>
      <BankModal
        open={previewId !== null}
        onClose={() => setPreviewId(null)}
        title={
          previewAllowed
            ? documentLabel(preview.kind, locale)
            : text('Document access restricted', 'الوصول إلى المستند مقيّد')
        }
        description={text(
          'Extracted details from the shared demo document; original files are not hosted here.',
          'تفاصيل مستخرجة من المستند التجريبي المشترك؛ لا تُستضاف الملفات الأصلية هنا.',
        )}
        footer={
          <Button variant="secondary" onClick={() => setPreviewId(null)}>
            {text('Close', 'إغلاق')}
          </Button>
        }
      >
        {previewAllowed ? (
          <>
            <p className="mb-4 text-caption text-fg-tertiary">
              {preview.fileName} · {formatDate(preview.uploadedAt, locale)}
            </p>
            <dl className="divide-y divide-line">
              {preview.fields.map((field) => (
                <div key={field.key} className="flex flex-wrap justify-between gap-3 py-3">
                  <dt className="text-label text-fg-secondary">{fieldCopy(field.label, locale)}</dt>
                  <dd className="text-body font-medium">
                    <bdi>{field.value}</bdi>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 rounded-md bg-subtle p-3 text-label leading-5 text-fg-secondary">
              {riskCopy(preview.reasoning, locale)}
            </p>
          </>
        ) : (
          <div className="flex items-start gap-3">
            <LockKeyhole aria-hidden className="size-5 shrink-0 text-warning" />
            <p className="text-body text-fg-secondary">
              {text(
                'Current permission does not cover every data label in this document. Its filename, extracted fields and reasoning are hidden.',
                'لا يغطي الإذن الحالي جميع تصنيفات البيانات في هذا المستند. يُحجب اسم الملف وحقوله المستخرجة وأسبابه.',
              )}
            </p>
          </div>
        )}
      </BankModal>
    </>
  );
}

function DecisionEntry({
  decision,
  locale,
  detailsAllowed,
}: {
  decision: Decision;
  locale: Locale;
  detailsAllowed: boolean;
}) {
  return (
    <div className="mt-4 border-t border-line pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge
          tone={
            decision.outcome === 'approved'
              ? 'success'
              : decision.outcome === 'declined'
                ? 'danger'
                : 'warning'
          }
        >
          {bankText(
            locale,
            decision.outcome === 'approved'
              ? 'Approved'
              : decision.outcome === 'declined'
                ? 'Declined'
                : decision.outcome === 'info_requested'
                  ? 'Information requested'
                  : 'Terms offered',
            decision.outcome === 'approved'
              ? 'معتمد'
              : decision.outcome === 'declined'
                ? 'مرفوض'
                : decision.outcome === 'info_requested'
                  ? 'معلومات مطلوبة'
                  : 'شروط مقترحة',
          )}
        </Badge>
        <span className="text-caption text-fg-tertiary">
          {decision.decidedBy} · {formatDate(decision.decidedAt, locale)}
        </span>
      </div>
      <p className="mt-3 text-body leading-6 text-fg-secondary">
        {detailsAllowed
          ? riskCopy(decision.note, locale)
          : bankText(
              locale,
              'Historical decision recorded. Current permission is required to read the written details.',
              'تم تسجيل قرار سابق. يتطلب الاطلاع على التفاصيل المكتوبة إذناً حالياً.',
            )}
      </p>
    </div>
  );
}

function fieldCopy(value: string, locale: Locale) {
  if (locale !== 'ar') return value;
  const labels: Record<string, string> = {
    'Full name': 'الاسم الكامل',
    'Passport number': 'رقم جواز السفر',
    Nationality: 'الجنسية',
    'Date of birth': 'تاريخ الميلاد',
    'Expiry date': 'تاريخ الانتهاء',
    Employer: 'جهة العمل',
    Role: 'الدور الوظيفي',
    Salary: 'الراتب',
    'Start date': 'تاريخ البدء',
  };
  return labels[value] ?? value;
}

function riskCopy(value: string, locale: Locale) {
  if (value === 'The employer backs the hire and is a known partner of the bank.')
    return bankText(
      locale,
      'The employer backs this application. Its portfolio is inferred from submitted applications; a formal bank relationship is not independently recorded.',
      'تدعم جهة العمل هذا الطلب. يُستنتج سجلها من الطلبات المقدمة؛ لا توجد علاقة بنكية رسمية مسجلة بشكل مستقل.',
    );
  if (locale !== 'ar') return value;
  const copy: Record<string, string> = {
    'Low risk. Employment is verified and the Emirates ID application is already in.':
      'مخاطر منخفضة. تم التحقق من التوظيف وتقديم طلب الهوية الإماراتية.',
    Employment: 'التوظيف',
    'Employer backing': 'دعم جهة العمل',
    'Emirates ID': 'الهوية الإماراتية',
    'Banking history': 'السجل البنكي',
    'The offer letter was verified against the employer record and is signed.':
      'تم التحقق من عرض العمل الموقّع بمقارنته بسجل جهة العمل.',
    'The employer backs the hire and is a known partner of the bank.':
      'تدعم جهة العمل الموظف. يشير ملخص العرض الأولي إلى علاقة بنكية؛ لا يوجد سجل مستقل يؤكدها.',
    'The application is submitted but the card is not issued yet.':
      'تم تقديم الطلب، لكن البطاقة لم تصدر بعد.',
    'No bank statement was shared, so there is nothing to assess either way.':
      'لم يُشارك كشف حساب بنكي، لذلك لا توجد أدلة لتقييم السجل البنكي.',
    'You allowed your passport and salary for banks.': 'سمحت بمشاركة جواز السفر والراتب مع البنوك.',
    'The name matches the offer letter and the passport has more than six months of validity left.':
      'يطابق الاسم عرض العمل ويظل جواز السفر صالحاً لأكثر من ستة أشهر.',
    'The employer and role match the Rasikh hire record, and the letter is signed.':
      'تطابق جهة العمل والدور الوظيفي سجل الموظف في راسخ، والرسالة موقعة.',
    'Account approved.': 'تم اعتماد الحساب.',
  };
  return copy[value] ?? value;
}
