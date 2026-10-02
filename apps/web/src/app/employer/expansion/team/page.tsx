import type { Metadata } from 'next';
import { Route } from 'lucide-react';
import { EmptyPage } from '@/components/shell/empty-page';

export const metadata: Metadata = { title: 'Team move' };

export default function TeamMovePage() {
  return (
    <EmptyPage
      title="Team move"
      icon={Route}
      emptyTitle="Nobody is moving yet"
      emptyDescription="Once the entity can sponsor visas, the team you plan to transfer starts relocating here."
    />
  );
}
