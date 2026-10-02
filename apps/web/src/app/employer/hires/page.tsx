import type { Metadata } from 'next';
import { EmployerHires } from '@/components/employer/hires';

export const metadata: Metadata = { title: 'Hires' };

export default function HiresPage() {
  return <EmployerHires />;
}
