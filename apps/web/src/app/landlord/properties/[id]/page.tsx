import type { Metadata } from 'next';
import { PropertyDetail } from '@/components/landlord/properties';

export const metadata: Metadata = { title: 'Property details' };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PropertyDetail id={id} />;
}
