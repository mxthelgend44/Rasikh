import type { Metadata } from 'next';
import { Landmark } from 'lucide-react';
import { EmptyPage } from '@/components/shell/empty-page';

export const metadata: Metadata = { title: 'Applications' };

export default function BankApplicationsPage() {
  return (
    <EmptyPage
      title="Applications"
      description="Account applications from newcomers, with employer backing and document status."
      icon={Landmark}
      emptyTitle="No pending applications"
      emptyDescription="New account applications arrive here with a plain-language risk summary."
    />
  );
}
