import { describe, expect, it, vi } from 'vitest';
import { createSeed } from '@/domain/seed';
import { handleAiGet, handleAiPost } from './http';
import type { AiRuntime } from './service';

const runtime: AiRuntime = {
  env: {},
  snapshot: () => ({ epoch: 'test', state: createSeed() }),
  fetch,
};
function request(body: unknown, origin?: string) {
  return new Request('http://localhost/api/ai/explain', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'cf-connecting-ip': crypto.randomUUID(),
      ...(origin ? { origin } : {}),
    },
    body: JSON.stringify(body),
  });
}

const PUBLIC_ORIGIN = 'https://rasikh--rasikh-f0207.europe-west4.hosted.app';
function originRequest(url: string, origin?: string, headers: Record<string, string> = {}) {
  return new Request(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'cf-connecting-ip': crypto.randomUUID(),
      ...(origin === undefined ? {} : { origin }),
      ...headers,
    },
    body: JSON.stringify({ hireId: 'hire_demo_001' }),
  });
}

async function originResponse(url: string, origin?: string, env = {}, headers = {}) {
  return handleAiPost(originRequest(url, origin, headers), 'explain', { ...runtime, env });
}

async function expectOriginAccepted(response: Response) {
  // Disabled provider proves the request passed origin validation without making an inference.
  expect(response.status).toBe(503);
  expect(await response.json()).toMatchObject({ error: { code: 'ai_unavailable' }, live: false });
}

async function expectOriginDenied(response: Response) {
  expect(response.status).toBe(403);
  expect(await response.json()).toMatchObject({ error: { code: 'invalid_origin' }, live: false });
}

describe('AI HTTP boundary', () => {
  it('reports unavailable honestly without successful demo fallback', async () => {
    const response = await handleAiPost(request({ hireId: 'hire_demo_001' }), 'explain', runtime);
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ live: false, error: { code: 'ai_unavailable' } });
    expect(response.headers.get('cache-control')).toBe('no-store, private');
  });
  it('never lets unknown client facts become context', async () => {
    const response = await handleAiPost(
      request({ hireId: 'hire_demo_001', sensitive_data: { salary: 'hidden' } }),
      'explain',
      runtime,
    );
    expect(response.status).toBe(400);
    expect(JSON.stringify(await response.json())).not.toContain('hidden');
  });
  it('rejects cross-site calls', async () => {
    const response = await handleAiPost(
      request({ hireId: 'hire_demo_001' }, 'https://evil.example'),
      'explain',
      runtime,
    );
    expect(response.status).toBe(403);
  });
  it('status makes no inference or safety certification', async () => {
    const response = await handleAiGet('status', runtime);
    expect(await response.json()).toMatchObject({
      available: false,
      live: false,
      capabilities: { extract: false, explain: false },
    });
  });
  it('metadata does not claim evaluation adapter parity', async () => {
    const response = await handleAiGet('metadata', runtime);
    expect(await response.json()).toMatchObject({
      app_prompt_parity: 'unverified',
      eval_adapter_compatible: false,
      live: false,
    });
  });
});

