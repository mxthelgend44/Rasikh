import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { OpenAiExtractor } from '../../src/lib/agent-runtime/index';

const fields = ['full_name'];
const input = { kind: 'passport' as const, text: 'Full name: A B', fields };
const envelope = (content: unknown[]) => ({
  status: 'completed',
  output: [{ type: 'message', content }],
});
const respond =
  (body: unknown, status = 200) =>
  async () =>
    new Response(JSON.stringify(body), { status });

describe('OpenAiExtractor (fake transport; no live call is made)', () => {
  it('sends a strict, non-stored structured request with the key only in the header', async () => {
    let seen: { url: string; init: RequestInit } | undefined;
    const ex = new OpenAiExtractor({
      apiKey: 'sk-test',
      model: 'm-test',
      fetch: async (url, init) => {
        seen = { url: String(url), init: init! };
        return respond(envelope([{ type: 'output_text', text: '{"fields":{}}' }]))();
      },
    });
    assert.equal(await ex.extract(input), '{"fields":{}}');
    assert.equal(seen!.url, 'https://api.openai.com/v1/responses');
    const body = JSON.parse(String(seen!.init.body));
    assert.equal(body.store, false);
    assert.equal(body.text.format.strict, true);
    assert.equal(body.model, 'm-test');
    assert.ok(!String(seen!.init.body).includes('sk-test'));
    assert.equal((seen!.init.headers as Record<string, string>).authorization, 'Bearer sk-test');
    assert.equal(ex.provenance.live_model_call, true);
    assert.equal(ex.provenance.evaluation.openai_extraction_eval, 'not_run');
  });
  it('reports refusals, HTTP errors, transport errors and incomplete responses', async () => {
    const run = (fetch: typeof globalThis.fetch) =>
      new OpenAiExtractor({ apiKey: 'k', model: 'm', fetch }).extract(input);
    await assert.rejects(run(respond(envelope([{ type: 'refusal' }]))), /refused/);
    await assert.rejects(run(respond({}, 429)), /HTTP 429/);
    await assert.rejects(
      run(async () => {
        throw new Error('x');
      }),
      /unavailable/,
    );
    await assert.rejects(run(respond({ status: 'incomplete', output: [] })), /did not complete/);
  });
  it('requires credentials', () => {
    assert.throws(() => new OpenAiExtractor({ apiKey: '', model: 'm' }), /OPENAI_API_KEY/);
  });
});
