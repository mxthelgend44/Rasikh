import type { Metadata } from 'next';
import { BankPartners } from '@/components/bank/bank-partners';

export const metadata: Metadata = { title: 'Employer partners' };

export default function PartnersPage() {
  return <BankPartners />;
}
