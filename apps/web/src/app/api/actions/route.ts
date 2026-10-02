import { isDomainError } from '@/domain/actions';
import { getStore } from '@/server/store';
import { parseAction } from '@/server/parse-action';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const action = parseAction(await request.json().catch(() => null));
  if (!action) return Response.json({ error: 'Not a known action' }, { status: 400 });
  try {
    return Response.json(getStore().dispatch(action));
  } catch (error) {
    if (isDomainError(error)) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
