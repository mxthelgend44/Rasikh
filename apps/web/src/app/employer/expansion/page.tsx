import type { Metadata } from 'next';
import { Building2 } from 'lucide-react';
import { EmptyPage } from '@/components/shell/empty-page';

export const metadata: Metadata = { title: 'Setup roadmap' };

export default function ExpansionPage() {
  return (
    <EmptyPage
      title="Setup roadmap"
      icon={Building2}
      emptyTitle="No expansion started"
      emptyDescription="Describe your company to get a recommended setup path and an ordered roadmap."
    />
  );
}
