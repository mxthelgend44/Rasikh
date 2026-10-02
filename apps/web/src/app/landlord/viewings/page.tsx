import type { Metadata } from 'next';
import { ViewingsPage } from '@/components/landlord/viewings';

export const metadata: Metadata = { title: 'Viewings' };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ property?: string; application?: string }>;
}) {
  const query = await searchParams;
  return <ViewingsPage initialProperty={query.property} initialApplication={query.application} />;
}
