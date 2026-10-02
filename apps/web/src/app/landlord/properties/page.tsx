import type { Metadata } from 'next';
import { Building2 } from 'lucide-react';
import { EmptyPage } from '@/components/shell/empty-page';

export const metadata: Metadata = { title: 'Properties' };

export default function PropertiesPage() {
  return (
    <EmptyPage
      title="Properties"
      icon={Building2}
      emptyTitle="No properties listed"
      emptyDescription="Units and the cheque schedules you accept appear here."
    />
  );
}
