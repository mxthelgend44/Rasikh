import { getStore, type Snapshot } from '@/server/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HEARTBEAT_MS = 15_000;

/**
 * Server-Sent Events: the current snapshot on connect, then a new one after every change. A
 * comment line every 15 seconds keeps proxies from closing an idle connection.
 */
export function GET(request: Request) {
  const store = getStore();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (snapshot: Snapshot) =>
        controller.enqueue(
          encoder.encode(`event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`),
        );
      send(store.snapshot());
      const unsubscribe = store.subscribe(send);
      const heartbeat = setInterval(
        () => controller.enqueue(encoder.encode(': heartbeat\n\n')),
        HEARTBEAT_MS,
      );
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
