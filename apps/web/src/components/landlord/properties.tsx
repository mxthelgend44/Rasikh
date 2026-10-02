'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Building2, CalendarDays, ChevronDown, FileText, Plus } from 'lucide-react';
import type { AbuDhabiArea, Property } from '@/domain/types';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatAed } from '@/lib/format';
import { ApplicationRows } from './applications';
import { PropertyIllustration } from './illustration';
import {
  ActionLink,
  bedroomLabel,
  controlClass,
  Feedback,
  linkClass,
  PropertyBadge,
  propertyStatus,
  SearchField,
  SectionTitle,
  Title,
  useLandlordLocale,
  useMutation,
  usePortfolio,
} from './shared';

const areas: AbuDhabiArea[] = [
  'Al Reem Island',
  'Al Raha Beach',
  'Khalifa City',
  'Mohammed Bin Zayed City',
  'Saadiyat Island',
  'Yas Island',
  'Al Maryah Island',
];

export function PropertiesPage() {
  const { state, properties, landlordId } = usePortfolio();
  const { locale, l } = useLandlordLocale();
  const [query, setQuery] = useState('');
  const [area, setArea] = useState('all');
  const [status, setStatus] = useState('all');
  const [bedrooms, setBedrooms] = useState('all');
  const [sort, setSort] = useState('name');
  const [adding, setAdding] = useState(false);
  const rows = properties
    .filter(
      (property) =>
        `${property.name} ${property.unit} ${property.area}`
          .toLowerCase()
          .includes(query.toLowerCase().trim()) &&
        (area === 'all' || property.area === area) &&
        (status === 'all' || propertyStatus(state, property.id) === status) &&
        (bedrooms === 'all' || property.bedrooms === Number(bedrooms)),
    )
    .sort((a, b) =>
      sort === 'rent_low'
        ? a.estAnnualRentAed - b.estAnnualRentAed
        : sort === 'rent_high'
          ? b.estAnnualRentAed - a.estAnnualRentAed
          : a.name.localeCompare(b.name) || a.unit.localeCompare(b.unit),
    );
  return (
    <>
      <Title
        eyebrow={l('Managed inventory', 'المخزون المدار')}
        title={l('Properties', 'العقارات')}
        description={l(
          'Your units, estimated rents and accepted payment schedules in one place.',
          'الوحدات والإيجارات التقديرية وخيارات السداد المقبولة في مكان واحد.',
        )}
        action={
          <Button
            className="h-10"
            icon={<Plus />}
            onClick={() => setAdding((value) => !value)}
            aria-expanded={adding}
            aria-controls="new-property"
          >
            {adding ? l('Close form', 'إغلاق النموذج') : l('Add property', 'إضافة عقار')}
          </Button>
        }
      />
      <div className="space-y-5 px-4 pb-8 sm:px-6">
        {adding ? (
          <section id="new-property" className="rounded-lg border border-edge bg-subtle p-5">
            <SectionTitle title={l('Add a managed unit', 'إضافة وحدة مدارة')} />
            <PropertyForm key={landlordId} onDone={() => setAdding(false)} />
          </section>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_180px_170px_140px_170px]">
          <SearchField
            value={query}
            onChange={setQuery}
            label={l('Search properties', 'البحث في العقارات')}
            placeholder={l('Search property, area or unit…', 'ابحث بالعقار أو المنطقة أو الوحدة…')}
          />
          <label>
            <span className="sr-only">{l('Area', 'المنطقة')}</span>
            <select className={controlClass} value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="all">{l('All areas', 'جميع المناطق')}</option>
              {Array.from(new Set(properties.map((p) => p.area))).map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">{l('Availability', 'حالة الوحدة')}</span>
            <select
              className={controlClass}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">{l('All statuses', 'جميع الحالات')}</option>
              <option value="available">{l('Open for applications', 'متاح للطلبات')}</option>
              <option value="in_review">{l('Application in review', 'طلب قيد المراجعة')}</option>
              <option value="approved">{l('Lease approved', 'إيجار معتمد')}</option>
            </select>
          </label>
          <label>
            <span className="sr-only">{l('Bedrooms', 'غرف النوم')}</span>
            <select
              className={controlClass}
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
            >
              <option value="all">{l('All sizes', 'جميع المساحات')}</option>
              {Array.from(new Set(properties.map((p) => p.bedrooms)))
                .sort()
                .map((n) => (
                  <option key={n} value={n}>
                    {bedroomLabel(n, locale)}
                  </option>
                ))}
            </select>
          </label>
          <label>
            <span className="sr-only">{l('Sort properties', 'ترتيب العقارات')}</span>
            <select className={controlClass} value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="name">{l('Property name', 'اسم العقار')}</option>
              <option value="rent_low">{l('Rent: low to high', 'الإيجار: من الأقل')}</option>
              <option value="rent_high">{l('Rent: high to low', 'الإيجار: من الأعلى')}</option>
            </select>
          </label>
        </div>
        <p className="text-label text-fg-tertiary" role="status">
          {rows.length} {rows.length === 1 ? l('unit', 'وحدة') : l('units', 'وحدات')} ·{' '}
          {l('Status is derived from recorded applications.', 'تُستمد الحالة من الطلبات المسجلة.')}
        </p>
        {rows.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((property) => (
              <article
                key={property.id}
                className="overflow-hidden rounded-lg border border-edge transition-colors hover:border-line-strong motion-reduce:transition-none"
              >
                <div className="relative">
                  <PropertyIllustration property={property} className="rounded-none" />
                  <span className="absolute start-3 top-3 inline-flex rounded bg-surface shadow-sm">
                    <PropertyBadge state={state} property={property} />
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-title font-medium">
                        <Link
                          href={`/landlord/properties/${property.id}`}
                          className="hover:text-accent"
                        >
                          {property.name}
                        </Link>
                      </h2>
                      <p className="mt-1 text-label text-fg-tertiary">
                        {property.area} · {l('Unit', 'الوحدة')} {property.unit}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-track px-2 py-1 text-caption">
                      {bedroomLabel(property.bedrooms, locale)}
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-caption text-fg-tertiary">
                      {l('Est. annual rent', 'الإيجار السنوي التقديري')}
                    </p>
                    <p className="mt-1 text-heading font-medium">
                      {formatAed(property.estAnnualRentAed, locale)}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                    <span className="text-caption text-fg-secondary">
                      {property.chequeOptions.join(' / ')} {l('cheques accepted', 'شيكات مقبولة')}
                    </span>
                    <ActionLink href={`/landlord/properties/${property.id}`}>
                      {l('Details', 'التفاصيل')}
                    </ActionLink>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Building2}
            title={
              properties.length
                ? l('No matching units', 'لا توجد وحدات مطابقة')
                : l('No properties in this portfolio', 'لا توجد عقارات في هذه المحفظة')
            }
            description={l(
              'Try another search, filter or managed portfolio.',
              'جرّب بحثاً أو فلتراً أو محفظة أخرى.',
            )}
            action={
              properties.length ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery('');
                    setArea('all');
                    setStatus('all');
                    setBedrooms('all');
                  }}
                >
                  {l('Clear filters', 'مسح الفلاتر')}
                </Button>
              ) : (
                <Button onClick={() => setAdding(true)}>{l('Add property', 'إضافة عقار')}</Button>
              )
            }
          />
        )}
      </div>
    </>
  );
}

