import type { Metadata } from 'next';
import { ApplicationDetail } from '@/components/landlord/applications';

export const metadata: Metadata = { title: 'Rental application' };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ApplicationDetail id={id} />;
}
