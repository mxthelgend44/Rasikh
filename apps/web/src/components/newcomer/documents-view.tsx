'use client';

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { Check, FileText, Pencil, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, Input, Select } from '@/components/ui/field';
import { Illustration } from '@/components/ui/illustration';
import { demoExtraction } from '@/domain/demo-extraction';
import { documentId, documentLabelsForKind, REQUIRED_DOCUMENTS } from '@/domain/documents';
import type { DocumentKind, ExtractedField, RelocationDocument } from '@/domain/types';
import { formatDate } from '@/lib/format';
import { intlTag, type MessageKey } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/provider';
import { useNewcomer } from '@/store/person';
import { useStore } from '@/store/provider';
import {
  documentFieldLabel,
  documentFieldValue,
  documentReasoning,
  documentsCopy,
  documentStatus,
  type DocumentsCopyKey,
} from './documents-copy';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_LIVE_FILE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const ACCEPTED_EXTENSION = /\.(pdf|jpe?g|png)$/i;
const DEMO_REASONING =
  'Demo suggestions generated from the hire profile. Selected file contents were not uploaded or read by AI. Confirm the fields before continuing.';

type Review = {
  document: RelocationDocument;
  fields: ExtractedField[];
  editing: string[];
  confirmed: boolean;
  error?: DocumentsCopyKey;
  provenance?: VertexResult['provenance'];
  focusPickerOnClose: boolean;
};

interface AIStatus {
  available: boolean;
  model: string | null;
  capabilities: { extract: boolean };
  supportedKinds: DocumentKind[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const LIVE_DOCUMENT_KINDS: readonly DocumentKind[] = [
  'passport',
  'degree',
  'residence_visa',
  'emirates_id',
  'bank_statement',
];

function isLiveDocumentKind(value: unknown): value is DocumentKind {
  return typeof value === 'string' && LIVE_DOCUMENT_KINDS.includes(value as DocumentKind);
}

function parseAIStatus(value: unknown): AIStatus | null {
  if (!isRecord(value) || !isRecord(value.capabilities)) return null;
  const capabilities = value.capabilities;
  const supportedKinds = value.supportedKinds;
  if (
    value.provider !== 'vertex' ||
    typeof value.available !== 'boolean' ||
    typeof capabilities.extract !== 'boolean' ||
    !Array.isArray(supportedKinds) ||
    !supportedKinds.every(isLiveDocumentKind)
  )
    return null;
  return {
    available: value.available,
    capabilities: { extract: capabilities.extract },
    model: typeof value.model === 'string' ? value.model : null,
    supportedKinds,
  };
}

interface VertexResult {
  fields: Array<{
    key: string;
    label: string;
    value: string | null;
    confidence: null;
  }>;
  reasoning: string;
  provenance: {
    provider: 'vertex';
    model: string;
    live: true;
    prompt_sha256: string;
    response_schema_sha256: string;
  };
}

function isVertexResult(value: unknown): value is VertexResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as Partial<VertexResult>;
  return (
    typeof result.reasoning === 'string' &&
    Boolean(result.reasoning.trim()) &&
    result.provenance?.provider === 'vertex' &&
    result.provenance.live === true &&
    typeof result.provenance.model === 'string' &&
    Boolean(result.provenance.model.trim()) &&
    /^[a-f0-9]{64}$/i.test(result.provenance.prompt_sha256 ?? '') &&
    /^[a-f0-9]{64}$/i.test(result.provenance.response_schema_sha256 ?? '') &&
    Array.isArray(result.fields) &&
    result.fields.length > 0 &&
    result.fields.every(
      (field) =>
        typeof field.key === 'string' &&
        typeof field.label === 'string' &&
        (typeof field.value === 'string' || field.value === null) &&
        field.confidence === null,
    )
  );
}

function fileBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The selected file could not be read'));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string' || !result.includes(','))
        reject(new Error('The selected file could not be read'));
      else resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.readAsDataURL(file);
  });
}

