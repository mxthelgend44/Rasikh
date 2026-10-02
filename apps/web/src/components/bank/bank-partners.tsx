'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Building2, Handshake, Search, ShieldCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';
import { useAppState } from '@/store/provider';
import { bankApplications, bankText, initials, OPEN_STATES } from './bank-data';
import { BankHeader } from './bank-header';
import { BankModal } from './bank-modal';

export function BankPartners() {
  const state = useAppState();
  const { locale } = useI18n();
  const text = (en: string, ar: string) => bankText(locale, en, ar);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const applications = bankApplications(state);
  const employerRows = Object.values(state.employers).map((employer) => {
    const hires = Object.values(state.hires).filter((hire) => hire.employerId === employer.id);
    const portfolio = applications.filter((application) =>
      hires.some((hire) => hire.id === application.hireId),
    );
    return {
      employer,
      hires,
      portfolio,
      open: portfolio.filter((application) => OPEN_STATES.includes(application.state)).length,
      approved: portfolio.filter((application) => application.state === 'approved').length,
    };
  });
  const rows = employerRows.filter(
    ({ employer, portfolio }) =>
      `${employer.name} ${employer.industry} ${employer.area}`
        .toLowerCase()
        .includes(query.toLowerCase().trim()) &&
      (filter === 'all' ||
        (filter === 'portfolio' ? portfolio.length > 0 : portfolio.length === 0)),
  );
  const selected = employerRows.find((row) => row.employer.id === selectedId);
  const activeEmployers = employerRows.filter((row) => row.portfolio.length > 0);
  return (
    <>
      <BankHeader
        title={text('Employer partners', 'جهات العمل')}
        description={text(
          'An employer portfolio inferred from the shared relocation records.',
          'سجل جهات العمل المستنتج من سجلات الانتقال المشتركة.',
        )}
      />
      <div className="space-y-6 p-5 sm:p-7">
        <section className="flex flex-wrap items-start justify-between gap-5 rounded-xl border border-accent/20 bg-accent-soft p-5 sm:p-6">
          <div className="max-w-xl">
            <p className="mb-2 flex items-center gap-2 text-label text-accent">
              <Handshake aria-hidden className="size-4" />
              {text('Backed arrivals, clearer reviews', 'دعم الوافدين وتوضيح المراجعات')}
            </p>
            <h2 className="text-heading font-medium">
              {text('See who stands behind each application', 'اطلع على جهة الدعم وراء كل طلب')}
            </h2>
            <p className="mt-2 text-body leading-6 text-fg-secondary">
              {text(
                'Employer backing is attached to an application. These records help you understand the onboarding pipeline; they do not confirm a formal banking partnership.',
                'يرفق دعم جهة العمل بالطلب. تساعد هذه السجلات في فهم مسار التهيئة ولا تؤكد وجود شراكة بنكية رسمية.',
              )}
            </p>
          </div>
          <dl className="flex rounded-lg border border-accent/20 bg-surface">
            <div className="flex flex-col-reverse px-5 py-4">
              <dt className="mt-1 text-label text-fg-secondary">
                {text('With applications', 'لديها طلبات')}
              </dt>
              <dd className="text-display font-medium tabular-nums">{activeEmployers.length}</dd>
            </div>
            <div className="flex flex-col-reverse border-s border-accent/20 px-5 py-4">
              <dt className="mt-1 text-label text-fg-secondary">
                {text('Backed applications', 'طلبات مدعومة')}
              </dt>
              <dd className="text-display font-medium tabular-nums">
                {applications.filter((application) => application.employerBacked).length}
              </dd>
            </div>
          </dl>
        </section>
        <section aria-labelledby="bank-employer-directory">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="bank-employer-directory" className="text-title font-medium">
                {text('Employer directory', 'دليل جهات العمل')}
              </h2>
              <p className="mt-1 text-label text-fg-secondary">
                {text(
                  'Open a profile or review the applications linked to that employer.',
                  'افتح ملفاً أو راجع الطلبات المرتبطة بجهة العمل.',
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="flex flex-col gap-1.5 text-label text-fg-secondary">
                <span>{text('Search employers', 'البحث عن جهة عمل')}</span>
                <span className="relative">
                  <Search
                    aria-hidden
                    className="pointer-events-none absolute start-3 top-3 size-4 text-fg-tertiary"
                  />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={text('Name, industry or area', 'الاسم أو القطاع أو المنطقة')}
                    className="h-10 w-full rounded-md border border-line-strong bg-surface pe-3 ps-9 text-body text-fg sm:w-64"
                  />
                </span>
              </label>
              <label className="flex flex-col gap-1.5 text-label text-fg-secondary">
                <span>{text('Portfolio', 'السجل')}</span>
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  className="h-10 rounded-md border border-line-strong bg-surface px-3 text-body text-fg"
                >
                  <option value="all">{text('All employers', 'كل جهات العمل')}</option>
                  <option value="portfolio">{text('With applications', 'لديها طلبات')}</option>
                  <option value="pipeline">
                    {text('No applications yet', 'دون طلبات حتى الآن')}
                  </option>
                </select>
              </label>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[760px] text-body">
              <caption className="sr-only">
                {text('Employer portfolio directory', 'دليل سجلات جهات العمل')}
              </caption>
              <thead className="bg-subtle text-label text-fg-tertiary">
                <tr>
                  {[
                    text('Employer', 'جهة العمل'),
                    text('Portfolio status', 'حالة السجل'),
                    text('Applications', 'الطلبات'),
                    text('Open reviews', 'مراجعات مفتوحة'),
                    text('Approved', 'معتمدة'),
                    text('Actions', 'الإجراءات'),
                  ].map((label) => (
                    <th key={label} scope="col" className="px-4 py-3 text-start font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ employer, portfolio, open, approved }) => (
                  <tr key={employer.id} className="border-t border-line hover:bg-subtle/70">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-caption font-semibold text-accent"
                        >
                          {initials(employer.name)}
                        </span>
                        <div>
                          <button
                            type="button"
                            onClick={() => setSelectedId(employer.id)}
                            className="text-start font-medium hover:text-accent hover:underline"
                          >
                            {employer.name}
                          </button>
                          <p className="mt-1 text-caption text-fg-tertiary">
                            {employer.industry} · {employer.area}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={portfolio.length ? 'accent' : 'neutral'}>
                        {portfolio.length
                          ? text('Applications on file', 'طلبات مسجلة')
                          : text('Employer record', 'سجل جهة عمل')}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 tabular-nums">{portfolio.length}</td>
                    <td className="px-4 py-4 tabular-nums">{open}</td>
                    <td className="px-4 py-4 tabular-nums">{approved}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedId(employer.id)}
                        >
                          {text('View profile', 'عرض الملف')}
                        </Button>
                        <Link
                          href={`/bank/applications?employerId=${employer.id}`}
                          aria-label={text(
                            `View applications from ${employer.name}`,
                            `عرض طلبات ${employer.name}`,
                          )}
                          className="flex size-8 items-center justify-center rounded-md text-fg-secondary hover:bg-hover hover:text-accent"
                        >
                          <ArrowRight aria-hidden className="size-4 rtl:-scale-x-100" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length ? (
              <div className="flex flex-col items-center gap-3 p-10 text-center">
                <Building2 aria-hidden className="size-7 text-fg-tertiary" />
                <h3 className="text-title font-medium">
                  {text('No employers match these filters', 'لا توجد جهات عمل تطابق عوامل التصفية')}
                </h3>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery('');
                    setFilter('all');
                  }}
                >
                  {text('Clear filters', 'مسح عوامل التصفية')}
                </Button>
              </div>
            ) : null}
          </div>
        </section>
        <section className="flex items-start gap-3 rounded-lg border border-line p-5">
          <ShieldCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-accent" />
          <div>
            <h2 className="text-body font-medium">
              {text('Backing and permission are separate', 'الدعم والإذن أمران منفصلان')}
            </h2>
            <p className="mt-1 max-w-3xl text-label leading-6 text-fg-secondary">
              {text(
                'Employer backing can support the review, but it does not grant access to salary, identity or bank statements. Those permissions belong to the applicant. Only employment-level portfolio information appears here.',
                'يمكن أن يدعم تأييد جهة العمل المراجعة، لكنه لا يمنح الوصول إلى الراتب أو الهوية أو كشوف الحساب. هذه الأذونات تخص المتقدم. تظهر هنا فقط معلومات السجل المتعلقة بالتوظيف.',
              )}
            </p>
          </div>
        </section>
      </div>
      <BankModal
        open={selectedId !== null}
        onClose={() => setSelectedId(null)}
        title={selected?.employer.name ?? text('Employer profile', 'ملف جهة العمل')}
        description={text(
          'A fictional employer record. This is not a verified bank relationship or an external contact channel.',
          'سجل جهة عمل خيالية. لا يمثل علاقة بنكية مؤكدة أو قناة اتصال خارجية.',
        )}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedId(null)}>
              {text('Close', 'إغلاق')}
            </Button>
            {selected ? (
              <Link
                href={`/bank/applications?employerId=${selected.employer.id}`}
                className="inline-flex h-8 items-center gap-2 rounded-md bg-solid px-3 text-body font-medium text-solid-fg"
              >
                {text('View applications', 'عرض الطلبات')}
                <ArrowRight aria-hidden className="size-4 rtl:-scale-x-100" />
              </Link>
            ) : null}
          </>
        }
      >
        {selected ? (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <Building2 aria-hidden className="mt-0.5 size-5 text-accent" />
              <div>
                <p className="text-body font-medium">{selected.employer.industry}</p>
                <p className="mt-1 text-label text-fg-secondary">{selected.employer.area}</p>
              </div>
            </div>
            <dl className="grid grid-cols-3 gap-3 rounded-lg border border-line p-4">
              <div>
                <dt className="text-caption text-fg-tertiary">{text('Applications', 'الطلبات')}</dt>
                <dd className="mt-1 text-heading font-medium">{selected.portfolio.length}</dd>
              </div>
              <div>
                <dt className="text-caption text-fg-tertiary">{text('Open', 'مفتوحة')}</dt>
                <dd className="mt-1 text-heading font-medium">{selected.open}</dd>
              </div>
              <div>
                <dt className="text-caption text-fg-tertiary">{text('Approved', 'معتمدة')}</dt>
                <dd className="mt-1 text-heading font-medium">{selected.approved}</dd>
              </div>
            </dl>
            <div>
              <h3 className="text-body font-medium">
                {text('Employer contact on file', 'جهة الاتصال المسجلة')}
              </h3>
              <p className="mt-2 text-body text-fg-secondary">{selected.employer.hrContact.name}</p>
              <p className="mt-1 break-all text-label text-fg-tertiary">
                <bdi>{selected.employer.hrContact.email}</bdi>
              </p>
              <p className="mt-2 text-caption text-fg-tertiary">
                {text(
                  'Reference only. No message can be sent from this demo.',
                  'للمرجع فقط. لا يمكن إرسال رسالة من هذا العرض.',
                )}
              </p>
            </div>
            <div className="flex items-start gap-2 rounded-md bg-subtle p-3">
              <Users aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-tertiary" />
              <p className="text-label leading-5 text-fg-secondary">
                {selected.portfolio.length
                  ? text(
                      'The portfolio contains submitted bank applications linked to this employer. Backing is checked per application.',
                      'يحتوي السجل على طلبات بنكية مقدمة مرتبطة بجهة العمل هذه. يتم التحقق من الدعم لكل طلب.',
                    )
                  : text(
                      'No submitted bank applications are linked to this employer yet. Its directory record alone does not establish a banking partnership.',
                      'لا توجد طلبات بنكية مقدمة مرتبطة بجهة العمل حتى الآن. لا يثبت سجل الدليل وحده وجود شراكة بنكية.',
                    )}
              </p>
            </div>
          </div>
        ) : null}
      </BankModal>
    </>
  );
}
