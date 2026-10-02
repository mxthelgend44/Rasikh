import type { Metadata } from 'next';
import { Handshake } from 'lucide-react';
import { EmptyPage } from '@/components/shell/empty-page';

export const metadata: Metadata = { title: 'Employer partners' };

export default function PartnersPage() {
  return (
    <EmptyPage
      title="Employer partners"
      description="Companies whose hires you onboard."
      icon={Handshake}
      emptyTitle="No employer partners"
      emptyDescription="Employers that back their hires through Rasikh are listed here."
    />
  );
}
