import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import test from 'node:test';
import { AppHttpAdapter } from '../src/adapters/app.ts';
import { HttpGuardAdapter } from '../src/adapters/guard.ts';
import { OpenAiAdapter } from '../src/adapters/openai.ts';
import type { Fetch } from '../src/adapters/http.ts';
import { documentFixtures } from '../src/fixtures/documents.ts';
import { roadmapFixtures } from '../src/fixtures/roadmaps.ts';
import { summaryFixtures } from '../src/fixtures/summaries.ts';
import { guardFixtures } from '../src/fixtures/guard.ts';

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
const guardResponse = (decision = 'deny') => ({
  contract_version: '1.0.0',
  check_id: 'fake_check',
  decision,
  reason: 'Synthetic policy result.',
  policy_rule: 'fake.test.rule',
  blocked_labels: ['salary'],
});

test('HTTP Guard uses a new session, observes reads, then evaluates omitted labels', async (t) => {
  const calls: { path: string; body: Record<string, unknown> }[] = [];
  const server = createServer(async (request, response) => {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const body = JSON.parse(Buffer.concat(chunks).toString()) as Record<string, unknown>;
    calls.push({ path: request.url!, body });
    response.setHeader('content-type', 'application/json');
    response.end(
      JSON.stringify(
        request.url === '/session'
          ? { contract_version: '1.0.0', session_id: `fake_session_${calls.length}` }
          : request.url === '/observe'
            ? { contract_version: '1.0.0', recorded: true }
            : guardResponse(),
      ),
    );
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => close(server));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const adapter = new HttpGuardAdapter({ baseUrl: `http://127.0.0.1:${address.port}` });
  const fixture = guardFixtures[13]!;
  const outcome = await adapter.check(fixture);
  assert.equal(outcome.verified, true);
  assert.equal(outcome.source, 'http');
  assert.deepEqual(
    calls.map((call) => call.path),
    ['/session', '/observe', '/check'],
  );
  assert.deepEqual(calls[1]!.body.payload_refs, fixture.observed);
  assert.deepEqual(calls[2]!.body.data_labels, []);
  assert.equal(calls[1]!.body.session_id, calls[2]!.body.session_id);
  await adapter.check(guardFixtures[0]!);
  assert.equal(calls[3]!.path, '/session');
  assert.notEqual(calls[2]!.body.session_id, calls[4]!.body.session_id);
});

async function close(server: Server): Promise<void> {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

test('unreachable, HTTP errors and malformed/version mismatched responses fail closed', async () => {
  const badFetches: Fetch[] = [
    async () => {
      throw new Error('secret transport details');
    },
    async () => json({ error: 'internal details' }, 503),
    async () => new Response('not JSON'),
    async () => json({ contract_version: '9.0.0', session_id: 'fake_session' }),
    async () => json({ contract_version: '1.0.0' }),
  ];
  for (const fetch of badFetches) {
    const result = await new HttpGuardAdapter({ fetch }).check(guardFixtures[0]!);
    assert.equal(result.decision, 'deny');
    assert.equal(result.source, 'fail_closed');
    assert.equal(result.verified, false);
    assert.ok(result.error);
    assert.ok(!result.error.includes('secret'));
  }
});

test('failed observe stops before /check, malformed checks are unverified', async () => {
  const calls: string[] = [];
  const fetch: Fetch = async (url) => {
    calls.push(String(url));
    return json(
      String(url).endsWith('/session')
        ? { contract_version: '1.0.0', session_id: 'fake' }
        : { contract_version: '1.0.0', recorded: false },
    );
  };
  assert.equal((await new HttpGuardAdapter({ fetch }).check(guardFixtures[13]!)).verified, false);
  assert.equal(calls.length, 2);
  const malformed: Fetch = async (url) =>
    json(
      String(url).endsWith('/session')
        ? { contract_version: '1.0.0', session_id: 'fake' }
        : { contract_version: '1.0.0', decision: 'deny' },
    );
  assert.equal(
    (await new HttpGuardAdapter({ fetch: malformed }).check(guardFixtures[0]!)).source,
    'fail_closed',
  );
});

test('OpenAI adapter uses Responses structured output without expected field values', async () => {
  let request: Record<string, unknown> | undefined;
  const fixture = documentFixtures[0]!;
  const fetch: Fetch = async (_url, options) => {
    request = JSON.parse(String(options!.body));
    return json({
      status: 'completed',
      output: [
        {
          type: 'message',
          content: [{ type: 'output_text', text: JSON.stringify(fixture.expected) }],
        },
      ],
    });
  };
  const answer = await new OpenAiAdapter({
    apiKey: 'fake_test_key',
    model: 'fake_test_model',
    fetch,
  }).extract(fixture);
  assert.deepEqual(answer, fixture.expected);
  assert.equal(request!.store, false);
  assert.equal(request!.model, 'fake_test_model');
  const input = JSON.parse(String(request!.input));
  assert.equal(input.text, fixture.text);
  assert.ok(!Object.hasOwn(input, 'expected'));
  const format = (
    request!.text as { format: { type: string; strict: boolean; schema: { required: string[] } } }
  ).format;
  assert.equal(format.type, 'json_schema');
  assert.equal(format.strict, true);
  assert.deepEqual(format.schema.required, Object.keys(fixture.expected));
});

test('OpenAI refusals, incomplete results, invalid JSON, missing text and HTTP errors fail', async () => {
  const envelopes = [
    { status: 'incomplete', output: [] },
    {
      status: 'completed',
      output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'No' }] }],
    },
    {
      status: 'completed',
      output: [{ type: 'message', content: [{ type: 'output_text', text: 'invalid' }] }],
    },
    { status: 'completed', output: [] },
  ];
  for (const envelope of envelopes)
    await assert.rejects(
      new OpenAiAdapter({
        apiKey: 'fake',
        model: 'fake',
        fetch: async () => json(envelope),
      }).extract(documentFixtures[0]!),
    );
  await assert.rejects(
    new OpenAiAdapter({ apiKey: 'fake', model: 'fake', fetch: async () => json({}, 429) }).extract(
      documentFixtures[0]!,
    ),
    /HTTP 429/,
  );
  assert.throws(() => new OpenAiAdapter({ apiKey: '', model: 'fake' }), /requires/);
  assert.throws(() => new OpenAiAdapter({ apiKey: 'fake', model: '' }), /requires/);
  await assert.rejects(
    new OpenAiAdapter({
      apiKey: 'secret_fake_key',
      model: 'fake',
      fetch: async () => {
        throw new Error('secret_fake_key in transport diagnostics');
      },
    }).extract(documentFixtures[0]!),
    (error) => error instanceof Error && !error.message.includes('secret_fake_key'),
  );
});

