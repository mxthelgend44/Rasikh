'use client';

import { useState } from 'react';
import type { DataLabel, Destination } from '@rasikh/shared';
import {
  Ban,
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  EyeOff,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Illustration } from '@/components/ui/illustration';
import { Switch } from '@/components/ui/switch';
import {
  PASSPORT_DESTINATIONS,
  PASSPORT_LABELS,
  policyFor,
  type PolicyCell,
} from '@/domain/policy';
import { formatDate } from '@/lib/format';
import { intlTag, type MessageKey } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/provider';
import { useNewcomer } from '@/store/person';
import { useStore } from '@/store/provider';
import { localizedRecord, translatedRecord } from './localized-record';

const en = {
  intro: 'Review the demo policy and record your consent for each recipient category.',
  guard: 'Live Guard enforcement is unverified',
  guardHint:
    'These controls update demo consent. The records below are illustrative and do not prove that a real request was checked.',
  current: 'Current consent',
  noConsent: 'No optional sharing is currently permitted.',
  scope: 'Consent applies to every recipient in this category.',
  saved: 'Consent updated.',
  revoked: 'Consent revoked. Future demo decisions will not allow this sharing.',
  statAllowed: 'Allowed by rule',
  statConsent: 'Your consent given',
  statNever: 'Never shared',
  error: 'The change could not be saved. Your current consent is shown below.',
  revoke: 'Revoke',
  revokeHint:
    'Revoking changes future demo decisions. It does not undo past disclosures or erase records.',
  recorded: 'Recorded',
  fixed: 'Fixed demo policy',
  permission: 'Permission',
  log: 'Demo check history',
  noChecks: 'No checks recorded for this person.',
  allow: 'Recorded allow',
  needs_consent: 'Consent needed',
  deny: 'Recorded block',
  original: 'Original record',
  rule: 'Policy rule',
  labels: 'Data involved',
  model: 'AI extraction provider',
  extraction_only: 'Extraction only',
  redacted: 'Redacted only',
  raw: 'Raw details are unavailable to this recipient under the demo policy.',
  unrecognized: 'Review the original reason recorded for this demo check.',
  empty: 'No newcomer selected',
  emptyHint: 'Create a hire from the employer view to see their consent settings.',
};
const ar: Record<keyof typeof en, string> = {
  intro: 'راجع سياسة العرض وسجّل موافقتك لكل فئة من الجهات المستلمة.',
  guard: 'لم يتم التحقق من تطبيق Guard الفعلي',
  guardHint:
    'تحدّث هذه الأدوات موافقات العرض التجريبي. السجلات أدناه توضيحية ولا تثبت فحص طلب فعلي.',
  current: 'الموافقات الحالية',
  noConsent: 'لا توجد موافقات حالية على المشاركة الاختيارية.',
  scope: 'تسري الموافقة على جميع الجهات ضمن هذه الفئة.',
  saved: 'تم تحديث الموافقة.',
  revoked: 'أُلغيت الموافقة. لن تسمح قرارات العرض المستقبلية بهذه المشاركة.',
  statAllowed: 'مسموح بالقاعدة',
  statConsent: 'موافقاتك الممنوحة',
  statNever: 'لا تُشارك أبدًا',
  error: 'تعذّر حفظ التغيير. تظهر موافقاتك الحالية أدناه.',
  revoke: 'إلغاء الموافقة',
  revokeHint:
    'يؤثر الإلغاء على قرارات العرض المستقبلية، ولا يسترجع البيانات السابقة أو يمحو السجلات.',
  recorded: 'سُجّلت في',
  fixed: 'سياسة عرض ثابتة',
  permission: 'الموافقة',
  log: 'سجل فحوص العرض',
  noChecks: 'لا توجد فحوص مسجّلة لهذا الشخص.',
  allow: 'سماح مسجّل',
  needs_consent: 'تحتاج موافقة',
  deny: 'منع مسجّل',
  original: 'السجل الأصلي',
  rule: 'قاعدة السياسة',
  labels: 'البيانات المعنية',
  model: 'مزود استخراج بالذكاء الاصطناعي',
  extraction_only: 'للاستخراج فقط',
  redacted: 'بعد إخفاء التفاصيل فقط',
  raw: 'تمنع سياسة العرض مشاركة التفاصيل الأصلية مع هذه الجهة.',
  unrecognized: 'راجع السبب الأصلي المسجّل لهذا الفحص التجريبي.',
  empty: 'لم يتم اختيار وافد',
  emptyHint: 'أضف موظفاً من واجهة جهة العمل لعرض إعدادات موافقته.',
};
const CELL_KEYS: Partial<Record<PolicyCell, MessageKey>> = {
  allow: 'passport.allowed',
  deny: 'passport.never',
  derived_only: 'passport.derived',
  insurance_only: 'passport.insurance',
};
const TONES: Record<'allow' | 'deny' | 'needs_consent', BadgeTone> = {
  allow: 'neutral',
  deny: 'danger',
  needs_consent: 'warning',
};

