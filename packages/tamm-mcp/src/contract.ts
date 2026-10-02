/**
 * Runtime schemas for the INTEGRATION.md section 2 and 6 types.
 *
 * `packages/shared` holds the canonical TypeScript types, but it is consumed as TS source and
 * this package is not an npm workspace yet (DECISIONS.md), so the enums are mirrored here as
 * zod schemas. Keep them in lockstep with `packages/shared/src/contract.ts`.
 */
import { z } from "zod";

/** Contract version this server implements (INTEGRATION.md header). */
export const CONTRACT_VERSION = "1.1.1";

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
export type DataLabel = (typeof DATA_LABELS)[number];
export const dataLabelSchema = z.enum(DATA_LABELS);

export const AUDIENCES = ["individual", "business"] as const;
export type Audience = (typeof AUDIENCES)[number];
export const audienceSchema = z.enum(AUDIENCES);

export const APPLICATION_STATUSES = ["submitted", "under_review", "needs_info", "approved", "rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);

export const GUARD_DECISIONS = ["allow", "deny", "needs_consent"] as const;
export type GuardDecision = (typeof GUARD_DECISIONS)[number];

export const payloadRefSchema = z.object({
  ref: z.string().min(1),
  labels: z.array(dataLabelSchema),
  derived: z.boolean().optional(),
});
export type PayloadRef = z.infer<typeof payloadRefSchema>;

/** Error codes from INTEGRATION.md section 6 that this server emits. */
export type ErrorCode =
  | "invalid_request"
  | "unknown_session"
  | "unknown_service"
  | "unknown_application"
  | "demo_mode_only"
  | "guard_unavailable"
  | "internal";

export interface ErrorBody {
  contract_version: string;
  error: { code: ErrorCode; message: string };
}
