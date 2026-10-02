import type { Metadata } from 'next';
import { EmployerHireDetail } from '@/components/employer/hire-detail';

export const metadata: Metadata = { title: 'Hire journey' };

export default async function HireDetailPage({ params }: { params: Promise<{ hireId: string }> }) {
  const { hireId } = await params;
  return <EmployerHireDetail hireId={hireId} />;
}
