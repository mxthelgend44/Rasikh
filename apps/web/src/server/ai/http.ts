import { CONTRACT_VERSION } from '@rasikh/shared';
import { AiError } from './errors';
import {
  aiMetadata,
  aiStatus,
  currentRuntime,
  explainJourney,
  extractDocument,
  type AiRuntime,
} from './service';
import type { AiEnv } from './config';
import { parseExplanation, parseExtraction, readJson } from './validation';

const HEADERS = { 'cache-control': 'no-store, private', 'x-content-type-options': 'nosniff' };
const windows = new Map<string, { expires: number; count: number }>();
let active = 0;
let aggregate = { expires: 0, count: 0 };

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

function publicOrigin(env: AiEnv): URL | undefined {
  const configured = env.RASIKH_PUBLIC_ORIGIN;
  if (configured === undefined) return undefined;
  try {
    const url = new URL(configured);
    if (
      configured !== url.origin ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash ||
      (url.protocol !== 'https:' && !(url.protocol === 'http:' && LOOPBACK_HOSTS.has(url.hostname)))
    )
      throw new Error();
    return url;
  } catch {
    throw new AiError(
      'invalid_origin',
      'The public Rasikh address is not configured correctly.',
      403,
    );
  }
}

function allowedOrigin(request: Request, configured: URL | undefined): boolean {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false;
  const origin = request.headers.get('origin');
  if (origin === null) return true;
  if (configured) return origin === configured.origin;
  const url = new URL(request.url);
  if (origin === url.origin) return true;
  try {
    const source = new URL(origin);
    return (
      origin === source.origin &&
      LOOPBACK_HOSTS.has(url.hostname) &&
      LOOPBACK_HOSTS.has(source.hostname) &&
      source.protocol === url.protocol &&
      source.port === url.port
    );
  } catch {
    return false;
  }
}

/** A bounded local guard for demo cost; deployment-level quotas remain a hosting concern. */
function reserve(request: Request, env: AiEnv): () => void {
  // Deployment configuration is authoritative. Caller Host and forwarded headers are never used.
  if (!allowedOrigin(request, publicOrigin(env))) {
    throw new AiError('invalid_origin', 'Open this action from Rasikh.', 403);
  }
  const now = Date.now();
  if (aggregate.expires <= now) aggregate = { expires: now + 60000, count: 0 };
  for (const [key, value] of windows) if (value.expires <= now) windows.delete(key);
  if (windows.size > 500) windows.clear();
  const key =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'shared';
  const window = windows.get(key) ?? { expires: now + 60000, count: 0 };
  if (window.count >= 4 || active >= 2 || aggregate.count >= 20)
    throw new AiError('ai_busy', 'The live AI request limit was reached. Try again shortly.', 429);
  window.count += 1;
  aggregate.count += 1;
  windows.set(key, window);
  active += 1;
  return () => {
    active -= 1;
  };
}

export async function handleAiPost(
  request: Request,
  operation: 'extract' | 'explain',
  runtime?: AiRuntime,
): Promise<Response> {
  let release: (() => void) | undefined;
  try {
    const effectiveRuntime = runtime ?? currentRuntime();
    release = reserve(request, effectiveRuntime.env);
    const body = await readJson(request, operation === 'explain' ? 1024 : undefined);
    const result =
      operation === 'extract'
        ? await extractDocument(parseExtraction(body), effectiveRuntime)
        : await explainJourney(parseExplanation(body), effectiveRuntime);
    return Response.json(result, { headers: HEADERS });
  } catch (error) {
    const safe =
      error instanceof AiError
        ? error
        : new AiError('ai_unavailable', 'The live AI request could not be completed.');
    return Response.json(
      {
        contract_version: CONTRACT_VERSION,
        error: { code: safe.code, message: safe.message },
        live: false,
      },
      { status: safe.status, headers: HEADERS },
    );
  } finally {
    release?.();
  }
}

export async function handleAiGet(
  operation: 'status' | 'metadata',
  runtime?: AiRuntime,
): Promise<Response> {
  return Response.json(await (operation === 'status' ? aiStatus(runtime) : aiMetadata(runtime)), {
    headers: HEADERS,
  });
}
