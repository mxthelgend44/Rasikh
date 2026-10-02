'use client';

import { useState } from 'react';
import { FileCheck } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatAed } from '@/lib/format';
import { DecisionRecord } from './applications';
import {
  ActionLink,
  controlClass,
  SearchField,
  Title,
  useLandlordLocale,
  usePortfolio,
} from './shared';

export function LeasesPage() {
  const { state, applications } = usePortfolio();
  const { locale, l } = useLandlordLocale();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const ids = new Set(applications.map((a) => a.id));
  const decisions = Object.values(state.decisions)
    .filter((d) => ids.has(d.applicationId))
    .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt));
  const rows = decisions.filter((decision) => {
    const application = state.applications[decision.applicationId];
    const property = state.properties[application?.propertyId ?? ''];
    return (
      (filter === 'all' || decision.outcome === filter) &&
      `${state.hires[application?.hireId ?? '']?.fullName ?? ''} ${property?.name ?? ''} ${property?.unit ?? ''} ${decision.note}`
        .toLowerCase()
        .includes(query.toLowerCase().trim())
    );
  });
  return (
    <>
      <Title
        eyebrow={l('Recorded outcomes', 'النتائج المسجلة')}
        title={l('Lease decisions', 'قرارات الإيجار')}
        description={l(
          'Follow approvals, offered payment terms and information requests. Offers await the applicant’s acceptance.',
          'تابع الاعتمادات وشروط السداد وطلبات المعلومات. تنتظر العروض قبول المتقدم.',
        )}
      />
      <div className="space-y-5 px-4 pb-8 sm:px-6">
        <div className="flex flex-wrap gap-3">
          <SearchField
            value={query}
            onChange={setQuery}
            label={l('Search decisions', 'البحث في القرارات')}
            placeholder={l(
              'Search applicant, property or decision note…',
              'ابحث بالمتقدم أو العقار أو ملاحظة القرار…',
            )}
          />
          <label className="min-w-[180px]">
            <span className="sr-only">{l('Decision outcome', 'نتيجة القرار')}</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={controlClass}
            >
              <option value="all">{l('All outcomes', 'جميع النتائج')}</option>
              <option value="approved">{l('Approvals', 'الاعتمادات')}</option>
              <option value="terms_offered">{l('Terms offered', 'شروط مقدمة')}</option>
              <option value="info_requested">{l('Information requested', 'معلومات مطلوبة')}</option>
              <option value="declined">{l('Declined', 'مرفوض')}</option>
            </select>
          </label>
        </div>
        <p role="status" className="text-label text-fg-tertiary">
          {rows.length}{' '}
          {rows.length === 1
            ? l('recorded decision', 'قرار مسجل')
            : l('recorded decisions', 'قرارات مسجلة')}
        </p>
        {rows.length ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {rows.map((decision) => {
              const application = state.applications[decision.applicationId];
              const property = state.properties[application?.propertyId ?? ''];
              const hire = state.hires[application?.hireId ?? ''];
              return (
                <article key={decision.id} className="rounded-lg border border-edge p-5">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {hire ? (
                        <Avatar
                          name={hire.fullName}
                          className="size-10 bg-accent-soft text-accent"
                        />
                      ) : null}
                      <div className="min-w-0">
                        <h2 className="text-title font-medium">
                          {hire?.fullName ?? l('Applicant unavailable', 'المتقدم غير متاح')}
                        </h2>
                        <p className="mt-0.5 text-label text-fg-secondary">
                          {property?.name ?? '—'} · {l('Unit', 'الوحدة')} {property?.unit ?? '—'}
                        </p>
                      </div>
                    </div>
                    <ActionLink href={`/landlord/applications/${decision.applicationId}`}>
                      {l('Application', 'الطلب')}
                    </ActionLink>
                  </div>
                  <DecisionRecord decision={decision} />
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-label text-fg-secondary">
                    <span>
                      {l('Est. annual rent', 'الإيجار السنوي التقديري')}:{' '}
                      {property ? formatAed(property.estAnnualRentAed, locale) : '—'}
                    </span>
                    {property ? (
                      <ActionLink href={`/landlord/properties/${property.id}`}>
                        {l('Unit details', 'تفاصيل الوحدة')}
                      </ActionLink>
                    ) : null}
                  </div>
                  {decision.outcome === 'terms_offered' && application.state === 'terms_offered' ? (
                    <p className="mt-3 rounded-md bg-accent-soft p-3 text-label text-accent">
                      {l(
                        'Awaiting the applicant’s explicit acceptance. The landlord cannot accept on their behalf.',
                        'بانتظار قبول المتقدم الصريح. لا يمكن للمالك القبول نيابةً عنه.',
                      )}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={FileCheck}
            title={
              decisions.length
                ? l('No matching decisions', 'لا توجد قرارات مطابقة')
                : l('No lease decisions yet', 'لا توجد قرارات إيجار بعد')
            }
            description={l(
              'Decisions saved while reviewing applications appear here.',
              'تظهر هنا القرارات المحفوظة أثناء مراجعة الطلبات.',
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
              ) : (
                <ActionLink href="/landlord/applications">
                  {l('Review applications', 'مراجعة الطلبات')}
                </ActionLink>
              )
            }
          />
        )}
        <p className="text-caption text-fg-tertiary">
          {l(
            'These are application decisions and estimated terms in the demo. No signed lease document is stored.',
            'هذه قرارات طلبات وشروط تقديرية في العرض. لا يُحفظ مستند إيجار موقع.',
          )}
        </p>
      </div>
    </>
  );
}