export function PropertyDetail({ id }: { id: string }) {
  const { state, landlordId } = usePortfolio();
  const property = state.properties[id];
  const { locale, l } = useLandlordLocale();
  const [editing, setEditing] = useState(false);
  if (!property || (landlordId !== 'all' && property.landlordId !== landlordId))
    return (
      <>
        <Title title={l('Property unavailable', 'العقار غير متاح')} />
        <EmptyState
          icon={Building2}
          title={l('Choose the matching portfolio', 'اختر المحفظة المناسبة')}
          description={l(
            'This unit is not in the selected portfolio, or it no longer exists.',
            'هذه الوحدة لا تنتمي للمحفظة المحددة أو لم تعد موجودة.',
          )}
          action={
            <ActionLink href="/landlord/properties">
              {l('Back to properties', 'العودة إلى العقارات')}
            </ActionLink>
          }
        />
      </>
    );
  const applications = Object.values(state.applications).filter(
    (a) => a.kind === 'rental' && a.propertyId === id,
  );
  return (
    <>
      <div className="px-4 pt-5 sm:px-6">
        <Link href="/landlord/properties" className={linkClass}>
          <ArrowLeft aria-hidden className="size-4 rtl:-scale-x-100" />
          {l('Properties', 'العقارات')}
        </Link>
      </div>
      <Title
        eyebrow={state.landlords[property.landlordId]?.name}
        title={property.name}
        description={`${property.area} · ${l('Unit', 'الوحدة')} ${property.unit}`}
        action={
          <Button
            variant="secondary"
            className="h-10"
            onClick={() => setEditing((value) => !value)}
            aria-expanded={editing}
            aria-controls="edit-property"
          >
            {editing ? l('Close form', 'إغلاق النموذج') : l('Edit unit', 'تعديل الوحدة')}
            <ChevronDown aria-hidden className="ms-2 size-4" />
          </Button>
        }
      />
      <div className="space-y-7 px-4 pb-8 sm:px-6">
        {editing ? (
          <section id="edit-property" className="rounded-lg border border-edge bg-subtle p-5">
            <SectionTitle title={l('Edit property details', 'تعديل تفاصيل العقار')} />
            <PropertyForm key={property.id} property={property} onDone={() => setEditing(false)} />
          </section>
        ) : null}
        <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
          <PropertyIllustration property={property} className="min-h-44 lg:aspect-auto lg:h-full" />
          <section className="rounded-lg border border-edge p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-title font-medium">{l('Unit details', 'تفاصيل الوحدة')}</h2>
              <PropertyBadge state={state} property={property} />
            </div>
            <dl className="mt-5 grid gap-5 sm:grid-cols-3">
              <div>
                <dt className="text-label text-fg-tertiary">
                  {l('Est. annual rent', 'الإيجار السنوي التقديري')}
                </dt>
                <dd className="mt-1 text-heading font-medium">
                  {formatAed(property.estAnnualRentAed, locale)}
                </dd>
              </div>
              <div>
                <dt className="text-label text-fg-tertiary">{l('Layout', 'نوع الوحدة')}</dt>
                <dd className="mt-1 text-title">{bedroomLabel(property.bedrooms, locale)}</dd>
              </div>
              <div>
                <dt className="text-label text-fg-tertiary">
                  {l('Accepted cheques', 'الشيكات المقبولة')}
                </dt>
                <dd className="mt-1 text-title">{property.chequeOptions.join(' / ')}</dd>
              </div>
              <div className="sm:col-span-3">
                <dt className="text-label text-fg-tertiary">
                  {l('Lease reference', 'مرجع الإيجار')}
                </dt>
                <dd className="mt-1 break-all font-mono text-label">{property.leaseRef}</dd>
              </div>
            </dl>
          </section>
        </div>
        <section>
          <SectionTitle
            title={l('Applications for this unit', 'طلبات هذه الوحدة')}
            action={
              <ActionLink href={`/landlord/viewings?property=${property.id}`}>
                <CalendarDays aria-hidden className="size-4" />
                {l('Plan viewing', 'تخطيط معاينة')}
              </ActionLink>
            }
          />
          {applications.length ? (
            <ApplicationRows applications={applications} />
          ) : (
            <EmptyState
              icon={FileText}
              title={l('No applications for this unit', 'لا توجد طلبات لهذه الوحدة')}
              description={l(
                'Applications appear after a newcomer chooses this property.',
                'تظهر الطلبات بعد أن يختار أحد المتقدمين هذا العقار.',
              )}
              className="rounded-lg border border-edge py-10"
            />
          )}
        </section>
      </div>
    </>
  );
}

