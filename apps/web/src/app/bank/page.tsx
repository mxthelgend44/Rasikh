import type { Metadata } from 'next';
import { BankOverview } from '@/components/bank/bank-overview';

export const metadata: Metadata = { title: 'Bank overview' };

export default function BankPage() {
  return <BankOverview />;
}
