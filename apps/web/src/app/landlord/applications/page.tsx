import type { Metadata } from 'next';
import { ApplicationsPage } from '@/components/landlord/applications';

export const metadata: Metadata = { title: 'Rental applications' };
export default function Page() {
  return <ApplicationsPage />;
}
