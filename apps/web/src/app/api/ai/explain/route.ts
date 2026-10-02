import { handleAiPost } from '@/server/ai/http';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  return handleAiPost(request, 'explain');
}
