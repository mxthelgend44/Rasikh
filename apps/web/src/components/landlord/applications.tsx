'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Check,
  CircleDot,
  FileText,
  LockKeyhole,
  Minus,
  ShieldAlert,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { useAppState } from '@/store/provider';
import type { Application, Decision, RiskPoint, RiskSummary } from '@/domain/types';
import { formatAed, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { policyFor } from '@/domain/policy';
import { recordText } from './content';
import { PropertyIllustration } from './illustration';
import {
  ActionLink,
  BackedChip,
  bedroomLabel,
  controlClass,
  Feedback,
  latestDecision,
  linkClass,
  RiskBadge,
  SearchField,
  SectionTitle,
  StateBadge,
  textAreaClass,
  Title,
  useLandlordLocale,
  useMutation,
  usePortfolio,
} from './shared';

export const reviewable = (application: Application) =>
  ['submitted', 'under_review', 'needs_info'].includes(application.state);

/** One place that resolves everything a list row or card shows about an application. */
function useRowModel() {
  const state = useAppState();
  const { locale, l } = useLandlordLocale();
  return (application: Application) => {
    const hire = state.hires[application.hireId];
    const property = application.propertyId ? state.properties[application.propertyId] : undefined;
    const disclosed = application.state !== 'awaiting_approval';
    return {
      hire,
      property,
      disclosed,
      name: disclosed
        ? (hire?.fullName ?? l('Applicant unavailable', 'المتقدم غير متاح'))
        : l('Awaiting applicant approval', 'بانتظار موافقة المتقدم'),
      employer: disclosed
        ? (state.employers[hire?.employerId ?? '']?.name ??
          l('Employer not recorded', 'جهة العمل غير مسجلة'))
        : l('Details have not been released', 'لم تُشارك التفاصيل بعد'),
      unitLine: property
        ? `${l('Unit', 'الوحدة')} ${property.unit} · ${bedroomLabel(property.bedrooms, locale)}`
        : '—',
      received: application.submittedAt
        ? formatDate(application.submittedAt, locale)
        : l('Not submitted', 'لم يُرسل'),
    };
  };
}

function ApplicantMark({ name, disclosed }: { name: string; disclosed: boolean }) {
  return disclosed ? (
    <Avatar name={name} className="size-10 bg-accent-soft text-accent" />
  ) : (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-track">
      <LockKeyhole aria-hidden className="size-4 text-fg-tertiary" />
    </span>
  );
}

function AssessmentCell({ application }: { application: Application }) {
  const { l } = useLandlordLocale();
  if (application.state === 'awaiting_approval')
    return (
      <span className="text-caption text-fg-tertiary">{l('Not shared yet', 'لم تُشارك بعد')}</span>
    );
  return (
    <div className="flex flex-col items-start gap-1.5">
      {application.risk ? (
        <RiskBadge level={application.risk.level} />
      ) : (
        <span className="text-caption text-fg-tertiary">{l('No assessment', 'لا يوجد تقييم')}</span>
      )}
      <BackedChip backed={application.employerBacked} />
    </div>
  );
}

export function ApplicationRows({ applications }: { applications: Application[] }) {
  const { l } = useLandlordLocale();
  const model = useRowModel();
  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border border-edge xl:block">
        <Table>
          <thead>
            <tr>
              <Th>{l('Applicant', 'المتقدم')}</Th>
              <Th>{l('Property', 'العقار')}</Th>
              <Th>{l('Assessment', 'التقييم')}</Th>
              <Th>{l('Status', 'الحالة')}</Th>
              <Th>{l('Received', 'تاريخ الاستلام')}</Th>
              <Th>
                <span className="sr-only">{l('Open application', 'فتح الطلب')}</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => {
              const m = model(application);
              const needsYou = reviewable(application);
              return (
                <Tr key={application.id} className="h-[4.75rem]">
                  <Td className="relative">
                    {needsYou ? (
                      <span
                        aria-hidden
                        className="absolute inset-y-3 start-0 w-0.5 rounded-full bg-accent"
                      />
                    ) : null}
                    <div className="flex items-center gap-3">
                      <ApplicantMark
                        name={m.hire?.fullName ?? ''}
                        disclosed={m.disclosed && !!m.hire}
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/landlord/applications/${application.id}`}
                          className="font-medium text-fg hover:text-accent"
                        >
                          {m.name}
                        </Link>
                        <p className="mt-0.5 text-caption text-fg-tertiary">{m.employer}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <span className="text-fg">
                      {m.property?.name ?? l('Property not recorded', 'العقار غير مسجل')}
                    </span>
                    <p className="mt-0.5 text-caption text-fg-tertiary">{m.unitLine}</p>
                  </Td>
                  <Td>
                    <AssessmentCell application={application} />
                  </Td>
                  <Td>
                    <StateBadge state={application.state} />
                  </Td>
                  <Td className="whitespace-nowrap text-label text-fg-secondary">{m.received}</Td>
                  <Td>
                    <ActionLink href={`/landlord/applications/${application.id}`}>
                      {needsYou ? l('Review', 'مراجعة') : l('View', 'عرض')}
                    </ActionLink>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </div>
      <ul className="grid gap-3 md:grid-cols-2 xl:hidden">
        {applications.map((application) => {
          const m = model(application);
          const needsYou = reviewable(application);
          return (
            <li
              key={application.id}
              className={cn(
                'flex flex-col gap-3 rounded-lg border p-4',
                needsYou ? 'border-accent/40 bg-accent-soft/40' : 'border-edge',
              )}
            >
              <div className="flex items-start gap-3">
                <ApplicantMark name={m.hire?.fullName ?? ''} disclosed={m.disclosed && !!m.hire} />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/landlord/applications/${application.id}`}
                    className="font-medium text-fg hover:text-accent"
                  >
                    {m.name}
                  </Link>
                  <p className="mt-0.5 text-caption text-fg-tertiary">{m.employer}</p>
                </div>
                <StateBadge state={application.state} />
              </div>
              <div>
                <p className="text-body text-fg">
                  {m.property?.name ?? l('Property not recorded', 'العقار غير مسجل')}
                </p>
                <p className="mt-0.5 text-caption text-fg-tertiary">{m.unitLine}</p>
              </div>
              <AssessmentCell application={application} />
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3">
                <span className="text-label text-fg-secondary">{m.received}</span>
                <ActionLink href={`/landlord/applications/${application.id}`}>
                  {needsYou ? l('Review', 'مراجعة') : l('View', 'عرض')}
                </ActionLink>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function ApplicationsPage() {
  const { applications } = usePortfolio();
  const { l } = useLandlordLocale();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const state = useAppState();
  const rows = applications.filter((application) => {
    const property = state.properties[application.propertyId ?? ''];
    const name =
      application.state === 'awaiting_approval'
        ? ''
        : (state.hires[application.hireId]?.fullName ?? '');
    const matches = `${name} ${property?.name ?? ''} ${property?.unit ?? ''} ${application.id}`
      .toLowerCase()
      .includes(query.toLowerCase().trim());
    return (
      matches &&
      (filter === 'all' ||
        (filter === 'review' && reviewable(application)) ||
        application.state === filter)
    );
  });
  const tiles = [
    {
      key: 'review',
      label: l('Needs your review', 'بانتظار مراجعتك'),
      count: applications.filter(reviewable).length,
      dot: 'bg-accent',
    },
    {
      key: 'awaiting_approval',
      label: l('Waiting on applicant', 'بانتظار المتقدم'),
      count: applications.filter((a) => a.state === 'awaiting_approval').length,
      dot: 'bg-[rgb(var(--brand-saffron))]',
    },
    {
      key: 'terms_offered',
      label: l('Terms offered', 'شروط مقدمة'),
      count: applications.filter((a) => a.state === 'terms_offered').length,
      dot: 'bg-[rgb(var(--brand-seafoam))]',
    },
    {
      key: 'approved',
      label: l('Approved', 'معتمد'),
      count: applications.filter((a) => a.state === 'approved').length,
      dot: 'bg-success-solid',
    },
  ];
  return (
    <>
      <Title
        eyebrow={l('Leasing desk', 'إدارة الإيجار')}
        title={l('Rental applications', 'طلبات الإيجار')}
        description={l(
          'Review submitted applications, compare the evidence and record your decision.',
          'راجع الطلبات المقدمة، وقارن المعلومات، وسجّل قرارك.',
        )}
      />
      <div className="space-y-5 px-4 pb-8 sm:px-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map((tile) => {
            const active = filter === tile.key;
            return (
              <button
                key={tile.key}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(active ? 'all' : tile.key)}
                className={cn(
                  'rounded-lg border p-4 text-start transition-colors motion-reduce:transition-none',
                  active
                    ? 'border-accent bg-accent-soft'
                    : 'border-edge hover:border-line-strong hover:bg-subtle',
                )}
              >
                <span className="flex items-center gap-2 text-label text-fg-secondary">
                  <span aria-hidden className={cn('size-2 rounded-full', tile.dot)} />
                  {tile.label}
                </span>
                <span className="mt-2 block text-display font-medium tracking-tight">
                  {tile.count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3">
          <SearchField
            value={query}
            onChange={setQuery}
            label={l('Search applications', 'البحث في الطلبات')}
            placeholder={l(
              'Search applicant, property or unit…',
              'ابحث بالمتقدم أو العقار أو الوحدة…',
            )}
          />
          <label className="min-w-[180px]">
            <span className="sr-only">{l('Application status', 'حالة الطلب')}</span>
            <select
              className={controlClass}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">{l('All applications', 'جميع الطلبات')}</option>
              <option value="review">{l('Needs your review', 'بانتظار مراجعتك')}</option>
              <option value="awaiting_approval">
                {l('Applicant approval pending', 'بانتظار موافقة المتقدم')}
              </option>
              <option value="terms_offered">{l('Terms offered', 'شروط مقدمة')}</option>
              <option value="approved">{l('Approved', 'معتمد')}</option>
              <option value="declined">{l('Declined', 'مرفوض')}</option>
            </select>
          </label>
        </div>
        <p className="text-label text-fg-tertiary" role="status">
          {rows.length} {rows.length === 1 ? l('application', 'طلب') : l('applications', 'طلبات')}
        </p>
        {rows.length ? (
          <ApplicationRows applications={rows} />
        ) : (
          <EmptyState
            icon={FileText}
            title={
              applications.length
                ? l('No matching applications', 'لا توجد طلبات مطابقة')
                : l('No applications in this portfolio', 'لا توجد طلبات لهذه المحفظة')
            }
            description={l(
              'Submitted rental applications appear here. Try another search or portfolio.',
              'تظهر طلبات الإيجار المقدمة هنا. جرّب بحثاً أو محفظة أخرى.',
            )}
            action={
              query || filter !== 'all' ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery('');
                    setFilter('all');
                  }}
                >
                  {l('Clear filters', 'مسح الفلاتر')}
                </Button>
              ) : undefined
            }
          />
        )}
      </div>
    </>
  );
}

const levelRank: Record<RiskSummary['level'], number> = {
  low: 1,
  moderate: 2,
  elevated: 3,
};

/** Three-step level indicator. The label next to it carries the meaning, colour only reinforces it. */
function RiskMeter({ level }: { level: RiskSummary['level'] }) {
  const { l } = useLandlordLocale();
  const rank = levelRank[level];
  const fill =
    level === 'low'
      ? 'bg-success-solid'
      : level === 'moderate'
        ? 'bg-[rgb(var(--brand-saffron))]'
        : 'bg-danger-solid';
  return (
    <span
      role="img"
      aria-label={`${l('Risk level', 'مستوى المخاطر')} ${rank} ${l('of', 'من')} 3`}
      className="flex items-center gap-1"
    >
      {[1, 2, 3].map((step) => (
        <span
          key={step}
          className={cn('h-2 w-9 rounded-full', step <= rank ? fill : 'bg-line-strong/30')}
        />
      ))}
    </span>
  );
}

function RiskPointRow({ point }: { point: RiskPoint }) {
  const { locale, l } = useLandlordLocale();
  const kind =
    point.effect === 'positive'
      ? {
          Icon: Check,
          tile: 'bg-success-soft text-success',
          text: 'text-success',
          label: l('Supports approval', 'يدعم الاعتماد'),
        }
      : point.effect === 'concern'
        ? {
            Icon: AlertTriangle,
            tile: 'bg-warning-soft text-warning',
            text: 'text-warning',
            label: l('Worth checking', 'يستحق المراجعة'),
          }
        : {
            Icon: Minus,
            tile: 'bg-track text-fg-secondary',
            text: 'text-fg-tertiary',
            label: l('Neutral', 'محايد'),
          };
  return (
    <li className="flex gap-3 px-4 py-4 sm:px-5">
      <span
        className={cn(
          'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full',
          kind.tile,
        )}
      >
        <kind.Icon aria-hidden className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <h3 className="text-body font-medium" dir="auto">
            {recordText(point.label, locale)}
          </h3>
          <span className={cn('text-caption font-medium', kind.text)}>{kind.label}</span>
        </div>
        <p className="mt-1 text-body text-fg-secondary" dir="auto">
          {recordText(point.reason, locale)}
        </p>
      </div>
    </li>
  );
}

function RiskPanel({ risk }: { risk: RiskSummary }) {
  const { locale, l } = useLandlordLocale();
  const positives = risk.points.filter((p) => p.effect === 'positive').length;
  const concerns = risk.points.filter((p) => p.effect === 'concern').length;
  return (
    <div className="overflow-hidden rounded-lg border border-edge">
      <div className="space-y-4 border-b border-line bg-subtle p-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <RiskMeter level={risk.level} />
          <RiskBadge level={risk.level} />
          <span className="ms-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-label text-fg-secondary">
            <span className="inline-flex items-center gap-1.5">
              <Check aria-hidden className="size-4 text-success" />
              {positives} {l('supporting', 'داعمة')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <AlertTriangle aria-hidden className="size-4 text-warning" />
              {concerns} {l('to check', 'للمراجعة')}
            </span>
          </span>
        </div>
        <p className="max-w-2xl text-title font-medium text-fg" dir="auto">
          {recordText(risk.headline, locale)}
        </p>
      </div>
      <ul className="divide-y divide-line">
        {risk.points.map((point) => (
          <RiskPointRow key={point.label} point={point} />
        ))}
      </ul>
    </div>
  );
}

function EmployerBackingCard({ backed, employer }: { backed: boolean; employer: string }) {
  const { l } = useLandlordLocale();
  return (
    <section className="rounded-lg border border-edge p-5">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg',
            backed ? 'bg-accent-soft text-accent' : 'bg-track text-fg-tertiary',
          )}
        >
          <BadgeCheck aria-hidden className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-title font-medium">{l('Employer backing', 'دعم جهة العمل')}</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge tone={backed ? 'accent' : 'neutral'}>
              {backed
                ? l('Employer backed', 'مدعوم من جهة العمل')
                : l('No backing recorded', 'لم يُسجل دعم')}
            </Badge>
            <span className="text-label text-fg-secondary">{employer}</span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-body text-fg-secondary">
        {backed
          ? l(
              'The employer has backed this application, which lowers the chance of a missed payment.',
              'دعمت جهة العمل هذا الطلب، مما يقلل احتمال التأخر في السداد.',
            )
          : l(
              'No backing is recorded. Base your decision on the assessment and disclosure.',
              'لا يوجد دعم مسجل. استند في قرارك إلى التقييم والمعلومات المشتركة.',
            )}
      </p>
    </section>
  );
}