function PropertyForm({ property, onDone }: { property?: Property; onDone: () => void }) {
  const { state, landlordId } = usePortfolio();
  const { l } = useLandlordLocale();
  const [owner, setOwner] = useState(
    property?.landlordId ?? (landlordId === 'all' ? Object.keys(state.landlords)[0] : landlordId),
  );
  const [name, setName] = useState(property?.name ?? '');
  const [unit, setUnit] = useState(property?.unit ?? '');
  const [area, setArea] = useState<AbuDhabiArea>(
    property?.area ?? state.landlords[owner]?.area ?? 'Al Reem Island',
  );
  const [bedrooms, setBedrooms] = useState(String(property?.bedrooms ?? 1));
  const [rent, setRent] = useState(String(property?.estAnnualRentAed ?? ''));
  const [leaseRef, setLeaseRef] = useState(property?.leaseRef ?? '');
  const [cheques, setCheques] = useState(property?.chequeOptions ?? [1, 2, 4]);
  const mutation = useMutation();
  const valid =
    name.trim().length > 2 &&
    unit.trim().length > 0 &&
    leaseRef.trim().length > 2 &&
    Number(rent) > 0 &&
    Number.isInteger(Number(bedrooms)) &&
    cheques.length > 0 &&
    Boolean(state.landlords[owner]) &&
    (landlordId === 'all' || landlordId === owner);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const values = {
      name: name.trim(),
      unit: unit.trim(),
      area,
      bedrooms: Number(bedrooms),
      estAnnualRentAed: Number(rent),
      leaseRef: leaseRef.trim(),
      chequeOptions: [...cheques].sort((a, b) => a - b),
    };
    const saved = await mutation.run(
      property
        ? {
            type: 'property.update',
            landlordId: property.landlordId,
            propertyId: property.id,
            patch: values,
          }
        : { type: 'property.create', landlordId: owner, property: values },
      l('Property saved to the shared portfolio.', 'حُفظ العقار في المحفظة المشتركة.'),
    );
    if (saved) onDone();
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block space-y-2">
          <span className="text-label font-medium">
            {l('Managed portfolio', 'المحفظة المدارة')}
          </span>
          <select
            disabled={Boolean(property)}
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className={controlClass}
          >
            {Object.values(state.landlords)
              .filter((p) => landlordId === 'all' || p.id === landlordId)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-label font-medium">{l('Property name', 'اسم العقار')}</span>
          <input
            required
            maxLength={150}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={controlClass}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-label font-medium">{l('Unit number', 'رقم الوحدة')}</span>
          <input
            required
            maxLength={40}
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className={controlClass}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-label font-medium">{l('Area', 'المنطقة')}</span>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value as AbuDhabiArea)}
            className={controlClass}
          >
            {areas.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-label font-medium">{l('Bedrooms', 'غرف النوم')}</span>
          <input
            required
            type="number"
            min={0}
            max={10}
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            className={controlClass}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-label font-medium">
            {l('Est. annual rent (AED)', 'الإيجار السنوي التقديري (د.إ.)')}
          </span>
          <input
            required
            type="number"
            min={1}
            max={10000000}
            step={1}
            value={rent}
            onChange={(e) => setRent(e.target.value)}
            className={controlClass}
          />
        </label>
        <label className="block space-y-2 sm:col-span-2">
          <span className="text-label font-medium">{l('Lease reference', 'مرجع الإيجار')}</span>
          <input
            required
            maxLength={100}
            value={leaseRef}
            onChange={(e) => setLeaseRef(e.target.value)}
            className={controlClass}
          />
        </label>
      </div>
      <fieldset>
        <legend className="mb-3 text-label font-medium">
          {l('Accepted cheque schedules', 'عدد الشيكات المقبول')}
        </legend>
        <div className="flex flex-wrap gap-4">
          {[1, 2, 4, 6, 12].map((n) => (
            <label key={n} className="inline-flex min-h-10 items-center gap-2 text-body">
              <input
                type="checkbox"
                checked={cheques.includes(n)}
                onChange={(e) =>
                  setCheques(e.target.checked ? [...cheques, n] : cheques.filter((c) => c !== n))
                }
                className="size-4 accent-accent"
              />
              {n} {l('cheques', 'شيكات')}
            </label>
          ))}
        </div>
      </fieldset>
      <Feedback error={mutation.error} success={mutation.success} />
      <div className="flex gap-3">
        <Button type="submit" className="h-10" disabled={!valid || mutation.pending}>
          {mutation.pending ? l('Saving…', 'جارٍ الحفظ…') : l('Save property', 'حفظ العقار')}
        </Button>
        <Button variant="secondary" className="h-10" disabled={mutation.pending} onClick={onDone}>
          {l('Cancel', 'إلغاء')}
        </Button>
      </div>
      <p className="text-caption text-fg-tertiary">
        {l(
          'Changes are saved to the shared demo portfolio. Existing lease decisions retain their recorded terms.',
          'تُحفظ التغييرات في محفظة العرض المشتركة وتحتفظ قرارات الإيجار السابقة بشروطها المسجلة.',
        )}
      </p>
    </form>
  );
}
