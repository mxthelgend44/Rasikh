import { getStore } from '@/server/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function POST() {
  return Response.json(getStore().reset());
}
