import type { Metadata } from 'next';
import { LeasesPage } from '@/components/landlord/leases';

export const metadata: Metadata = { title: 'Lease decisions' };
export default function Page() {
  return <LeasesPage />;
}
