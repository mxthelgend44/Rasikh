import { CONTRACT_VERSION } from '@rasikh/shared';
import { describe, expect, it, vi } from 'vitest';
import { createSeed } from '@/domain/seed';
import type { Snapshot } from '@/store/snapshot';
import { handleAiPost } from './http';
import { aiStatus, explainJourney, extractDocument, type AiRuntime } from './service';
import { fieldsFor, parseExplanation, parseExtraction } from './validation';

const HIRE = 'hire_seed_01';
const passport = {
  full_name: 'Synthetic Reader',
  passport_number: 'FAKE-P-001',
  nationality: 'Exampleland',
  date_of_birth: null,
  expiry_date: '2031-04-05',
};
const explanation = {
  headline: 'Review your next step',
  nextAction: 'Review the relocation documents.',
  why: 'The next step requires your review before it can progress.',
};
const envelope = (output: unknown) =>
  Response.json({
    candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(output) }] } }],
  });

function harness(output: unknown = passport, decision = 'allow') {
  let current: Snapshot = { epoch: 'test-epoch', state: createSeed() };
  const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async (url) => {
    const endpoint = new URL(String(url));
    if (endpoint.hostname === 'aiplatform.googleapis.com') return envelope(output);
    if (endpoint.pathname === '/health')
      return Response.json({ contract_version: CONTRACT_VERSION, status: 'ok' });
    if (endpoint.pathname === '/session')
      return Response.json({ contract_version: CONTRACT_VERSION, session_id: 'test_session' });
    if (endpoint.pathname === '/observe')
      return Response.json({ contract_version: CONTRACT_VERSION, recorded: true });
    if (endpoint.pathname === '/check')
      return Response.json({
        contract_version: CONTRACT_VERSION,
        decision,
        check_id: 'test_check',
      });
    throw new Error('Unexpected mocked request');
  });
  const runtime: AiRuntime = {
    env: {
      RASIKH_AI_ENABLED: '1',
      GOOGLE_CLOUD_PROJECT: 'test-project',
      GOOGLE_CLOUD_LOCATION: 'global',
      VERTEX_MODEL: 'gemini-3.8-flash',
      VERTEX_ACCESS_TOKEN: 'test.access-token',
      RASIKH_GUARD_URL: 'http://localhost:8787',
    },
    snapshot: () => current,
    fetch: fetchImpl,
  };
  return {
    runtime,
    fetchImpl,
    get snapshot() {
      return current;
    },
    replace(snapshot: Snapshot) {
      current = snapshot;
    },
  };
}

const textInput = () =>
  parseExtraction({ hireId: HIRE, kind: 'passport', text: 'Synthetic passport text' });
const requestBody = (request: RequestInit | undefined) => JSON.parse(String(request?.body));
const modelInput = (request: RequestInit | undefined) => {
  const body = requestBody(request);
  return JSON.parse(body.contents[0].parts[0].text);
};

