'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Download, ListFilter, Plus, Search, ShieldCheck, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { demoNow } from '@/domain/clock';
import { STEP_KEYS } from '@/domain/types';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { useAppState, useConnection } from '@/store/provider';
import {
  EmployerHeader,
  Feedback,
  HireStatusBadge,
  Initials,
  inputClass,
  Panel,
  Progress,
  StepName,
  useEmployerAction,
  useEmployerCopy,
} from './common';
import { NewHireDialog } from './new-hire';
import { csvCell, filterPipeline, pipelineRows } from './pipeline-model';
import { EmployerScopePicker, useEmployerScope } from './scope';

export function EmployerHires() {
  const state = useAppState();
  const connection = useConnection();
  const { employerId, employer } = useEmployerScope();
  const { e, locale, t } = useEmployerCopy();
  const params = useSearchParams();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(params.get('status') ?? 'all');
  const [stage, setStage] = useState(params.get('stage') ?? 'all');
  const [stageGroup, setStageGroup] = useState(params.get('stageGroup') ?? '');
  const [backing, setBacking] = useState('all');
  const [origin, setOrigin] = useState('all');
  const [sort, setSort] = useState<'name' | 'start' | 'days'>('start');
  const [ascending, setAscending] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const action = useEmployerAction();
  const allRows = pipelineRows(state, employerId, demoNow(state));
  const rows = filterPipeline(allRows, { search, status, stage, stageGroup, backing, origin }).sort(
    (a, b) =>
      (sort === 'name'
        ? a.hire.fullName.localeCompare(b.hire.fullName)
        : sort === 'start'
          ? a.hire.startDate.localeCompare(b.hire.startDate)
          : a.days - b.days) * (ascending ? 1 : -1),
  );
  const visibleSelected = rows.filter((row) => selected.has(row.hire.id));
  const origins = [...new Set(allRows.map((row) => row.hire.originCountry))].sort();
  const filtersActive = Boolean(
    search ||
    status !== 'all' ||
    stage !== 'all' ||
    stageGroup ||
    backing !== 'all' ||
    origin !== 'all',
  );
  const reset = () => {
    setSearch('');
    setStatus('all');
    setStage('all');
    setStageGroup('');
    setBacking('all');
    setOrigin('all');
  };
  const sortBy = (key: typeof sort) => {
    setAscending(sort === key ? !ascending : true);
    setSort(key);
  };
  const toggle = (id: string) =>
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const exportRows = () => {
    const csv = [
      [
        'Name',
        'Role',
        'Department',
        'Origin',
        'Stage',
        'Status',
        'Start date',
        'Days in relocation',
      ],
      ...rows.map((row) => [
        row.hire.fullName,
        row.hire.role,
        row.hire.department,
        row.hire.originCountry,
        row.current?.title ?? 'Settled',
        row.status,
        row.hire.startDate,
        row.days,
      ]),
    ]
      .map((row) => row.map(csvCell).join(','))
      .join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `rasikh-${employerId}-pipeline.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const statuses = [
    { value: 'all', label: e('All hires', 'كل الموظفين') },
    { value: 'attention', label: e('Needs attention', 'يحتاج إلى متابعة') },
    { value: 'on_track', label: e('On track', 'على المسار') },
    { value: 'waiting', label: e('Waiting', 'بانتظار الرد') },
    { value: 'blocked', label: e('Blocked', 'متعثر') },
    { value: 'settled', label: e('Settled', 'مستقر') },
  ];
  return (
    <>
      <EmployerHeader
        eyebrow={e('From arrival to belonging', 'من الوصول إلى الاستقرار')}
        title={e('Your people, in motion', 'فريقك، في رحلة الانتقال')}
        description={e(
          'Follow every journey. Spot the next task. Help people settle sooner.',
          'تابع كل رحلة. حدد المهمة التالية. ساعد فريقك على الاستقرار.',
        )}
        actions={
          <>
            <Button
              variant="secondary"
              icon={<Download />}
              onClick={exportRows}
              disabled={!rows.length}
            >
              {e('Export view', 'تصدير العرض')}
            </Button>
            <Button icon={<Plus />} onClick={() => setAdding(true)}>
              {e('Add a hire', 'إضافة موظف')}
            </Button>
          </>
        }
      />
      <div className="space-y-5 p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <EmployerScopePicker />
          <Badge shape="pill" tone={connection === 'live' ? 'accent' : 'warning'}>
            {connection === 'live'
              ? e('Shared demo connected', 'العرض التجريبي متصل')
              : connection === 'offline'
                ? e('Connection interrupted', 'الاتصال منقطع')
                : e('Connecting to shared demo', 'جارٍ الاتصال بالعرض التجريبي')}
          </Badge>
        </div>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={e('Filter by status', 'تصفية حسب الحالة')}
        >
          {statuses.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={status === option.value}
              onClick={() => {
                setStatus(option.value);
                setStageGroup('');
              }}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-label font-medium transition-colors ${status === option.value ? 'border-accent bg-accent-soft text-accent' : 'border-edge bg-surface text-fg-secondary hover:bg-hover'}`}
            >
              {option.label}
              <span className="text-caption tabular-nums opacity-75">
                {option.value === 'all'
                  ? allRows.length
                  : option.value === 'attention'
                    ? allRows.filter((row) =>
                        row.steps.some(
                          (step) => step.status === 'blocked' || step.status === 'needs_approval',
                        ),
                      ).length
                    : allRows.filter((row) => row.status === option.value).length}
              </span>
            </button>
          ))}
        </div>
        <Panel>
          <div className="space-y-3 border-b border-line p-4">
            <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
              <label className="relative">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute start-3 top-3.5 size-4 text-fg-tertiary"
                />
                <span className="sr-only">{e('Search hires', 'البحث عن موظف')}</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={e('Search name, role, city…', 'ابحث بالاسم أو الوظيفة أو المدينة…')}
                  className={`${inputClass} ps-9`}
                />
              </label>
              <label>
                <span className="sr-only">{e('Stage', 'المرحلة')}</span>
                <select
                  aria-label={e('Stage', 'المرحلة')}
                  value={stage}
                  onChange={(event) => {
                    setStage(event.target.value);
                    setStageGroup('');
                  }}
                  className={inputClass}
                >
                  <option value="all">{e('All stages', 'كل المراحل')}</option>
                  {STEP_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {t(`step.${key}.short`)}
                    </option>
                  ))}
                  <option value="settled">{e('Settled', 'مستقر')}</option>
                </select>
              </label>
              <label>
                <span className="sr-only">{e('Employer backing', 'دعم صاحب العمل')}</span>
                <select
                  value={backing}
                  onChange={(event) => setBacking(event.target.value)}
                  className={inputClass}
                >
                  <option value="all">{e('All backing', 'جميع حالات الدعم')}</option>
                  <option value="backed">{e('Employer backed', 'مدعوم من صاحب العمل')}</option>
                  <option value="none">{e('Not backed yet', 'لم يحصل على الدعم')}</option>
                </select>
              </label>
              <label>
                <span className="sr-only">{e('Origin country', 'بلد المنشأ')}</span>
                <select
                  value={origin}
                  onChange={(event) => setOrigin(event.target.value)}
                  className={inputClass}
                >
                  <option value="all">{e('All origins', 'كل البلدان')}</option>
                  {origins.map((country) => (
                    <option key={country}>{country}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-label">
              <span className="inline-flex items-center gap-2 text-fg-tertiary">
                <ListFilter aria-hidden className="size-3.5" />
                {e(
                  `Showing ${rows.length} of ${allRows.length} hires`,
                  `عرض ${rows.length} من ${allRows.length} موظفين`,
                )}
              </span>
              {filtersActive && (
                <Button size="sm" variant="ghost" icon={<X />} onClick={reset}>
                  {e('Clear filters', 'مسح التصفية')}
                </Button>
              )}
            </div>
            {visibleSelected.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl bg-accent-soft p-3">
                <p className="text-label font-medium text-accent">
                  {e(`${visibleSelected.length} selected`, `تم اختيار ${visibleSelected.length}`)}
                </p>
                <Button
                  size="sm"
                  icon={<ShieldCheck />}
                  disabled={action.busy}
                  onClick={async () => {
                    const ok = await action.run(
                      visibleSelected.map((row) => ({
                        type: 'hire.back' as const,
                        hireId: row.hire.id,
                        employerId,
                        backed: true,
                        by: employer?.hrContact.name ?? 'Employer',
                      })),
                      e(
                        'Employer backing saved for the selected hires.',
                        'تم حفظ دعم صاحب العمل للموظفين المختارين.',
                      ),
                    );
                    if (ok) setSelected(new Set());
                  }}
                >
                  {e('Back selected hires', 'دعم الموظفين المختارين')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                  {e('Clear selection', 'إلغاء الاختيار')}
                </Button>
              </div>
            )}
            <Feedback action={action} />
          </div>
          {rows.length ? (
            <>
              <div className="hidden overflow-x-auto md:block">
                <Table className="min-w-[900px]">
                  <caption className="sr-only">
                    {e('Hire relocation pipeline', 'مسار انتقال الموظفين')}
                  </caption>
                  <thead>
                    <tr>
                      <Th className="w-10">
                        <input
                          type="checkbox"
                          aria-label={e(
                            'Select all visible hires',
                            'اختيار جميع الموظفين الظاهرين',
                          )}
                          checked={rows.length > 0 && visibleSelected.length === rows.length}
                          onChange={(event) =>
                            setSelected(
                              event.target.checked
                                ? new Set(rows.map((row) => row.hire.id))
                                : new Set(),
                            )
                          }
                          className="size-4 accent-accent"
                        />
                      </Th>
                      <Th
                        sort={sort === 'name' ? (ascending ? 'asc' : 'desc') : 'none'}
                        onSort={() => sortBy('name')}
                      >
                        {e('Person', 'الموظف')}
                      </Th>
                      <Th>{e('Journey', 'الرحلة')}</Th>
                      <Th>{e('Status', 'الحالة')}</Th>
                      <Th
                        sort={sort === 'start' ? (ascending ? 'asc' : 'desc') : 'none'}
                        onSort={() => sortBy('start')}
                      >
                        {e('Starts work', 'بدء العمل')}
                      </Th>
                      <Th
                        align="end"
                        sort={sort === 'days' ? (ascending ? 'asc' : 'desc') : 'none'}
                        onSort={() => sortBy('days')}
                      >
                        {e('Days', 'الأيام')}
                      </Th>
                      <Th>
                        <span className="sr-only">{e('Open record', 'فتح السجل')}</span>
                      </Th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <Tr
                        key={row.hire.id}
                        className={cn(
                          '!h-20',
                          row.steps.some((step) => step.status === 'blocked')
                            ? 'bg-danger-soft/40'
                            : row.steps.some((step) => step.status === 'needs_approval')
                              ? 'bg-warning-soft/40'
                              : '',
                        )}
                      >
                        <Td>
                          <input
                            type="checkbox"
                            aria-label={e(
                              `Select ${row.hire.fullName}`,
                              `اختيار ${row.hire.fullName}`,
                            )}
                            checked={selected.has(row.hire.id)}
                            onChange={() => toggle(row.hire.id)}
                            className="size-4 accent-accent"
                          />
                        </Td>
                        <Td>
                          <div className="flex items-center gap-3">
                            <Initials name={row.hire.fullName} />
                            <div>
                              <Link
                                href={`/employer/hires/${row.hire.id}`}
                                className="font-medium text-fg hover:text-accent"
                              >
                                {row.hire.fullName}
                              </Link>
                              <p className="mt-1 text-caption text-fg-tertiary">
                                {row.hire.role} · {row.hire.originCity}
                              </p>
                            </div>
                          </div>
                        </Td>
                        <Td className="min-w-44">
                          <p className="mb-2 text-label capitalize">
                            {row.current ? (
                              <StepName stepKey={row.current.key} />
                            ) : (
                              e('Settled', 'مستقر')
                            )}
                          </p>
                          <Progress
                            done={row.done}
                            total={row.steps.length}
                            label={e(
                              `${row.done} of ${row.steps.length} steps complete`,
                              `${row.done} من ${row.steps.length} خطوات مكتملة`,
                            )}
                          />
                        </Td>
                        <Td>
                          <HireStatusBadge status={row.status} />
                          <p className="mt-1.5 text-caption text-fg-tertiary">
                            {row.hire.backing.status === 'backed'
                              ? e('Employer backed', 'مدعوم من صاحب العمل')
                              : e('Not backed', 'غير مدعوم')}
                          </p>
                        </Td>
                        <Td className="whitespace-nowrap text-label">
                          {formatDate(row.hire.startDate, locale)}
                        </Td>
                        <Td align="end" className="tabular-nums">
                          {row.days}
                        </Td>
                        <Td>
                          <Link
                            href={`/employer/hires/${row.hire.id}`}
                            aria-label={e(
                              `Open ${row.hire.fullName}`,
                              `فتح سجل ${row.hire.fullName}`,
                            )}
                            className="flex size-9 items-center justify-center rounded-lg text-accent hover:bg-accent-soft"
                          >
                            <ArrowRight aria-hidden className="size-4 rtl:-scale-x-100" />
                          </Link>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <ul className="divide-y divide-line md:hidden">
                {rows.map((row) => (
                  <li key={row.hire.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Initials name={row.hire.fullName} />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/employer/hires/${row.hire.id}`}
                          className="text-body font-medium"
                        >
                          {row.hire.fullName}
                        </Link>
                        <p className="mt-1 text-label text-fg-tertiary">{row.hire.role}</p>
                      </div>
                      <HireStatusBadge status={row.status} />
                    </div>
                    <div className="mt-4">
                      <Progress
                        done={row.done}
                        total={row.steps.length}
                        label={
                          row.current ? t(`step.${row.current.key}.short`) : e('Settled', 'مستقر')
                        }
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-label text-fg-secondary">
                      <span>{formatDate(row.hire.startDate, locale)}</span>
                      <Link
                        className="inline-flex min-h-9 items-center gap-2 text-accent"
                        href={`/employer/hires/${row.hire.id}`}
                      >
                        {e('View journey', 'عرض الرحلة')}
                        <ArrowRight aria-hidden className="size-4 rtl:-scale-x-100" />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="px-6 py-16 text-center">
              <UsersEmpty />
              <h2 className="mt-4 text-title font-medium">
                {allRows.length
                  ? e('No journeys match these filters', 'لا توجد رحلات تطابق هذه التصفية')
                  : e('Your next hire starts here', 'رحلة موظفك القادم تبدأ هنا')}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-body leading-6 text-fg-tertiary">
                {allRows.length
                  ? e(
                      'Try another name or clear the filters to see your team.',
                      'جرّب اسماً آخر أو امسح التصفية لعرض فريقك.',
                    )
                  : e(
                      'Add a person to create their roadmap and begin their move.',
                      'أضف موظفاً لإنشاء خارطة انتقاله وبدء رحلته.',
                    )}
              </p>
              <Button
                className="mt-5"
                variant={allRows.length ? 'secondary' : 'primary'}
                onClick={allRows.length ? reset : () => setAdding(true)}
              >
                {allRows.length ? e('Clear filters', 'مسح التصفية') : e('Add a hire', 'إضافة موظف')}
              </Button>
            </div>
          )}
        </Panel>
        <p className="text-caption text-fg-tertiary">
          {e(
            'Dates follow the demo clock. People and figures are illustrative.',
            'تعتمد التواريخ على الوقت التجريبي. الأشخاص والأرقام توضيحية.',
          )}
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

function UsersEmpty() {
  return (
    <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
      <Search aria-hidden className="size-6" />
    </span>
  );
}
