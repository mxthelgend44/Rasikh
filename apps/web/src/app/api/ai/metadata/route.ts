import { handleAiGet } from '@/server/ai/http';
export const dynamic = 'force-dynamic';
export async function GET() {
  return handleAiGet('metadata');
}
