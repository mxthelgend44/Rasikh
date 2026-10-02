import type { LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';

export interface EmptyPageProps {
  title: string;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
}

/** A routed page with a header and a designed empty state, until its surface is built. */
export function EmptyPage({ title, icon, emptyTitle, emptyDescription }: EmptyPageProps) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} />
    </>
  );
}
