/**
 * Validating Firestore converters. Writes and reads both pass through the collection's zod
 * schema; JavaScript `Date`s are stored as Firestore `Timestamp`s and come back as `Date`s.
 */
import { type DocumentData, type FirestoreDataConverter, Timestamp } from "firebase/firestore";
import type { z } from "zod";
import {
  applicationSchema,
  caseDocumentSchema,
  caseSchema,
  companySchema,
  consentSchema,
  guardCheckSchema,
  trustPassportSchema,
  userSchema,
} from "./model.js";

/** A document that does not match its collection's schema. */
export class DataValidationError extends Error {
  constructor(
    readonly collection: string,
    readonly issues: readonly { path: PropertyKey[]; message: string }[],
  ) {
    super(`${collection}: ${issues.map((issue) => `${issue.path.join(".") || "(root)"} ${issue.message}`).join("; ")}`);
  }
}

/** Recursively maps `Date` to `Timestamp` (write) or `Timestamp` to `Date` (read). */
function mapTimes(value: unknown, direction: "write" | "read"): unknown {
  if (direction === "write" && value instanceof Date) {
    return Timestamp.fromDate(value);
  }
  if (direction === "read" && value instanceof Timestamp) {
    return value.toDate();
  }
  if (Array.isArray(value)) {
    return value.map((item) => mapTimes(item, direction));
  }
  if (value !== null && typeof value === "object" && !(value instanceof Timestamp)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, mapTimes(item, direction)]));
  }
  return value;
}

function validate<T>(collection: string, schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new DataValidationError(
      collection,
      parsed.error.issues.map((issue) => ({ path: issue.path, message: issue.message })),
    );
  }
  return parsed.data;
}

/** Builds a converter that validates against `schema` in both directions. */
export function validatingConverter<T>(collection: string, schema: z.ZodType<T>): FirestoreDataConverter<T, DocumentData> {
  return {
    toFirestore: (model) => mapTimes(validate(collection, schema, model), "write") as DocumentData,
    fromFirestore: (snapshot, options) => validate(collection, schema, mapTimes(snapshot.data(options), "read")),
  };
}

export const converters = {
  user: validatingConverter("users", userSchema),
  company: validatingConverter("companies", companySchema),
  case: validatingConverter("cases", caseSchema),
  document: validatingConverter("documents", caseDocumentSchema),
  consent: validatingConverter("consents", consentSchema),
  guardCheck: validatingConverter("guard_checks", guardCheckSchema),
  application: validatingConverter("applications", applicationSchema),
  trustPassport: validatingConverter("trust_passports", trustPassportSchema),
};
