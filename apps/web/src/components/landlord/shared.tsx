'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  Check,
  FileText,
  LayoutDashboard,
  Search,
  WifiOff,
} from 'lucide-react';
import { useAppState, useConnection, useStore } from '@/store/provider';
import { useI18n } from '@/lib/i18n/provider';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import type {
  Application,
  AppState,
  Decision,
  Locale,
  Property,
  RiskSummary,
} from '@/domain/types';

const PortfolioContext = createContext<{
  landlordId: string;
  setLandlordId: (id: string) => void;
} | null>(null);

export const controlClass =
  'h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-body text-fg placeholder:text-fg-placeholder';
export const textAreaClass =
  'min-h-24 w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-body text-fg placeholder:text-fg-placeholder';
export const linkClass =
  'inline-flex min-h-9 items-center gap-2 rounded-md text-body font-medium text-accent hover:underline';

export function useLandlordLocale() {
  const { locale } = useI18n();
  return { locale, l: (en: string, ar: string) => (locale === 'ar' ? ar : en) };
}

export function usePortfolio() {
  const portfolio = useContext(PortfolioContext);
  if (!portfolio) throw new Error('Portfolio requires the landlord frame');
  const state = useAppState();
  const properties = useMemo(
    () =>
      Object.values(state.properties).filter(
        (p) => portfolio.landlordId === 'all' || p.landlordId === portfolio.landlordId,
      ),
    [state.properties, portfolio.landlordId],
  );
  const applications = useMemo(
    () =>
      Object.values(state.applications)
        .filter(
          (a) =>
            a.kind === 'rental' &&
            (portfolio.landlordId === 'all' || a.partyId === portfolio.landlordId),
        )
        .sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? '')),
    [state.applications, portfolio.landlordId],
  );
  return { ...portfolio, state, properties, applications };
}

export function LandlordFrame({ children }: { children: ReactNode }) {
  const state = useAppState();
  const pathname = usePathname();
  const routeId = pathname.split('/')[3];
  const routeOwner = pathname.startsWith('/landlord/properties/')
    ? state.properties[routeId]?.landlordId
    : pathname.startsWith('/landlord/applications/')
      ? state.applications[routeId]?.partyId
      : undefined;
  const [landlordId, setLandlordId] = useState(routeOwner ?? 'landlord_al_reem');
  useEffect(() => {
    if (routeOwner) setLandlordId(routeOwner);
  }, [routeOwner]);
  const { l } = useLandlordLocale();
  const connection = useConnection();
  const links = [
    {
      href: '/landlord',
      label: l('Overview', 'نظرة عامة'),
      icon: LayoutDashboard,
    },
    {
      href: '/landlord/applications',
      label: l('Applications', 'طلبات الإيجار'),
      icon: FileText,
    },
    {
      href: '/landlord/properties',
      label: l('Properties', 'العقارات'),
      icon: Building2,
    },
    {
      href: '/landlord/viewings',
      label: l('Viewings', 'المعاينات'),
      icon: CalendarDays,
    },
    {
      href: '/landlord/leases',
      label: l('Lease decisions', 'قرارات الإيجار'),
      icon: Check,
    },
  ];
  return (
    <PortfolioContext.Provider value={{ landlordId, setLandlordId }}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line px-4 py-3 sm:px-6 md:hidden">
        <nav
          aria-label={l('Leasing workspace', 'مساحة إدارة الإيجار')}
          className="flex min-w-0 max-w-full flex-1 gap-1 overflow-x-auto"
        >
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === '/landlord' ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 text-label font-medium transition-colors',
                  active ? 'bg-accent-soft text-accent' : 'text-fg-secondary hover:bg-hover',
                )}
              >
                <Icon aria-hidden className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-6">
        <label className="flex max-w-full items-center gap-2 text-label text-fg-tertiary">
          <Building2 aria-hidden className="size-4 shrink-0" />
          <span className="sr-only">{l('Portfolio', 'المحفظة')}</span>
          <select
            value={landlordId}
            onChange={(e) => setLandlordId(e.target.value)}
            className="h-9 min-w-0 max-w-full rounded-md border border-line-strong bg-surface px-2 text-label text-fg"
          >
            <option value="all">{l('All managed portfolios', 'جميع المحافظ المدارة')}</option>
            {Object.values(state.landlords).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <span
          role="status"
          className={cn(
            'inline-flex items-center gap-1.5 text-caption',
            connection === 'offline' ? 'text-warning' : 'text-fg-tertiary',
          )}
        >
          {connection === 'offline' ? (
            <WifiOff aria-hidden className="size-3.5" />
          ) : (
            <span
              className={cn(
                'size-1.5 rounded-full',
                connection === 'live' ? 'bg-success' : 'bg-warning',
              )}
            />
          )}
          {connection === 'live'
            ? l('Live portfolio', 'محفظة مباشرة')
            : connection === 'offline'
              ? l('Connection interrupted · showing last update', 'انقطع الاتصال · آخر تحديث محفوظ')
              : l('Connecting to live updates', 'جارٍ الاتصال بالتحديثات')}
        </span>
      </div>
      <div className="pb-16">{children}</div>
    </PortfolioContext.Provider>
  );
}

