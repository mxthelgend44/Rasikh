import type { Metadata } from 'next';
import { EmployerOverview } from '@/components/employer/overview';

export const metadata: Metadata = { title: 'Overview' };

export default function EmployerOverviewPage() {
  return <EmployerOverview />;
}
