/**
 * The Rasikh Firestore data model. Every collection has one zod schema; converters validate
 * on both read and write, so a malformed document fails at the boundary.
 *
 * ```
 * users/{uid}                              role, subject_ref, company_id
 * companies/{companyId}                    name, setup_path, member_uids
 * cases/{caseId}                           one hire or one company expansion
 *   documents/{ref}                        labelled data items (id = PayloadRef.ref)
 *   consents/{label}__{destination}        trust passport consent, one per pair
 *   guard_checks/{checkId}                 Guard decisions (server-written)
 *   applications/{applicationId}           TAMM applications (server-written)
 * trust_passports/{uid}                    the newcomer's sharing toggles
 * ```
 *
 * Design choices:
 * - Unbounded lists (documents, checks, applications) are subcollections, never arrays, so a
 *   case document stays far below the 1 MiB limit and reads stay cheap.
 * - Ids are deterministic where idempotency matters: a document's id is its Guard ref, and a
 *   consent's id is `label__destination`, so toggling twice cannot create duplicates.
 * - `cases/{caseId}.summary` is a denormalised roll-up for dashboards, so listing cases never
 *   fans out into subcollections.
 * - Enums are the closed sets from INTEGRATION.md section 2; adding a value is a contract bump.
 */
import { z } from "zod";

export const DATA_LABELS = [
  "passport",
  "emirates_id",
  "salary",
  "bank_statement",
  "employment",
  "family",
  "address",
  "degree",
  "health",
] as const;
export const DESTINATIONS = ["tamm", "employer", "landlord", "bank", "school", "llm_provider", "newcomer"] as const;
export const GUARD_DECISIONS = ["allow", "deny", "needs_consent"] as const;
export const APPLICATION_STATUSES = ["submitted", "under_review", "needs_info", "approved", "rejected"] as const;

export const dataLabel = z.enum(DATA_LABELS);
export const destination = z.enum(DESTINATIONS);
export type DataLabel = z.infer<typeof dataLabel>;
export type Destination = z.infer<typeof destination>;

const id = z.string().min(1).max(200);
const timestamp = z.date();

export const userSchema = z.strictObject({
  role: z.enum(["newcomer", "employer", "landlord", "bank"]),
  subject_ref: id,
  company_id: id.nullable(),
  display_name: z.string().min(1).max(120),
  created_at: timestamp,
});

export const companySchema = z.strictObject({
  name: z.string().min(1).max(200),
  setup_path: z.enum(["mainland", "adgm", "kezad", "masdar", "twofour54"]).nullable(),
  member_uids: z.array(id).max(100),
  created_at: timestamp,
  updated_at: timestamp,
});

export const caseSummarySchema = z.strictObject({
  documents: z.number().int().nonnegative(),
  open_applications: z.number().int().nonnegative(),
  last_guard_decision: z.enum(GUARD_DECISIONS).nullable(),
  last_activity_at: timestamp,
});

export const caseSchema = z.strictObject({
  case_type: z.enum(["hire", "company"]),
  subject_ref: id,
  newcomer_uid: id.nullable(),
  company_id: id,
  guard_session_id: id.nullable(),
  status: z.enum(["intake", "active", "settled", "closed"]),
  summary: caseSummarySchema,
  created_at: timestamp,
  updated_at: timestamp,
});

export const caseDocumentSchema = z.strictObject({
  ref: id,
  kind: z.string().min(1).max(60),
  labels: z.array(dataLabel).max(DATA_LABELS.length),
  derived: z.boolean(),
  /** The ref this one was redacted or derived from, if any. */
  source_ref: id.nullable(),
  storage_path: z.string().max(500).nullable(),
  /** When the app reported it to Guard with `POST /observe`. */
  observed_at: timestamp.nullable(),
  created_at: timestamp,
});

export const consentSchema = z.strictObject({
  label: dataLabel,
  destination,
  granted_by: z.literal("newcomer"),
  guard_consent_id: id.nullable(),
  active: z.boolean(),
  expires_at: timestamp.nullable(),
  granted_at: timestamp,
  revoked_at: timestamp.nullable(),
});

const remedyStepSchema = z.discriminatedUnion("action", [
  z.strictObject({ action: z.literal("use_tool"), label: dataLabel, tool: z.string() }),
  z.strictObject({ action: z.literal("send_derived_signal"), label: dataLabel }),
  z.strictObject({ action: z.literal("redact"), label: dataLabel }),
  z.strictObject({ action: z.literal("grant_consent"), label: dataLabel, destination }),
  z.strictObject({ action: z.literal("remove_label"), label: dataLabel }),
]);

export const guardCheckSchema = z.strictObject({
  check_id: id,
  at: timestamp,
  tool: z.string().min(1),
  destination,
  decision: z.enum(GUARD_DECISIONS),
  reason: z.string(),
  policy_rule: z.string(),
  blocked_labels: z.array(dataLabel),
  allowed_destinations: z.array(destination),
  remedy: z.strictObject({ steps: z.array(remedyStepSchema), verified: z.boolean() }).nullable(),
});

export const applicationSchema = z.strictObject({
  service_id: id,
  applicant_ref: id,
  status: z.enum(APPLICATION_STATUSES),
  history: z.array(z.strictObject({ status: z.enum(APPLICATION_STATUSES), at: timestamp })).max(50),
  needs_info: z.strictObject({ message: z.string(), required_labels: z.array(dataLabel) }).nullable(),
  updated_at: timestamp,
});

/** `shares[label][destination] === true` means the newcomer wants that flow consented. */
export const trustPassportSchema = z.strictObject({
  shares: z.partialRecord(dataLabel, z.partialRecord(destination, z.boolean())),
  updated_at: timestamp,
});

export type User = z.infer<typeof userSchema>;
export type Company = z.infer<typeof companySchema>;
export type Case = z.infer<typeof caseSchema>;
export type CaseSummary = z.infer<typeof caseSummarySchema>;
export type CaseDocument = z.infer<typeof caseDocumentSchema>;
export type Consent = z.infer<typeof consentSchema>;
export type GuardCheck = z.infer<typeof guardCheckSchema>;
export type Application = z.infer<typeof applicationSchema>;
export type TrustPassport = z.infer<typeof trustPassportSchema>;

/** Deterministic consent document id: at most one consent per label and destination. */
export function consentId(label: DataLabel, to: Destination): string {
  return `${label}__${to}`;
}
