'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useLandlordLocale } from '@/components/landlord/shared';

export default function Error({ reset }: { reset: () => void }) {
  const { l } = useLandlordLocale();
  return (
    <EmptyState
      icon={AlertCircle}
      title={l('Unable to open this workspace', 'تعذر فتح مساحة العمل')}
      description={l(
        'The portfolio could not be loaded. Try opening it again.',
        'تعذر تحميل المحفظة. حاول فتحها مجدداً.',
      )}
      action={
        <Button className="h-10" onClick={reset}>
          {l('Try again', 'إعادة المحاولة')}
        </Button>
      }
    />
  );
}
