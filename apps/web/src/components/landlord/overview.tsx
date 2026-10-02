'use client';

import Link from 'next/link';
import { ArrowUpRight, Building2, CalendarDays, FileCheck, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatAed, formatDate } from '@/lib/format';
import { ApplicationRows, reviewable } from './applications';
import {
  ActionLink,
  BackedChip,
  bedroomLabel,
  propertyStatus,
  RiskBadge,
  SectionTitle,
  Title,
  useLandlordLocale,
  usePortfolio,
} from './shared';
import { PropertyIllustration } from './illustration';

export function LandlordOverview() {
  const { state, properties, applications } = usePortfolio();
  const { locale, l } = useLandlordLocale();
  const queue = applications.filter(reviewable);
  const pending = applications.filter((a) => a.state === 'awaiting_approval');
  const approvedPropertyIds = new Set(
    applications.filter((a) => a.state === 'approved').map((a) => a.propertyId),
  );
  const annualRent = properties
    .filter((p) => approvedPropertyIds.has(p.id))
    .reduce((sum, p) => sum + p.estAnnualRentAed, 0);
  const available = properties.filter((p) => propertyStatus(state, p.id) === 'available');
  const inReview = properties.filter((p) => propertyStatus(state, p.id) === 'in_review');
  const approvedUnits = properties.filter((p) => propertyStatus(state, p.id) === 'approved');
  const focused = queue[0];
  const focusProperty = focused ? state.properties[focused.propertyId ?? ''] : undefined;
  const focusHire = focused ? state.hires[focused.hireId] : undefined;
  const upcoming = Object.values(state.viewings)
    .filter((v) => v.status === 'planned' && properties.some((p) => p.id === v.propertyId))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return (
    <>
      <Title
        eyebrow={l('Leasing workspace', 'مساحة إدارة الإيجار')}
        title={l('A clear view of your portfolio', 'صورة واضحة لمحفظتك العقارية')}
        description={l(
          'Keep applications moving, organize property visits and follow every lease decision.',
          'تابع الطلبات ونظم زيارات العقارات وراقب كل قرار إيجار.',
        )}
        action={
          <ActionLink href="/landlord/applications">
            {l('Open applications', 'فتح الطلبات')}
          </ActionLink>
        }
      />
      <div className="space-y-7 px-4 pb-8 sm:px-6">
        <div className="grid gap-0 overflow-hidden rounded-lg border border-edge sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: l('Managed units', 'الوحدات المدارة'),
              value: String(properties.length),
              detail: l('Across the selected portfolio', 'ضمن المحفظة المحددة'),
              icon: Building2,
            },
            {
              label: l('Awaiting your review', 'بانتظار مراجعتك'),
              value: String(queue.length),
              detail: pending.length
                ? `${pending.length} ${l('also awaiting applicant approval', 'بانتظار موافقة المتقدم أيضاً')}`
                : l('Submitted rental applications', 'طلبات إيجار مقدمة'),
              icon: FileText,
            },
            {
              label: l('Rental approvals', 'اعتمادات الإيجار'),
              value: String(approvedUnits.length),
              detail: l('From recorded application decisions', 'وفق قرارات الطلبات المسجلة'),
              icon: FileCheck,
            },
            {
              label: l('Listing estimates for approved units', 'تقديرات الوحدات المعتمدة'),
              value: formatAed(annualRent, locale),
              detail: l('Current annual listing estimates', 'تقديرات الإعلانات السنوية الحالية'),
              icon: Building2,
            },
          ].map(({ label, value, detail, icon: Icon }) => (
            <div
              key={label}
              className="border-b border-line p-5 last:border-b-0 sm:border-e xl:border-b-0"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-label text-fg-secondary">{label}</p>
                <Icon aria-hidden className="size-4 text-accent" />
              </div>
              <p className="mt-4 break-words text-display font-medium tracking-tight">{value}</p>
              <p className="mt-2 text-caption text-fg-tertiary">{detail}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,1fr)]">
          <section className="rounded-lg border border-edge bg-accent-soft p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-label font-medium text-accent">
                {l('Next decision', 'القرار التالي')}
              </p>
              <Badge tone={focused ? 'warning' : 'success'}>
                {focused
                  ? l('Needs review', 'بانتظار المراجعة')
                  : l('Review queue clear', 'لا توجد طلبات للمراجعة')}
              </Badge>
            </div>
            {focused ? (
              <>
                <h2 className="mt-5 text-heading font-medium">
                  {focusHire?.fullName ?? l('Rental applicant', 'متقدم للإيجار')}
                </h2>
                <p className="mt-2 text-body text-fg-secondary">
                  {focusProperty
                    ? `${focusProperty.name} · ${l('Unit', 'الوحدة')} ${focusProperty.unit}`
                    : l('Property not recorded', 'العقار غير مسجل')}
                </p>
                {focused.risk ? (
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <RiskBadge level={focused.risk.level} />
                    <BackedChip backed={focused.employerBacked} />
                  </div>
                ) : null}
                <p className="mt-3 max-w-xl text-body text-fg-secondary">
                  {l(
                    'Review the disclosed evidence and payment schedule. Save an approval, offer revised terms, or request more information.',
                    'راجع المعلومات المشتركة وجدول الدفع. اعتمد الطلب أو قدم شروطاً معدلة أو اطلب معلومات إضافية.',
                  )}
                </p>
                <Link
                  href={`/landlord/applications/${focused.id}`}
                  className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-md bg-solid px-4 text-body font-medium text-solid-fg hover:bg-solid/85"
                >
                  {l('Review application', 'مراجعة الطلب')}
                  <ArrowUpRight aria-hidden className="size-4 rtl:-scale-x-100" />
                </Link>
              </>
            ) : (
              <>
                <h2 className="mt-5 text-heading font-medium">
                  {l('Every submitted application has a decision', 'لكل طلب مقدم قرار مسجل')}
                </h2>
                <p className="mt-3 text-body text-fg-secondary">
                  {l(
                    'Use this time to update your inventory or plan the next property visit.',
                    'حدّث مخزون العقارات أو خطط للزيارة التالية.',
                  )}
                </p>
                <ActionLink href="/landlord/properties">
                  {l('Manage properties', 'إدارة العقارات')}
                </ActionLink>
              </>
            )}
          </section>
          <section className="rounded-lg border border-edge p-5 sm:p-6">
            <SectionTitle
              title={l('Portfolio status', 'حالة المحفظة')}
              description={l(
                'Unit status follows the latest application records.',
                'تتبع حالة الوحدة سجلات طلبات الإيجار.',
              )}
            />
            <div
              className="mt-5 flex h-3 overflow-hidden rounded-full bg-track"
              role="img"
              aria-label={`${approvedUnits.length} ${l('approved', 'معتمد')}, ${inReview.length} ${l('in review', 'قيد المراجعة')}, ${available.length} ${l('open', 'متاح')}`}
            >
              {approvedUnits.length ? (
                <span
                  style={{
                    width: `${(approvedUnits.length / properties.length) * 100}%`,
                  }}
                  className="bg-accent"
                />
              ) : null}
              {inReview.length ? (
                <span
                  style={{
                    width: `${(inReview.length / properties.length) * 100}%`,
                  }}
                  className="bg-[#E4AD42]"
                />
              ) : null}
              {available.length ? (
                <span
                  style={{
                    width: `${(available.length / properties.length) * 100}%`,
                  }}
                  className="bg-[#A5D9D0]"
                />
              ) : null}
            </div>
            <div className="mt-5 space-y-3">
              {[
                {
                  title: l('Lease approved', 'إيجار معتمد'),
                  count: approvedUnits.length,
                  color: 'bg-accent',
                },
                {
                  title: l('Application in review', 'طلب قيد المراجعة'),
                  count: inReview.length,
                  color: 'bg-[#E4AD42]',
                },
                {
                  title: l('Open for applications', 'متاح للطلبات'),
                  count: available.length,
                  color: 'bg-[#A5D9D0]',
                },
              ].map((row) => (
                <div key={row.title} className="flex items-center justify-between gap-3 text-body">
                  <span className="inline-flex items-center gap-2 text-fg-secondary">
                    <span aria-hidden className={`size-2 rounded-full ${row.color}`} />
                    {row.title}
                  </span>
                  <span className="font-medium">{row.count}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-line pt-3">
              <ActionLink href="/landlord/leases">
                {l('See lease decisions', 'عرض قرارات الإيجار')}
              </ActionLink>
            </div>
          </section>
        </div>
        <section>
          <SectionTitle
            title={l('Your review queue', 'طلبات تنتظر مراجعتك')}
            description={l(
              'Applications that are submitted or need follow-up information.',
              'طلبات مقدمة أو تحتاج إلى استكمال معلومات.',
            )}
            action={
              <ActionLink href="/landlord/applications">
                {l('All applications', 'جميع الطلبات')}
              </ActionLink>
            }
          />
          {queue.length ? (
            <ApplicationRows applications={queue.slice(0, 4)} />
          ) : (
            <EmptyState
              icon={FileCheck}
              title={l('No applications awaiting review', 'لا توجد طلبات بانتظار المراجعة')}
              description={l(
                'New submissions and information requests appear here.',
                'تظهر هنا الطلبات الجديدة وطلبات استكمال المعلومات.',
              )}
              className="rounded-lg border border-edge py-8"
            />
          )}
        </section>
        <div className="grid gap-6 xl:grid-cols-2">
          <section>
            <SectionTitle
              title={l('Open units', 'الوحدات المتاحة')}
              action={
                <ActionLink href="/landlord/properties">{l('Inventory', 'المخزون')}</ActionLink>
              }
            />
            <div className="divide-y divide-line rounded-lg border border-edge">
              {available.length ? (
                available.slice(0, 3).map((property) => (
                  <div key={property.id} className="flex gap-4 p-4">
                    <PropertyIllustration property={property} compact />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-body font-medium">
                        <Link
                          href={`/landlord/properties/${property.id}`}
                          className="hover:text-accent"
                        >
                          {property.name}
                        </Link>
                      </h3>
                      <p className="mt-1 text-caption text-fg-tertiary">
                        {l('Unit', 'الوحدة')} {property.unit} ·{' '}
                        {bedroomLabel(property.bedrooms, locale)}
                      </p>
                      <p className="mt-2 text-label font-medium">
                        {formatAed(property.estAnnualRentAed, locale)}{' '}
                        <span className="font-normal text-fg-tertiary">
                          {l('est. / year', 'تقديرياً / سنوياً')}
                        </span>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-5 text-body text-fg-secondary">
                  {l(
                    'All units have active or approved applications.',
                    'لجميع الوحدات طلبات نشطة أو معتمدة.',
                  )}
                </p>
              )}
            </div>
          </section>
          <section>
            <SectionTitle
              title={l('Planned viewings', 'المعاينات المخططة')}
              action={<ActionLink href="/landlord/viewings">{l('Organizer', 'المنظم')}</ActionLink>}
            />
            {upcoming.length ? (
              <div className="divide-y divide-line rounded-lg border border-edge">
                {upcoming.slice(0, 3).map((viewing) => (
                  <div key={viewing.id} className="flex items-start gap-3 p-4">
                    <span className="rounded-md bg-accent-soft p-2 text-accent">
                      <CalendarDays aria-hidden className="size-4" />
                    </span>
                    <div>
                      <h3 className="text-body font-medium">
                        {state.properties[viewing.propertyId]?.name ?? '—'} ·{' '}
                        {state.properties[viewing.propertyId]?.unit ?? '—'}
                      </h3>
                      <p className="mt-1 text-label text-fg-tertiary">
                        {formatDate(viewing.startsAt, locale)} ·{' '}
                        {new Intl.DateTimeFormat(locale === 'ar' ? 'ar-AE-u-nu-latn' : 'en-GB', {
                          hour: 'numeric',
                          minute: '2-digit',
                          timeZone: 'Asia/Dubai',
                        }).format(new Date(viewing.startsAt))}{' '}
                        · GMT+4
                      </p>
                      <p className="mt-2 text-caption text-fg-secondary">
                        {viewing.durationMinutes} {l('minute internal plan', 'دقيقة · خطة داخلية')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title={l('No viewings planned', 'لا توجد معاينات مخططة')}
                description={l(
                  'Save an internal plan for a property visit.',
                  'احفظ خطة داخلية لزيارة أحد العقارات.',
                )}
                action={
                  <ActionLink href="/landlord/viewings">
                    {l('Plan a viewing', 'تخطيط معاينة')}
                  </ActionLink>
                }
                className="rounded-lg border border-edge py-8"
              />
            )}
          </section>
        </div>
      </div>
    </>
  );
}
