import type { Metadata } from 'next';
import { EmployerExpansion } from '@/components/employer/expansion';

export const metadata: Metadata = { title: 'Setup roadmap' };

export default function ExpansionPage() {
  return <EmployerExpansion />;
}
