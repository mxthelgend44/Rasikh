'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/lib/i18n/provider';
import { bankText } from '@/components/bank/bank-data';

export default function BankLoading() {
  const { locale } = useI18n();
  const text = (en: string, ar: string) => bankText(locale, en, ar);
  return (
    <div className="space-y-6 p-5 sm:p-7" role="status" aria-live="polite" aria-busy="true">
      <div>
        <h1 className="text-display font-medium">
          {text('Loading bank workspace', 'جارٍ تحميل مساحة البنك')}
        </h1>
        <p className="mt-2 text-body text-fg-secondary">
          {text(
            'Reading the shared applications and their current permission scope.',
            'جارٍ قراءة الطلبات المشتركة ونطاق أذوناتها الحالي.',
          )}
        </p>
      </div>
      <Skeleton className="h-44 w-full" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
      <div className="rounded-lg border border-line p-5">
        <p className="mb-4 text-title font-medium">{text('Application queue', 'قائمة الطلبات')}</p>
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
