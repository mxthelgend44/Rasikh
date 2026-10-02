const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const METADATA_ACCOUNT =
  'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/';
const CLOUD_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';
const AUTH_TIMEOUT_MS = 10_000;
const MAX_CONFIG_BYTES = 16_384;
const MAX_TOKEN_BYTES = 16_384;
const MAX_CACHE_ENTRIES = 4;
const EXPIRY_MARGIN_MS = 60_000;
const AUTH_FAILED = 'Vertex authentication failed.';
const INVALID_ACCOUNT = 'Vertex service account configuration is invalid.';

interface ServiceAccount {
  email: string;
  privateKey: string;
  keyId?: string;
}

interface CacheEntry {
  token?: { value: string; until: number };
  pending?: Promise<string>;
}

// Service-account identities are digests; metadata identities use fixed non-secret keys.
const tokenCache = new Map<string, CacheEntry>();
const encoder = new TextEncoder();

function validToken(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MAX_TOKEN_BYTES &&
    /^[A-Za-z0-9._~+/-]+=*$/.test(value)
  );
}

function serviceAccount(raw: string): ServiceAccount {
  try {
    if (encoder.encode(raw).byteLength > MAX_CONFIG_BYTES) throw new Error();
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    const account = value as Record<string, unknown>;
    if (
      account.type !== 'service_account' ||
      typeof account.client_email !== 'string' ||
      account.client_email.length > 254 ||
      !/^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+\.gserviceaccount\.com$/.test(account.client_email) ||
      typeof account.private_key !== 'string' ||
      !/^-----BEGIN PRIVATE KEY-----\s+[A-Za-z0-9+/=\s]+\s+-----END PRIVATE KEY-----\s*$/.test(
        account.private_key,
      ) ||
      (account.private_key_id !== undefined &&
        (typeof account.private_key_id !== 'string' ||
          !/^[A-Za-z0-9._-]{1,128}$/.test(account.private_key_id)))
    ) {
      throw new Error();
    }
    return {
      email: account.client_email,
      privateKey: account.private_key,
      ...(typeof account.private_key_id === 'string' ? { keyId: account.private_key_id } : {}),
    };
  } catch {
    throw new Error(INVALID_ACCOUNT);
  }
}

function privateKeyBytes(pem: string): Uint8Array<ArrayBuffer> {
  const encoded = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  if (encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    throw new Error(INVALID_ACCOUNT);
  }
  return Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
}

function base64url(bytes: Uint8Array): string {
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function cacheIdentity(account: ServiceAccount): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(account)));
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function signedAssertion(account: ServiceAccount, issuedAt: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBytes(account.privateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const header = { alg: 'RS256', typ: 'JWT', ...(account.keyId ? { kid: account.keyId } : {}) };
  const claims = {
    iss: account.email,
    scope: CLOUD_SCOPE,
    aud: TOKEN_ENDPOINT,
    iat: issuedAt,
    exp: issuedAt + 3600,
  };
  const message = `${base64url(encoder.encode(JSON.stringify(header)))}.${base64url(
    encoder.encode(JSON.stringify(claims)),
  )}`;
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(message));
  return `${message}.${base64url(new Uint8Array(signature))}`;
}

async function responseText(response: Response): Promise<string> {
  if (!response.ok || !response.body) throw new Error(AUTH_FAILED);
  const declaredSize = response.headers.get('content-length');
  if (declaredSize && Number(declaredSize) > MAX_TOKEN_BYTES) throw new Error(AUTH_FAILED);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_TOKEN_BYTES) {
        await reader.cancel();
        throw new Error(AUTH_FAILED);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

async function tokenResponse(response: Response): Promise<Record<string, unknown>> {
  const value: unknown = JSON.parse(await responseText(response));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(AUTH_FAILED);
  return value as Record<string, unknown>;
}

function storeAccessToken(
  value: Record<string, unknown>,
  startedAt: number,
  entry: CacheEntry,
): string {
  if (
    !validToken(value.access_token) ||
    typeof value.token_type !== 'string' ||
    !/^bearer$/i.test(value.token_type) ||
    typeof value.expires_in !== 'number' ||
    !Number.isSafeInteger(value.expires_in) ||
    value.expires_in <= 0 ||
    value.expires_in > 86_400
  ) {
    throw new Error(AUTH_FAILED);
  }
  const until = Math.min(startedAt + value.expires_in * 1000, startedAt + 3_600_000);
  entry.token = { value: value.access_token, until: until - EXPIRY_MARGIN_MS };
  return value.access_token;
}

async function metadataRequest<T>(
  url: string,
  fetchImpl: typeof fetch,
  read: (response: Response) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: { 'Metadata-Flavor': 'Google' },
      signal: controller.signal,
      redirect: 'error',
      cache: 'no-store',
    });
    if (response.headers.get('Metadata-Flavor') !== 'Google') throw new Error(AUTH_FAILED);
    const result = await read(response);
    if (controller.signal.aborted) throw new Error(AUTH_FAILED);
    return result;
  } catch {
    throw new Error(AUTH_FAILED);
  } finally {
    clearTimeout(timeout);
  }
}

