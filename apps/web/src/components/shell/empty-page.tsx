import type { LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';

export interface EmptyPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
}

/** A routed page with a header and a designed empty state, until its surface is built. */
export function EmptyPage({ title, description, icon, emptyTitle, emptyDescription }: EmptyPageProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} />
    </>
  );
}
