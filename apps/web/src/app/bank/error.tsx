'use client';

import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';
import { bankText } from '@/components/bank/bank-data';

export default function BankError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { locale } = useI18n();
  const text = (en: string, ar: string) => bankText(locale, en, ar);
  return (
    <div
      role="alert"
      className="flex min-h-[420px] flex-col items-start justify-center gap-4 p-5 sm:p-7"
    >
      <span className="flex size-12 items-center justify-center rounded-xl bg-warning-soft text-warning">
        <TriangleAlert aria-hidden className="size-6" />
      </span>
      <div>
        <h1 className="text-heading font-medium">
          {text('The bank workspace could not be loaded', 'تعذر تحميل مساحة عمل البنك')}
        </h1>
        <p className="mt-2 max-w-xl text-body leading-6 text-fg-secondary">
          {text(
            'Try loading this page again. Application decisions can be recorded only after the shared state is available.',
            'حاول تحميل هذه الصفحة مجدداً. لا يمكن تسجيل قرارات الطلبات إلا بعد توفر الحالة المشتركة.',
          )}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={reset}>{text('Try again', 'حاول مجدداً')}</Button>
        <Link
          href="/bank"
          className="inline-flex h-8 items-center rounded-md border border-line-strong px-3 text-body hover:bg-subtle"
        >
          {text('Bank overview', 'نظرة عامة على البنك')}
        </Link>
      </div>
    </div>
  );
}