export function Title({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 px-4 pb-6 pt-6 sm:px-6">
      <div className="max-w-2xl">
        {eyebrow ? <p className="mb-2 text-label font-medium text-accent">{eyebrow}</p> : null}
        <h1 className="text-display font-medium tracking-tight text-fg sm:text-[1.75rem] sm:leading-9">
          {title}
        </h1>
        {description ? <p className="mt-2 text-body text-fg-secondary">{description}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-title font-medium text-fg">{title}</h2>
        {description ? <p className="mt-1 text-label text-fg-tertiary">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <label className="relative block min-w-[14rem] flex-1">
      <span className="sr-only">{label}</span>
      <Search
        aria-hidden
        className="pointer-events-none absolute start-3 top-3 size-4 text-fg-tertiary"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(controlClass, 'ps-9')}
      />
    </label>
  );
}

export function StateBadge({ state }: { state: Application['state'] }) {
  const { l } = useLandlordLocale();
  const labels: Record<Application['state'], [string, string, BadgeTone]> = {
    awaiting_approval: ['Applicant approval pending', 'بانتظار موافقة المتقدم', 'neutral'],
    submitted: ['New application', 'طلب جديد', 'accent'],
    under_review: ['In review', 'قيد المراجعة', 'warning'],
    needs_info: ['More information needed', 'معلومات إضافية مطلوبة', 'warning'],
    terms_offered: ['Terms offered', 'شروط مقدمة', 'accent'],
    approved: ['Approved', 'معتمد', 'success'],
    declined: ['Declined', 'مرفوض', 'danger'],
  };
  const [en, ar, tone] = labels[state];
  return <Badge tone={tone}>{l(en, ar)}</Badge>;
}

export function RiskBadge({ level }: { level: RiskSummary['level'] }) {
  const { l } = useLandlordLocale();
  const labels: Record<RiskSummary['level'], [string, string, BadgeTone]> = {
    low: ['Low risk', 'مخاطر منخفضة', 'success'],
    moderate: ['Moderate risk', 'مخاطر متوسطة', 'warning'],
    elevated: ['Elevated risk', 'مخاطر مرتفعة', 'danger'],
  };
  const [en, ar, tone] = labels[level];
  return <Badge tone={tone}>{l(en, ar)}</Badge>;
}

/** Small marker for applications that the employer has agreed to stand behind. */
export function BackedChip({ backed }: { backed: boolean }) {
  const { l } = useLandlordLocale();
  return backed ? (
    <span className="inline-flex items-center gap-1 text-caption font-medium text-accent">
      <BadgeCheck aria-hidden className="size-3.5" />
      {l('Employer backed', 'مدعوم من جهة العمل')}
    </span>
  ) : (
    <span className="text-caption text-fg-tertiary">
      {l('No employer backing', 'بلا دعم من جهة العمل')}
    </span>
  );
}

export function latestDecision(state: AppState, applicationId: string): Decision | undefined {
  return Object.values(state.decisions)
    .filter((d) => d.applicationId === applicationId)
    .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt))[0];
}

export function propertyStatus(
  state: AppState,
  propertyId: string,
): 'approved' | 'in_review' | 'available' {
  const applications = Object.values(state.applications).filter(
    (a) => a.kind === 'rental' && a.propertyId === propertyId,
  );
  if (applications.some((a) => a.state === 'approved')) return 'approved';
  if (
    applications.some((a) =>
      ['submitted', 'under_review', 'needs_info', 'terms_offered'].includes(a.state),
    )
  )
    return 'in_review';
  return 'available';
}

export function PropertyBadge({ state, property }: { state: AppState; property: Property }) {
  const { l } = useLandlordLocale();
  const status = propertyStatus(state, property.id);
  return (
    <Badge tone={status === 'approved' ? 'success' : status === 'in_review' ? 'warning' : 'accent'}>
      {status === 'approved'
        ? l('Lease approved', 'إيجار معتمد')
        : status === 'in_review'
          ? l('Application in review', 'طلب قيد المراجعة')
          : l('Open for applications', 'متاح للطلبات')}
    </Badge>
  );
}

export function bedroomLabel(bedrooms: number, locale: Locale) {
  return bedrooms === 0
    ? locale === 'ar'
      ? 'استوديو'
      : 'Studio'
    : locale === 'ar'
      ? `${bedrooms} غرف نوم`
      : `${bedrooms} ${bedrooms === 1 ? 'bedroom' : 'bedrooms'}`;
}
export function ActionLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={linkClass}>
      {children}
      <ArrowUpRight aria-hidden className="size-4 rtl:-scale-x-100" />
    </Link>
  );
}

export function useMutation() {
  const store = useStore();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  async function run(action: Parameters<typeof store.dispatch>[0], message: string) {
    if (pending) return false;
    setPending(true);
    setError('');
    setSuccess('');
    try {
      await store.dispatch(action);
      setSuccess(message);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save the change');
      return false;
    } finally {
      setPending(false);
    }
  }
  return {
    run,
    pending,
    error,
    success,
    clear: () => {
      setError('');
      setSuccess('');
    },
  };
}

export function Feedback({ error, success }: { error?: string; success?: string }) {
  return (
    <>
      {error ? (
        <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-body text-danger">
          {error}
        </p>
      ) : null}
      {success ? (
        <p role="status" className="rounded-md bg-success-soft px-3 py-2 text-body text-success">
          {success}
        </p>
      ) : null}
    </>
  );
}
