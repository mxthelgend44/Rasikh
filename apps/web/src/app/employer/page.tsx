import type { Metadata } from 'next';
import { Gauge } from 'lucide-react';
import { EmptyPage } from '@/components/shell/empty-page';

export const metadata: Metadata = { title: 'Overview' };

export default function EmployerOverviewPage() {
  return (
    <EmptyPage
      title="Overview"
      icon={Gauge}
      emptyTitle="No relocations in progress"
      emptyDescription="Average days to settled, blocked hires and hires on track appear here once you add a hire."
    />
  );
}
