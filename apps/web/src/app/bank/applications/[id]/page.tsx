import type { Metadata } from 'next';
import { BankApplicationDetail } from '@/components/bank/bank-application-detail';

export const metadata: Metadata = { title: 'Application review' };

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  return <BankApplicationDetail applicationId={(await params).id} />;
}
