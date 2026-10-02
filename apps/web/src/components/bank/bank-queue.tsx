'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowUpRight, Download, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Illustration } from '@/components/ui/illustration';
import type { Application, Locale } from '@/domain/types';
import { useI18n } from '@/lib/i18n/provider';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useAppState } from '@/store/provider';
import {
  applicationLabel,
  applicationTone,
  bankApplications,
  bankText,
  consentGaps,
  initials,
  OPEN_STATES,
} from './bank-data';
import { BankHeader } from './bank-header';

const FILTER_STATES: Application['state'][] = [
  'submitted',
  'under_review',
  'needs_info',
  'approved',
  'declined',
];
type QueueStatus = Application['state'] | 'all' | 'open' | 'follow_up';
const inputClass = 'h-10 rounded-md border border-line-strong bg-surface px-3 text-body text-fg';

function csvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function BankQueuePage({
  employerId,
  initialStatus,
}: {
  employerId?: string;
  initialStatus?: string;
}) {
  const { locale } = useI18n();
  return (
    <>
      <BankHeader
        title={bankText(locale, 'Account applications', 'طلبات الحسابات')}
        description={bankText(
          locale,
          'One review queue, with the evidence and permission behind every application.',
          'قائمة مراجعة واحدة مع الأدلة والأذونات لكل طلب.',
        )}
      />
      <div className="p-5 sm:p-7">
        <BankQueue employerId={employerId} initialStatus={initialStatus} />
      </div>
    </>
  );
}