export function ApplicationDetail({ id }: { id: string }) {
  const state = useAppState();
  const { landlordId } = usePortfolio();
  const application = state.applications[id];
  const { locale, l } = useLandlordLocale();
  const mutation = useMutation();
  if (
    !application ||
    application.kind !== 'rental' ||
    (landlordId !== 'all' && application.partyId !== landlordId)
  )
    return (
      <>
        <Title title={l('Application unavailable', 'الطلب غير متاح')} />
        <EmptyState
          icon={FileText}
          title={l('Choose the matching portfolio', 'اختر المحفظة المناسبة')}
          description={l(
            'This rental application is not in the selected portfolio, or it no longer exists.',
            'هذا الطلب لا ينتمي للمحفظة المحددة أو لم يعد موجوداً.',
          )}
          action={
            <ActionLink href="/landlord/applications">
              {l('Back to applications', 'العودة إلى الطلبات')}
            </ActionLink>
          }
        />
      </>
    );
  const hire = state.hires[application.hireId];
  const property = state.properties[application.propertyId ?? ''];
  const employerName = state.employers[hire?.employerId ?? '']?.name ?? '—';
  const draft = application.state === 'awaiting_approval';
  const decisions = Object.values(state.decisions)
    .filter((d) => d.applicationId === id)
    .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt));
  const checks = Object.values(state.guardChecks)
    .filter((c) => c.caseId === application.hireId && c.destination === 'landlord')
    .sort((a, b) => b.at.localeCompare(a.at));
  return (
    <>
      <div className="px-4 pt-5 sm:px-6">
        <Link href="/landlord/applications" className={linkClass}>
          <ArrowLeft aria-hidden className="size-4 rtl:-scale-x-100" />
          {l('Applications', 'طلبات الإيجار')}
        </Link>
      </div>
      <header className="flex flex-wrap items-start justify-between gap-4 px-4 pb-6 pt-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          {draft || !hire ? (
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-track">
              <LockKeyhole aria-hidden className="size-6 text-fg-tertiary" />
            </span>
          ) : (
            <Avatar
              name={hire.fullName}
              className="size-14 bg-accent-soft text-title text-accent"
            />
          )}
          <div className="min-w-0">
            <p className="mb-1 text-label font-medium text-accent">
              {l('Application', 'الطلب')} · <span dir="ltr">{application.id}</span>
            </p>
            <h1 className="text-display font-medium tracking-tight text-fg sm:text-[1.75rem] sm:leading-9">
              {draft
                ? l('Applicant approval pending', 'بانتظار موافقة المتقدم')
                : (hire?.fullName ?? l('Rental application', 'طلب إيجار'))}
            </h1>
            <p className="mt-1 text-body text-fg-secondary">
              {draft
                ? l(
                    'The applicant has not released this application. Review and decision controls unlock after approval.',
                    'لم يوافق المتقدم على مشاركة الطلب بعد. تتاح المراجعة والقرارات بعد موافقته.',
                  )
                : `${employerName} · ${hire?.role ?? ''}`}
            </p>
          </div>
        </div>
        <StateBadge state={application.state} />
      </header>
      {!draft ? (
        <dl className="mx-4 mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-edge bg-edge sm:mx-6 lg:grid-cols-4">
          <div className="bg-surface p-4">
            <dt className="text-label text-fg-tertiary">{l('Assessment', 'التقييم')}</dt>
            <dd className="mt-2">
              {application.risk ? (
                <RiskBadge level={application.risk.level} />
              ) : (
                <span className="text-body text-fg-tertiary">—</span>
              )}
            </dd>
          </div>
          <div className="bg-surface p-4">
            <dt className="text-label text-fg-tertiary">
              {l('Employer backing', 'دعم جهة العمل')}
            </dt>
            <dd className="mt-2">
              <BackedChip backed={application.employerBacked} />
            </dd>
          </div>
          <div className="bg-surface p-4">
            <dt className="text-label text-fg-tertiary">{l('Received', 'تاريخ الاستلام')}</dt>
            <dd className="mt-2 text-body font-medium">
              {application.submittedAt ? formatDate(application.submittedAt, locale) : '—'}
            </dd>
          </div>
          <div className="bg-surface p-4">
            <dt className="text-label text-fg-tertiary">
              {l('Estimated annual rent', 'الإيجار السنوي التقديري')}
            </dt>
            <dd className="mt-2 text-body font-medium">
              {property ? formatAed(property.estAnnualRentAed, locale) : '—'}
            </dd>
          </div>
        </dl>
      ) : null}
      <div className="grid gap-6 px-4 pb-8 sm:px-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-7">
          {!draft ? (
            <section>
              <SectionTitle
                title={l('Application assessment', 'تقييم الطلب')}
                description={l(
                  'Illustrative assessment with the reasoning supplied in the application.',
                  'تقييم توضيحي وأسباب مسجلة ضمن الطلب.',
                )}
              />
              {application.risk ? (
                <RiskPanel risk={application.risk} />
              ) : (
                <p className="rounded-lg bg-subtle p-4 text-body text-fg-secondary">
                  {l(
                    'No assessment was supplied for this application. Base your decision on the available disclosure and records.',
                    'لم يُرفق تقييم لهذا الطلب. استند إلى المعلومات والسجلات المتاحة عند اتخاذ القرار.',
                  )}
                </p>
              )}
            </section>
          ) : null}
          <section className="rounded-lg border border-edge p-5">
            <SectionTitle
              title={l('Property and lease', 'العقار والإيجار')}
              action={
                property ? (
                  <ActionLink href={`/landlord/properties/${property.id}`}>
                    {l('Property details', 'تفاصيل العقار')}
                  </ActionLink>
                ) : undefined
              }
            />
            <div className="flex gap-4">
              {property ? <PropertyIllustration property={property} compact /> : null}
              <div className="min-w-0">
                <h3 className="text-title font-medium">{property?.name ?? '—'}</h3>
                <p className="mt-1 text-body text-fg-secondary">
                  {property
                    ? `${property.area} · ${l('Unit', 'الوحدة')} ${property.unit} · ${bedroomLabel(property.bedrooms, locale)}`
                    : '—'}
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
              <div>
                <p className="text-label text-fg-tertiary">
                  {l('Estimated annual rent', 'الإيجار السنوي التقديري')}
                </p>
                <p className="mt-1 text-heading font-medium">
                  {property ? formatAed(property.estAnnualRentAed, locale) : '—'}
                </p>
              </div>
              <div>
                <p className="text-label text-fg-tertiary">
                  {l('Accepted cheque schedules', 'عدد الشيكات المقبول')}
                </p>
                <p className="mt-1 text-title">
                  {property?.chequeOptions.join(' / ') ?? '—'} {l('cheques', 'شيكات')}
                </p>
              </div>
            </div>
          </section>
          {draft ? (
            <div className="flex gap-3 rounded-lg bg-subtle p-5">
              <LockKeyhole aria-hidden className="mt-0.5 size-5 shrink-0 text-fg-tertiary" />
              <p className="text-body text-fg-secondary">
                {l(
                  'Applicant details, documents and assessment are unavailable until the applicant approves sharing.',
                  'لا تتاح معلومات المتقدم ومستنداته وتقييمه حتى يوافق على مشاركتها.',
                )}
              </p>
            </div>
          ) : (
            <>
              <section>
                <SectionTitle
                  title={l('Recorded application disclosure', 'المعلومات المشتركة المسجلة')}
                  description={l(
                    'Historical disclosure is shown alongside the current demo permission. Revoking consent changes current availability.',
                    'تظهر المشاركة السابقة مع حالة الإذن الحالية في العرض. يؤثر سحب الموافقة على الإتاحة الحالية.',
                  )}
                />
                <div className="divide-y divide-line rounded-lg border border-edge">
                  {application.disclosed.map((item) => (
                    <div
                      key={item.label}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                    >
                      <p className="text-body font-medium">
                        {item.label === 'employment'
                          ? l('Employment confirmation', 'تأكيد التوظيف')
                          : item.label === 'passport'
                            ? l('Passport', 'جواز السفر')
                            : item.label === 'salary'
                              ? l('Affordability result', 'نتيجة القدرة على تحمل الإيجار')
                              : item.label}
                      </p>
                      <DisclosureStatus application={application} item={item} />
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-caption text-fg-tertiary">
                  {l(
                    'Raw salary is not shown. Document files are not hosted in this demo.',
                    'لا يُعرض الراتب الفعلي. ملفات المستندات غير مستضافة في هذا العرض.',
                  )}
                </p>
              </section>
              {checks.length ? (
                <section>
                  <SectionTitle
                    title={l('Recorded sharing checks', 'فحوص المشاركة المسجلة')}
                    description={l(
                      'Historical decisions from the shared Guard log.',
                      'قرارات سابقة من سجل Guard المشترك.',
                    )}
                  />
                  <div className="space-y-3">
                    {checks.map((check) => (
                      <div key={check.id} className="rounded-lg border border-edge p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Badge
                            tone={
                              check.decision === 'allow'
                                ? 'success'
                                : check.decision === 'deny'
                                  ? 'danger'
                                  : 'warning'
                            }
                          >
                            {check.decision === 'allow'
                              ? l('Allowed', 'مسموح')
                              : check.decision === 'deny'
                                ? l('Denied', 'مرفوض')
                                : l('Consent required', 'الموافقة مطلوبة')}
                          </Badge>
                          <span className="text-caption text-fg-tertiary">
                            {formatDate(check.at, locale)}
                          </span>
                        </div>
                        <p className="mt-2 text-body text-fg-secondary" dir="auto">
                          {recordText(check.reason, locale)}
                        </p>
                        {check.blockedLabels.length ? (
                          <p className="mt-2 text-caption text-danger">
                            {l('Blocked labels', 'الفئات المحظورة')}:{' '}
                            {check.blockedLabels.join(', ')}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          )}
          {decisions.length ? (
            <section>
              <SectionTitle title={l('Decision history', 'سجل القرارات')} />
              <div className="space-y-3">
                {decisions.map((decision) => (
                  <DecisionRecord key={decision.id} decision={decision} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
        <aside className="min-w-0 space-y-5 xl:sticky xl:top-4 xl:self-start">
          <section className="rounded-lg border border-accent/40 bg-surface p-5">
            <h2 className="text-title font-medium">{l('Your decision', 'قرارك')}</h2>
            <div className="mt-3">
              <Feedback error={mutation.error} success={mutation.success} />
            </div>
            {draft ? (
              <p className="mt-3 text-body text-fg-secondary">
                {l(
                  'Waiting for applicant approval. A landlord cannot approve sharing on the applicant’s behalf.',
                  'بانتظار موافقة المتقدم. لا يمكن للمالك الموافقة على المشاركة نيابةً عنه.',
                )}
              </p>
            ) : reviewable(application) ? (
              <DecisionForm key={application.id} application={application} mutation={mutation} />
            ) : (
              <div className="mt-4 space-y-3">
                <StateBadge state={application.state} />
                <p className="text-body text-fg-secondary">
                  {application.state === 'terms_offered'
                    ? l(
                        'The terms have been offered. The applicant must explicitly accept them before the lease is approved.',
                        'قُدمت الشروط. يجب أن يوافق عليها المتقدم صراحةً قبل اعتماد الإيجار.',
                      )
                    : l(
                        'This application has a final decision. The recorded terms appear in the decision history.',
                        'صدر قرار نهائي لهذا الطلب. تظهر الشروط المسجلة في سجل القرارات.',
                      )}
                </p>
              </div>
            )}
          </section>
          {!draft ? (
            <EmployerBackingCard backed={application.employerBacked} employer={employerName} />
          ) : null}
          {property && !draft ? (
            <section className="rounded-lg border border-edge p-5">
              <h2 className="text-title font-medium">{l('Organize a viewing', 'تنظيم معاينة')}</h2>
              <p className="mt-2 text-body text-fg-secondary">
                {l(
                  'Save a viewing plan in the shared workspace.',
                  'احفظ خطة المعاينة في مساحة العمل المشتركة.',
                )}
              </p>
              <ActionLink
                href={`/landlord/viewings?property=${property.id}&application=${application.id}`}
              >
                {l('Plan viewing', 'تخطيط المعاينة')}
              </ActionLink>
            </section>
          ) : null}
          <div className="flex gap-2 text-caption text-fg-tertiary">
            <ShieldAlert aria-hidden className="size-4 shrink-0" />
            <p>
              {l(
                'Sharing checks shown here are historical demo evidence.',
                'فحوص المشاركة المعروضة هنا سجلات سابقة في العرض.',
              )}
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

function DisclosureStatus({
  application,
  item,
}: {
  application: Application;
  item: Application['disclosed'][number];
}) {
  const state = useAppState();
  const { l } = useLandlordLocale();
  const policy = policyFor(item.label, 'landlord');
  const granted = Object.values(state.grants).some(
    (grant) =>
      grant.hireId === application.hireId &&
      grant.label === item.label &&
      grant.destination === 'landlord',
  );
  const restricted = policy === 'deny' || (policy === 'derived_only' && !item.derived);
  const missingConsent = policy === 'consent' && !granted;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-caption text-fg-tertiary">
        {item.derived
          ? l('Recorded derived result', 'نتيجة مشتقة مسجلة')
          : l('Recorded in application', 'مسجل في الطلب')}
      </span>
      <Badge tone={restricted ? 'danger' : missingConsent ? 'warning' : 'neutral'}>
        {restricted
          ? l('Current policy restricts this', 'مقيد وفق السياسة الحالية')
          : missingConsent
            ? l('Consent absent or withdrawn', 'الموافقة غائبة أو مسحوبة')
            : policy === 'derived_only'
              ? l('Derived result only', 'نتيجة مشتقة فقط')
              : policy === 'consent'
                ? l('Current consent recorded', 'موافقة حالية مسجلة')
                : l('Permitted by demo default', 'مسموح وفق سياسة العرض')}
      </Badge>
    </div>
  );
}

function DecisionForm({
  application,
  mutation,
}: {
  application: Application;
  mutation: ReturnType<typeof useMutation>;
}) {
  const { state } = usePortfolio();
  const { l } = useLandlordLocale();
  const property = state.properties[application.propertyId ?? ''];
  const existing = latestDecision(state, application.id);
  const [outcome, setOutcome] = useState<Decision['outcome']>('terms_offered');
  const [cheques, setCheques] = useState(String(property?.chequeOptions.at(-1) ?? 1));
  const [note, setNote] = useState(existing?.note ?? '');
  const needsTerms = outcome === 'approved' || outcome === 'terms_offered';
  const valid =
    note.trim().length >= 8 &&
    (!needsTerms || Boolean(property?.chequeOptions.includes(Number(cheques))));
  const outcomeHint: Record<Decision['outcome'], string> = {
    terms_offered: l(
      'The applicant sees your terms and must accept them before the lease is approved.',
      'يطلع المتقدم على شروطك ويجب أن يوافق عليها قبل اعتماد الإيجار.',
    ),
    approved: l(
      'Approves the application on the cheque schedule below.',
      'يعتمد الطلب وفق جدول الشيكات أدناه.',
    ),
    info_requested: l(
      'Pauses the review until the applicant adds the missing details.',
      'يوقف المراجعة إلى أن يضيف المتقدم المعلومات الناقصة.',
    ),
    declined: l(
      'Closes the application. Your reason is recorded in the decision history.',
      'يغلق الطلب ويُسجل سببك في سجل القرارات.',
    ),
  };
  const suggestedNote: Record<Decision['outcome'], string> = {
    terms_offered: l(
      'Lease offered on the selected cheque schedule. Please review and accept to proceed.',
      'عرض إيجار وفق جدول الشيكات المحدد. يرجى المراجعة والموافقة للمتابعة.',
    ),
    approved: l('Approved on the terms shown.', 'تم الاعتماد وفق الشروط المعروضة.'),
    info_requested: l(
      'Please share the missing details so the review can be completed.',
      'يرجى تزويدنا بالمعلومات الناقصة لإتمام المراجعة.',
    ),
    declined: l(
      'We are unable to proceed with this application for this unit.',
      'تعذر المضي في هذا الطلب لهذه الوحدة.',
    ),
  };
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    await mutation.run(
      {
        type: 'application.decide',
        applicationId: application.id,
        partyId: application.partyId,
        outcome,
        terms: needsTerms ? { cheques: Number(cheques) } : undefined,
        note: note.trim(),
        decidedBy: 'Omar Al Mansoori',
      },
      l(
        'Decision saved. The shared roadmap has been updated.',
        'حُفظ القرار وحُدثت خارطة الخطوات المشتركة.',
      ),
    );
  }
  return (
    <form onSubmit={submit} className="mt-4 space-y-4">
      {application.state === 'submitted' || application.state === 'needs_info' ? (
        <Button
          variant="secondary"
          className="h-10 w-full"
          disabled={mutation.pending}
          onClick={() =>
            void mutation.run(
              {
                type: 'application.start_review',
                applicationId: application.id,
                partyId: application.partyId,
              },
              l('Review started.', 'بدأت المراجعة.'),
            )
          }
        >
          {application.state === 'needs_info'
            ? l('Resume review', 'استئناف المراجعة')
            : l('Start review', 'بدء المراجعة')}
        </Button>
      ) : null}
      <div className="block space-y-2">
        <label htmlFor="decision-outcome" className="block text-label font-medium">
          {l('Outcome', 'القرار')}
        </label>
        <select
          id="decision-outcome"
          value={outcome}
          aria-describedby="decision-outcome-hint"
          onChange={(e) => {
            setOutcome(e.target.value as Decision['outcome']);
            mutation.clear();
          }}
          className={controlClass}
        >
          <option value="terms_offered">{l('Offer lease terms', 'تقديم شروط الإيجار')}</option>
          <option value="approved">{l('Approve application', 'اعتماد الطلب')}</option>
          <option value="info_requested">{l('Request information', 'طلب معلومات')}</option>
          <option value="declined">{l('Decline application', 'رفض الطلب')}</option>
        </select>
        <p id="decision-outcome-hint" className="flex gap-2 text-caption text-fg-tertiary">
          <CircleDot aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          {outcomeHint[outcome]}
        </p>
      </div>
      {needsTerms ? (
        <label className="block space-y-2">
          <span className="text-label font-medium">{l('Cheque schedule', 'عدد الشيكات')}</span>
          <select
            value={cheques}
            onChange={(e) => setCheques(e.target.value)}
            className={controlClass}
          >
            {property?.chequeOptions.map((n) => (
              <option key={n} value={n}>
                {n} {l(n === 1 ? 'cheque' : 'cheques', 'شيكات')}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="decision-note" className="text-label font-medium">
            {needsTerms
              ? l('Lease note and conditions', 'ملاحظات الإيجار وشروطه')
              : l('Reason or requested information', 'السبب أو المعلومات المطلوبة')}
          </label>
          <button
            type="button"
            onClick={() => setNote(suggestedNote[outcome])}
            className="rounded text-caption font-medium text-accent hover:underline"
          >
            {l('Use suggested note', 'استخدم ملاحظة مقترحة')}
          </button>
        </div>
        <textarea
          id="decision-note"
          required
          minLength={8}
          maxLength={1000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={textAreaClass}
          placeholder={l(
            'Explain the decision and any next steps…',
            'وضح القرار والخطوات التالية…',
          )}
        />
      </div>
      <Button
        type="submit"
        className="h-11 w-full"
        variant={outcome === 'declined' ? 'destructive' : 'primary'}
        disabled={!valid || mutation.pending}
        aria-describedby="decision-footnote"
      >
        {mutation.pending
          ? l('Saving…', 'جارٍ الحفظ…')
          : outcome === 'terms_offered'
            ? l('Save lease offer', 'حفظ عرض الإيجار')
            : outcome === 'approved'
              ? l('Save approval', 'حفظ الاعتماد')
              : outcome === 'info_requested'
                ? l('Save information request', 'حفظ طلب المعلومات')
                : l('Save decline', 'حفظ الرفض')}
      </Button>
      <p id="decision-footnote" className="text-caption text-fg-tertiary">
        {!valid
          ? l(
              'Add a note of at least 8 characters to enable saving. ',
              'أضف ملاحظة من 8 أحرف على الأقل لتفعيل الحفظ. ',
            )
          : ''}
        {l(
          'This records a decision in the demo and updates the applicant’s roadmap. It sends no external message.',
          'يسجل القرار في العرض ويحدث خارطة المتقدم. لا يُرسل أي رسالة خارجية.',
        )}
      </p>
    </form>
  );
}

export function DecisionRecord({ decision }: { decision: Decision }) {
  const { locale, l } = useLandlordLocale();
  return (
    <div className="rounded-lg border border-edge p-4">
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
          {decision.outcome === 'approved'
            ? l('Approved', 'معتمد')
            : decision.outcome === 'terms_offered'
              ? l('Terms offered', 'شروط مقدمة')
              : decision.outcome === 'info_requested'
                ? l('Information requested', 'معلومات مطلوبة')
                : l('Declined', 'مرفوض')}
        </Badge>
        <span className="text-caption text-fg-tertiary">
          {formatDate(decision.decidedAt, locale)} · {decision.decidedBy}
        </span>
      </div>
      <p className="mt-3 text-body text-fg-secondary" dir="auto">
        {recordText(decision.note, locale)}
      </p>
      {decision.terms?.cheques ? (
        <p className="mt-2 text-label font-medium">
          {decision.terms.cheques} {l('cheques', 'شيكات')}
          {decision.terms.note ? ` · ${decision.terms.note}` : ''}
        </p>
      ) : null}
    </div>
  );
}
