import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

let getVertexAccessToken: typeof import('./auth').getVertexAccessToken;
let getGuardIdentityToken: typeof import('./auth').getGuardIdentityToken;
let keyPair: CryptoKeyPair;
let privateKey: string;

const account = (email = 'rasikh@demo-project.iam.gserviceaccount.com') => ({
  type: 'service_account',
  client_email: email,
  private_key: privateKey,
  private_key_id: 'test-key-id',
  token_uri: 'https://untrusted.example/token',
});
const environment = (email?: string) => ({
  VERTEX_SERVICE_ACCOUNT_JSON: JSON.stringify(account(email)),
});
const tokenResponse = (token = 'test.access-token', expiresIn = 3600) =>
  Response.json({ access_token: token, token_type: 'Bearer', expires_in: expiresIn });
const decodePart = (value: string) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')), (character) =>
    character.charCodeAt(0),
  );
};

beforeAll(async () => {
  keyPair = (await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  )) as CryptoKeyPair;
  const bytes = new Uint8Array(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey));
  const base64 = btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));
  privateKey = `-----BEGIN PRIVATE KEY-----\n${base64}\n-----END PRIVATE KEY-----\n`;
});

beforeEach(async () => {
  vi.resetModules();
  ({ getVertexAccessToken, getGuardIdentityToken } = await import('./auth'));
});