export function BankQueue({
  employerId,
  initialStatus,
  compact = false,
}: {
  employerId?: string;
  initialStatus?: string;
  compact?: boolean;
}) {
  const state = useAppState();
  const { locale } = useI18n();
  const text = (en: string, ar: string) => bankText(locale, en, ar);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<QueueStatus>(
    (['open', 'follow_up', ...FILTER_STATES] as QueueStatus[]).find(
      (item) => item === initialStatus,
    ) ?? 'all',
  );
  const [employer, setEmployer] = useState(employerId ?? 'all');
  const [risk, setRisk] = useState('all');
  const [sort, setSort] = useState('newest');
  const [notice, setNotice] = useState('');
  const applications = bankApplications(state);
  const visible = useMemo(
    () =>
      applications
        .filter((application) => {
          const hire = state.hires[application.hireId];
          const company = hire ? state.employers[hire.employerId] : undefined;
          const searchable =
            `${hire?.fullName} ${hire?.role} ${company?.name} ${application.id}`.toLowerCase();
          const matchesStatus =
            status === 'all' ||
            (status === 'open'
              ? OPEN_STATES.includes(application.state)
              : status === 'follow_up'
                ? OPEN_STATES.includes(application.state) &&
                  (application.state === 'needs_info' || consentGaps(state, application).length > 0)
                : application.state === status);
          return (
            searchable.includes(query.toLowerCase().trim()) &&
            matchesStatus &&
            (employer === 'all' || hire?.employerId === employer) &&
            (risk === 'all' ||
              (!consentGaps(state, application).length && application.risk?.level === risk))
          );
        })
        .sort((a, b) =>
          sort === 'oldest'
            ? (a.submittedAt ?? '').localeCompare(b.submittedAt ?? '')
            : (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''),
        ),
    [applications, state, query, status, employer, risk, sort],
  );

  function clearFilters() {
    setQuery('');
    setStatus('all');
    setEmployer('all');
    setRisk('all');
  }
  function exportQueue() {
    const rows = [
      ['Application', 'Applicant', 'Employer', 'Status', 'Risk summary', 'Submitted at'],
      ...visible.map((application) => {
        const hire = state.hires[application.hireId];
        return [
          application.id,
          hire?.fullName ?? '',
          state.employers[hire?.employerId ?? '']?.name ?? '',
          application.state,
          consentGaps(state, application).length
            ? 'Current permission required'
            : (application.risk?.level ?? 'No summary'),
          application.submittedAt ?? '',
        ];
      }),
    ];
    const blob = new Blob(['\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'rasikh-bank-queue.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice(
      text(
        'Queue downloaded. Document contents and salary values are excluded.',
        'تم تنزيل القائمة دون محتويات المستندات أو قيم الرواتب.',
      ),
    );
  }

  return (
    <section aria-labelledby="bank-queue-title" className="min-w-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="bank-queue-title" className="text-title font-medium">
            {text(
              compact ? 'Application queue' : 'All applications',
              compact ? 'قائمة الطلبات' : 'جميع الطلبات',
            )}{' '}
            <span className="ms-2 text-body font-normal text-fg-tertiary">
              {applications.length}
            </span>
          </h2>
          <p className="mt-1 text-label text-fg-secondary">
            {text(
              'Applications awaiting newcomer permission stay outside this queue.',
              'لا تظهر الطلبات التي تنتظر إذن الوافد في هذه القائمة.',
            )}
          </p>
        </div>
        <Button
          variant="secondary"
          icon={<Download />}
          onClick={exportQueue}
          disabled={!visible.length}
        >
          {text('Export queue', 'تصدير القائمة')}
        </Button>
      </div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex min-w-[180px] flex-1 flex-col gap-1.5 text-label text-fg-secondary">
          <span>{text('Search applications', 'البحث في الطلبات')}</span>
          <span className="relative block">
            <Search
              aria-hidden
              className="pointer-events-none absolute start-3 top-3 size-4 text-fg-tertiary"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={cn(inputClass, 'w-full ps-9')}
              placeholder={text('Name, employer or reference', 'الاسم أو جهة العمل أو المرجع')}
            />
          </span>
        </label>
        <label className="flex min-w-[160px] flex-col gap-1.5 text-label text-fg-secondary">
          <span>{text('Employer', 'جهة العمل')}</span>
          <select
            className={inputClass}
            value={employer}
            onChange={(event) => setEmployer(event.target.value)}
          >
            <option value="all">{text('All employers', 'كل جهات العمل')}</option>
            {Object.values(state.employers).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        {!compact ? (
          <label className="flex min-w-[140px] flex-col gap-1.5 text-label text-fg-secondary">
            <span>{text('Risk summary', 'ملخص المخاطر')}</span>
            <select
              className={inputClass}
              value={risk}
              onChange={(event) => setRisk(event.target.value)}
            >
              <option value="all">{text('All summaries', 'كل الملخصات')}</option>
              <option value="low">{text('Low', 'منخفضة')}</option>
              <option value="moderate">{text('Moderate', 'متوسطة')}</option>
              <option value="elevated">{text('Elevated', 'مرتفعة')}</option>
            </select>
          </label>
        ) : null}
        <label className="flex min-w-[145px] flex-col gap-1.5 text-label text-fg-secondary">
          <span>{text('Sort by', 'ترتيب حسب')}</span>
          <select
            className={inputClass}
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="newest">{text('Newest first', 'الأحدث أولاً')}</option>
            <option value="oldest">{text('Oldest first', 'الأقدم أولاً')}</option>
          </select>
        </label>
      </div>
      <div
        className="mb-4 flex flex-wrap gap-1.5"
        role="group"
        aria-label={text('Filter by status', 'تصفية حسب الحالة')}
      >
        {(['all', 'open', 'follow_up', ...FILTER_STATES] as const).map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={status === item}
            onClick={() => setStatus(item)}
            className={cn(
              'inline-flex h-8 items-center gap-2 rounded-full px-3 text-label transition-colors',
              status === item
                ? 'bg-accent-soft font-medium text-accent'
                : 'text-fg-secondary hover:bg-subtle',
            )}
          >
            <span>
              {item === 'all'
                ? text('All', 'الكل')
                : item === 'open'
                  ? text('Awaiting decision', 'بانتظار القرار')
                  : item === 'follow_up'
                    ? text('Follow-up', 'متابعة')
                    : applicationLabel(item, locale)}
            </span>
            <span className="text-caption opacity-80">
              {item === 'all'
                ? applications.length
                : applications.filter((application) =>
                    item === 'open'
                      ? OPEN_STATES.includes(application.state)
                      : item === 'follow_up'
                        ? OPEN_STATES.includes(application.state) &&
                          (application.state === 'needs_info' ||
                            consentGaps(state, application).length > 0)
                        : application.state === item,
                  ).length}
            </span>
          </button>
        ))}
      </div>
      {notice ? (
        <p
          role="status"
          className="mb-3 rounded-md bg-accent-soft px-3 py-2 text-label text-accent"
        >
          {notice}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-line">
        <ul className="divide-y divide-line md:hidden">
          {visible.map((application) => {
            const hire = state.hires[application.hireId];
            if (!hire) return null;
            const gaps = consentGaps(state, application);
            return (
              <li key={application.id}>
                <Link
                  href={`/bank/applications/${application.id}`}
                  className="block px-4 py-4 hover:bg-subtle/70"
                >
                  <span className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-caption font-semibold text-accent"
                    >
                      {initials(hire.fullName)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{hire.fullName}</span>
                      <span className="mt-0.5 block text-caption text-fg-tertiary">
                        {hire.role} · {state.employers[hire.employerId]?.name}
                      </span>
                    </span>
                    <Badge tone={applicationTone(application.state)}>
                      {applicationLabel(application.state, locale)}
                    </Badge>
                  </span>
                  <span className="mt-3 flex items-end justify-between gap-3">
                    <ReviewSignals application={application} gaps={gaps.length} locale={locale} />
                    <span className="shrink-0 text-caption text-fg-secondary">
                      {application.submittedAt ? formatDate(application.submittedAt, locale) : '—'}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <table className="hidden w-full min-w-[740px] border-collapse text-body md:table">
          <caption className="sr-only">
            {text('Bank account application queue', 'قائمة طلبات الحساب البنكي')}
          </caption>
          <thead className="bg-subtle text-start text-label text-fg-tertiary">
            <tr>
              {[
                text('Applicant', 'مقدم الطلب'),
                text('Employer', 'جهة العمل'),
                text('Status', 'الحالة'),
                text('Review signals', 'مؤشرات المراجعة'),
                text('Received', 'تاريخ الاستلام'),
                text('Open', 'فتح'),
              ].map((label) => (
                <th key={label} scope="col" className="px-4 py-2.5 text-start font-medium">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((application) => {
              const hire = state.hires[application.hireId];
              if (!hire) return null;
              const gaps = consentGaps(state, application);
              return (
                <tr key={application.id} className="border-t border-line hover:bg-subtle/70">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-caption font-semibold text-accent"
                      >
                        {initials(hire.fullName)}
                      </span>
                      <div>
                        <Link
                          href={`/bank/applications/${application.id}`}
                          className="font-medium hover:text-accent hover:underline"
                        >
                          {hire.fullName}
                        </Link>
                        <p className="mt-0.5 text-caption text-fg-tertiary">{hire.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[180px] px-4 py-4 text-label text-fg-secondary">
                    {state.employers[hire.employerId]?.name}
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={applicationTone(application.state)}>
                      {applicationLabel(application.state, locale)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <ReviewSignals application={application} gaps={gaps.length} locale={locale} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-label text-fg-secondary">
                    {application.submittedAt ? formatDate(application.submittedAt, locale) : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/bank/applications/${application.id}`}
                      aria-label={`${text('Review', 'مراجعة')} ${hire.fullName}`}
                      className="flex size-8 items-center justify-center rounded-md text-fg-secondary hover:bg-hover hover:text-accent"
                    >
                      <ArrowUpRight aria-hidden className="size-4 rtl:-scale-x-100" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!visible.length ? (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            {!applications.length ? (
              <Illustration
                variant="empty-bank-applications"
                decorative
                className="max-w-[180px]"
              />
            ) : (
              <SlidersHorizontal aria-hidden className="size-6 text-fg-tertiary" />
            )}
            <h3 className="text-title font-medium">
              {!applications.length
                ? text(
                    'No submitted account applications yet',
                    'لا توجد طلبات حسابات مقدمة حتى الآن',
                  )
                : employer !== 'all' &&
                    !applications.some(
                      (application) => state.hires[application.hireId]?.employerId === employer,
                    )
                  ? text(
                      'No submitted applications for this employer',
                      'لا توجد طلبات مقدمة لجهة العمل هذه',
                    )
                  : text('No matching applications', 'لا توجد طلبات مطابقة')}
            </h3>
            <p className="text-body text-fg-secondary">
              {!applications.length
                ? text(
                    'Applications appear after the newcomer approves the bank disclosure.',
                    'تظهر الطلبات بعد موافقة الوافد على الإفصاح البنكي.',
                  )
                : text(
                    'Try another name, employer or review status.',
                    'جرّب اسماً أو جهة عمل أو حالة مراجعة أخرى.',
                  )}
            </p>
            {applications.length ? (
              <Button variant="secondary" onClick={clearFilters}>
                {text('Clear filters', 'مسح عوامل التصفية')}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      <p className="mt-3 text-caption text-fg-tertiary">
        {text(
          `${visible.length} of ${applications.length} applications · Fictional organisations and estimated figures`,
          `${visible.length} من ${applications.length} طلبات · جهات خيالية وقيم تقديرية`,
        )}
      </p>
    </section>
  );
}

function ReviewSignals({
  application,
  gaps,
  locale,
}: {
  application: Application;
  gaps: number;
  locale: Locale;
}) {
  const text = (en: string, ar: string) => bankText(locale, en, ar);
  return (
    <div className="space-y-1 text-label">
      <span className="flex items-center gap-1.5 text-accent">
        <ShieldCheck aria-hidden className="size-3.5" />
        {application.employerBacked
          ? text('Employer backed', 'بدعم جهة العمل')
          : text('No employer backing', 'دون دعم جهة العمل')}
      </span>
      <p className="text-caption text-fg-tertiary">
        {gaps
          ? text('Current permission needs attention', 'الإذن الحالي يحتاج إلى متابعة')
          : application.risk?.level === 'low'
            ? text('Low risk · written summary', 'مخاطر منخفضة · ملخص مكتوب')
            : application.risk
              ? text('Written risk summary', 'ملخص مخاطر مكتوب')
              : text('Officer decision on file', 'قرار الموظف مسجل')}
      </p>
    </div>
  );
}
