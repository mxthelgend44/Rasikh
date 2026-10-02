'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useLandlordLocale } from '@/components/landlord/shared';

export default function Loading() {
  const { l } = useLandlordLocale();
  return (
    <div
      role="status"
      aria-label={l('Loading landlord workspace', 'جارٍ تحميل مساحة المالك')}
      className="space-y-6 p-6"
    >
      <p className="text-heading font-medium">{l('Loading portfolio…', 'جارٍ تحميل المحفظة…')}</p>
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
