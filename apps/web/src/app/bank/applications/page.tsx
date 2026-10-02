import type { Metadata } from 'next';
import { BankQueuePage } from '@/components/bank/bank-queue';

export const metadata: Metadata = { title: 'Account applications' };

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ employerId?: string; status?: string }>;
}) {
  const params = await searchParams;
  return <BankQueuePage employerId={params.employerId} initialStatus={params.status} />;
}