test('App eval transport matches documented inputs and validates contract/result shapes', async () => {
  const calls: { url: string; body: Record<string, unknown> }[] = [];
  const fetch: Fetch = async (url, options) => {
    calls.push({ url: String(url), body: JSON.parse(String(options!.body)) });
    return json({
      contract_version: '1.0.0',
      ...(String(url).endsWith('/extract')
        ? { fields: documentFixtures[0]!.expected }
        : String(url).endsWith('/roadmap')
          ? roadmapFixtures[0]!.expected
          : { summary: 'Synthetic summary.' }),
    });
  };
  const adapter = new AppHttpAdapter('http://fake.local/evals/', { fetch });
  assert.deepEqual(await adapter.extract(documentFixtures[0]!), documentFixtures[0]!.expected);
  assert.deepEqual(
    await adapter.roadmap(roadmapFixtures[0]!, roadmapFixtures[0]!.expected),
    roadmapFixtures[0]!.expected,
  );
  assert.equal(await adapter.summarize(summaryFixtures[0]!), 'Synthetic summary.');
  assert.deepEqual(
    calls.map((call) => call.url),
    [
      'http://fake.local/evals/extract',
      'http://fake.local/evals/roadmap',
      'http://fake.local/evals/summary',
    ],
  );
  assert.ok(!Object.hasOwn(calls[0]!.body, 'expected'));
  assert.deepEqual(calls[1]!.body.engine_ground_truth, roadmapFixtures[0]!.expected);
  assert.equal(calls[2]!.body.destination, 'landlord');
  await assert.rejects(
    new AppHttpAdapter('http://fake.local', {
      fetch: async () => json({ contract_version: '0.0.0', fields: {} }),
    }).extract(documentFixtures[0]!),
    /version mismatch/,
  );
  await assert.rejects(
    new AppHttpAdapter('http://fake.local', {
      fetch: async () => json({ contract_version: '1.0.0', summary: '' }),
    }).summarize(summaryFixtures[0]!),
    /missing/,
  );
});
