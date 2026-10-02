'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import {
  Check,
  Download,
  FileSearch,
  LockKeyhole,
  Search,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Illustration } from '@/components/ui/illustration';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import {
  PASSPORT_DESTINATIONS,
  PASSPORT_LABELS,
  policyFor,
  type PolicyCell,
} from '@/domain/policy';
import type { GuardCheck } from '@/domain/types';
import { formatDate } from '@/lib/format';
import { useAppState } from '@/store/provider';
import {
  EmployerHeader,
  inputClass,
  Metric,
  Modal,
  NewcomerLink,
  Panel,
  useEmployerCopy,
} from './common';
import { csvCell } from './pipeline-model';
import { EmployerScopePicker, useEmployerScope } from './scope';
import evidenceSnapshot from './evidence-snapshot.json';
import { CurrentGuardEvidence } from './current-guard-evidence';

const historicalEvidence = {
  generatedAt: evidenceSnapshot.guard.generatedAt,
  runs: evidenceSnapshot.guard.runs.length,
  attacksPerRun: evidenceSnapshot.guard.runs[0].attacks,
  deniedPerRun: evidenceSnapshot.guard.runs[0].denied,
  unsafeAllowsPerRun: evidenceSnapshot.guard.runs[0].unsafeAllows,
  verifiedPerRun: evidenceSnapshot.guard.runs[0].verified,
  conformanceFailures: evidenceSnapshot.guard.runs[0].failedConformance.length,
  contract: evidenceSnapshot.guard.contract,
  upstream: evidenceSnapshot.guard.upstream,
  source: evidenceSnapshot.guard.source,
  modelSource: evidenceSnapshot.model.source,
  model: evidenceSnapshot.model.model,
  modelGeneratedAt: evidenceSnapshot.model.generatedAt,
  authorizationLeakRate:
    evidenceSnapshot.guard.runs.reduce((total, run) => total + run.unsafeAllows, 0) /
    evidenceSnapshot.guard.runs.reduce((total, run) => total + run.attacks, 0),
};

