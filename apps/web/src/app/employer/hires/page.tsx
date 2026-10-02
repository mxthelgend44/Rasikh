import type { Metadata } from 'next';
import { Users } from 'lucide-react';
import { EmptyPage } from '@/components/shell/empty-page';

export const metadata: Metadata = { title: 'Hires' };

export default function HiresPage() {
  return (
    <EmptyPage
      title="Hires"
      description="Every international hire, their stage and what is blocking them."
      icon={Users}
      emptyTitle="No hires yet"
      emptyDescription="Add a hire to start their relocation. Rasikh orders the steps and chases each party."
    />
  );
}
