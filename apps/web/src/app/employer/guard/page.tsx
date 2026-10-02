import type { Metadata } from 'next';
import { EmployerGuard } from '@/components/employer/guard';

export const metadata: Metadata = { title: 'Guard log' };

export default function GuardLogPage() {
  return <EmployerGuard />;
}