describe('explicit keyless metadata authentication', () => {
  const metadataEnv = { RASIKH_VERTEX_METADATA_AUTH: '1' };
  const audience = 'https://rasikh-guard-test.europe-west1.run.app';
  const guardEnv = { ...metadataEnv, RASIKH_GUARD_AUTH_AUDIENCE: audience };
  const metadataToken = (token = 'metadata.access-token', expiresIn = 3600) =>
    Response.json(
      { access_token: token, token_type: 'Bearer', expires_in: expiresIn },
      { headers: { 'Metadata-Flavor': 'Google' } },
    );
  const identityToken = (overrides: Record<string, unknown> = {}) => {
    const encoded = (value: unknown) =>
      btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    return `${encoded({ alg: 'RS256', typ: 'JWT' })}.${encoded({
      iss: 'https://accounts.google.com',
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...overrides,
    })}.test-signature`;
  };
  const metadataIdentity = (token = identityToken()) =>
    new Response(token, { headers: { 'Metadata-Flavor': 'Google' } });

  it('never probes metadata unless the explicit flag is exactly 1', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(
      getVertexAccessToken({ RASIKH_VERTEX_METADATA_AUTH: 'true' }, fetchImpl),
    ).rejects.toThrow('Vertex credentials are unavailable.');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('preserves static-token and service-account priority over metadata', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(tokenResponse());
    await expect(
      getVertexAccessToken({ ...metadataEnv, VERTEX_ACCESS_TOKEN: 'static.token' }, fetchImpl),
    ).resolves.toBe('static.token');
    expect(fetchImpl).not.toHaveBeenCalled();
    await expect(
      getVertexAccessToken({ ...metadataEnv, ...environment() }, fetchImpl),
    ).resolves.toBe('test.access-token');
    expect(fetchImpl.mock.calls[0][0]).toBe('https://oauth2.googleapis.com/token');
  });

  it('requests and coalesces access tokens only from the fixed metadata path', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async () => metadataToken());
    expect(
      await Promise.all(
        Array.from({ length: 4 }, () => getVertexAccessToken(metadataEnv, fetchImpl)),
      ),
    ).toEqual(Array(4).fill('metadata.access-token'));
    const [url, request] = fetchImpl.mock.calls[0];
    expect(url).toBe(
      'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
    );
    expect(request).toMatchObject({ method: 'GET', redirect: 'error', cache: 'no-store' });
    expect(request?.body).toBeUndefined();
    expect(new Headers(request?.headers).get('Metadata-Flavor')).toBe('Google');
    expect(request?.signal).toBeInstanceOf(AbortSignal);
    await getVertexAccessToken(metadataEnv, fetchImpl);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('refreshes metadata access tokens before their reported expiry', async () => {
    let now = 1_800_000_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(metadataToken('first.token', 300))
      .mockResolvedValueOnce(metadataToken('second.token', 300));
    await expect(getVertexAccessToken(metadataEnv, fetchImpl)).resolves.toBe('first.token');
    now += 240_001;
    await expect(getVertexAccessToken(metadataEnv, fetchImpl)).resolves.toBe('second.token');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it.each(['missing', 'Untrusted'])(
    'rejects metadata responses with an invalid flavor',
    async (flavor) => {
      const response = tokenResponse();
      if (flavor !== 'missing') response.headers.set('Metadata-Flavor', flavor);
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response);
      await expect(getVertexAccessToken(metadataEnv, fetchImpl)).rejects.toThrow(
        'Vertex authentication failed.',
      );
    },
  );

  it('rejects oversized metadata bodies and sanitizes metadata network errors', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response('private-value'.repeat(2000), { headers: { 'Metadata-Flavor': 'Google' } }),
      )
      .mockRejectedValueOnce(new Error('private-value'));
    await expect(getVertexAccessToken(metadataEnv, fetchImpl)).rejects.toThrow(
      'Vertex authentication failed.',
    );
    await expect(getVertexAccessToken(metadataEnv, fetchImpl)).rejects.toThrow(
      'Vertex authentication failed.',
    );
  });

  it('returns no Guard identity when its audience is absent', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(getGuardIdentityToken(metadataEnv, fetchImpl)).resolves.toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('requires explicit metadata opt-in for Guard identity tokens too', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(
      getGuardIdentityToken({ RASIKH_GUARD_AUTH_AUDIENCE: audience }, fetchImpl),
    ).rejects.toThrow('Guard identity authentication is unavailable.');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([
    'http://rasikh-guard.run.app',
    'https://user:password@rasikh-guard.run.app',
    'https://rasikh-guard.run.app/private',
    'https://rasikh-guard.run.app?audience=attacker',
    'https://rasikh-guard.run.app#secret',
    'https://rasikh-guard.run.app:8443',
    'https://example.com',
    'not a URL',
  ])('rejects unsafe Guard audiences before any metadata request', async (unsafe) => {
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(
      getGuardIdentityToken({ ...metadataEnv, RASIKH_GUARD_AUTH_AUDIENCE: unsafe }, fetchImpl),
    ).rejects.toThrow('Guard identity audience is invalid.');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('gets a Guard identity for a fixed validated audience and refreshes in under five minutes', async () => {
    let now = 1_800_000_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async () => metadataIdentity());
    const token = await getGuardIdentityToken(guardEnv, fetchImpl);
    expect(token).toBe(identityToken());
    const [url, request] = fetchImpl.mock.calls[0];
    const endpoint = new URL(String(url));
    expect(`${endpoint.origin}${endpoint.pathname}`).toBe(
      'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity',
    );
    expect(endpoint.searchParams.get('audience')).toBe(audience);
    expect(endpoint.searchParams.get('format')).toBe('full');
    expect(new Headers(request?.headers).get('Metadata-Flavor')).toBe('Google');
    await getGuardIdentityToken(guardEnv, fetchImpl);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    now += 240_001;
    await getGuardIdentityToken(guardEnv, fetchImpl);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it.each([
    { aud: 'https://another-service.run.app' },
    { iss: 'https://untrusted.example' },
    { exp: 1 },
    { exp: '9999999999' },
  ])(
    'rejects expired or mismatched Guard identity claims without exposing them',
    async (claims) => {
      const fetchImpl = vi
        .fn<typeof fetch>()
        .mockResolvedValue(metadataIdentity(identityToken(claims)));
      await expect(getGuardIdentityToken(guardEnv, fetchImpl)).rejects.toThrow(
        'Guard identity authentication failed.',
      );
    },
  );

  it('sanitizes malformed and untrusted identity metadata responses', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(metadataIdentity('private-value'))
      .mockResolvedValueOnce(new Response(identityToken()));
    await expect(getGuardIdentityToken(guardEnv, fetchImpl)).rejects.toThrow(
      'Guard identity authentication failed.',
    );
    await expect(getGuardIdentityToken(guardEnv, fetchImpl)).rejects.toThrow(
      'Guard identity authentication failed.',
    );
  });

  it('aborts metadata requests after ten seconds', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(
      async (_url, request) =>
        new Promise<Response>((_resolve, reject) => {
          request!.signal!.addEventListener('abort', () => reject(new Error('private-value')));
        }),
    );
    const result = getVertexAccessToken(metadataEnv, fetchImpl).catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await result).toEqual(new Error('Vertex authentication failed.'));
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Vertex server authentication', () => {
  it('uses an explicit bearer token before service-account configuration', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(
      getVertexAccessToken(
        { VERTEX_ACCESS_TOKEN: '  explicit.token  ', VERTEX_SERVICE_ACCOUNT_JSON: 'invalid' },
        fetchImpl,
      ),
    ).resolves.toBe('explicit.token');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects header-injection tokens without exposing their value', async () => {
    await expect(
      getVertexAccessToken({ VERTEX_ACCESS_TOKEN: 'private-token\r\nInjected: yes' }),
    ).rejects.toThrow('Vertex access token configuration is invalid.');
  });

  it('reports missing credentials explicitly', async () => {
    await expect(getVertexAccessToken({})).rejects.toThrow('Vertex credentials are unavailable.');
  });

  it('refuses to expose authentication through a browser runtime', async () => {
    vi.stubGlobal('window', {});
    await expect(getVertexAccessToken({ VERTEX_ACCESS_TOKEN: 'test-token' })).rejects.toThrow(
      'Vertex authentication is available only on the server.',
    );
  });

  it.each([
    'not json private-value',
    '[]',
    JSON.stringify({ type: 'authorized_user', private_key: 'private-value' }),
    JSON.stringify({
      type: 'service_account',
      client_email: 'attacker@example.com',
      private_key: '',
    }),
    'x'.repeat(16_385),
  ])('rejects malformed service-account configuration with a fixed error', async (raw) => {
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(
      getVertexAccessToken({ VERTEX_SERVICE_ACCOUNT_JSON: raw }, fetchImpl),
    ).rejects.toThrow('Vertex service account configuration is invalid.');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('signs a verifiable RS256 assertion for the fixed Google endpoint and caches the result', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(tokenResponse());
    const env = environment();
    await expect(getVertexAccessToken(env, fetchImpl)).resolves.toBe('test.access-token');
    const [url, request] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://oauth2.googleapis.com/token');
    expect(request?.method).toBe('POST');
    expect(request?.redirect).toBe('error');
    expect(new Headers(request?.headers).get('content-type')).toBe(
      'application/x-www-form-urlencoded',
    );
    expect(request?.signal).toBeInstanceOf(AbortSignal);
    const form = new URLSearchParams(String(request?.body));
    expect(form.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
    const [header, claims, signature] = form.get('assertion')!.split('.');
    expect(JSON.parse(new TextDecoder().decode(decodePart(header)))).toEqual({
      alg: 'RS256',
      typ: 'JWT',
      kid: 'test-key-id',
    });
    const payload = JSON.parse(new TextDecoder().decode(decodePart(claims)));
    expect(payload).toEqual({
      iss: account().client_email,
      aud: 'https://oauth2.googleapis.com/token',
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      iat: expect.any(Number),
      exp: payload.iat + 3600,
    });
    expect(
      await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        keyPair.publicKey,
        decodePart(signature),
        new TextEncoder().encode(`${header}.${claims}`),
      ),
    ).toBe(true);
    await expect(getVertexAccessToken(env, fetchImpl)).resolves.toBe('test.access-token');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('coalesces concurrent exchanges for the same credentials', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async () => tokenResponse());
    const tokens = await Promise.all(
      Array.from({ length: 5 }, () => getVertexAccessToken(environment(), fetchImpl)),
    );
    expect(tokens).toEqual(Array(5).fill('test.access-token'));
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('refreshes before expiry and never caches beyond a one-hour assertion', async () => {
    let now = 1_800_000_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(tokenResponse('first.token', 86_400))
      .mockResolvedValueOnce(tokenResponse('refreshed.token'));
    await expect(getVertexAccessToken(environment(), fetchImpl)).resolves.toBe('first.token');
    now += 3_541_000;
    await expect(getVertexAccessToken(environment(), fetchImpl)).resolves.toBe('refreshed.token');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('keeps credentials isolated and caps the cache to four entries', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async () => tokenResponse());
    for (let index = 0; index < 5; index++) {
      await getVertexAccessToken(
        environment(`account-${index}@demo-project.iam.gserviceaccount.com`),
        fetchImpl,
      );
    }
    await getVertexAccessToken(
      environment('account-4@demo-project.iam.gserviceaccount.com'),
      fetchImpl,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(5);
    await getVertexAccessToken(
      environment('account-0@demo-project.iam.gserviceaccount.com'),
      fetchImpl,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(6);
  });

  it.each([
    { access_token: 'private-value', token_type: 'Basic', expires_in: 3600 },
    { access_token: 'private-value', token_type: 'Bearer', expires_in: 0 },
    { access_token: 'private-value', token_type: 'Bearer', expires_in: '3600' },
    { access_token: 'private-value', token_type: 'Bearer', expires_in: 86_401 },
    { access_token: { secret: 'private-value' }, token_type: 'Bearer', expires_in: 3600 },
    { access_token: 'private-value\nheader', token_type: 'Bearer', expires_in: 3600 },
  ])('rejects invalid token responses with a sanitized failure', async (response) => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(Response.json(response));
    await expect(getVertexAccessToken(environment(), fetchImpl)).rejects.toThrow(
      'Vertex authentication failed.',
    );
  });

  it('bounds streamed token-response bytes even when content-length is absent', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('private-value'.repeat(2000)));
    await expect(getVertexAccessToken(environment(), fetchImpl)).rejects.toThrow(
      'Vertex authentication failed.',
    );
  });

  it('sanitizes provider and network errors, then permits a clean retry', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('private-value', { status: 401 }))
      .mockRejectedValueOnce(new Error('request contained private-value'))
      .mockResolvedValueOnce(tokenResponse());
    await expect(getVertexAccessToken(environment(), fetchImpl)).rejects.toThrow(
      'Vertex authentication failed.',
    );
    await expect(getVertexAccessToken(environment(), fetchImpl)).rejects.toThrow(
      'Vertex authentication failed.',
    );
    await expect(getVertexAccessToken(environment(), fetchImpl)).resolves.toBe('test.access-token');
  });

  it('aborts a token exchange after ten seconds', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async (_url, request) => {
      return new Promise<Response>((_resolve, reject) => {
        request!.signal!.addEventListener('abort', () => reject(new Error('private-value')));
      });
    });
    const result = getVertexAccessToken(environment(), fetchImpl).catch((error: unknown) => error);
    await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1));
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await result).toEqual(new Error('Vertex authentication failed.'));
  });
});