describe('AI public origin configuration', () => {
  it('returns 400 for an invalid body from the correct public Origin through an internal adapter URL', async () => {
    const response = await handleAiPost(
      new Request('http://internal-cloud-run:8080/api/ai/explain', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: PUBLIC_ORIGIN,
          'cf-connecting-ip': crypto.randomUUID(),
        },
        body: '{}',
      }),
      'explain',
      { ...runtime, env: { RASIKH_PUBLIC_ORIGIN: PUBLIC_ORIGIN } },
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: 'invalid_request' },
      live: false,
    });
  });
  it('accepts the configured deployed origin when the adapter uses an internal request URL', async () => {
    await expectOriginAccepted(
      await originResponse('http://localhost:8080/api/ai/explain', PUBLIC_ORIGIN, {
        RASIKH_PUBLIC_ORIGIN: PUBLIC_ORIGIN,
      }),
    );
  });
  it('accepts an explicit local origin configuration', async () => {
    await expectOriginAccepted(
      await originResponse('http://localhost:8080/api/ai/explain', 'http://127.0.0.1:3000', {
        RASIKH_PUBLIC_ORIGIN: 'http://127.0.0.1:3000',
      }),
    );
  });
  it('uses the passed runtime environment rather than an unrelated process environment', async () => {
    vi.stubEnv('RASIKH_PUBLIC_ORIGIN', PUBLIC_ORIGIN);
    try {
      await expectOriginAccepted(
        await originResponse('http://localhost:3000/api/ai/explain', 'http://127.0.0.1:3000', {}),
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });
  it('does not fall back to the internal request origin when configured', async () => {
    await expectOriginDenied(
      await originResponse('http://localhost:8080/api/ai/explain', 'http://localhost:8080', {
        RASIKH_PUBLIC_ORIGIN: PUBLIC_ORIGIN,
      }),
    );
  });
  it.each([
    '',
    'not-a-url',
    'http://public.example',
    `${PUBLIC_ORIGIN}/path`,
    `${PUBLIC_ORIGIN}/`,
    `${PUBLIC_ORIGIN}?source=caller`,
    `${PUBLIC_ORIGIN}#fragment`,
    'https://user:password@public.example',
    'https://public.example https://other.example',
    ' https://public.example',
    'http://127.1:3000',
  ])('fails closed for malformed or unsafe configuration %s', async (configured) => {
    await expectOriginDenied(
      await originResponse('http://localhost/api/ai/explain', 'http://localhost', {
        RASIKH_PUBLIC_ORIGIN: configured,
      }),
    );
  });
  it.each([
    '',
    'null',
    `${PUBLIC_ORIGIN}/`,
    `${PUBLIC_ORIGIN}/path`,
    `${PUBLIC_ORIGIN}.evil.example`,
    `${PUBLIC_ORIGIN}, https://evil.example`,
    'https://evil.example',
  ])('rejects an Origin that is not the exact configured origin %s', async (origin) => {
    await expectOriginDenied(
      await originResponse('http://localhost:8080/api/ai/explain', origin, {
        RASIKH_PUBLIC_ORIGIN: PUBLIC_ORIGIN,
      }),
    );
  });
  it('rejects cross-site requests even when the public Origin matches', async () => {
    await expectOriginDenied(
      await originResponse(
        'http://localhost:8080/api/ai/explain',
        PUBLIC_ORIGIN,
        { RASIKH_PUBLIC_ORIGIN: PUBLIC_ORIGIN },
        { 'sec-fetch-site': 'cross-site' },
      ),
    );
  });
  it('rejects cross-site requests even when the Origin header is absent', async () => {
    await expectOriginDenied(
      await originResponse(
        'http://localhost:8080/api/ai/explain',
        undefined,
        { RASIKH_PUBLIC_ORIGIN: PUBLIC_ORIGIN },
        { 'sec-fetch-site': 'cross-site' },
      ),
    );
  });
  it('preserves server callers without an Origin while validating configured addresses', async () => {
    await expectOriginAccepted(
      await originResponse('http://localhost:8080/api/ai/explain', undefined, {
        RASIKH_PUBLIC_ORIGIN: PUBLIC_ORIGIN,
      }),
    );
    await expectOriginDenied(
      await originResponse('http://localhost:8080/api/ai/explain', undefined, {
        RASIKH_PUBLIC_ORIGIN: '',
      }),
    );
  });
  it.each([
    ['http://localhost:3000', 'http://127.0.0.1:3000'],
    ['http://127.0.0.1:3000', 'http://localhost:3000'],
    ['http://localhost:3000', 'http://[::1]:3000'],
    ['https://localhost:3000', 'https://127.0.0.1:3000'],
    ['http://localhost', 'http://127.0.0.1'],
  ])(
    'permits same-protocol and same-port loopback aliases %s and %s without configuration',
    async (url, origin) => {
      await expectOriginAccepted(await originResponse(`${url}/api/ai/explain`, origin));
    },
  );
  it('keeps exact same-origin requests valid without configuration', async () => {
    await expectOriginAccepted(
      await originResponse(`${PUBLIC_ORIGIN}/api/ai/explain`, PUBLIC_ORIGIN),
    );
  });
  it.each([
    'http://127.0.0.1:3001',
    'https://127.0.0.1:3000',
    'http://localhost.evil.example:3000',
    'http://127.0.0.1:3000/',
    'http://127.0.0.1:3000/path',
    'http://user@127.0.0.1:3000',
    'http://127.0.0.1:3000?x=1',
    'http://127.0.0.1:3000#x',
    'http://127.1:3000',
    'http://2130706433:3000',
    'http://0x7f000001:3000',
    'http://127.0.0.2:3000',
    'null',
  ])('rejects mismatched or disguised loopback origins %s', async (origin) => {
    await expectOriginDenied(await originResponse('http://localhost:3000/api/ai/explain', origin));
  });
  it('rejects a public origin when no configured origin authorizes the internal URL', async () => {
    await expectOriginDenied(
      await originResponse('http://localhost:8080/api/ai/explain', PUBLIC_ORIGIN),
    );
  });
  it('does not trust spoofed Host or forwarding headers', async () => {
    const spoofed = {
      host: 'evil.example',
      'x-forwarded-host': 'evil.example',
      'x-forwarded-proto': 'https',
    };
    await expectOriginDenied(
      await originResponse(
        'http://localhost:3000/api/ai/explain',
        'https://evil.example',
        {},
        spoofed,
      ),
    );
    await expectOriginDenied(
      await originResponse(
        'http://localhost:8080/api/ai/explain',
        'https://evil.example',
        { RASIKH_PUBLIC_ORIGIN: PUBLIC_ORIGIN },
        spoofed,
      ),
    );
  });
});