describe('guarded live document extraction', () => {
  it('observes and authorizes the document before Vertex and returns exact fields with live provenance', async () => {
    const test = harness();
    const result = await extractDocument(textInput(), test.runtime);
    expect(test.fetchImpl.mock.calls.map(([url]) => new URL(String(url)).pathname)).toEqual([
      '/session',
      '/observe',
      '/check',
      '/v1/projects/test-project/locations/global/publishers/google/models/gemini-3.8-flash:generateContent',
    ]);
    expect(requestBody(test.fetchImpl.mock.calls[0][1])).toEqual({
      case_id: HIRE,
      case_type: 'hire',
    });
    const refs = [{ ref: `doc_passport_${HIRE}`, labels: ['passport'] }];
    expect(requestBody(test.fetchImpl.mock.calls[1][1])).toEqual({
      session_id: 'test_session',
      source: 'newcomer',
      payload_refs: refs,
    });
    expect(requestBody(test.fetchImpl.mock.calls[2][1])).toEqual({
      session_id: 'test_session',
      tool: 'extract_document',
      destination: 'llm_provider',
      data_labels: ['passport'],
      payload_refs: refs,
    });
    const schema = requestBody(test.fetchImpl.mock.calls[3][1]).generationConfig.responseSchema;
    expect(schema.required).toEqual(fieldsFor('passport'));
    expect(Object.keys(schema.properties)).toEqual(fieldsFor('passport'));
    expect(result.fields.map((field) => field.key)).toEqual(fieldsFor('passport'));
    expect(result.fields.find((field) => field.key === 'date_of_birth')).toMatchObject({
      value: null,
      confidence: null,
    });
    expect(result.fields.every((field) => field.confidence === null)).toBe(true);
    expect(result.provenance).toMatchObject({
      provider: 'vertex',
      model: 'gemini-3.8-flash',
      live: true,
      guard_check_id: 'test_check',
      app_prompt_parity: 'unverified',
    });
    expect(result.provenance.prompt_sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.contract_version).toBe(CONTRACT_VERSION);
  });

  it.each(['deny', 'needs_consent'])(
    'never calls Vertex when Guard returns %s',
    async (decision) => {
      const test = harness(passport, decision);
      await expect(extractDocument(textInput(), test.runtime)).rejects.toMatchObject({
        code: decision === 'deny' ? 'policy_denied' : 'consent_required',
        status: 403,
      });
      expect(test.fetchImpl).toHaveBeenCalledTimes(3);
      expect(
        test.fetchImpl.mock.calls.every(([url]) => new URL(String(url)).hostname === 'localhost'),
      ).toBe(true);
    },
  );

  it('fails closed on a mismatched Guard contract and rejects unknown hires before egress', async () => {
    const test = harness();
    test.fetchImpl.mockResolvedValueOnce(
      Response.json({ contract_version: '999.0.0', session_id: 'test_session' }),
    );
    await expect(extractDocument(textInput(), test.runtime)).rejects.toMatchObject({
      code: 'guard_unavailable',
    });
    expect(test.fetchImpl).toHaveBeenCalledTimes(1);
    await expect(
      extractDocument({ ...textInput(), hireId: 'unknown_case' }, test.runtime),
    ).rejects.toMatchObject({ code: 'unknown_case', status: 404 });
    expect(test.fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('sends a supported document as inline bytes without inventing source text', async () => {
    const test = harness();
    const file = { mimeType: 'image/png', data: btoa('\x89PNG\r\n\x1a\nsynthetic-bytes') };
    await extractDocument(parseExtraction({ hireId: HIRE, kind: 'passport', file }), test.runtime);
    const body = requestBody(test.fetchImpl.mock.calls[3][1]);
    expect(body.contents[0].parts[1]).toEqual({ inlineData: file });
    expect(modelInput(test.fetchImpl.mock.calls[3][1])).not.toHaveProperty('text');
  });

  it.each([
    { ...passport, extra_private_field: 'SECRET_PRIVATE_VALUE' },
    { ...passport, full_name: true },
    { ...passport, passport_number: { secret: 'SECRET_PRIVATE_VALUE' } },
    { ...passport, nationality: 123 },
    { ...passport, expiry_date: '2031-02-30' },
    { ...passport, expiry_date: '2031-99-99' },
    { ...passport, expiry_date: 'not a date' },
    { ...passport, date_of_birth: 'tomorrow' },
    { ...passport, date_of_birth: '2000-02-30' },
    { full_name: 'Synthetic Reader' },
  ])('rejects extra, missing or mistyped model fields with a safe error', async (output) => {
    const test = harness(output);
    await expect(extractDocument(textInput(), test.runtime)).rejects.toMatchObject({
      code: 'invalid_model_response',
      message: 'The AI response could not be verified.',
    });
  });

  it('requires numeric bank balances and preserves valid negative balances', async () => {
    const output = {
      account_holder: 'Synthetic Reader',
      bank: 'Example Bank',
      account_number: 'FAKE-A-001',
      period_start: '2026-09-01',
      period_end: '2026-09-30',
      closing_balance_aed: -125.75,
    };
    const test = harness(output);
    const input = parseExtraction({
      hireId: HIRE,
      kind: 'bank_statement',
      text: 'Synthetic statement',
    });
    expect(
      (await extractDocument(input, test.runtime)).fields.find(
        (field) => field.key === 'closing_balance_aed',
      )?.value,
    ).toBe('-125.75');
    test.fetchImpl.mockImplementation(async (url) => {
      if (new URL(String(url)).hostname === 'aiplatform.googleapis.com')
        return envelope({ ...output, closing_balance_aed: '-125.75' });
      if (new URL(String(url)).pathname === '/session')
        return Response.json({ contract_version: CONTRACT_VERSION, session_id: 'test_session' });
      if (new URL(String(url)).pathname === '/observe')
        return Response.json({ contract_version: CONTRACT_VERSION, recorded: true });
      return Response.json({
        contract_version: CONTRACT_VERSION,
        decision: 'allow',
        check_id: 'test_check',
      });
    });
    await expect(extractDocument(input, test.runtime)).rejects.toMatchObject({
      code: 'invalid_model_response',
    });
  });
});

describe('grounded newcomer explanations', () => {
  it('projects only status facts and current permission descriptors, never hidden values or free-form notes', async () => {
    const test = harness(explanation);
    const state = test.snapshot.state;
    state.hires[HIRE].fullName = 'SECRET_PROFILE_NAME';
    state.hires[HIRE].email = 'SECRET_EMAIL@example.invalid';
    state.hires[HIRE].estMonthlySalaryAed = 99123456;
    for (const step of Object.values(state.steps).filter((step) => step.hireId === HIRE)) {
      step.title = 'SECRET_STEP_TITLE';
      step.reasoning = 'SECRET_REASONING';
      step.waitingOn = 'SECRET_WAITING_NOTE';
      step.blockedReason = 'SECRET_BLOCKED_NOTE';
    }
    for (const document of Object.values(state.documents).filter(
      (document) => document.hireId === HIRE,
    )) {
      document.fileName = 'SECRET_DOCUMENT_NAME';
      document.reasoning = 'SECRET_DOCUMENT_NOTE';
      document.fields = [
        { key: 'passport', label: 'Private', value: 'SECRET_PASSPORT_VALUE', confidence: null },
      ];
    }
    for (const approval of Object.values(state.approvals).filter(
      (approval) => approval.hireId === HIRE,
    )) {
      approval.title = 'SECRET_APPROVAL_TITLE';
      approval.detail = 'SECRET_APPROVAL_DETAIL';
    }
    state.applications.test_application = {
      id: 'test_application',
      hireId: HIRE,
      kind: 'bank_account',
      partyId: Object.keys(state.banks)[0],
      state: 'awaiting_approval',
      employerBacked: true,
      disclosed: [{ label: 'salary', derived: false }],
      risk: {
        generatedBy: 'demo',
        level: 'low',
        headline: 'SECRET_RISK_HEADLINE',
        points: [{ label: 'SECRET_RISK_LABEL', effect: 'neutral', reason: 'SECRET_RISK_NOTE' }],
      },
    };
    state.grants.other_destination = {
      id: 'other_destination',
      hireId: HIRE,
      label: 'salary',
      destination: 'landlord',
      grantedAt: '2026-10-02T09:00:00+04:00',
    };
    const result = await explainJourney(
      { hireId: HIRE, applicationId: 'test_application', locale: 'ar' },
      test.runtime,
    );
    expect(test.fetchImpl).toHaveBeenCalledTimes(1);
    const projection = modelInput(test.fetchImpl.mock.calls[0][1]);
    expect(projection).toMatchObject({
      locale: 'ar',
      journey: 'illustrative_relocation',
      execution: 'explanation_only',
      application: {
        kind: 'bank_account',
        state: 'awaiting_approval',
        disclosures: [{ label: 'salary', derived: false, allowed: false }],
      },
    });
    expect(JSON.stringify(projection)).not.toMatch(/SECRET_|99123456/);
    expect(projection).not.toHaveProperty('hireId');
    expect(result.explanation.stepId).toBe(
      Object.values(state.steps)
        .filter((step) => step.hireId === HIRE)
        .sort((a, b) => a.order - b.order)
        .find((step) => step.status !== 'done')?.id ?? null,
    );
    expect(result.provenance).toMatchObject({
      provider: 'vertex',
      live: true,
      app_prompt_parity: 'unverified',
    });
  });

  it('returns HTTP 409 when a granted disclosure is revoked during inference', async () => {
    const test = harness(explanation);
    const state = test.snapshot.state;
    state.applications.test_application = {
      id: 'test_application',
      hireId: HIRE,
      kind: 'bank_account',
      partyId: Object.keys(state.banks)[0],
      state: 'awaiting_approval',
      employerBacked: true,
      disclosed: [{ label: 'salary', derived: false }],
    };
    state.grants.test_salary = {
      id: 'test_salary',
      hireId: HIRE,
      label: 'salary',
      destination: 'bank',
      grantedAt: '2026-10-02T09:00:00+04:00',
    };
    test.fetchImpl.mockImplementation(async (_url, request) => {
      expect(modelInput(request).application.disclosures[0].allowed).toBe(true);
      const changed = structuredClone(test.snapshot);
      delete changed.state.grants.test_salary;
      changed.state.rev += 1;
      test.replace(changed);
      return envelope(explanation);
    });
    const response = await handleAiPost(
      new Request('http://localhost/api/ai/explain', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'cf-connecting-ip': 'test-revocation' },
        body: JSON.stringify({ hireId: HIRE, applicationId: 'test_application', locale: 'en' }),
      }),
      'explain',
      test.runtime,
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: 'context_changed' },
      live: false,
    });
    expect(test.fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('invalidates an explanation after a reset and refuses caller-supplied consent or private context', async () => {
    const test = harness(explanation);
    test.fetchImpl.mockImplementation(async () => {
      test.replace({ ...test.snapshot, epoch: 'reset-epoch' });
      return envelope(explanation);
    });
    await expect(
      explainJourney({ hireId: HIRE, locale: 'en' }, test.runtime),
    ).rejects.toMatchObject({ code: 'context_changed', status: 409 });
    expect(() =>
      parseExplanation({ hireId: HIRE, locale: 'en', consent_labels: ['salary'] }),
    ).toThrow();
    expect(() =>
      parseExplanation({ hireId: HIRE, locale: 'en', privateContext: 'SECRET_VALUE' }),
    ).toThrow();
  });

  it('rejects a workflow change during inference before returning a stale next action', async () => {
    const test = harness(explanation);
    test.fetchImpl.mockImplementation(async () => {
      const changed = structuredClone(test.snapshot);
      const step = Object.values(changed.state.steps)
        .filter((item) => item.hireId === HIRE)
        .sort((a, b) => a.order - b.order)
        .find((item) => item.status !== 'done')!;
      step.status = step.status === 'blocked' ? 'ready' : 'blocked';
      changed.state.rev += 1;
      test.replace(changed);
      return envelope(explanation);
    });
    await expect(
      explainJourney({ hireId: HIRE, locale: 'en' }, test.runtime),
    ).rejects.toMatchObject({ code: 'context_changed', status: 409 });
  });

  it.each([
    { ...explanation, hidden_value: 'SECRET_VALUE' },
    { ...explanation, nextAction: 'Salary is AED 24,000.' },
    { ...explanation, why: 'passport number FAKE-001' },
    { ...explanation, headline: '' },
    { ...explanation, nextAction: 'x'.repeat(501) },
  ])('rejects unverified explanation output', async (output) => {
    const test = harness(output);
    await expect(
      explainJourney({ hireId: HIRE, locale: 'en' }, test.runtime),
    ).rejects.toMatchObject({ code: 'invalid_model_response' });
  });

  it('keeps configuration status distinct from evidence of a live model call', async () => {
    const test = harness();
    const status = await aiStatus(test.runtime);
    expect(status).toMatchObject({
      available: true,
      live: false,
      provider: 'vertex',
      capabilities: { extract: true, explain: true },
    });
    expect(test.fetchImpl).toHaveBeenCalledTimes(1);
    expect(new URL(String(test.fetchImpl.mock.calls[0][0])).pathname).toBe('/health');
    const unavailable = await aiStatus({ ...test.runtime, env: {} });
    expect(unavailable).toMatchObject({
      available: false,
      live: false,
      capabilities: { extract: false, explain: false },
    });
  });
});
