import type { Metadata } from 'next';
import { EmployerExpansion } from '@/components/employer/expansion';

export const metadata: Metadata = { title: 'Team move' };

export default function TeamMovePage() {
  return <EmployerExpansion team />;
}