const ROW_TONE = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  accent: 'bg-accent-soft text-accent',
  neutral: 'bg-track text-fg-secondary',
} as const;

function policyIcon(policy: PolicyCell, granted: boolean): [LucideIcon, keyof typeof ROW_TONE] {
  if (policy === 'consent') return granted ? [CircleCheck, 'success'] : [KeyRound, 'warning'];
  if (policy === 'deny') return [Ban, 'neutral'];
  if (policy === 'derived_only') return [EyeOff, 'accent'];
  return [Check, 'success'];
}

export function PassportView() {
  const { locale, t } = useI18n();
  const copy = locale === 'ar' ? ar : en;
  const { state, hire } = useNewcomer();
  const store = useStore();
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<'saved' | 'revoked' | 'error' | null>(null);
  const [noticeHire, setNoticeHire] = useState<string | null>(null);
  const [destination, setDestination] = useState<Destination>('landlord');
  if (!hire) return <EmptyState title={copy.empty} description={copy.emptyHint} />;
  const grants = Object.values(state.grants).filter((grant) => grant.hireId === hire.id);
  const checks = Object.values(state.guardChecks)
    .filter((check) => check.caseId === hire.id)
    .sort((a, b) => b.at.localeCompare(a.at));
  const destinations: Destination[] = [...PASSPORT_DESTINATIONS, 'llm_provider'];
  const destinationName = (value: Destination) =>
    value === 'llm_provider'
      ? copy.model
      : value === 'newcomer'
        ? t('owner.newcomer')
        : t(`passport.group.${value}` as MessageKey);
  const labelName = (label: DataLabel) => t(`passport.label.${label}` as MessageKey);
  const number = (value: number) => new Intl.NumberFormat(intlTag(locale)).format(value);
  const stats = PASSPORT_LABELS.reduce(
    (total, label) => {
      const policy = policyFor(label, destination);
      if (policy === 'deny') total.never += 1;
      else if (policy === 'consent') {
        total.consentTotal += 1;
        if (grants.some((grant) => grant.label === label && grant.destination === destination))
          total.consentOn += 1;
      } else total.allowed += 1;
      return total;
    },
    { allowed: 0, consentOn: 0, consentTotal: 0, never: 0 },
  );

  async function setConsent(label: DataLabel, target: Destination, granted: boolean) {
    if (!hire || busy) return;
    setBusy(`${label}:${target}`);
    setNotice(null);
    setNoticeHire(hire.id);
    try {
      await store.dispatch({
        type: 'grant.set',
        hireId: hire.id,
        label,
        destination: target,
        granted,
      });
      setNotice(granted ? 'saved' : 'revoked');
    } catch {
      setNotice('error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-heading font-medium">{t('passport.title')}</h1>
          <p className="mt-1 text-body text-fg-secondary">{copy.intro}</p>
        </div>
        <Illustration variant="privacy-consent" className="max-w-[6rem] shrink-0" />
      </div>
      <div className="mt-4 rounded-lg border border-warning/30 bg-warning-soft p-3">
        <p className="flex items-center gap-2 text-body font-medium text-warning">
          <ShieldAlert aria-hidden className="size-4 shrink-0" />
          {copy.guard}
        </p>
        <p className="mt-1 text-label text-fg-secondary">{copy.guardHint}</p>
      </div>
      <section className="mt-6" aria-labelledby="current-consent">
        <h2 id="current-consent" className="text-title font-medium">
          {copy.current}
        </h2>
        <p className="mt-1 text-label text-fg-secondary">{copy.revokeHint}</p>
        {grants.length ? (
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
            {grants.map((grant) => (
              <li key={grant.id} className="flex items-center gap-3 px-3 py-3">
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success"
                >
                  <CircleCheck className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium">
                    {labelName(grant.label)} · {destinationName(grant.destination)}
                  </p>
                  <p className="mt-0.5 text-label text-fg-tertiary">
                    {copy.recorded} {formatDate(grant.grantedAt, locale)}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  className="min-h-11"
                  disabled={Boolean(busy)}
                  loading={busy === `${grant.label}:${grant.destination}`}
                  onClick={() => setConsent(grant.label, grant.destination, false)}
                  aria-label={`${copy.revoke}: ${labelName(grant.label)} · ${destinationName(grant.destination)}`}
                >
                  {copy.revoke}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 flex items-center gap-2 rounded-lg bg-track p-3 text-body text-fg-secondary">
            <ShieldCheck aria-hidden className="size-4 shrink-0" />
            {copy.noConsent}
          </p>
        )}
      </section>
      <div role={notice === 'error' ? 'alert' : 'status'} aria-live="polite">
        {notice && noticeHire === hire.id ? (
          <p
            className={`mt-3 flex items-start gap-2 rounded-lg p-3 text-body motion-safe:animate-pop-in ${notice === 'error' ? 'bg-danger-soft text-danger' : notice === 'revoked' ? 'bg-warning-soft text-warning' : 'bg-success-soft text-success'}`}
          >
            {notice === 'error' ? (
              <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            ) : (
              <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
            )}
            <span>{copy[notice]}</span>
          </p>
        ) : null}
      </div>
      <section className="mt-6" aria-label={copy.permission}>
        <div
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2"
          role="group"
          aria-label={copy.permission}
        >
          {destinations.map((target) => (
            <button
              key={target}
              type="button"
              aria-pressed={destination === target}
              onClick={() => setDestination(target)}
              className={`inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-body transition-colors active:bg-selected ${destination === target ? 'border-accent bg-accent-soft font-medium text-accent' : 'border-line-strong text-fg-secondary hover:bg-hover'}`}
            >
              {destinationName(target)}
            </button>
          ))}
        </div>
        <h2 className="mt-4 text-title font-medium">{destinationName(destination)}</h2>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-success-soft px-2 py-2.5">
            <dd className="text-title font-medium text-success">{number(stats.allowed)}</dd>
            <dt className="text-caption text-fg-secondary">{copy.statAllowed}</dt>
          </div>
          <div className="rounded-lg bg-warning-soft px-2 py-2.5">
            <dd className="text-title font-medium text-warning">
              {number(stats.consentOn)} / {number(stats.consentTotal)}
            </dd>
            <dt className="text-caption text-fg-secondary">{copy.statConsent}</dt>
          </div>
          <div className="rounded-lg bg-track px-2 py-2.5">
            <dd className="text-title font-medium text-fg">{number(stats.never)}</dd>
            <dt className="text-caption text-fg-secondary">{copy.statNever}</dt>
          </div>
        </dl>
        <p className="mt-3 text-label text-fg-secondary">{copy.scope}</p>
        <ul className="mt-2 divide-y divide-line">
          {PASSPORT_LABELS.map((label) => {
            const policy = policyFor(label, destination);
            const grant = grants.find(
              (item) => item.label === label && item.destination === destination,
            );
            const cellKey = CELL_KEYS[policy];
            const [RowIcon, rowTone] = policyIcon(policy, Boolean(grant));
            const fixedLabel = cellKey
              ? t(cellKey)
              : policy === 'extraction_only'
                ? copy.extraction_only
                : copy.redacted;
            return (
              <li
                key={`${destination}:${label}`}
                className="flex min-h-14 items-center gap-3 py-2.5"
              >
                <span
                  aria-hidden
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${ROW_TONE[rowTone]}`}
                >
                  <RowIcon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium">{labelName(label)}</p>
                  <p className="mt-0.5 text-label text-fg-tertiary">
                    {policy === 'consent'
                      ? t(grant ? 'passport.on' : 'passport.consent')
                      : copy.fixed}
                  </p>
                </div>
                {policy === 'consent' ? (
                  <Switch
                    checked={Boolean(grant)}
                    disabled={Boolean(busy)}
                    aria-label={`${labelName(label)} · ${destinationName(destination)}`}
                    onChange={(next) => setConsent(label, destination, next)}
                  />
                ) : (
                  <Badge shape="pill" tone={policy === 'deny' ? 'neutral' : 'accent'}>
                    {fixedLabel}
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>
      </section>
      <section className="mt-7 border-t border-line pt-5" aria-labelledby="guard-history">
        <h2 id="guard-history" className="text-title font-medium">
          {copy.log}
        </h2>
        {!checks.length ? (
          <p className="mt-2 text-body text-fg-secondary">{copy.noChecks}</p>
        ) : (
          <ol className="mt-2 divide-y divide-line">
            {checks.map((check) => (
              <li key={check.id} className="py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={TONES[check.decision]} shape="pill">
                    {copy[check.decision]}
                  </Badge>
                  <span className="text-label text-fg-secondary">
                    {destinationName(check.destination)}
                  </span>
                  <time className="text-label text-fg-tertiary" dateTime={check.at}>
                    {formatDate(check.at, locale)}
                  </time>
                </div>
                <p className="mt-2 text-body text-fg-secondary">
                  {translatedRecord(check.reason, locale)
                    ? localizedRecord(check.reason, locale)
                    : copy.unrecognized}
                </p>
                {check.blockedLabels.length ? (
                  <p className="mt-1 text-label text-fg-secondary">
                    {copy.labels}: {check.blockedLabels.map(labelName).join(' · ')}
                  </p>
                ) : null}
                <details className="group mt-2 text-label text-fg-tertiary">
                  <summary className="flex min-h-8 cursor-pointer items-center gap-1">
                    {copy.original}
                    <ChevronDown aria-hidden className="size-3.5 group-open:rotate-180" />
                  </summary>
                  <p className="mt-1 break-words">
                    <bdi dir="auto">{check.reason}</bdi>
                  </p>
                  <p className="mt-1 break-all">
                    {copy.rule}: <bdi dir="ltr">{check.policyRule}</bdi>
                  </p>
                </details>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
