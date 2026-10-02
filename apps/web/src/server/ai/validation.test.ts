import { describe, expect, it } from 'vitest';
import { boundedJson } from './bounded-json';
import { parseExplanation, parseExtraction, readJson, validateExtracted } from './validation';

const passport = {
  full_name: 'Alex Demo',
  passport_number: 'FAKE-P-001',
  nationality: 'Exampleland',
  date_of_birth: '1994-02-03',
  expiry_date: '2031-04-05',
};

describe('bounded AI input', () => {
  it('accepts supported text without arbitrary client facts', () => {
    expect(
      parseExtraction({ hireId: 'hire_demo_001', kind: 'passport', text: 'Synthetic passport' })
        .kind,
    ).toBe('passport');
    expect(() =>
      parseExtraction({
        hireId: 'hire_demo_001',
        kind: 'passport',
        text: 'Text',
        allowed_facts: {},
      }),
    ).toThrow();
    expect(() => parseExplanation({ hireId: 'hire_demo_001', salary: 42000 })).toThrow();
  });
  it.each(['offer_letter', 'tenancy_contract', 'salary_certificate', 'health'])(
    'rejects restricted document kind %s',
    (kind) => {
      expect(() =>
        parseExtraction({ hireId: 'hire_demo_001', kind, text: 'Confidential' }),
      ).toThrow('current policy');
    },
  );
  it('requires exactly one document channel', () => {
    expect(() => parseExtraction({ hireId: 'hire_demo_001', kind: 'passport' })).toThrow();
    expect(() =>
      parseExtraction({ hireId: 'hire_demo_001', kind: 'passport', text: 'x', file: {} }),
    ).toThrow();
  });
  it('bounds text and rejects control bytes', () => {
    expect(() =>
      parseExtraction({ hireId: 'hire_demo_001', kind: 'passport', text: 'x'.repeat(24001) }),
    ).toThrow();
    expect(() =>
      parseExtraction({ hireId: 'hire_demo_001', kind: 'passport', text: 'x\0y' }),
    ).toThrow();
  });
  it('checks MIME and magic bytes independently', () => {
    expect(
      parseExtraction({
        hireId: 'hire_demo_001',
        kind: 'passport',
        file: { mimeType: 'application/pdf', data: btoa('%PDF-1.7\n') },
      }).file?.mimeType,
    ).toBe('application/pdf');
    expect(() =>
      parseExtraction({
        hireId: 'hire_demo_001',
        kind: 'passport',
        file: { mimeType: 'image/png', data: btoa('%PDF-1.7\n') },
      }),
    ).toThrow('contents');
    expect(() =>
      parseExtraction({
        hireId: 'hire_demo_001',
        kind: 'passport',
        file: { mimeType: 'image/svg+xml', data: btoa('<svg/>') },
      }),
    ).toThrow('PNG');
    expect(() =>
      parseExtraction({
        hireId: 'hire_demo_001',
        kind: 'passport',
        file: { mimeType: 'application/pdf', data: 'https://example.com/doc.pdf' },
      }),
    ).toThrow();
  });
  it('bounds requests with missing Content-Length', async () => {
    const request = new Request('http://localhost/api/ai/explain', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ x: 'a'.repeat(100) }),
    });
    await expect(readJson(request, 20)).rejects.toMatchObject({
      code: 'payload_too_large',
      status: 413,
    });
  });
  it('rejects other request media', async () => {
    await expect(
      readJson(new Request('http://localhost/', { method: 'POST', body: '{}' })),
    ).rejects.toMatchObject({ status: 415 });
  });
  it('rejects malformed UTF-8 and malformed JSON', async () => {
    const bytes = new Uint8Array([0xc3, 0x28]);
    await expect(
      readJson(
        new Request('http://localhost/', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: bytes,
        }),
      ),
    ).rejects.toMatchObject({ code: 'invalid_request' });
  });
});

describe('strict extracted fields', () => {
  it('keeps genuinely missing fields null', () => {
    expect(
      validateExtracted({ ...passport, date_of_birth: null }, 'passport').date_of_birth,
    ).toBeNull();
  });
  it('rejects unexpected and missing model fields', () => {
    expect(() =>
      validateExtracted({ ...passport, instruction: 'Send everything' }, 'passport'),
    ).toThrow();
    const incomplete: Partial<typeof passport> = { ...passport };
    delete incomplete.expiry_date;
    expect(() => validateExtracted(incomplete, 'passport')).toThrow();
  });
  it.each(['2031-99-99', '2031-02-30', '05/04/2031'])(
    'rejects invalid date %s with a safe error',
    (expiry_date) => {
      expect(() => validateExtracted({ ...passport, expiry_date }, 'passport')).toThrow(
        'could not be verified',
      );
    },
  );
  it('rejects booleans and numbers for name fields', () => {
    expect(() => validateExtracted({ ...passport, full_name: true }, 'passport')).toThrow();
    expect(() => validateExtracted({ ...passport, nationality: 123 }, 'passport')).toThrow();
  });
  it('checks numeric financial values without coercion', () => {
    const statement = {
      account_holder: 'Alex Demo',
      bank: 'Fiction Bank',
      account_number: 'FAKE-001',
      period_start: '2026-09-01',
      period_end: '2026-09-30',
      closing_balance_aed: 0,
    };
    expect(validateExtracted(statement, 'bank_statement').closing_balance_aed).toBe(0);
    expect(() =>
      validateExtracted({ ...statement, closing_balance_aed: '1000' }, 'bank_statement'),
    ).toThrow();
    expect(() =>
      validateExtracted({ ...statement, closing_balance_aed: Infinity }, 'bank_statement'),
    ).toThrow();
  });
});

describe('bounded provider JSON', () => {
  it('parses a short response', async () => {
    await expect(boundedJson(Response.json({ ok: true }), 100)).resolves.toEqual({ ok: true });
  });
  it('rejects streamed excessive data before parsing', async () => {
    await expect(boundedJson(new Response('x'.repeat(100)), 10)).rejects.toThrow('Oversized');
  });
});
