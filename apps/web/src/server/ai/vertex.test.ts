import { afterEach, describe, expect, it, vi } from 'vitest';
import { readConfig } from './config';
import { generate, vertexSchema, type ModelRequest } from './vertex';

const config = () =>
  readConfig({
    RASIKH_AI_ENABLED: '1',
    GOOGLE_CLOUD_PROJECT: 'test-project',
    GOOGLE_CLOUD_LOCATION: 'global',
    VERTEX_MODEL: 'gemini-3.8-flash',
    VERTEX_ACCESS_TOKEN: 'test.access-token',
  });
const request: ModelRequest = {
  instructions: 'Use only supplied safe facts.',
  input: { status: 'ready' },
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['summary'],
    properties: { summary: { type: 'string' } },
  },
};
const candidate = (parts: unknown[], finishReason = 'STOP') => ({
  finishReason,
  content: { parts },
});
const response = (value: unknown) => Response.json(value);

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('bounded Vertex REST adapter', () => {
  it('uses the global endpoint, server bearer header and strict response schema without tools', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response({ candidates: [candidate([{ text: '{"summary":"Ready"}' }])] }));
    expect(await generate(config(), request, fetchImpl)).toEqual({ summary: 'Ready' });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(
      'https://aiplatform.googleapis.com/v1/projects/test-project/locations/global/publishers/google/models/gemini-3.8-flash:generateContent',
    );
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer test.access-token');
    expect(init).toMatchObject({ method: 'POST', redirect: 'error', cache: 'no-store' });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    const body = JSON.parse(String(init?.body));
    expect(body.systemInstruction).toEqual({ parts: [{ text: request.instructions }] });
    expect(body.contents).toEqual([
      { role: 'user', parts: [{ text: JSON.stringify(request.input) }] },
    ]);
    expect(body.generationConfig).toMatchObject({
      responseMimeType: 'application/json',
      candidateCount: 1,
      responseSchema: {
        type: 'OBJECT',
        required: ['summary'],
        properties: { summary: { type: 'STRING' } },
      },
    });
    expect(body).not.toHaveProperty('tools');
  });

  it('maps nullable scalar unions and nested arrays to the supported Vertex subset', () => {
    expect(
      vertexSchema({
        type: 'object',
        additionalProperties: false,
        required: ['amount', 'items'],
        properties: {
          amount: { type: ['number', 'null'] },
          items: {
            type: 'array',
            minItems: 1,
            maxItems: 5,
            items: { type: ['string', 'number', 'boolean', 'null'] },
          },
        },
      }),
    ).toEqual({
      type: 'OBJECT',
      required: ['amount', 'items'],
      propertyOrdering: ['amount', 'items'],
      properties: {
        amount: { nullable: true, type: 'NUMBER' },
        items: {
          type: 'ARRAY',
          minItems: 1,
          maxItems: 5,
          items: {
            nullable: true,
            anyOf: [{ type: 'STRING' }, { type: 'NUMBER' }, { type: 'BOOLEAN' }],
          },
        },
      },
    });
  });

  it('ignores private thought parts and joins only public JSON text', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      response({
        candidates: [
          candidate([
            { thought: true, text: 'SECRET_THOUGHT invalid JSON' },
            { text: '{"summary":' },
            { thoughtSignature: 'SECRET_SIGNATURE' },
            { text: '"Ready"}' },
          ]),
        ],
      }),
    );
    expect(await generate(config(), request, fetchImpl)).toEqual({ summary: 'Ready' });
  });

  it.each(['MAX_TOKENS', 'SAFETY', 'RECITATION', 'OTHER', ''])(
    'rejects non-completed %s candidates',
    async (finishReason) => {
      const fetchImpl = vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          response({ candidates: [candidate([{ text: '{"summary":"partial"}' }], finishReason)] }),
        );
      await expect(generate(config(), request, fetchImpl)).rejects.toMatchObject({
        code: 'invalid_model_response',
        message: 'The AI response could not be verified.',
      });
    },
  );

  it.each([
    {},
    { candidates: [] },
    { candidates: [candidate([]), candidate([])] },
    { candidates: [candidate([{ thought: true, text: '{"summary":"private"}' }])] },
    { candidates: [candidate([{ text: 'private invalid-json output' }])] },
    { candidates: [{ finishReason: 'STOP', content: null }] },
  ])(
    'rejects missing, malformed or ambiguous provider output with a fixed error',
    async (output) => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response(output));
      await expect(generate(config(), request, fetchImpl)).rejects.toMatchObject({
        code: 'invalid_model_response',
        message: 'The AI response could not be verified.',
      });
    },
  );

  it.each([401, 403, 500])('sanitizes HTTP %s provider bodies', async (status) => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('SECRET_PROVIDER_BODY', { status }));
    await expect(generate(config(), request, fetchImpl)).rejects.toMatchObject({
      code: 'ai_unavailable',
      message: 'The live AI provider could not complete this request.',
    });
  });

  it('returns a safe busy error for quota exhaustion and sanitizes network exceptions', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('SECRET_QUOTA_BODY', { status: 429 }))
      .mockRejectedValueOnce(new Error('SECRET_NETWORK_DETAIL'));
    await expect(generate(config(), request, fetchImpl)).rejects.toMatchObject({
      code: 'ai_busy',
      message: 'The live AI provider is busy. Try again shortly.',
    });
    await expect(generate(config(), request, fetchImpl)).rejects.toMatchObject({
      code: 'invalid_model_response',
      message: 'The AI response could not be verified.',
    });
  });

  it('does not invoke Vertex when configured credentials are invalid', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(
      generate(
        { ...config(), env: { VERTEX_ACCESS_TOKEN: 'SECRET_TOKEN\r\nheader' } },
        request,
        fetchImpl,
      ),
    ).rejects.toMatchObject({
      code: 'ai_unavailable',
      message: 'The live AI credentials are unavailable.',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects oversized provider output without exposing its content', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('SECRET_'.repeat(10_000)));
    await expect(generate(config(), request, fetchImpl)).rejects.toMatchObject({
      code: 'invalid_model_response',
    });
  });

  it('cancels an oversized stream before waiting for the provider to finish it', async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(65_537));
      },
      cancel() {
        cancelled = true;
      },
    });
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(stream));
    await expect(generate(config(), request, fetchImpl)).rejects.toMatchObject({
      code: 'invalid_model_response',
    });
    expect(cancelled).toBe(true);
  });

  it('aborts Vertex inference after 45 seconds and reports a safe timeout', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockImplementation(
        async (_url, init) =>
          new Promise<Response>((_resolve, reject) =>
            init!.signal!.addEventListener('abort', () => reject(new Error('SECRET_DETAIL'))),
          ),
      );
    const result = generate(config(), request, fetchImpl).catch((error: unknown) => error);
    await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1));
    await vi.advanceTimersByTimeAsync(45_000);
    expect(await result).toMatchObject({
      code: 'ai_timeout',
      message: 'The live AI request timed out. Try again.',
    });
  });
});
