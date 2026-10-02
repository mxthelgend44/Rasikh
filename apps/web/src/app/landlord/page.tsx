import type { Metadata } from 'next';
import { FileCheck } from 'lucide-react';
import { EmptyPage } from '@/components/shell/empty-page';

export const metadata: Metadata = { title: 'Applications' };

export default function LandlordApplicationsPage() {
  return (
    <EmptyPage
      title="Applications"
      icon={FileCheck}
      emptyTitle="No applications yet"
      emptyDescription="When a tenant applies for one of your units, the application and its risk summary appear here."
    />
  );
}
