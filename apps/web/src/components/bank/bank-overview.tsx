'use client';

import Link from 'next/link';
import { ArrowRight, CheckCheck, Clock3, FileCheck2, Handshake, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Illustration } from '@/components/ui/illustration';
import { useI18n } from '@/lib/i18n/provider';
import { formatDate } from '@/lib/format';
import { useAppState } from '@/store/provider';
import { bankApplications, bankText, consentGaps, latestDecision, OPEN_STATES } from './bank-data';
import { BankHeader } from './bank-header';
import { BankQueue } from './bank-queue';
import { BankScopePanel } from './bank-scope';

export function BankOverview() {
  const state = useAppState();
  const { locale } = useI18n();
  const text = (en: string, ar: string) => bankText(locale, en, ar);
  const applications = bankApplications(state);
  const open = applications.filter((application) => OPEN_STATES.includes(application.state));
  const approvals = applications.filter((application) => application.state === 'approved');
  const waiting = open.filter(
    (application) =>
      application.state === 'needs_info' || consentGaps(state, application).length > 0,
  );
  const next = open.find((application) => application.state !== 'needs_info') ?? open[0];
  const nextHire = next ? state.hires[next.hireId] : undefined;
  const backed = applications.filter((application) => application.employerBacked).length;
  const latest = approvals
    .map((application) => ({
      application,
      decision: latestDecision(state, application.id),
    }))
    .filter((item) => item.decision)
    .sort((a, b) => b.decision!.decidedAt.localeCompare(a.decision!.decidedAt));

  return (
    <>
      <BankHeader
        title={text('Account onboarding', 'تهيئة الحسابات')}
        description={text(
          'Help new arrivals get ready for their first salary.',
          'ساعد القادمين الجدد على الاستعداد لأول راتب.',
        )}
        actions={
          <Link
            href="/bank/partners"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-line-strong px-3 text-body hover:bg-subtle"
          >
            <Handshake aria-hidden className="size-4" />
            {text('Employer partners', 'جهات العمل')}
          </Link>
        }
      />
      <div className="space-y-7 p-5 sm:p-7">
        <section
          className="overflow-hidden rounded-xl border border-accent/20 bg-accent-soft"
          aria-labelledby="bank-priority-title"
        >
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-label text-accent">
                <span className="inline-flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-accent" aria-hidden />
                  {text('The next clear step', 'الخطوة التالية الواضحة')}
                </span>
                <span className="text-caption text-fg-secondary">
                  {formatDate(state.clock.anchor, locale)} · {text('Demo clock', 'ساعة العرض')}
                </span>
              </div>
              <h2 id="bank-priority-title" className="text-display font-medium tracking-tight">
                {nextHire
                  ? text(
                      `${nextHire.fullName} is waiting for your review`,
                      `${nextHire.fullName} بانتظار مراجعتك`,
                    )
                  : text('Your review queue is up to date', 'قائمة المراجعة محدثة')}
              </h2>
              {next && nextHire ? (
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-body text-fg-secondary">
                  <span>{nextHire.role}</span>
                  <span aria-hidden>·</span>
                  <span>{state.employers[nextHire.employerId]?.name}</span>
                  {next.submittedAt ? (
                    <>
                      <span aria-hidden>·</span>
                      <span>
                        {text('Received ', 'تم الاستلام ')}
                        {formatDate(next.submittedAt, locale)}
                      </span>
                    </>
                  ) : null}
                </p>
              ) : null}
              {next ? (
                <ol className="mt-5 space-y-2.5">
                  {[
                    text('Check the signed employment evidence', 'تحقق من أدلة التوظيف الموقعة'),
                    text('Confirm the permission scope', 'تأكد من نطاق الإذن'),
                    text('Record a decision with your reasoning', 'سجل قرارك مع أسبابه'),
                  ].map((step, index) => (
                    <li key={step} className="flex items-center gap-3 text-body">
                      <span
                        aria-hidden
                        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface text-caption font-medium tabular-nums text-accent"
                      >
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 max-w-lg text-body leading-6 text-fg-secondary">
                  {text(
                    'Approved decisions are reflected in the newcomer and employer workspaces. New applications will appear here.',
                    'تظهر القرارات المعتمدة في مساحات عمل الوافد وجهة العمل. وستظهر الطلبات الجديدة هنا.',
                  )}
                </p>
              )}
              <Link
                href={next ? `/bank/applications/${next.id}` : '/bank/applications'}
                className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-body font-medium text-accent-fg transition-opacity hover:opacity-90"
              >
                {text(
                  next ? 'Review application' : 'View applications',
                  next ? 'مراجعة الطلب' : 'عرض الطلبات',
                )}
                <ArrowRight aria-hidden className="size-4 rtl:-scale-x-100" />
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <Illustration
                variant="banking"
                decorative
                aspect="landscape"
                className="hidden max-h-[170px] rounded-lg sm:block"
                priority
              />
              <div className="rounded-lg border border-accent/20 bg-surface p-3.5">
                <p className="flex items-center gap-2 text-body font-medium">
                  <ShieldCheck aria-hidden className="size-4 text-accent" />
                  {text('Permission comes first', 'الإذن أولاً')}
                </p>
                <p className="mt-1.5 text-label leading-5 text-fg-secondary">
                  {text(
                    'Only consented bank disclosures are visible. A bank officer cannot grant permission for an applicant.',
                    'تظهر فقط البيانات المصرح بها للبنك. لا يمكن لموظف البنك منح الإذن نيابة عن المتقدم.',
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>
        <section
          aria-label={text('Onboarding metrics', 'مؤشرات التهيئة')}
          className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          {[
            {
              value: open.length,
              label: text('Awaiting a decision', 'بانتظار القرار'),
              caption: text('Submitted and open reviews', 'طلبات مقدمة ومراجعات مفتوحة'),
              icon: Clock3,
              href: '/bank/applications?status=open',
              attention: open.length > 0,
            },
            {
              value: approvals.length,
              label: text('Accounts approved', 'حسابات معتمدة'),
              caption: text('Recorded demo decisions', 'قرارات العرض المسجلة'),
              icon: CheckCheck,
              href: '/bank/applications?status=approved',
              attention: false,
            },
            {
              value: waiting.length,
              label: text('Need follow-up', 'تحتاج إلى متابعة'),
              caption: text('Information or consent gaps', 'نقص معلومات أو أذونات'),
              icon: FileCheck2,
              href: '/bank/applications?status=follow_up',
              attention: waiting.length > 0,
            },
            {
              value: `${applications.length ? Math.round((backed / applications.length) * 100) : 0}%`,
              label: text('Employer backed', 'بدعم جهة العمل'),
              caption: text(
                `${backed} of ${applications.length} applications`,
                `${backed} من ${applications.length} طلبات`,
              ),
              icon: Handshake,
              href: '/bank/partners',
              attention: false,
            },
          ].map((metric) => (
            <Link
              key={metric.label}
              href={metric.href}
              className="group flex flex-col rounded-lg border border-line bg-surface p-4 transition-colors duration-150 hover:border-accent/40 hover:bg-subtle"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-label text-fg-secondary">{metric.label}</span>
                <span
                  aria-hidden
                  className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent"
                >
                  <metric.icon className="size-4" />
                </span>
              </div>
              <p
                className={`mt-3 text-[1.75rem] font-medium leading-9 tracking-tight tabular-nums ${metric.attention ? 'text-accent' : ''}`}
              >
                {metric.value}
              </p>
              <p className="mt-1 text-caption text-fg-tertiary">{metric.caption}</p>
            </Link>
          ))}
        </section>
        <BankQueue compact />
        <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
          <section className="rounded-lg border border-line p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-title font-medium">
                {text('Recent approvals', 'الاعتمادات الأخيرة')}
              </h2>
              <Badge tone="neutral">{text('Shared state', 'حالة مشتركة')}</Badge>
            </div>
            {latest.length ? (
              <div className="divide-y divide-line">
                {latest.slice(0, 3).map(({ application, decision }) => (
                  <Link
                    key={application.id}
                    href={`/bank/applications/${application.id}`}
                    className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 hover:text-accent"
                  >
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                      <CheckCheck aria-hidden className="size-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-body font-medium">
                        {state.hires[application.hireId]?.fullName}
                      </p>
                      <p className="mt-1 text-label text-fg-secondary">
                        {consentGaps(state, application).length
                          ? text(
                              'Historical approval recorded. Current permission is required to read its details.',
                              'تم تسجيل اعتماد سابق. يتطلب الاطلاع على التفاصيل إذناً حالياً.',
                            )
                          : decision!.note}
                      </p>
                      <p className="mt-1 text-caption text-fg-tertiary">
                        {decision!.decidedBy} · {formatDate(decision!.decidedAt, locale)}
                      </p>
                    </div>
                    <ArrowRight aria-hidden className="mt-1 size-4 rtl:-scale-x-100" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-body text-fg-secondary">
                {text('Recorded decisions will appear here.', 'ستظهر القرارات المسجلة هنا.')}
              </p>
            )}
          </section>
          <BankScopePanel />
        </div>
      </div>
    </>
  );
}
