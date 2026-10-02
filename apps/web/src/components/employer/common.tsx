'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ArrowUpRight, Check, LoaderCircle, X, type LucideIcon } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Illustration } from '@/components/ui/illustration';
import type { Action } from '@/domain/actions';
import type { HireStatus } from '@/domain/selectors';
import type { AgentAction, SetupStepKey, StepKey, StepStatus } from '@/domain/types';
import { cn } from '@/lib/cn';
import { useI18n } from '@/lib/i18n/provider';
import { useNewcomer } from '@/store/person';
import { useStore } from '@/store/provider';

export const inputClass =
  'h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-body text-fg transition-colors placeholder:text-fg-placeholder focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15';
export const linkClass =
  'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-line-strong bg-surface px-3 text-label font-medium text-fg transition-colors hover:bg-hover';

export function useEmployerCopy() {
  const { locale, t } = useI18n();
  return {
    locale,
    t,
    e: (en: string, ar: string) => (locale === 'ar' ? ar : en),
    record: (text: string) => (locale === 'ar' ? (knownRecordArabic[text] ?? text) : text),
  };
}

// Translate known fixture prose exactly; preserve unknown user-entered or partner text.
const knownRecordArabic: Record<string, string> = {
  'The degree certificate is not attested, so the visa application cannot be submitted.':
    'الشهادة الجامعية غير مصدّقة، لذا لا يمكن تقديم طلب التأشيرة.',
  'Approve submitting your rental application to Al Reem Residences?':
    'هل توافق على تقديم طلب السكن إلى الريم رزيدنسز؟',
  'The name matches the offer letter and the passport has more than six months of validity left.':
    'الاسم مطابق لعرض العمل، ويتبقى أكثر من ستة أشهر على انتهاء جواز السفر.',
  'The employer and role match the Rasikh hire record, and the letter is signed.':
    'صاحب العمل والوظيفة مطابقان لسجل الموظف في راسخ، والخطاب موقع.',
  'The degree matches the role requirements and the name matches the passport.':
    'الشهادة مطابقة لمتطلبات الوظيفة، والاسم مطابق لجواز السفر.',
  'The certificate has no attestation stamp. The visa application needs an attested copy.':
    'لا توجد على الشهادة علامة تصديق. يحتاج طلب التأشيرة إلى نسخة مصدّقة.',
  'The demo company plans an office on Al Maryah Island.':
    'تخطط الشركة التجريبية لإنشاء مكتب في جزيرة المارية.',
  'Confirm that the planned activities are eligible before choosing a route.':
    'تحقق من أهلية الأنشطة المخطط لها قبل اختيار المسار.',
  'The demo company plans to serve clients across Abu Dhabi.':
    'تخطط الشركة التجريبية لخدمة العملاء في أنحاء أبوظبي.',
  'Office and licence requirements depend on the selected activities.':
    'تعتمد متطلبات المكتب والرخصة على الأنشطة المختارة.',
  'Illustrative demo guidance. Confirm the setup route and requirements with the relevant authority.':
    'إرشادات تجريبية توضيحية. تحقق من مسار التأسيس ومتطلباته لدى الجهة المعنية.',
};

