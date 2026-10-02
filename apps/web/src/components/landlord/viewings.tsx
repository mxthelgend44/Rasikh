'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Clock3, MapPin, Plus } from 'lucide-react';
import type { Viewing } from '@/domain/types';
import { demoNow, demoNowMs, toAbuDhabiIso } from '@/domain/clock';
import { intlTag } from '@/lib/i18n';
import { formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  ActionLink,
  controlClass,
  Feedback,
  SectionTitle,
  textAreaClass,
  Title,
  useLandlordLocale,
  useMutation,
  usePortfolio,
} from './shared';

function timeLabel(value: string, locale: 'en' | 'ar') {
  return new Intl.DateTimeFormat(intlTag(locale), {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Dubai',
  }).format(new Date(value));
}

export function ViewingsPage({
  initialProperty = '',
  initialApplication = '',
}: {
  initialProperty?: string;
  initialApplication?: string;
}) {
  const { state, landlordId, properties, setLandlordId } = usePortfolio();
  const { locale, l } = useLandlordLocale();
  const [adding, setAdding] = useState(Boolean(initialProperty));
  const [filter, setFilter] = useState('planned');
  const [editing, setEditing] = useState('');
  const mutation = useMutation();
  const initialOwner = state.properties[initialProperty]?.landlordId;
  useEffect(() => {
    if (initialOwner) setLandlordId(initialOwner);
  }, [initialOwner, setLandlordId]);
  const all = Object.values(state.viewings)
    .filter((v) => landlordId === 'all' || v.landlordId === landlordId)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const rows = all.filter((v) => filter === 'all' || v.status === filter);
  async function setStatus(viewing: Viewing, status: 'completed' | 'cancelled') {
    await mutation.run(
      {
        type: 'viewing.update',
        landlordId: viewing.landlordId,
        viewingId: viewing.id,
        patch: { status },
      },
      status === 'completed'
        ? l('Viewing marked complete.', 'سُجلت المعاينة كمكتملة.')
        : l('Viewing plan cancelled.', 'أُلغيت خطة المعاينة.'),
    );
  }
  return (
    <>
      <Title
        eyebrow={l('Property visits', 'زيارات العقارات')}
        title={l('Viewings', 'المعاينات')}
        description={l(
          'Organize visits, keep the unit and applicant together, and track what happened.',
          'نظم الزيارات واربط الوحدة بالمتقدم وتابع نتائجها.',
        )}
        action={
          <Button
            className="h-10"
            icon={<Plus />}
            onClick={() => setAdding((value) => !value)}
            aria-expanded={adding}
            aria-controls="viewing-plan"
          >
            {adding ? l('Close form', 'إغلاق النموذج') : l('Plan viewing', 'تخطيط معاينة')}
          </Button>
        }
      />
      <div className="space-y-5 px-4 pb-8 sm:px-6">
        {adding ? (
          <section id="viewing-plan" className="rounded-lg border border-edge bg-subtle p-5">
            <SectionTitle title={l('Plan a property viewing', 'تخطيط معاينة عقار')} />
            <ViewingForm
              key={landlordId + initialProperty + initialApplication}
              initialProperty={initialProperty}
              initialApplication={initialApplication}
              onDone={() => setAdding(false)}
            />
          </section>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1" aria-label={l('Viewing status', 'حالة المعاينة')}>
            {(['planned', 'completed', 'cancelled', 'all'] as const).map((value) => (
              <Button
                key={value}
                variant={filter === value ? 'primary' : 'ghost'}
                className="h-10"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {value === 'planned'
                  ? l('Planned', 'مخططة')
                  : value === 'completed'
                    ? l('Completed', 'مكتملة')
                    : value === 'cancelled'
                      ? l('Cancelled', 'ملغاة')
                      : l('All', 'الكل')}
              </Button>
            ))}
          </div>
          <span className="text-label text-fg-tertiary" role="status">
            {rows.length} {rows.length === 1 ? l('viewing', 'معاينة') : l('viewings', 'معاينات')}
          </span>
        </div>
        <Feedback error={mutation.error} success={mutation.success} />
        {rows.length ? (
          <div className="space-y-4">
            {rows.map((viewing) => {
              const property = state.properties[viewing.propertyId];
              const application = viewing.applicationId
                ? state.applications[viewing.applicationId]
                : undefined;
              const hire =
                application && application.state !== 'awaiting_approval'
                  ? state.hires[application.hireId]
                  : undefined;
              return (
                <article key={viewing.id} className="rounded-lg border border-edge p-5">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex min-w-[68px] flex-col items-center justify-center rounded-lg bg-accent-soft p-3 text-accent">
                      <CalendarDays aria-hidden className="size-5" />
                      <span className="mt-2 text-caption font-medium">
                        {timeLabel(viewing.startsAt, locale)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-title font-medium">
                          {property?.name ?? l('Property unavailable', 'العقار غير متاح')} ·{' '}
                          {l('Unit', 'الوحدة')} {property?.unit ?? '—'}
                        </h2>
                        <Badge
                          tone={
                            viewing.status === 'completed'
                              ? 'success'
                              : viewing.status === 'cancelled'
                                ? 'neutral'
                                : 'accent'
                          }
                        >
                          {viewing.status === 'planned'
                            ? l('Planned', 'مخططة')
                            : viewing.status === 'completed'
                              ? l('Completed', 'مكتملة')
                              : l('Cancelled', 'ملغاة')}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-label text-fg-secondary">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 aria-hidden className="size-4" />
                          {formatDate(viewing.startsAt, locale)} ·{' '}
                          {timeLabel(viewing.startsAt, locale)} · {viewing.durationMinutes}{' '}
                          {l('min', 'دقيقة')}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin aria-hidden className="size-4" />
                          {property?.area ?? '—'}
                        </span>
                      </div>
                      {hire ? (
                        <p className="mt-2 text-label text-fg-secondary">
                          {l('Applicant', 'المتقدم')}: {hire.fullName}
                        </p>
                      ) : (
                        <p className="mt-2 text-label text-fg-tertiary">
                          {l('General property viewing', 'معاينة عامة للعقار')}
                        </p>
                      )}
                      {viewing.note ? (
                        <p className="mt-3 text-body text-fg-secondary" dir="auto">
                          {viewing.note}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                    <div className="flex flex-wrap gap-4">
                      {property ? (
                        <ActionLink href={`/landlord/properties/${property.id}`}>
                          {l('Property', 'العقار')}
                        </ActionLink>
                      ) : null}
                      {application && application.state !== 'awaiting_approval' ? (
                        <ActionLink href={`/landlord/applications/${application.id}`}>
                          {l('Application', 'الطلب')}
                        </ActionLink>
                      ) : null}
                    </div>
                    {viewing.status === 'planned' ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          className="h-10"
                          disabled={mutation.pending}
                          onClick={() => setEditing(editing === viewing.id ? '' : viewing.id)}
                          aria-expanded={editing === viewing.id}
                        >
                          {l('Reschedule', 'تغيير الموعد')}
                        </Button>
                        <Button
                          variant="secondary"
                          className="h-10"
                          disabled={mutation.pending}
                          onClick={() => void setStatus(viewing, 'cancelled')}
                        >
                          {l('Cancel plan', 'إلغاء الخطة')}
                        </Button>
                        <Button
                          className="h-10"
                          disabled={mutation.pending}
                          onClick={() => void setStatus(viewing, 'completed')}
                        >
                          {l('Mark complete', 'تسجيل الاكتمال')}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  {editing === viewing.id ? (
                    <div className="mt-5 border-t border-line pt-5">
                      <ViewingForm viewing={viewing} onDone={() => setEditing('')} />
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title={
              all.length
                ? l('No viewings with this status', 'لا توجد معاينات بهذه الحالة')
                : l('No viewing plans yet', 'لا توجد خطط معاينة بعد')
            }
            description={l(
              'Save a visit plan for one of your managed properties. Plans are internal; no invitation is sent.',
              'احفظ خطة زيارة لأحد عقاراتك. الخطط داخلية ولا تُرسل دعوة.',
            )}
            action={
              <Button
                className="h-10"
                disabled={!properties.length}
                onClick={() => setAdding(true)}
              >
                {l('Plan viewing', 'تخطيط معاينة')}
              </Button>
            }
          />
        )}
        <p className="text-caption text-fg-tertiary">
          {l(
            'All times are Abu Dhabi time (GMT+4). Viewing plans are shared demo records; invitations are arranged separately.',
            'جميع المواعيد بتوقيت أبوظبي (GMT+4). خطط المعاينة سجلات عرض مشتركة، وتُنظم الدعوات بشكل منفصل.',
          )}
        </p>
      </div>
    </>
  );
}

function ViewingForm({
  viewing,
  initialProperty = '',
  initialApplication = '',
  onDone,
}: {
  viewing?: Viewing;
  initialProperty?: string;
  initialApplication?: string;
  onDone: () => void;
}) {
  const { state, properties, landlordId } = usePortfolio();
  const { l } = useLandlordLocale();
  const [propertyId, setPropertyId] = useState(
    viewing?.propertyId ??
      (properties.some((p) => p.id === initialProperty)
        ? initialProperty
        : (properties[0]?.id ?? '')),
  );
  const [applicationId, setApplicationId] = useState(() => {
    if (viewing?.applicationId) return viewing.applicationId;
    const application = state.applications[initialApplication];
    return application &&
      application.propertyId === propertyId &&
      application.state !== 'awaiting_approval' &&
      application.state !== 'declined'
      ? initialApplication
      : '';
  });
  const [start, setStart] = useState(
    (viewing?.startsAt ?? toAbuDhabiIso(demoNowMs(state) + 24 * 60 * 60 * 1000)).slice(0, 16),
  );
  const [duration, setDuration] = useState(String(viewing?.durationMinutes ?? 30));
  const [note, setNote] = useState(viewing?.note ?? '');
  const mutation = useMutation();
  const property = state.properties[propertyId];
  const applications = Object.values(state.applications).filter(
    (a) =>
      a.kind === 'rental' &&
      a.propertyId === propertyId &&
      a.state !== 'awaiting_approval' &&
      (a.state !== 'declined' || viewing?.applicationId === a.id),
  );
  const selectedApplication = applications.find((a) => a.id === applicationId);
  const startsAt = `${start}:00+04:00`;
  const valid =
    Boolean(property) &&
    (landlordId === 'all' || property.landlordId === landlordId) &&
    !Number.isNaN(Date.parse(startsAt)) &&
    Date.parse(startsAt) > Date.parse(demoNow(state)) &&
    (!applicationId || Boolean(selectedApplication));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || !property) return;
    const saved = await mutation.run(
      viewing
        ? {
            type: 'viewing.update',
            landlordId: viewing.landlordId,
            viewingId: viewing.id,
            patch: {
              startsAt,
              durationMinutes: Number(duration),
              note: note.trim(),
            },
          }
        : {
            type: 'viewing.create',
            landlordId: property.landlordId,
            viewing: {
              propertyId,
              applicationId: applicationId || undefined,
              startsAt,
              durationMinutes: Number(duration),
              note: note.trim(),
            },
          },
      l('Viewing plan saved.', 'حُفظت خطة المعاينة.'),
    );
    if (saved) onDone();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block space-y-2 lg:col-span-2">
          <span className="text-label font-medium">{l('Property', 'العقار')}</span>
          <select
            className={controlClass}
            disabled={Boolean(viewing)}
            value={propertyId}
            onChange={(e) => {
              setPropertyId(e.target.value);
              setApplicationId('');
            }}
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.unit}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-label font-medium">
            {l('Date and time (GMT+4)', 'التاريخ والوقت (GMT+4)')}
          </span>
          <input
            type="datetime-local"
            required
            className={controlClass}
            min={demoNow(state).slice(0, 16)}
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-label font-medium">{l('Duration', 'المدة')}</span>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className={controlClass}
          >
            {[15, 30, 45, 60, 90].map((n) => (
              <option key={n} value={n}>
                {n} {l('minutes', 'دقيقة')}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2 sm:col-span-2">
          <span className="text-label font-medium">
            {l('Related application (optional)', 'الطلب المرتبط (اختياري)')}
          </span>
          <select
            className={controlClass}
            disabled={Boolean(viewing)}
            value={selectedApplication?.id ?? ''}
            onChange={(e) => setApplicationId(e.target.value)}
          >
            <option value="">{l('General property viewing', 'معاينة عامة للعقار')}</option>
            {applications.map((a) => (
              <option key={a.id} value={a.id}>
                {state.hires[a.hireId]?.fullName ?? a.id}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block space-y-2">
        <span className="text-label font-medium">{l('Visit notes', 'ملاحظات الزيارة')}</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          className={textAreaClass}
          placeholder={l(
            'Meeting point, access instructions or questions to discuss…',
            'نقطة اللقاء وتعليمات الدخول أو الأسئلة المطروحة…',
          )}
        />
      </label>
      <p className="text-caption text-fg-tertiary">
        {l(
          'Choose a future time on the demo clock. This saves an internal plan and does not send an invitation.',
          'اختر موعداً مستقبلياً وفق ساعة العرض. يُحفظ التخطيط داخلياً ولا تُرسل دعوة.',
        )}
      </p>
      <Feedback error={mutation.error} success={mutation.success} />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" className="h-10" disabled={!valid || mutation.pending}>
          {mutation.pending
            ? l('Saving…', 'جارٍ الحفظ…')
            : viewing
              ? l('Save new time', 'حفظ الموعد الجديد')
              : l('Save viewing plan', 'حفظ خطة المعاينة')}
        </Button>
        <Button variant="secondary" className="h-10" onClick={onDone} disabled={mutation.pending}>
          {l('Cancel', 'إلغاء')}
        </Button>
      </div>
    </form>
  );
}