export function EmployerGuard() {
  const state = useAppState();
  const { employerId } = useEmployerScope();
  const { e, locale, t } = useEmployerCopy();
  const params = useSearchParams();
  const [tab, setTab] = useState<'log' | 'trust' | 'evidence'>('log');
  const [hireId, setHireId] = useState(params.get('hire') ?? 'all');
  const [decision, setDecision] = useState('all');
  const [destination, setDestination] = useState('all');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<GuardCheck | null>(null);
  const [sources, setSources] = useState(false);
  const hires = Object.values(state.hires).filter((hire) => hire.employerId === employerId);
  const companies = Object.values(state.companies).filter(
    (company) => company.employerId === employerId,
  );
  const caseIds = new Set([...hires, ...companies].map((item) => item.id));
  const scopedChecks = Object.values(state.guardChecks)
    .filter((check) => caseIds.has(check.caseId))
    .sort((a, b) => b.at.localeCompare(a.at));
  const effectiveHireId = hires.some((hire) => hire.id === hireId) ? hireId : 'all';
  const checks = scopedChecks.filter(
    (check) =>
      (effectiveHireId === 'all' || check.caseId === effectiveHireId) &&
      (decision === 'all' || check.decision === decision) &&
      (destination === 'all' || check.destination === destination) &&
      (!search.trim() ||
        [
          check.reason,
          check.tool,
          check.policyRule,
          state.hires[check.caseId]?.fullName ?? state.companies[check.caseId]?.name ?? '',
        ].some((value) => value.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))),
  );
  const destinationLabel = (value: GuardCheck['destination']) =>
    value === 'llm_provider'
      ? e('AI provider', 'مزود الذكاء الاصطناعي')
      : value === 'newcomer'
        ? e('Newcomer', 'الموظف المنتقل')
        : t(`passport.group.${value}`);
  const decisionLabel = (value: GuardCheck['decision']) =>
    value === 'allow'
      ? e('Allowed', 'مسموح')
      : value === 'deny'
        ? e('Denied', 'مرفوض')
        : e('Consent needed', 'الموافقة مطلوبة');
  const exportChecks = () => {
    const rows = [
      ['Time', 'Case', 'Tool', 'Destination', 'Decision', 'Reason', 'Policy rule'],
      ...checks.map((check) => [
        check.at,
        state.hires[check.caseId]?.fullName ?? state.companies[check.caseId]?.name ?? check.caseId,
        check.tool,
        check.destination,
        check.decision,
        check.reason,
        check.policyRule,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob(['\uFEFF', rows.map((row) => row.map(csvCell).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8',
      }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `rasikh-${employerId}-demo-guard-log.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const cellLabel = (
    cell: PolicyCell,
    label: (typeof PASSPORT_LABELS)[number],
    destination: (typeof PASSPORT_DESTINATIONS)[number],
  ) => {
    const activeConsent =
      effectiveHireId !== 'all' &&
      Object.values(state.grants).some(
        (grant) =>
          grant.hireId === effectiveHireId &&
          grant.label === label &&
          grant.destination === destination,
      );
    const labels: Record<PolicyCell, string> = {
      allow: e('Allowed', 'مسموح'),
      deny: e('Restricted', 'مقيّد'),
      consent: activeConsent
        ? e('Consent recorded', 'موافقة مسجلة')
        : e('Needs consent', 'الموافقة مطلوبة'),
      derived_only: e('Yes / no only', 'نعم أو لا فقط'),
      extraction_only: e('Extraction only', 'استخراج فقط'),
      redacted: e('Redacted only', 'بيانات منقحة فقط'),
      insurance_only: e('Insurance only', 'التأمين فقط'),
    };
    return labels[cell];
  };
  return (
    <>
      <EmployerHeader
        eyebrow={e('A clear record of every recorded check', 'سجل واضح لعمليات التحقق المسجلة')}
        title={e('Trust, made visible', 'الثقة، بوضوح')}
        description={e(
          'Review demo sharing decisions, policy defaults and the evidence behind the Guard evaluation.',
          'راجع قرارات المشاركة التجريبية والسياسات الافتراضية وأدلة تقييم الحماية.',
        )}
        actions={
          <Button
            variant="secondary"
            icon={<Download />}
            onClick={exportChecks}
            disabled={!checks.length}
          >
            {e('Export demo log', 'تصدير السجل التجريبي')}
          </Button>
        }
      />
      <div className="space-y-6 p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <EmployerScopePicker />
          <Badge tone="neutral" shape="pill">
            {e('Demo records', 'سجلات تجريبية')}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-danger/25 bg-danger-soft p-5 sm:p-6">
          <div className="flex min-w-0 max-w-3xl flex-1 items-start gap-4">
            <div className="shrink-0 border-e border-danger/25 pe-4 text-danger">
              <p className="text-[2.25rem] font-medium leading-none tracking-tight tabular-nums">
                {historicalEvidence.unsafeAllowsPerRun}
                <span className="text-heading">/{historicalEvidence.attacksPerRun}</span>
              </p>
              <p className="mt-2 max-w-[8.5rem] text-caption leading-4">
                {e('forbidden flows allowed per run', 'مسارات محظورة سُمح بها في كل تجربة')}
              </p>
            </div>
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-title font-medium text-danger">
                <TriangleAlert aria-hidden className="size-5 shrink-0" />
                {e(
                  'Archived evaluation: provenance failure recorded',
                  'التقييم المؤرشف: خلل مسجل في تتبع مصدر البيانات',
                )}
              </h2>
              <p className="mt-2 text-body leading-6 text-danger">
                {e(
                  `In this historical snapshot, each of ${historicalEvidence.runs} runs allowed ${historicalEvidence.unsafeAllowsPerRun} of ${historicalEvidence.attacksPerRun} forbidden synthetic flows. Production prompt parity was not measured.`,
                  `في هذه اللقطة التاريخية، سمحت كل تجربة من ${historicalEvidence.runs} تجارب بـ${historicalEvidence.unsafeAllowsPerRun} من أصل ${historicalEvidence.attacksPerRun} مساراً اصطناعياً محظوراً. لم يُقَس التطابق مع تعليمات الإنتاج.`,
                )}
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setTab('evidence')}>
            {e('View evidence & scope', 'عرض الأدلة ونطاقها')}
          </Button>
        </div>
        <section className="grid items-center gap-5 overflow-hidden rounded-2xl border border-accent/15 bg-accent-soft p-5 md:grid-cols-[1.3fr_1fr] sm:p-6">
          <div>
            <ShieldCheck aria-hidden className="size-6 text-accent" />
            <h2 className="mt-2 text-[1.5rem] font-medium leading-tight">
              {e('Personal data. Clear decisions.', 'بيانات شخصية. قرارات واضحة.')}
            </h2>
            <p className="mt-3 max-w-lg text-body leading-6 text-fg-secondary">
              {e(
                'See who a demo check was for, the proposed destination and the reason it was allowed or stopped. Personal consent stays with the newcomer.',
                'اطلع على صاحب التحقق التجريبي والجهة المقترح إرسال البيانات إليها وسبب السماح أو الإيقاف. تظل الموافقة الشخصية بيد الموظف.',
              )}
            </p>
            <p className="mt-3 text-label font-medium leading-6 text-fg">
              {e(
                'This activity log is illustrative. It does not certify the current Guard integration.',
                'هذا السجل توضيحي. ولا يمثل اعتماداً لتكامل الحماية الحالي.',
              )}
            </p>
          </div>
          <Illustration
            variant="privacy-consent"
            decorative
            aspect="landscape"
            fit="contain"
            className="mx-auto max-w-[240px] overflow-hidden rounded-2xl"
          />
        </section>
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric
            title={e('Recorded demo checks', 'عمليات تحقق تجريبية مسجلة')}
            value={scopedChecks.length}
            detail={e(
              'For this employer’s hire and company cases',
              'لحالات الموظفين والشركة لدى صاحب العمل هذا',
            )}
            icon={FileSearch}
          />
          <Metric
            title={e('Recorded denials', 'حالات رفض مسجلة')}
            value={scopedChecks.filter((check) => check.decision === 'deny').length}
            detail={e(
              'Demo check outcomes, separate from evaluation',
              'نتائج تحقق تجريبية، منفصلة عن التقييم',
            )}
            icon={LockKeyhole}
            tone="danger"
          />
          <Metric
            title={e('Recorded consent prompts', 'طلبات موافقة مسجلة')}
            value={scopedChecks.filter((check) => check.decision === 'needs_consent').length}
            detail={e('The person controls personal consent', 'الموظف يتحكم بموافقته الشخصية')}
            icon={ShieldCheck}
            tone="warning"
          />
        </div>
        <div
          className="flex flex-wrap gap-1 border-b border-line"
          aria-label={e('Trust sections', 'أقسام الثقة')}
        >
          {(
            [
              { id: 'log', label: e('Demo check log', 'سجل التحقق التجريبي') },
              { id: 'trust', label: e('Trust defaults', 'إعدادات الثقة الافتراضية') },
              { id: 'evidence', label: e('Evaluation evidence', 'أدلة التقييم') },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`min-h-11 border-b-2 px-4 text-body font-medium ${tab === item.id ? 'border-accent text-accent' : 'border-transparent text-fg-secondary hover:text-fg'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {tab !== 'evidence' && (
          <div className="flex flex-wrap gap-3">
            <label className="w-full max-w-sm">
              <span className="sr-only">{e('Hire', 'الموظف')}</span>
              <select
                value={effectiveHireId}
                onChange={(event) => setHireId(event.target.value)}
                className={inputClass}
              >
                <option value="all">{e('All employer cases', 'كل حالات صاحب العمل')}</option>
                {hires.map((hire) => (
                  <option key={hire.id} value={hire.id}>
                    {hire.fullName}
                  </option>
                ))}
              </select>
            </label>
            {effectiveHireId !== 'all' && (
              <NewcomerLink hireId={effectiveHireId}>
                {e('Open personal trust passport', 'فتح جواز الثقة الشخصي')}
              </NewcomerLink>
            )}
          </div>
        )}
        {tab === 'log' && (
          <Panel
            title={e('What was checked, and why', 'ما تم التحقق منه، ولماذا')}
            description={e(
              'Seeded demo records and recorded actions. These are not live sidecar measurements.',
              'سجلات تجريبية وإجراءات مسجلة، وليست قياسات مباشرة لخدمة الحماية.',
            )}
          >
            <div className="grid gap-3 border-b border-line p-4 md:grid-cols-[1.3fr_1fr_1fr]">
              <label className="relative">
                <Search aria-hidden className="absolute start-3 top-3.5 size-4 text-fg-tertiary" />
                <span className="sr-only">{e('Search checks', 'البحث في عمليات التحقق')}</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={e(
                    'Search person, reason or rule',
                    'ابحث بالشخص أو السبب أو القاعدة',
                  )}
                  className={`${inputClass} ps-9`}
                />
              </label>
              <label>
                <span className="sr-only">{e('Decision', 'القرار')}</span>
                <select
                  value={decision}
                  onChange={(event) => setDecision(event.target.value)}
                  className={inputClass}
                >
                  <option value="all">{e('All decisions', 'كل القرارات')}</option>
                  <option value="allow">{e('Allowed', 'مسموح')}</option>
                  <option value="deny">{e('Denied', 'مرفوض')}</option>
                  <option value="needs_consent">{e('Consent needed', 'الموافقة مطلوبة')}</option>
                </select>
              </label>
              <label>
                <span className="sr-only">{e('Destination', 'الوجهة')}</span>
                <select
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  className={inputClass}
                >
                  <option value="all">{e('All destinations', 'كل الوجهات')}</option>
                  {(
                    [
                      'landlord',
                      'bank',
                      'employer',
                      'school',
                      'tamm',
                      'llm_provider',
                      'newcomer',
                    ] as const
                  ).map((value) => (
                    <option key={value} value={value}>
                      {destinationLabel(value)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <ul className="divide-y divide-line">
              {checks.map((check) => (
                <li key={check.id} className="p-5">
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl ${check.decision === 'deny' ? 'bg-danger-soft text-danger' : check.decision === 'needs_consent' ? 'bg-warning-soft text-warning' : 'bg-accent-soft text-accent'}`}
                    >
                      {check.decision === 'allow' ? (
                        <Check className="size-4" />
                      ) : (
                        <LockKeyhole className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-body font-medium">
                          {state.hires[check.caseId]?.fullName ??
                            state.companies[check.caseId]?.name ??
                            check.caseId}
                          <span className="mx-2 font-normal text-fg-tertiary">→</span>
                          {destinationLabel(check.destination)}
                        </p>
                        <Badge
                          tone={
                            check.decision === 'deny'
                              ? 'danger'
                              : check.decision === 'needs_consent'
                                ? 'warning'
                                : 'accent'
                          }
                          shape="pill"
                        >
                          {decisionLabel(check.decision)}
                        </Badge>
                      </div>
                      <p className="mt-2 text-body leading-6 text-fg-secondary">{check.reason}</p>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-caption text-fg-tertiary">
                          {formatDate(check.at, locale)} · {e('Demo check', 'تحقق تجريبي')}
                        </p>
                        <Button size="sm" variant="ghost" onClick={() => setDetail(check)}>
                          {e('View check details', 'عرض تفاصيل التحقق')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {!checks.length && (
              <div className="p-10 text-center">
                <FileSearch aria-hidden className="mx-auto size-8 text-accent" />
                <h3 className="mt-4 text-title font-medium">
                  {scopedChecks.length
                    ? e('No recorded checks match', 'لا توجد عمليات تحقق مطابقة')
                    : e('No demo checks recorded yet', 'لم تُسجّل عمليات تحقق تجريبية بعد')}
                </h3>
                <p className="mt-2 text-body text-fg-tertiary">
                  {e(
                    scopedChecks.length
                      ? 'Change a filter to explore another case or decision.'
                      : 'There are no recorded sharing checks for this employer. Policy defaults and historical evaluation evidence are available separately.',
                    scopedChecks.length
                      ? 'غيّر التصفية لاستكشاف حالة أو قرار آخر.'
                      : 'لا توجد عمليات تحقق مشاركة مسجلة لصاحب العمل هذا. إعدادات السياسة الافتراضية وأدلة التقييم التاريخية متاحة بشكل منفصل.',
                  )}
                </p>
                {(decision !== 'all' ||
                  destination !== 'all' ||
                  search.trim() ||
                  effectiveHireId !== 'all') && (
                  <Button
                    className="mt-4"
                    variant="secondary"
                    onClick={() => {
                      setDecision('all');
                      setDestination('all');
                      setSearch('');
                      setHireId('all');
                    }}
                  >
                    {e('Clear filters', 'مسح التصفية')}
                  </Button>
                )}
              </div>
            )}
          </Panel>
        )}
        {tab === 'trust' && (
          <Panel
            title={e(
              'Policy defaults, destination by destination',
              'الإعدادات الافتراضية للسياسة، حسب الوجهة',
            )}
            description={
              effectiveHireId === 'all'
                ? e(
                    'Product defaults only. Choose a hire to see recorded scoped consent.',
                    'الإعدادات الافتراضية للمنتج فقط. اختر موظفاً لعرض الموافقات المسجلة ضمن نطاقها.',
                  )
                : e(
                    'Policy defaults with this person’s consent records. Employer access remains restricted for health and bank statements.',
                    'الإعدادات الافتراضية وموافقات هذا الموظف. يظل وصول صاحب العمل مقيّداً للتفاصيل الصحية وكشف الحساب.',
                  )
            }
          >
            <div className="overflow-x-auto">
              <Table className="min-w-[780px]">
                <caption className="sr-only">
                  {e('Demo data-sharing policy', 'سياسة مشاركة البيانات التجريبية')}
                </caption>
                <thead>
                  <tr>
                    <Th>{e('Data category', 'فئة البيانات')}</Th>
                    {PASSPORT_DESTINATIONS.map((value) => (
                      <Th key={value}>{destinationLabel(value)}</Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PASSPORT_LABELS.map((label) => (
                    <Tr key={label} className="!h-16">
                      <Td className="font-medium">{t(`passport.label.${label}`)}</Td>
                      {PASSPORT_DESTINATIONS.map((value) => {
                        const cell = policyFor(label, value);
                        return (
                          <Td key={value}>
                            <Badge
                              tone={
                                cell === 'deny'
                                  ? 'neutral'
                                  : cell === 'allow'
                                    ? 'accent'
                                    : 'warning'
                              }
                              shape="pill"
                            >
                              {cellLabel(cell, label, value)}
                            </Badge>
                          </Td>
                        );
                      })}
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <div className="border-t border-line p-5">
              <p className="text-label leading-6 text-fg-secondary">
                {e(
                  'The employer can review policy categories and consent metadata. The newcomer controls grants in their personal view. This table expresses demo product defaults, not a security certification.',
                  'يمكن لصاحب العمل مراجعة فئات السياسة وبيانات الموافقات. يتحكم الموظف بالموافقات في شاشته الشخصية. يوضح الجدول الإعدادات التجريبية للمنتج، ولا يمثل اعتماداً أمنياً.',
                )}
              </p>
            </div>
          </Panel>
        )}
        {tab === 'evidence' && (
          <div className="space-y-6">
            <CurrentGuardEvidence />
            <Panel
              title={e(
                'Guard HTTP evaluation · 2 Oct 2026',
                'تقييم الحماية عبر HTTP · 2 أكتوبر 2026',
              )}
              description={e(
                'Historical synthetic-request measurements from the evaluation workspace.',
                'قياسات تاريخية لطلبات اصطناعية من مساحة التقييم.',
              )}
              action={
                <Badge tone="danger" shape="pill">
                  {e('Failed in measured scope', 'فشل ضمن نطاق القياس')}
                </Badge>
              }
            >
              <div className="grid gap-5 p-5 sm:grid-cols-3">
                <div>
                  <p className="text-caption text-fg-tertiary">
                    {e('Forbidden flows allowed', 'مسارات محظورة سُمح بها')}
                  </p>
                  <p className="mt-2 text-[2rem] font-medium text-danger">
                    {Math.round(historicalEvidence.authorizationLeakRate * 100)}%
                  </p>
                  <p className="mt-2 text-label leading-6 text-fg-secondary">
                    {e(
                      `${historicalEvidence.unsafeAllowsPerRun} of ${historicalEvidence.attacksPerRun} in each of ${historicalEvidence.runs} runs`,
                      `${historicalEvidence.unsafeAllowsPerRun} من أصل ${historicalEvidence.attacksPerRun} في كل تجربة من ${historicalEvidence.runs} تجارب`,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-caption text-fg-tertiary">
                    {e('Direct attacks denied', 'هجمات مباشرة رُفضت')}
                  </p>
                  <p className="mt-2 text-[2rem] font-medium">
                    {historicalEvidence.deniedPerRun} / {historicalEvidence.deniedPerRun}
                  </p>
                  <p className="mt-2 text-label leading-6 text-fg-secondary">
                    {e('Observed in every run', 'لوحظ ذلك في كل تجربة')}
                  </p>
                </div>
                <div>
                  <p className="text-caption text-fg-tertiary">
                    {e('Indirect attacks allowed', 'هجمات غير مباشرة سُمح بها')}
                  </p>
                  <p className="mt-2 text-[2rem] font-medium text-danger">
                    {historicalEvidence.unsafeAllowsPerRun} /{' '}
                    {historicalEvidence.unsafeAllowsPerRun}
                  </p>
                  <p className="mt-2 text-label leading-6 text-fg-secondary">
                    {e(
                      'New unlabelled references lost provenance',
                      'فقدت المراجع الجديدة غير المصنفة تتبع مصدر البيانات',
                    )}
                  </p>
                </div>
              </div>
              <div className="space-y-3 border-t border-line p-5">
                <p className="text-caption leading-5 text-fg-tertiary">
                  {e('Attack report', 'تقرير الهجمات')}: {historicalEvidence.modelSource} ·{' '}
                  {historicalEvidence.modelGeneratedAt}
                </p>
                <p className="text-body leading-6 text-fg-secondary">
                  {e(
                    `The sidecar denied direct forbidden flows. It allowed all ${historicalEvidence.unsafeAllowsPerRun} indirect attacks that replaced an observed sensitive reference with a fresh unlabelled summary reference. Those explicit allows count as unsafe authorization.`,
                    `رفضت خدمة الحماية المسارات المحظورة المباشرة، لكنها سمحت بكل الهجمات غير المباشرة وعددها ${historicalEvidence.unsafeAllowsPerRun} التي استبدلت مرجعاً حساساً بمرجع ملخص جديد غير مصنف. تُعد هذه السماحات تفويضاً غير آمن.`,
                  )}
                </p>
                <p className="text-label leading-6 text-fg-secondary">
                  {e(
                    `No attempted payload was forwarded. This measures authorization decisions, not actual data exfiltration. ${historicalEvidence.conformanceFailures} conformance failures per run were recorded, including the provenance defect and a method-error response format.`,
                    `لم يتم تمرير أي محتوى من الطلبات. يقيس هذا قرارات التفويض، وليس تسريب بيانات فعلياً. سُجلت ${historicalEvidence.conformanceFailures} إخفاقات في مطابقة العقد في كل تجربة، منها خلل تتبع المصدر وصيغة الرد على طريقة طلب غير صحيحة.`,
                  )}
                </p>
                <p className="text-caption leading-5 text-fg-tertiary">
                  {e('Conformance source', 'مصدر مطابقة العقد')}: {historicalEvidence.source} ·{' '}
                  {historicalEvidence.generatedAt}
                </p>
                <p className="text-caption text-fg-tertiary">
                  {e('Evidence scope', 'نطاق الأدلة')}:{' '}
                  {e(
                    `live HTTP · synthetic requests · ${historicalEvidence.runs} repetitions · ${historicalEvidence.verifiedPerRun}/${historicalEvidence.attacksPerRun} verified per run`,
                    `HTTP مباشر · طلبات اصطناعية · ${historicalEvidence.runs} تكرارات · ${historicalEvidence.verifiedPerRun} من ${historicalEvidence.attacksPerRun} موثقة في كل تجربة`,
                  )}
                </p>
                <p className="text-label leading-6 text-fg-secondary">
                  {e(
                    'The same synthetic fixtures were repeated, not independent customer cohorts. The attack and conformance reports share the same attack fixture cohort.',
                    'تكررت البيانات الاصطناعية نفسها، وليست مجموعات عملاء مستقلة. يستخدم تقريرا الهجمات ومطابقة العقد مجموعة بيانات الهجمات نفسها.',
                  )}
                </p>
              </div>
            </Panel>
            <Panel
              title={e('Model results have a different scope', 'نتائج النموذج لها نطاق مختلف')}
            >
              <div className="space-y-3 p-5">
                <p className="text-body leading-6 text-fg-secondary">
                  {e(
                    `The accompanying reference-model report used ${historicalEvidence.model} with synthetic fixtures. It recorded ${evidenceSnapshot.model.extraction.correct}/${evidenceSnapshot.model.extraction.total} extracted fields and ${evidenceSnapshot.model.summary.correct}/${evidenceSnapshot.model.summary.total} required summary facts across ${evidenceSnapshot.model.runs} runs.`,
                    `استخدم تقرير النموذج المرجعي المصاحب ${historicalEvidence.model} مع بيانات اصطناعية. وسجل ${evidenceSnapshot.model.extraction.correct} من ${evidenceSnapshot.model.extraction.total} حقلاً مستخرجاً و${evidenceSnapshot.model.summary.correct} من ${evidenceSnapshot.model.summary.total} حقيقة ملخص مطلوبة عبر ${evidenceSnapshot.model.runs} تجارب.`,
                  )}
                </p>
                <p className="rounded-xl bg-warning-soft p-4 text-body leading-6 text-warning">
                  {e(
                    'Production app prompt parity was not measured. The harness used reference prompts; these results do not validate the current app’s AI prompts or production security.',
                    'لم يُقَس التطابق مع تعليمات تطبيق الإنتاج. استخدمت أداة التقييم تعليمات مرجعية، لذا لا تؤكد النتائج تعليمات الذكاء الاصطناعي الحالية أو أمن الإنتاج.',
                  )}
                </p>
                <Button variant="secondary" icon={<FileSearch />} onClick={() => setSources(true)}>
                  {e('Inspect source and run labels', 'فحص المصادر وبيانات التجارب')}
                </Button>
              </div>
            </Panel>
          </div>
        )}
      </div>
      {detail && (
        <Modal
          title={e('Recorded demo check', 'عملية تحقق تجريبية مسجلة')}
          description={
            state.hires[detail.caseId]?.fullName ??
            state.companies[detail.caseId]?.name ??
            detail.caseId
          }
          onClose={() => setDetail(null)}
        >
          <dl className="space-y-4">
            <div>
              <dt className="text-caption text-fg-tertiary">{e('Decision', 'القرار')}</dt>
              <dd className="mt-1 text-body">{decisionLabel(detail.decision)}</dd>
            </div>
            <div>
              <dt className="text-caption text-fg-tertiary">{e('Reason', 'السبب')}</dt>
              <dd className="mt-1 text-body leading-6">{detail.reason}</dd>
            </div>
            <div>
              <dt className="text-caption text-fg-tertiary">{e('Destination', 'الوجهة')}</dt>
              <dd className="mt-1 text-body">{destinationLabel(detail.destination)}</dd>
            </div>
            <div>
              <dt className="text-caption text-fg-tertiary">
                {e('Data categories that stopped the flow', 'فئات البيانات التي أوقفت المسار')}
              </dt>
              <dd className="mt-1 text-body">
                {detail.blockedLabels.length
                  ? detail.blockedLabels.map((label) => t(`passport.label.${label}`)).join(' · ')
                  : e('None recorded', 'لا توجد فئات مسجلة')}
              </dd>
            </div>
            <div className="grid gap-3 rounded-xl bg-subtle p-4 sm:grid-cols-2">
              <div>
                <dt className="text-caption text-fg-tertiary">
                  {e('Policy rule', 'قاعدة السياسة')}
                </dt>
                <dd className="mt-1 break-all font-mono text-caption">{detail.policyRule}</dd>
              </div>
              <div>
                <dt className="text-caption text-fg-tertiary">{e('Tool', 'الأداة')}</dt>
                <dd className="mt-1 break-all font-mono text-caption">{detail.tool}</dd>
              </div>
            </div>
          </dl>
          <div className="mt-5 flex justify-end">
            <Button variant="secondary" onClick={() => setDetail(null)}>
              {e('Close', 'إغلاق')}
            </Button>
          </div>
        </Modal>
      )}
      {sources && (
        <Modal
          title={e('Evidence source and scope', 'مصدر الأدلة ونطاقها')}
          description={e(
            'Historical evaluation workspace snapshot. No current evaluation was run by this page.',
            'لقطة تاريخية لمساحة التقييم. لم تُشغّل هذه الصفحة تقييماً حالياً.',
          )}
          onClose={() => setSources(false)}
        >
          <dl className="space-y-4 text-body">
            <div>
              <dt className="text-caption text-fg-tertiary">
                {e('Trust aggregate snapshot', 'لقطة التقرير المجمع للثقة')}
              </dt>
              <dd className="mt-1 break-all font-mono text-caption">
                {evidenceSnapshot.trust.source} · {evidenceSnapshot.trust.generatedAt}
              </dd>
              <dd className="mt-2 break-all font-mono text-caption text-fg-tertiary">
                SHA-256: {evidenceSnapshot.trust.sha256}
              </dd>
              <dd className="mt-2 text-label text-danger">
                {e('Failed · incomplete evidence', 'فشل · الأدلة غير مكتملة')}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-fg-tertiary">{e('Guard source', 'مصدر الحماية')}</dt>
              <dd className="mt-1 break-all font-mono text-caption">{historicalEvidence.source}</dd>
              <dd className="mt-2 break-all font-mono text-caption text-fg-tertiary">
                SHA-256: {evidenceSnapshot.guard.sha256}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-fg-tertiary">
                {e('Guard run', 'وقت تشغيل الحماية')}
              </dt>
              <dd className="mt-1">{historicalEvidence.generatedAt}</dd>
            </div>
            <div>
              <dt className="text-caption text-fg-tertiary">
                {e('Contract / upstream', 'العقد / النسخة المرجعية')}
              </dt>
              <dd className="mt-1 break-all font-mono text-caption">
                {historicalEvidence.contract} / {historicalEvidence.upstream}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-fg-tertiary">
                {e('Reference model source', 'مصدر النموذج المرجعي')}
              </dt>
              <dd className="mt-1 break-all font-mono text-caption">
                {historicalEvidence.modelSource}
              </dd>
              <dd className="mt-2 break-all font-mono text-caption text-fg-tertiary">
                SHA-256: {evidenceSnapshot.model.sha256}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-fg-tertiary">
                {e('Model / report time', 'النموذج / وقت التقرير')}
              </dt>
              <dd className="mt-1 text-label">
                {historicalEvidence.model} / {historicalEvidence.modelGeneratedAt}
              </dd>
            </div>
            <div className="rounded-xl bg-warning-soft p-4 text-label leading-6 text-warning">
              {e(
                `The web application and production prompts were outside measured parity. The Guard failure is unresolved in this evidence snapshot. Evaluated contract ${evidenceSnapshot.trust.evaluatedContract} differs from main contract ${evidenceSnapshot.trust.mainContractAtSnapshot} at the time of the snapshot.`,
                `كان تطبيق الويب وتعليمات الإنتاج خارج نطاق قياس التطابق. خلل الحماية غير محلول في لقطة الأدلة هذه. يختلف العقد المقيّم ${evidenceSnapshot.trust.evaluatedContract} عن العقد الرئيسي ${evidenceSnapshot.trust.mainContractAtSnapshot} في وقت اللقطة.`,
              )}
            </div>
          </dl>
        </Modal>
      )}
    </>
  );
}