export function EmployerHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-6 sm:px-8">
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-2 text-label font-medium text-accent">{eyebrow}</p>}
        <h1 className="text-[1.75rem] font-medium leading-tight tracking-tight text-fg sm:text-[2rem]">
          {title}
        </h1>
        <p className="mt-2 text-body leading-6 text-fg-secondary">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 pt-1">{actions}</div>}
    </header>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('min-w-0 rounded-2xl border border-edge bg-surface', className)}>
      {title && (
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-title font-medium text-fg">{title}</h2>
            {description && (
              <p className="mt-1 text-label leading-5 text-fg-tertiary">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Metric({
  title,
  value,
  detail,
  icon: Icon,
  tone = 'accent',
}: {
  title: string;
  value: ReactNode;
  detail: string;
  icon: LucideIcon;
  tone?: 'accent' | 'warning' | 'success' | 'danger';
}) {
  return (
    <div className="relative rounded-2xl border border-edge bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-label text-fg-secondary">{title}</p>
        <span
          className={cn(
            'flex size-9 items-center justify-center rounded-xl',
            tone === 'warning'
              ? 'bg-warning-soft text-warning'
              : tone === 'danger'
                ? 'bg-danger-soft text-danger'
                : tone === 'success'
                  ? 'bg-success-soft text-success'
                  : 'bg-accent-soft text-accent',
          )}
        >
          <Icon aria-hidden className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-[2rem] font-medium leading-none tracking-tight text-fg tabular-nums">
        {value}
      </p>
      <p className="mt-3 text-caption leading-5 text-fg-tertiary">{detail}</p>
    </div>
  );
}

export function Progress({ done, total, label }: { done: number; total: number; label?: string }) {
  const { e } = useEmployerCopy();
  const percentage = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-3 text-caption text-fg-secondary">
        <span>{label ?? `${done} / ${total}`}</span>
        <span className="tabular-nums">{percentage}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={label ?? e('Relocation progress', 'تقدم الانتقال')}
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 overflow-hidden rounded-full bg-track"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

const hireTones: Record<HireStatus, BadgeTone> = {
  on_track: 'accent',
  waiting: 'warning',
  blocked: 'danger',
  settled: 'success',
};
export function HireStatusBadge({ status }: { status: HireStatus }) {
  const { e } = useEmployerCopy();
  const labels = {
    on_track: e('On track', 'على المسار'),
    waiting: e('Waiting', 'بانتظار الرد'),
    blocked: e('Needs attention', 'يحتاج إلى متابعة'),
    settled: e('Settled', 'مستقر'),
  };
  return (
    <Badge shape="pill" tone={hireTones[status]}>
      {labels[status]}
    </Badge>
  );
}

const stepTones: Record<StepStatus, BadgeTone> = {
  locked: 'neutral',
  ready: 'accent',
  in_progress: 'accent',
  waiting: 'warning',
  needs_approval: 'warning',
  blocked: 'danger',
  done: 'success',
};
export function StepBadge({ status }: { status: StepStatus }) {
  const { e } = useEmployerCopy();
  const labels: Record<StepStatus, string> = {
    locked: e('Upcoming', 'قادم'),
    ready: e('Ready', 'جاهز'),
    in_progress: e('In progress', 'قيد التنفيذ'),
    waiting: e('Waiting', 'بانتظار الرد'),
    needs_approval: e('Needs approval', 'يحتاج إلى موافقة'),
    blocked: e('Blocked', 'متعثر'),
    done: e('Done', 'مكتمل'),
  };
  return (
    <Badge tone={stepTones[status]} shape="pill">
      {labels[status]}
    </Badge>
  );
}

export function StepName({ stepKey }: { stepKey: StepKey }) {
  const { t } = useEmployerCopy();
  return <>{t(`step.${stepKey}.short`)}</>;
}

export const setupArabic: Record<SetupStepKey, string> = {
  trade_name: 'حجز الاسم التجاري',
  license: 'إصدار الرخصة',
  office_lease: 'تأمين مكتب',
  establishment_card: 'بطاقة المنشأة',
  visa_quota: 'حصة التأشيرات',
  entity_bank_account: 'حساب الشركة المصرفي',
};

export function Initials({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-label font-semibold text-accent',
        className,
      )}
    >
      {name
        .split(' ')
        .filter(Boolean)
        .map((word) => word[0])
        .slice(0, 2)
        .join('')}
    </span>
  );
}

export function NewcomerLink({
  hireId,
  children,
  className,
}: {
  hireId: string;
  children?: ReactNode;
  className?: string;
}) {
  const { choose } = useNewcomer();
  const { e } = useEmployerCopy();
  return (
    <Link href="/newcomer" onClick={() => choose(hireId)} className={className ?? linkClass}>
      {children ?? e('Open newcomer view', 'فتح شاشة الموظف')}
      <ArrowUpRight aria-hidden className="size-3.5 rtl:-scale-x-100" />
    </Link>
  );
}

export function Notice({ message, error = false }: { message: string | null; error?: boolean }) {
  if (!message) return null;
  return (
    <p
      role={error ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-xl px-4 py-3 text-body leading-6',
        error ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success',
      )}
    >
      <Check aria-hidden className="mt-1 size-4 shrink-0" />
      {message}
    </p>
  );
}

export function useEmployerAction() {
  const store = useStore();
  const { e } = useEmployerCopy();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = async (actions: Action | Action[], success: string) => {
    if (busy) return false;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      for (const action of Array.isArray(actions) ? actions : [actions])
        await store.dispatch(action);
      setMessage(success);
      return true;
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : e(
              'The change could not be saved. Please try again.',
              'تعذر حفظ التغيير. يرجى المحاولة مجدداً.',
            ),
      );
      return false;
    } finally {
      setBusy(false);
    }
  };
  return {
    busy,
    message,
    error,
    run,
    clear: () => {
      setMessage(null);
      setError(null);
    },
  };
}

