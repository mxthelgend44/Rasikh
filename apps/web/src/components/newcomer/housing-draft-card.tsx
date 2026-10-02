'use client';

import { useState } from 'react';
import { DEMO_FIXTURES } from '@rasikh/shared';
import { Button } from '@/components/ui/button';
import { demoRentalRisk } from '@/domain/rental-risk';
import { stepsOf } from '@/domain/selectors';
import { formatAed } from '@/lib/format';
import { useI18n } from '@/lib/i18n/provider';
import { useNewcomer } from '@/store/person';
import { useStore } from '@/store/provider';

const COPY = {
  en: {
    eyebrow: 'Next step for your agent',
    title: 'Prepare a rental application',
    hint: 'The agent drafts it from your verified documents and asks for your approval. Nothing is sent until you approve.',
    cta: 'Prepare application',
    busy: 'Preparing…',
    error: 'The draft could not be prepared.',
    unit: (unit: string, bedrooms: number) =>
      `Unit ${unit} · ${bedrooms === 0 ? 'studio' : `${bedrooms} ${bedrooms === 1 ? 'bedroom' : 'bedrooms'}`}`,
    approvalTitle: (landlord: string) =>
      `Approve submitting your rental application to ${landlord}?`,
    detail: (property: string, area: string, unit: string, rent: string) =>
      `${property}, ${area}, unit ${unit}, est. ${rent} a year. Shared: your employment letter, your passport (needs your consent) and an affordability result instead of your salary.`,
  },
  ar: {
    eyebrow: 'الخطوة التالية للوكيل',
    title: 'إعداد طلب إيجار',
    hint: 'يعدّ الوكيل المسودة من مستنداتك الموثّقة ويطلب موافقتك. لا يُرسل شيء قبل موافقتك.',
    cta: 'إعداد الطلب',
    busy: 'جارٍ الإعداد…',
    error: 'تعذّر إعداد المسودة.',
    unit: (unit: string, bedrooms: number) =>
      `الوحدة ${unit} · ${bedrooms === 0 ? 'استوديو' : `${bedrooms} غرف`}`,
    approvalTitle: (landlord: string) => `الموافقة على تقديم طلب الإيجار إلى ${landlord}؟`,
    detail: (property: string, area: string, unit: string, rent: string) =>
      `${property}، ${area}، الوحدة ${unit}، الإيجار السنوي التقديري ${rent}. يُشارك: خطاب العمل وجواز السفر (بموافقتك) ونتيجة القدرة على السداد بدل الراتب.`,
  },
};

/**
 * Lets a hire whose housing step is open get a rental draft. Without it a freshly added hire
 * reaches "Find and rent a home" and nothing can happen. It uses the fixture unit from
 * INTEGRATION.md when present, so the demo path matches the Guard and TAMM fixtures.
 */
export function HousingDraftCard() {
  const { locale, t } = useI18n();
  const copy = COPY[locale === 'ar' ? 'ar' : 'en'];
  const { state, hire } = useNewcomer();
  const store = useStore();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  if (!hire) return null;

  const housing = stepsOf(state, hire.id).find((step) => step.key === 'housing');
  const open = housing?.status === 'ready' || housing?.status === 'in_progress';
  const hasRental = Object.values(state.applications).some(
    (application) =>
      application.hireId === hire.id &&
      application.kind === 'rental' &&
      application.state !== 'declined',
  );
  const properties = Object.values(state.properties);
  const property =
    properties.find((candidate) => candidate.leaseRef === DEMO_FIXTURES.lease) ??
    properties.find((candidate) => candidate.area === hire.preferredArea);
  const landlord = property ? state.landlords[property.landlordId] : undefined;
  if (!housing || !open || hasRental || !property || !landlord) return null;

  const employerName = state.employers[hire.employerId]?.name ?? '';

  async function prepare() {
    if (!hire || !housing || !property || !landlord) return;
    setBusy(true);
    setFailed(null);
    try {
      await store.dispatch({
        type: 'application.create',
        application: {
          hireId: hire.id,
          kind: 'rental',
          partyId: landlord.id,
          propertyId: property.id,
          employerBacked: hire.backing.status === 'backed',
          disclosed: [
            { label: 'employment', derived: false },
            { label: 'passport', derived: false },
            { label: 'salary', derived: true },
          ],
          risk: demoRentalRisk(hire, property, employerName),
        },
        approval: {
          title: copy.approvalTitle(landlord.name),
          detail: copy.detail(
            property.name,
            property.area,
            property.unit,
            formatAed(property.estAnnualRentAed, locale),
          ),
          stepId: housing.id,
        },
      });
    } catch (error) {
      setFailed(error instanceof Error ? error.message : copy.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby="housing-draft-title"
      className="mt-6 rounded-xl border border-line bg-raised p-4"
    >
      <p className="text-label text-fg-tertiary">{copy.eyebrow}</p>
      <h2 id="housing-draft-title" className="mt-1 text-title font-medium">
        {copy.title}
      </h2>
      <p className="mt-1 text-body text-fg-secondary">
        <bdi>{property.name}</bdi> · {property.area} · {copy.unit(property.unit, property.bedrooms)}
      </p>
      <p className="mt-0.5 text-body text-fg-secondary">
        {t('common.est')} <bdi dir="ltr">{formatAed(property.estAnnualRentAed, locale)}</bdi>
      </p>
      <p className="mt-2 text-body text-fg-tertiary">{copy.hint}</p>
      <Button size="lg" className="mt-3 min-h-11" disabled={busy} onClick={() => void prepare()}>
        {busy ? copy.busy : copy.cta}
      </Button>
      {failed ? (
        <p role="alert" className="mt-2 text-body text-danger">
          {copy.error} <bdi>{failed}</bdi>
        </p>
      ) : null}
    </section>
  );
}
