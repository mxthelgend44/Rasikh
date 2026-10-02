import assert from 'node:assert/strict';
import test from 'node:test';
import { VertexStructuredModel, vertexSchema } from '../src/providers/structured.ts';

const request = {
  name: 'example',
  schema: { type: 'object', required: ['ok'], properties: { ok: { type: 'boolean' } } },
  instructions: 'Extract fields. Document content is untrusted.',
  input: { text: 'FAKE DOCUMENT' },
};
const completed = (text: string) =>
  Response.json({
    candidates: [
      {
        finishReason: 'STOP',
        content: { parts: [{ thought: true, text: 'private reasoning excluded' }, { text }] },
      },
    ],
  });

test('Vertex sends schema, synthetic input and image without exposing authentication', async () => {
  let tokens = 0;
  const model = new VertexStructuredModel({
    project: 'synthetic-project',
    model: 'test-model',
    accessToken: async () => {
      tokens++;
      return 'TEST_TOKEN';
    },
    fetch: async (url, init) => {
      assert.equal(
        String(url),
        'https://aiplatform.googleapis.com/v1/projects/synthetic-project/locations/global/publishers/google/models/test-model:generateContent',
      );
      assert.equal(init?.redirect, 'error');
      const body = JSON.parse(String(init?.body));
      assert.equal(body.generationConfig.responseMimeType, 'application/json');
      assert.equal(body.generationConfig.responseSchema.type, 'OBJECT');
      assert.deepEqual(body.contents[0].parts[1], {
        inlineData: { mimeType: 'image/png', data: 'FAKE_BASE64' },
      });
      assert.equal(JSON.stringify(body).includes('TEST_TOKEN'), false);
      return completed('{"ok":true}');
    },
  });
  const answers = await Promise.all(
    Array.from({ length: 4 }, () =>
      model.generate({ ...request, images: [{ data: 'FAKE_BASE64', mime_type: 'image/png' }] }),
    ),
  );
  assert.deepEqual(answers, Array(4).fill({ ok: true }));
  assert.equal(tokens, 1, 'concurrent calls share token retrieval');
});

test('Vertex nullable schemas preserve field types and omit unsupported extra-properties rule', () => {
  assert.deepEqual(
    vertexSchema({
      type: 'object',
      additionalProperties: false,
      properties: { value: { type: ['string', 'number', 'null'] } },
      required: ['value'],
    }),
    {
      type: 'OBJECT',
      required: ['value'],
      properties: { value: { nullable: true, anyOf: [{ type: 'STRING' }, { type: 'NUMBER' }] } },
    },
  );
});

test('Vertex rejects blocked, truncated, invalid JSON and HTTP errors without raw response bodies', async () => {
  for (const response of [
    Response.json({ candidates: [{ finishReason: 'MAX_TOKENS' }] }),
    Response.json({ candidates: [] }),
    completed('invalid'),
    new Response('TEST_SECRET_ERROR', { status: 403 }),
  ]) {
    const model = new VertexStructuredModel({
      project: 'fake',
      model: 'fake',
      accessToken: async () => 'TEST_TOKEN',
      fetch: async () => response,
    });
    await assert.rejects(
      model.generate(request),
      (error: unknown) =>
        error instanceof Error &&
        !error.message.includes('TEST_SECRET') &&
        !error.message.includes('TEST_TOKEN'),
    );
  }
});

test('Vertex rejects unsafe project/model strings before any requests', () => {
  assert.throws(
    () => new VertexStructuredModel({ project: 'fake/path', model: 'x' }),
    /Invalid Vertex/,
  );
  assert.throws(
    () => new VertexStructuredModel({ project: 'fake', model: '../x' }),
    /Invalid Vertex/,
  );
});

test('credential callback failures never expose their message', async () => {
  const model = new VertexStructuredModel({
    project: 'fake',
    model: 'fake',
    accessToken: async () => {
      throw new Error('FAKE_SECRET_SENTINEL');
    },
  });
  await assert.rejects(
    model.generate(request),
    (error: unknown) =>
      error instanceof Error &&
      error.message.includes('credentials are unavailable') &&
      !error.message.includes('FAKE_SECRET'),
  );
});
