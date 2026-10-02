import type { DataLabel } from '@rasikh/shared';
import { AiError, exactKeys, invalid, isRecord } from './errors';

export const MAX_FILE_BYTES = 4 * 1024 * 1024;
export const MAX_REQUEST_BYTES = Math.ceil((MAX_FILE_BYTES * 4) / 3) + 65536;
export const SUPPORTED_KINDS = [
  'passport',
  'degree',
  'residence_visa',
  'emirates_id',
  'bank_statement',
] as const;
export type ExtractKind = (typeof SUPPORTED_KINDS)[number];
export interface ExtractionInput {
  hireId: string;
  kind: ExtractKind;
  text?: string;
  file?: { mimeType: 'image/png' | 'image/jpeg' | 'application/pdf'; data: string };
}
export interface ExplanationInput {
  hireId: string;
  applicationId?: string;
  locale: 'en' | 'ar';
}

const FIELDS: Record<ExtractKind, readonly string[]> = {
  passport: ['full_name', 'passport_number', 'nationality', 'date_of_birth', 'expiry_date'],
  degree: ['full_name', 'institution', 'degree', 'field', 'award_date'],
  residence_visa: ['full_name', 'visa_number', 'issue_date', 'expiry_date'],
  emirates_id: ['full_name', 'emirates_id_number', 'nationality', 'expiry_date'],
  bank_statement: [
    'account_holder',
    'bank',
    'account_number',
    'period_start',
    'period_end',
    'closing_balance_aed',
  ],
};
const LABELS: Record<ExtractKind, DataLabel[]> = {
  passport: ['passport'],
  degree: ['degree'],
  residence_visa: ['passport'],
  emirates_id: ['emirates_id'],
  bank_statement: ['bank_statement'],
};
export function fieldsFor(kind: ExtractKind): readonly string[] {
  return FIELDS[kind];
}
export function labelsFor(kind: ExtractKind): DataLabel[] {
  return [...LABELS[kind]];
}

function id(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(value)) invalid();
  return value;
}

function validateFile(value: unknown): NonNullable<ExtractionInput['file']> {
  if (!isRecord(value)) invalid('A supported document file is required.');
  exactKeys(value, ['mimeType', 'data']);
  const { mimeType, data } = value;
  if (mimeType !== 'image/png' && mimeType !== 'image/jpeg' && mimeType !== 'application/pdf') {
    throw new AiError('unsupported_media_type', 'Use a PNG, JPEG or PDF document.', 415);
  }
  if (
    typeof data !== 'string' ||
    !data.length ||
    data.length > Math.ceil((MAX_FILE_BYTES * 4) / 3) ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data)
  ) {
    invalid('The document encoding or size is not supported.');
  }
  let decoded: string;
  try {
    decoded = atob(data);
  } catch {
    invalid('The document encoding is not supported.');
  }
  if (!decoded.length || decoded.length > MAX_FILE_BYTES) invalid('The document is too large.');
  const matches =
    mimeType === 'image/png'
      ? decoded.startsWith('\x89PNG\r\n\x1a\n')
      : mimeType === 'image/jpeg'
        ? decoded.startsWith('\xff\xd8\xff')
        : decoded.startsWith('%PDF-');
  if (!matches) invalid('The file contents do not match the document type.');
  return { mimeType, data };
}

export function parseExtraction(value: unknown): ExtractionInput {
  if (!isRecord(value)) invalid();
  exactKeys(value, ['hireId', 'kind', 'text', 'file']);
  const hireId = id(value.hireId);
  if (!SUPPORTED_KINDS.includes(value.kind as ExtractKind)) {
    invalid(
      'This document type cannot be processed by the live AI provider under the current policy.',
    );
  }
  const kind = value.kind as ExtractKind;
  if ((value.text === undefined) === (value.file === undefined)) {
    invalid('Provide one document text or one document file.');
  }
  if (value.text !== undefined) {
    if (
      typeof value.text !== 'string' ||
      !value.text.trim() ||
      value.text.length > 24000 ||
      /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value.text)
    )
      invalid('The document text is not supported.');
    return { hireId, kind, text: value.text };
  }
  return { hireId, kind, file: validateFile(value.file) };
}

export function parseExplanation(value: unknown): ExplanationInput {
  if (!isRecord(value)) invalid();
  exactKeys(value, ['hireId', 'applicationId', 'locale']);
  const hireId = id(value.hireId);
  const applicationId = value.applicationId === undefined ? undefined : id(value.applicationId);
  const locale = value.locale ?? 'en';
  if (locale !== 'en' && locale !== 'ar') invalid();
  return { hireId, applicationId, locale };
}

/** Enforces limits while reading, even when the caller omits Content-Length. */
export async function readJson(request: Request, limit = MAX_REQUEST_BYTES): Promise<unknown> {
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
    throw new AiError('unsupported_media_type', 'Send the AI request as JSON.', 415);
  }
  const length = request.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > limit)) {
    throw new AiError('payload_too_large', 'The document request is too large.', 413);
  }
  if (!request.body) invalid();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    void reader.cancel().catch(() => undefined);
  }, 15000);
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new AiError('payload_too_large', 'The document request is too large.', 413);
      }
      chunks.push(value);
    }
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
  if (timedOut)
    throw new AiError('request_timeout', 'The document upload timed out. Try again.', 408);
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    invalid();
  }
}

export function validateExtracted(
  value: unknown,
  kind: ExtractKind,
): Record<string, string | number | null> {
  const fields = fieldsFor(kind);
  if (
    !isRecord(value) ||
    Object.keys(value).length !== fields.length ||
    fields.some((field) => !Object.hasOwn(value, field))
  ) {
    throw new AiError('invalid_model_response', 'The AI response could not be verified.');
  }
  const output: Record<string, string | number | null> = {};
  for (const field of fields) {
    const item = value[field];
    const numeric = field === 'closing_balance_aed';
    if (item === null) {
      output[field] = null;
      continue;
    }
    if (
      numeric
        ? typeof item !== 'number' || !Number.isFinite(item)
        : typeof item !== 'string' || item.length > 500 || !item.trim() || /[\x00-\x1f]/.test(item)
    ) {
      throw new AiError('invalid_model_response', 'The AI response could not be verified.');
    }
    if (
      /date$|^date_|^period_/.test(field) &&
      (typeof item !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(item) ||
        !Number.isFinite(new Date(item).getTime()) ||
        new Date(item).toISOString().slice(0, 10) !== item)
    ) {
      throw new AiError('invalid_model_response', 'The AI response could not be verified.');
    }
    output[field] = item as string | number;
  }
  return output;
}