async function cachedToken(
  identity: string,
  create: (entry: CacheEntry) => Promise<string>,
): Promise<string> {
  const now = Date.now();
  for (const [key, entry] of tokenCache) {
    if (!entry.pending && (!entry.token || entry.token.until <= now)) tokenCache.delete(key);
  }
  let entry = tokenCache.get(identity);
  if (entry?.token && entry.token.until > now) return entry.token.value;
  if (entry?.pending) return entry.pending;
  if (!entry) {
    while (tokenCache.size >= MAX_CACHE_ENTRIES) {
      const oldest = tokenCache.keys().next().value;
      if (oldest !== undefined) tokenCache.delete(oldest);
    }
    entry = {};
    tokenCache.set(identity, entry);
  }
  const currentEntry = entry;
  currentEntry.pending = create(currentEntry);
  try {
    return await currentEntry.pending;
  } finally {
    currentEntry.pending = undefined;
    if (!currentEntry.token && tokenCache.get(identity) === currentEntry)
      tokenCache.delete(identity);
  }
}

async function exchange(
  account: ServiceAccount,
  fetchImpl: typeof fetch,
  entry: CacheEntry,
): Promise<string> {
  const startedAt = Date.now();
  const issuedAt = Math.floor(startedAt / 1000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
  try {
    const assertion = await signedAssertion(account, issuedAt);
    if (controller.signal.aborted) throw new Error(AUTH_FAILED);
    // A credential's token_uri is deliberately ignored: credentials can never change this host.
    const response = await fetchImpl(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }).toString(),
      redirect: 'error',
      signal: controller.signal,
    });
    const value = await tokenResponse(response);
    if (controller.signal.aborted) throw new Error(AUTH_FAILED);
    return storeAccessToken(value, issuedAt * 1000, entry);
  } catch {
    // Provider response bodies, signing errors and credential values never escape this boundary.
    throw new Error(AUTH_FAILED);
  } finally {
    clearTimeout(timeout);
  }
}

/** Server-only bearer auth. No ADC, subprocesses, user impersonation, or client credentials. */
export async function getVertexAccessToken(
  env: Record<string, string | undefined>,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  if (typeof window !== 'undefined') {
    throw new Error('Vertex authentication is available only on the server.');
  }
  const suppliedToken = env.VERTEX_ACCESS_TOKEN?.trim();
  if (suppliedToken) {
    if (!validToken(suppliedToken))
      throw new Error('Vertex access token configuration is invalid.');
    return suppliedToken;
  }
  if (!env.VERTEX_SERVICE_ACCOUNT_JSON) {
    if (env.RASIKH_VERTEX_METADATA_AUTH !== '1')
      throw new Error('Vertex credentials are unavailable.');
    return cachedToken('metadata-default-access-token', async (entry) => {
      const startedAt = Date.now();
      const value = await metadataRequest(`${METADATA_ACCOUNT}token`, fetchImpl, tokenResponse);
      return storeAccessToken(value, startedAt, entry);
    });
  }
  const account = serviceAccount(env.VERTEX_SERVICE_ACCOUNT_JSON);
  let identity: string;
  try {
    identity = await cacheIdentity(account);
  } catch {
    throw new Error(AUTH_FAILED);
  }
  return cachedToken(identity, (entry) => exchange(account, fetchImpl, entry));
}

/** An optional, fixed Cloud Run audience is supplied by server configuration only. */
export async function getGuardIdentityToken(
  env: Record<string, string | undefined>,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  if (typeof window !== 'undefined')
    throw new Error('Guard identity authentication is available only on the server.');
  const configured = env.RASIKH_GUARD_AUTH_AUDIENCE;
  if (!configured) return null;
  if (env.RASIKH_VERTEX_METADATA_AUTH !== '1')
    throw new Error('Guard identity authentication is unavailable.');
  let audience: string;
  try {
    const url = new URL(configured);
    if (
      configured.length > 2048 ||
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      url.pathname !== '/' ||
      url.search ||
      url.hash ||
      !/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.run\.app$/.test(url.hostname)
    )
      throw new Error();
    audience = url.origin;
  } catch {
    throw new Error('Guard identity audience is invalid.');
  }
  try {
    return await cachedToken(`metadata-identity:${audience}`, async (entry) => {
      const startedAt = Date.now();
      const url = new URL(`${METADATA_ACCOUNT}identity`);
      url.searchParams.set('audience', audience);
      url.searchParams.set('format', 'full');
      const token = (await metadataRequest(url.toString(), fetchImpl, responseText)).trim();
      if (
        token.length > MAX_TOKEN_BYTES ||
        !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)
      )
        throw new Error();
      const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const bytes = Uint8Array.from(
        atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')),
        (character) => character.charCodeAt(0),
      );
      // Claims are used only to constrain cache lifetime and audience, never logged or trusted as profile data.
      const claims: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
      if (!claims || typeof claims !== 'object' || Array.isArray(claims)) throw new Error();
      const payload = claims as Record<string, unknown>;
      if (
        payload.aud !== audience ||
        (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') ||
        typeof payload.exp !== 'number' ||
        !Number.isSafeInteger(payload.exp) ||
        payload.exp * 1000 <= Date.now()
      )
        throw new Error();
      entry.token = {
        value: token,
        until: Math.min(startedAt + 240_000, payload.exp * 1000 - EXPIRY_MARGIN_MS),
      };
      return token;
    });
  } catch {
    throw new Error('Guard identity authentication failed.');
  }
}
