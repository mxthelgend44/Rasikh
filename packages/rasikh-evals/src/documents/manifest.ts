import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Scalar } from '../types.ts';
import { record } from '../adapters/http.ts';

export type DocumentCohort = 'clean' | 'degraded' | 'arabic';
export interface DocumentImage {
  id: string;
  source_fixture_id: string;
  case_id: string;
  synthetic: true;
  kind: 'passport' | 'offer_letter' | 'degree_certificate' | 'bank_statement';
  cohort: DocumentCohort;
  language: 'en' | 'ar' | 'ar-en';
  image: string;
  mime_type: 'image/png' | 'image/jpeg';
  width: number;
  height: number;
  sha256: string;
  source_text: string;
  source_text_sha256: string;
  expected: Record<string, Scalar>;
  render_recipe: Record<string, unknown>;
  source_text_boxes: Array<{ source_text: string; bounds: number[]; rtl_shaped: boolean }>;
}
export interface DocumentManifest {
  schema_version: '1.0.0';
  synthetic: true;
  dataset: string;
  seed: number;
  generated_by: string;
  render_environment: Record<string, string>;
  source_fixtures_sha256: string;
  notice: string;
  documents: DocumentImage[];
}
export const defaultManifestPath = fileURLToPath(
  new URL('../../assets/documents/manifest.json', import.meta.url),
);
export const imageSha256 = (bytes: Uint8Array): string =>
  createHash('sha256').update(bytes).digest('hex');
const isHash = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const scalar = (value: unknown): value is Scalar =>
  value === null ||
  typeof value === 'string' ||
  typeof value === 'boolean' ||
  (typeof value === 'number' && Number.isFinite(value));

export async function loadDocumentManifest(path = defaultManifestPath): Promise<DocumentManifest> {
  const manifest = record(JSON.parse(await readFile(path, 'utf8')), 'Document manifest');
  if (
    manifest.schema_version !== '1.0.0' ||
    manifest.synthetic !== true ||
    typeof manifest.dataset !== 'string' ||
    !Number.isSafeInteger(manifest.seed) ||
    !isHash(manifest.source_fixtures_sha256) ||
    !Array.isArray(manifest.documents)
  )
    throw new Error('Document manifest is invalid.');
  const ids = new Set<string>();
  for (const entry of manifest.documents) {
    const document = record(entry, 'Document image');
    if (
      typeof document.id !== 'string' ||
      ids.has(document.id) ||
      document.synthetic !== true ||
      typeof document.image !== 'string' ||
      !['clean', 'degraded', 'arabic'].includes(String(document.cohort)) ||
      !['en', 'ar', 'ar-en'].includes(String(document.language)) ||
      !['passport', 'offer_letter', 'degree_certificate', 'bank_statement'].includes(
        String(document.kind),
      ) ||
      !['image/png', 'image/jpeg'].includes(String(document.mime_type)) ||
      !isHash(document.sha256) ||
      !isHash(document.source_text_sha256) ||
      typeof document.source_text !== 'string' ||
      typeof document.source_fixture_id !== 'string' ||
      typeof document.case_id !== 'string' ||
      !Number.isInteger(document.width) ||
      !Number.isInteger(document.height)
    )
      throw new Error('Document image manifest entry is invalid.');
    const fields = record(document.expected, 'Expected document fields');
    if (
      !Object.keys(fields).length ||
      !Object.entries(fields).every(
        ([key, value]) => /^[a-z][a-z0-9_]*$/.test(key) && scalar(value),
      )
    )
      throw new Error('Expected document fields are invalid.');
    if (imageSha256(Buffer.from(document.source_text, 'utf8')) !== document.source_text_sha256)
      throw new Error('Document source text checksum mismatch.');
    record(document.render_recipe, 'Document render recipe');
    if (!Array.isArray(document.source_text_boxes))
      throw new Error('Document text bounds are missing.');
    imagePath(document as unknown as DocumentImage, path);
    ids.add(document.id);
  }
  return manifest as unknown as DocumentManifest;
}

export function imagePath(document: DocumentImage, manifestPath = defaultManifestPath): string {
  if (isAbsolute(document.image)) throw new Error('Document image path must be relative.');
  const base = resolve(dirname(manifestPath));
  const target = resolve(base, document.image);
  const rel = relative(base, target);
  if (!rel || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel))
    throw new Error('Document image escaped the asset directory.');
  return target;
}

export async function readVerifiedImage(
  document: DocumentImage,
  manifestPath = defaultManifestPath,
): Promise<Buffer> {
  const base = await realpath(dirname(manifestPath));
  const target = await realpath(imagePath(document, manifestPath));
  const rel = relative(base, target);
  if (!rel || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel))
    throw new Error('Document image symlink escaped the asset directory.');
  const bytes = await readFile(target);
  if (imageSha256(bytes) !== document.sha256) throw new Error('Document image checksum mismatch.');
  const valid =
    document.mime_type === 'image/png'
      ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : bytes[0] === 255 && bytes[1] === 216 && bytes.at(-2) === 255 && bytes.at(-1) === 217;
  if (!valid) throw new Error('Document image MIME signature mismatch.');
  return bytes;
}
