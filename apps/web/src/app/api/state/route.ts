import { getStore } from '@/server/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET() {
  return Response.json(getStore().snapshot());
}