export function Feedback({
  action,
}: {
  action: Pick<ReturnType<typeof useEmployerAction>, 'message' | 'error'>;
}) {
  return (
    <>
      <Notice message={action.error} error />
      <Notice message={action.message} />
    </>
  );
}

export function BusyIcon({ busy }: { busy: boolean }) {
  return busy ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null;
}

export function Modal({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const { e } = useEmployerCopy();
  useEffect(() => {
    const dialog = ref.current;
    // The dialog is unmounted on close, so the browser has no dialog left to hand focus back from.
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    return () => {
      if (dialog?.open) dialog.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = ref.current?.getBoundingClientRect();
          if (
            rect &&
            (event.clientX < rect.x ||
              event.clientX > rect.x + rect.width ||
              event.clientY < rect.y ||
              event.clientY > rect.y + rect.height)
          )
            onClose();
        }
      }}
      className="fixed m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-edge bg-raised p-0 text-fg shadow-dialog backdrop:bg-black/45"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line p-5">
        <div>
          <h2 id={id} className="text-heading font-medium">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-label leading-6 text-fg-secondary">{description}</p>
          )}
        </div>
        <Button
          iconOnly
          variant="ghost"
          icon={<X />}
          aria-label={e('Close dialog', 'إغلاق النافذة')}
          onClick={onClose}
        />
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}

export function ActivityList({
  entries,
  compact = false,
}: {
  entries: AgentAction[];
  compact?: boolean;
}) {
  const { e } = useEmployerCopy();
  return (
    <ul className="divide-y divide-line">
      {entries.map((entry) => (
        <li key={entry.id} className="flex gap-3 px-5 py-4">
          <span
            aria-hidden
            className={cn(
              'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full',
              entry.status === 'blocked'
                ? 'bg-danger-soft text-danger'
                : entry.status === 'done'
                  ? 'bg-accent-soft text-accent'
                  : 'bg-warning-soft text-warning',
            )}
          >
            <Check className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-body font-medium text-fg">{entry.summary}</p>
            {!compact && (
              <p className="mt-1 text-label leading-5 text-fg-secondary">{entry.reasoning}</p>
            )}
            <p className="mt-1.5 text-caption text-fg-tertiary">
              {e('Demo activity', 'نشاط تجريبي')} ·{' '}
              <time dateTime={entry.at}>
                {new Intl.DateTimeFormat(e('en-GB', 'ar-AE'), {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Asia/Dubai',
                }).format(new Date(entry.at))}
              </time>
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function JourneyArt({
  compact = false,
  bleed = false,
}: {
  compact?: boolean;
  bleed?: boolean;
}) {
  return (
    <Illustration
      variant="welcoming-hire"
      decorative
      aspect="landscape"
      fit="contain"
      treatment="cutout"
      fade="none"
      sizes="(max-width: 767px) 100vw, (max-width: 1200px) 40vw, 520px"
      className={cn(bleed ? 'h-full' : compact ? 'max-w-[260px]' : 'max-w-[360px]')}
    />
  );
}
