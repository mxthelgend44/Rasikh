import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import { EmptyPage } from '@/components/shell/empty-page';

export const metadata: Metadata = { title: 'Guard log' };

export default function GuardLogPage() {
  return (
    <EmptyPage
      title="Guard log"
      icon={ShieldCheck}
      emptyTitle="No checks yet"
      emptyDescription="When the agent shares or is stopped from sharing a document, the check and its reason are listed here."
    />
  );
}