export function DocumentsView() {
  const { hire } = useNewcomer();
  return <DocumentsContent key={hire?.id ?? 'no-newcomer'} />;
}

function DocumentsContent() {
  const { t, locale, dir } = useI18n();
  const { state, hire } = useNewcomer();
  const store = useStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const chooseButton = useRef<HTMLButtonElement>(null);
  const picker = useId();
  const fileHint = useId();
  const uploadErrorId = useId();
  const acknowledgmentId = useId();
  const [kind, setKind] = useState<DocumentKind>('passport');
  const [selected, setSelected] = useState<{
    file: File;
    name: string;
    size: number;
    hireId: string;
  } | null>(null);
  const [uploadError, setUploadError] = useState<DocumentsCopyKey | null>(null);
  const [notice, setNotice] = useState<DocumentsCopyKey | null>(null);
  const [busy, setBusy] = useState<'add' | 'review' | 'live' | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [aiStatus, setAIStatus] = useState<AIStatus | null>(null);
  const [liveConsent, setLiveConsent] = useState(false);
  const [liveError, setLiveError] = useState<DocumentsCopyKey | null>(null);
  const copy = (key: DocumentsCopyKey, params?: Record<string, string | number>) =>
    documentsCopy(locale, key, params);
  const documents = useMemo(
    () =>
      hire ? Object.values(state.documents).filter((document) => document.hireId === hire.id) : [],
    [state.documents, hire],
  );
  const extras = documents.filter((document) => !REQUIRED_DOCUMENTS.includes(document.kind));
  const verified = REQUIRED_DOCUMENTS.filter((required) =>
    documents.some((document) => document.kind === required && document.status === 'verified'),
  ).length;
  const activeDocument = review ? state.documents[review.document.id] : undefined;
  const stale = Boolean(
    review &&
    (!activeDocument || JSON.stringify(activeDocument) !== JSON.stringify(review.document)),
  );
  const changedPerson = Boolean(review && review.document.hireId !== hire?.id);
  const selectedForHire = selected?.hireId === hire?.id ? selected : null;
  const liveAvailable = Boolean(aiStatus?.available && aiStatus.capabilities.extract);
  const selectableKinds = [
    ...new Set([...REQUIRED_DOCUMENTS, ...(aiStatus?.supportedKinds ?? [])]),
  ];
  const canExtract = Boolean(liveAvailable && aiStatus?.supportedKinds.includes(kind));
  const liveReview = review?.document.source === 'vertex';
  const kindLabel = (value: DocumentKind) => t(`documents.kind.${value}` as MessageKey);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/ai/status', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Live extraction unavailable');
        const payload: unknown = await response.json();
        const status = parseAIStatus(payload);
        if (!status) throw new Error('Live extraction unavailable');
        if (!controller.signal.aborted) setAIStatus(status);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setAIStatus({
            available: false,
            capabilities: { extract: false },
            model: null,
            supportedKinds: [],
          });
      });
    return () => controller.abort();
  }, []);

  function openReview(
    document: RelocationDocument,
    provenance?: VertexResult['provenance'],
    focusPickerOnClose = false,
  ) {
    setReview({
      document,
      fields: document.fields.map((field) => ({ ...field })),
      editing: [],
      confirmed: false,
      provenance,
      focusPickerOnClose,
    });
    setNotice(null);
  }

  function closeReview() {
    if (busy) return;
    setReview(null);
    if (review?.focusPickerOnClose) requestAnimationFrame(() => chooseButton.current?.focus());
  }

  function selectFile(file: File | undefined) {
    setNotice(null);
    setSelected(null);
    setLiveConsent(false);
    setLiveError(null);
    if (!file) return;
    let error: DocumentsCopyKey | null = null;
    if (!ACCEPTED_EXTENSION.test(file.name) || (file.type && !ACCEPTED_TYPES.has(file.type)))
      error = 'invalidType';
    else if (file.size === 0) error = 'emptyFile';
    else if (file.size > MAX_FILE_BYTES) error = 'invalidSize';
    setUploadError(error);
    if (!error && hire) setSelected({ file, name: file.name, size: file.size, hireId: hire.id });
  }

  async function extractLive() {
    if (!hire || busy || !selectedForHire || !canExtract || !liveConsent) return;
    if (selectedForHire.size > MAX_LIVE_FILE_BYTES) {
      setLiveError('liveSizeError');
      return;
    }
    const personId = hire.id;
    const chosenKind = kind;
    const file = selectedForHire.file;
    setBusy('live');
    setLiveError(null);
    setNotice(null);
    let extracted = false;
    try {
      const mimeType =
        file.type ||
        (/\.pdf$/i.test(file.name)
          ? 'application/pdf'
          : /\.png$/i.test(file.name)
            ? 'image/png'
            : 'image/jpeg');
      const data = await fileBase64(file);
      const response = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hireId: personId,
          kind: chosenKind,
          file: { mimeType, data },
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok || !isVertexResult(result)) throw new Error('Live extraction failed');
      extracted = true;
      await store.dispatch({
        type: 'document.add',
        hireId: personId,
        kind: chosenKind,
        fileName: file.name,
        labels: documentLabelsForKind(chosenKind),
        fields: result.fields.map((field) => ({
          ...field,
          value: field.value ?? '',
        })),
        reasoning: result.reasoning,
        status: 'extracted',
        source: 'vertex',
      });
      setSelected(null);
      setLiveConsent(false);
      if (fileInput.current) fileInput.current.value = '';
      const saved = store.getSnapshot().state.documents[documentId(chosenKind, personId)];
      if (saved) openReview(saved, result.provenance, true);
    } catch {
      setLiveError(extracted ? 'liveSaveFailed' : 'liveFailed');
    } finally {
      setBusy(null);
    }
  }

  async function addDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hire || busy) return;
    if (!selectedForHire) {
      setUploadError('noFile');
      fileInput.current?.focus();
      return;
    }
    const person = hire;
    const chosenKind = kind;
    const fileName = selectedForHire.name;
    setUploadError(null);
    setNotice(null);
    setBusy('add');
    try {
      const extraction = demoExtraction(
        chosenKind,
        person,
        state.employers[person.employerId]?.name ?? 'Demo employer',
      );
      await store.dispatch({
        type: 'document.add',
        hireId: person.id,
        kind: chosenKind,
        fileName,
        labels: documentLabelsForKind(chosenKind),
        fields: extraction.fields,
        reasoning: DEMO_REASONING,
        status: 'extracted',
        source: 'demo',
      });
      setSelected(null);
      if (fileInput.current) fileInput.current.value = '';
      setNotice('saved');
      const saved = store.getSnapshot().state.documents[documentId(chosenKind, person.id)];
      if (saved) openReview(saved, undefined, true);
    } catch {
      setUploadError('savingFailed');
    } finally {
      setBusy(null);
    }
  }

  async function confirmReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!review || !hire || busy || !review.confirmed) return;
    if (changedPerson || stale) {
      setReview({
        ...review,
        error: changedPerson ? 'changedPerson' : 'stale',
      });
      return;
    }
    if (review.fields.some((field) => !field.value.trim() || field.value.length > 500)) {
      setReview({
        ...review,
        editing: review.fields
          .filter((field) => !field.value.trim() || field.value.length > 500)
          .map((field) => field.key),
        error: 'requiredValue',
      });
      return;
    }
    setBusy('review');
    try {
      await store.dispatch({
        type: 'document.review',
        hireId: review.document.hireId,
        documentId: review.document.id,
        expectedVersion: review.document.version ?? 1,
        fields: review.fields.map((field) => ({
          ...field,
          value: field.value.trim(),
          confidence:
            field.value !==
            review.document.fields.find((original) => original.key === field.key)?.value
              ? null
              : field.confidence,
        })),
        accept: true,
      });
      setReview(null);
      if (review.focusPickerOnClose) requestAnimationFrame(() => chooseButton.current?.focus());
      setNotice(liveReview ? 'liveConfirmed' : 'confirmed');
    } catch {
      setReview({ ...review, error: 'reviewFailed' });
    } finally {
      setBusy(null);
    }
  }

  function renderDocument(documentKind: DocumentKind, document?: RelocationDocument) {
    return (
      <li key={document?.id ?? documentKind} className="flex flex-wrap items-center gap-3 py-4">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-subtle text-accent"
        >
          <FileText className="size-5" />
        </span>
        <div className="min-w-0 flex-1 basis-36">
          <h3 className="text-body font-medium">{kindLabel(documentKind)}</h3>
          {document ? (
            <p
              className="mt-0.5 truncate text-label text-fg-tertiary"
              dir="auto"
              title={document.fileName}
            >
              {document.fileName}
            </p>
          ) : (
            <p className="mt-0.5 text-label text-fg-tertiary">{t('documents.missing')}</p>
          )}
          {document ? (
            <div className="mt-1.5">
              <Badge
                shape="pill"
                tone={
                  document.status === 'verified'
                    ? 'success'
                    : document.status === 'rejected'
                      ? 'danger'
                      : 'warning'
                }
              >
                {documentStatus(document.status, locale, document.source)}
              </Badge>
            </div>
          ) : null}
        </div>
        {document ? (
          <Button
            variant="secondary"
            size="lg"
            disabled={Boolean(busy)}
            onClick={() => openReview(document)}
          >
            {copy(
              document.status === 'verified' || document.status === 'rejected' ? 'view' : 'review',
            )}
          </Button>
        ) : (
          <Button
            variant="tertiary"
            size="lg"
            disabled={Boolean(busy)}
            icon={<Upload />}
            onClick={() => {
              setKind(documentKind);
              setUploadError(null);
              fileInput.current?.click();
            }}
          >
            {t('documents.uploadShort')}
          </Button>
        )}
      </li>
    );
  }

  return (
    <>
      <header className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-heading font-medium">{t('documents.title')}</h1>
          <p className="mt-1 text-body text-fg-secondary">{copy('intro')}</p>
        </div>
        <Illustration
          variant="documents"
          className="w-20 shrink-0 sm:w-28"
          aspect="square"
          sizes="(max-width: 640px) 80px, 112px"
        />
      </header>

      {!hire ? (
        <p className="mt-6 text-body text-fg-secondary">{copy('missingPerson')}</p>
      ) : (
        <>
          <section
            aria-label={t('documents.upload')}
            className="mt-5 rounded-xl border border-line bg-subtle p-4 sm:p-5"
          >
            <div className="flex items-center gap-2">
              <Badge shape="pill" tone="accent">
                {copy('demo')}
              </Badge>
            </div>
            <p className="mt-2 text-body text-fg-secondary">{copy('demoHint')}</p>
            <form className="mt-4 space-y-4" onSubmit={addDocument} aria-busy={busy === 'add'}>
              <Field label={t('documents.kind')}>
                <Select
                  value={kind}
                  disabled={Boolean(busy)}
                  onChange={(event) => {
                    setKind(event.target.value as DocumentKind);
                    setNotice(null);
                    setLiveConsent(false);
                    setLiveError(null);
                  }}
                >
                  {selectableKinds.map((documentKind) => (
                    <option key={documentKind} value={documentKind}>
                      {kindLabel(documentKind)}
                    </option>
                  ))}
                </Select>
              </Field>
              <div>
                <p id={fileHint} className="text-label text-fg-tertiary">
                  {copy('fileHint')}
                </p>
                <input
                  id={picker}
                  ref={fileInput}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
                  className="sr-only"
                  tabIndex={-1}
                  aria-label={t('documents.choose')}
                  aria-describedby={`${fileHint}${uploadError ? ` ${uploadErrorId}` : ''}`}
                  disabled={Boolean(busy)}
                  onChange={(event) => selectFile(event.target.files?.[0])}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    ref={chooseButton}
                    variant="secondary"
                    size="lg"
                    disabled={Boolean(busy)}
                    icon={<Upload />}
                    aria-controls={picker}
                    aria-describedby={fileHint}
                    onClick={() => {
                      if (fileInput.current) fileInput.current.value = '';
                      fileInput.current?.click();
                    }}
                  >
                    {t('documents.choose')}
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    icon={<FileText />}
                    loading={busy === 'add'}
                    disabled={Boolean(busy) || !selectedForHire}
                  >
                    {copy(busy === 'add' ? 'adding' : 'add')}
                  </Button>
                </div>
                {selectedForHire ? (
                  <p className="mt-3 break-all text-label text-fg-secondary">
                    {copy('selected')}: <bdi>{selectedForHire.name}</bdi> ·{' '}
                    {new Intl.NumberFormat(intlTag(locale), {
                      maximumFractionDigits: 1,
                    }).format(selectedForHire.size / (1024 * 1024))}{' '}
                    MiB
                  </p>
                ) : null}
                {uploadError ? (
                  <p id={uploadErrorId} role="alert" className="mt-3 text-body text-danger">
                    {copy(uploadError)}
                  </p>
                ) : null}
              </div>
            </form>
          </section>

          {aiStatus ? (
            <section className="mt-4 rounded-lg border border-line p-4" aria-label={copy('live')}>
              <h2 className="text-body font-medium">{copy('live')}</h2>
              {canExtract ? (
                <>
                  <p className="mt-2 text-body text-fg-secondary">{copy('liveDisclosure')}</p>
                  <p className="mt-2 text-label text-fg-tertiary">{copy('liveSize')}</p>
                  {selectedForHire && selectedForHire.size > MAX_LIVE_FILE_BYTES ? (
                    <p className="mt-2 text-label text-danger">{copy('liveSizeError')}</p>
                  ) : null}
                  <label className="mt-3 flex min-h-11 cursor-pointer items-start gap-3 text-body">
                    <input
                      type="checkbox"
                      checked={liveConsent && Boolean(selectedForHire)}
                      className="mt-0.5 size-5 shrink-0 accent-accent"
                      disabled={Boolean(busy) || !selectedForHire}
                      onChange={(event) => setLiveConsent(event.target.checked)}
                    />
                    <span>{copy('liveConsent')}</span>
                  </label>
                  <Button
                    className="mt-3"
                    variant="secondary"
                    size="lg"
                    disabled={
                      Boolean(busy) ||
                      !selectedForHire ||
                      !liveConsent ||
                      selectedForHire.size > MAX_LIVE_FILE_BYTES
                    }
                    loading={busy === 'live'}
                    onClick={extractLive}
                  >
                    {copy(busy === 'live' ? 'liveBusy' : 'liveButton')}
                  </Button>
                </>
              ) : (
                <p className="mt-2 text-label text-fg-tertiary">
                  {copy(liveAvailable ? 'liveNotSupported' : 'liveUnavailable')}
                </p>
              )}
              {liveError ? (
                <p className="mt-3 text-body text-danger" role="alert">
                  {copy(liveError)}
                </p>
              ) : null}
            </section>
          ) : null}

          {notice ? (
            <p role="status" className="mt-4 flex items-start gap-2 text-body text-success">
              <Check aria-hidden className="mt-0.5 size-4 shrink-0" />
              {copy(notice)}
            </p>
          ) : null}
          <section className="mt-7" aria-labelledby={`${picker}-required`}>
            <h2 id={`${picker}-required`} className="text-title font-medium">
              {copy('required')}
            </h2>
            <p className="mt-1 text-label text-fg-tertiary">
              {copy('progress', {
                done: verified,
                total: REQUIRED_DOCUMENTS.length,
              })}
            </p>
            {!documents.length ? (
              <p className="mt-3 text-body text-fg-secondary">{copy('emptyHint')}</p>
            ) : null}
            <ul className="mt-2 divide-y divide-line">
              {REQUIRED_DOCUMENTS.map((documentKind) =>
                renderDocument(
                  documentKind,
                  documents.find((document) => document.kind === documentKind),
                ),
              )}
            </ul>
          </section>
          {extras.length ? (
            <section className="mt-6">
              <h2 className="text-title font-medium">{copy('extra')}</h2>
              <ul className="mt-2 divide-y divide-line">
                {extras.map((document) => renderDocument(document.kind, document))}
              </ul>
            </section>
          ) : null}
        </>
      )}

      <Dialog
        open={Boolean(review)}
        onClose={closeReview}
        title={review ? copy('reviewTitle', { kind: kindLabel(review.document.kind) }) : ''}
        description={copy(liveReview ? 'liveReviewHint' : 'reviewHint')}
        closeLabel={copy('close')}
        size="md"
      >
        {review ? (
          <form
            onSubmit={confirmReview}
            className="space-y-5"
            dir={dir}
            lang={locale}
            aria-busy={busy === 'review'}
          >
            <div className="rounded-lg bg-accent-soft p-3 text-body text-fg-secondary">
              <Badge shape="pill" tone="accent">
                {copy(liveReview ? 'live' : 'demo')}
              </Badge>
              <p className="mt-2">{copy(liveReview ? 'liveResult' : 'demoHint')}</p>
              {review.provenance ? (
                <p className="mt-2 text-label" dir="auto">
                  {copy('liveModel', { model: review.provenance.model })}
                </p>
              ) : null}
              <p className="mt-2 break-all text-label">
                <bdi>{review.document.fileName}</bdi> ·{' '}
                {formatDate(review.document.uploadedAt, locale)}
              </p>
              {review.document.reviewedAt ? (
                <p className="mt-1 text-label">
                  {copy('reviewedAt', {
                    date: formatDate(review.document.reviewedAt, locale),
                  })}
                </p>
              ) : null}
            </div>
            {review.document.status === 'rejected' ? (
              <p className="rounded-lg bg-danger-soft p-3 text-body text-danger">
                {copy(liveReview ? 'liveRejection' : 'rejection')}
              </p>
            ) : null}
            {!liveReview &&
            review.document.reasoning !== DEMO_REASONING &&
            review.document.status === 'rejected' ? (
              <div>
                <h3 className="text-label font-medium">{copy('fixtureReason')}</h3>
                <p className="mt-1 text-body text-fg-secondary">
                  {documentReasoning(review.document.reasoning, locale)}
                </p>
              </div>
            ) : null}
            {liveReview ? (
              <div>
                <h3 className="text-label font-medium">{copy('liveReason')}</h3>
                <p className="mt-1 break-words text-body text-fg-secondary" dir="auto">
                  {review.document.reasoning}
                </p>
                {locale === 'ar' && /[a-zA-Z]/.test(review.document.reasoning) ? (
                  <p className="mt-1 text-caption text-fg-tertiary">{copy('original')}</p>
                ) : null}
              </div>
            ) : null}
            <div className="space-y-4">
              {review.fields.map((field, index) => {
                const label = documentFieldLabel(field, t, locale);
                const display = documentFieldValue(field, locale);
                const editing = review.editing.includes(field.key);
                const corrected = field.value !== review.document.fields[index]?.value;
                const fieldError = !field.value.trim()
                  ? copy('requiredValue')
                  : field.value.length > 500
                    ? copy('tooLong')
                    : undefined;
                return (
                  <div key={`${field.key}-${index}`} className="border-b border-line pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-body font-medium">{label}</p>
                        <p className="mt-0.5 text-caption text-fg-tertiary">
                          {corrected
                            ? copy('corrected')
                            : field.confidence === null
                              ? copy('noConfidence')
                              : copy('confidence', {
                                  score: new Intl.NumberFormat(intlTag(locale), {
                                    style: 'percent',
                                    maximumFractionDigits: 0,
                                  }).format(field.confidence),
                                })}
                        </p>
                      </div>
                      {review.document.status !== 'verified' &&
                      review.document.status !== 'rejected' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={Boolean(busy)}
                          icon={editing ? <Check /> : <Pencil />}
                          aria-label={copy(editing ? 'finishEditing' : 'edit', {
                            field: label,
                          })}
                          onClick={() =>
                            setReview({
                              ...review,
                              editing: editing
                                ? review.editing.filter((key) => key !== field.key)
                                : [...review.editing, field.key],
                              confirmed: false,
                              error: undefined,
                            })
                          }
                        >
                          {copy(editing ? 'finishEditing' : 'edit', {
                            field: label,
                          })}
                        </Button>
                      ) : null}
                    </div>
                    {editing ? (
                      <Field
                        label={label}
                        hint={copy('correctionHint')}
                        error={fieldError}
                        className="mt-2"
                      >
                        <Input
                          value={field.value}
                          autoFocus
                          dir="auto"
                          maxLength={500}
                          disabled={Boolean(busy)}
                          onChange={(event) =>
                            setReview({
                              ...review,
                              fields: review.fields.map((value, position) =>
                                position === index
                                  ? { ...value, value: event.target.value }
                                  : value,
                              ),
                              confirmed: false,
                              error: undefined,
                            })
                          }
                        />
                      </Field>
                    ) : (
                      <div className="mt-2">
                        <p className="break-words text-body" dir="auto">
                          {display.value || copy('unavailableValue')}
                        </p>
                        {display.original ? (
                          <p className="mt-0.5 text-caption text-fg-tertiary">{copy('original')}</p>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
              {!review.fields.length ? (
                <p className="text-body text-fg-secondary">{copy('noFields')}</p>
              ) : null}
            </div>
            <p className="text-label text-fg-tertiary">
              {copy(liveReview ? 'liveConfirmedHint' : 'confirmedHint')}
            </p>
            {review.document.status !== 'verified' && review.document.status !== 'rejected' ? (
              <label
                htmlFor={acknowledgmentId}
                className="flex min-h-11 cursor-pointer items-start gap-3 text-body"
              >
                <input
                  id={acknowledgmentId}
                  type="checkbox"
                  className="mt-0.5 size-5 shrink-0 accent-accent"
                  checked={review.confirmed}
                  disabled={Boolean(busy) || stale || changedPerson || !review.fields.length}
                  onChange={(event) =>
                    setReview({
                      ...review,
                      confirmed: event.target.checked,
                      error: undefined,
                    })
                  }
                />
                <span>{copy(liveReview ? 'liveConfirmation' : 'confirmation')}</span>
              </label>
            ) : null}
            {stale || changedPerson || review.error ? (
              <p role="alert" className="text-body text-danger">
                {copy(changedPerson ? 'changedPerson' : stale ? 'stale' : review.error!)}
              </p>
            ) : null}
            <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
              <Button variant="secondary" size="lg" disabled={Boolean(busy)} onClick={closeReview}>
                {copy(
                  review.document.status === 'verified' || review.document.status === 'rejected'
                    ? 'close'
                    : 'cancel',
                )}
              </Button>
              {review.document.status !== 'verified' && review.document.status !== 'rejected' ? (
                <Button
                  type="submit"
                  size="lg"
                  loading={busy === 'review'}
                  disabled={
                    !review.confirmed ||
                    Boolean(busy) ||
                    stale ||
                    changedPerson ||
                    !review.fields.length
                  }
                >
                  {copy(busy === 'review' ? 'confirming' : liveReview ? 'liveConfirm' : 'confirm')}
                </Button>
              ) : null}
            </div>
          </form>
        ) : null}
      </Dialog>
    </>
  );
}
