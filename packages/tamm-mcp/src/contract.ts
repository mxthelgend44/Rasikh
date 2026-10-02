/**
 * Types from INTEGRATION.md section 2, mirrored locally until `packages/shared` exists.
 * Keep these in lockstep with the contract; they are closed enums.
 */
import { z } from "zod";

/** Contract version this server implements (INTEGRATION.md header). */
export const CONTRACT_VERSION = "1.0.0";

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

/** Error codes from INTEGRATION.md section 6. */
export type ErrorCode =
  | "invalid_request"
  | "unknown_session"
  | "not_found"
  | "invalid_uaepass_session"
  | "audience_mismatch"
  | "guard_unavailable"
  | "internal";

export interface ErrorBody {
  contract_version: string;
  error: { code: ErrorCode; message: string };
}
