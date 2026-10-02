import type { Metadata } from 'next';
import { PropertiesPage } from '@/components/landlord/properties';

export const metadata: Metadata = { title: 'Properties' };

export default function Page() {
  return <PropertiesPage />;
}
