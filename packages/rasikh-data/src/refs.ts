/** Typed references and the queries the app needs. Each query has a matching index. */
import {
  type CollectionReference,
  type DocumentReference,
  type Firestore,
  type Query,
  collection,
  doc,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { converters } from "./converters.js";
import {
  type Application,
  type Case,
  type CaseDocument,
  type Company,
  type Consent,
  type DataLabel,
  type Destination,
  type GuardCheck,
  type TrustPassport,
  type User,
  consentId,
} from "./model.js";

export const userRef = (db: Firestore, uid: string): DocumentReference<User> =>
  doc(db, "users", uid).withConverter(converters.user);

export const companyRef = (db: Firestore, companyId: string): DocumentReference<Company> =>
  doc(db, "companies", companyId).withConverter(converters.company);

export const caseRef = (db: Firestore, caseId: string): DocumentReference<Case> =>
  doc(db, "cases", caseId).withConverter(converters.case);

export const trustPassportRef = (db: Firestore, uid: string): DocumentReference<TrustPassport> =>
  doc(db, "trust_passports", uid).withConverter(converters.trustPassport);

export const documentsCol = (db: Firestore, caseId: string): CollectionReference<CaseDocument> =>
  collection(db, "cases", caseId, "documents").withConverter(converters.document);

/** A case document's ref; its id is the Guard payload ref, so writes are idempotent. */
export const documentRef = (db: Firestore, caseId: string, ref: string): DocumentReference<CaseDocument> =>
  doc(documentsCol(db, caseId), ref);

export const consentsCol = (db: Firestore, caseId: string): CollectionReference<Consent> =>
  collection(db, "cases", caseId, "consents").withConverter(converters.consent);

export const consentRef = (
  db: Firestore,
  caseId: string,
  label: DataLabel,
  to: Destination,
): DocumentReference<Consent> => doc(consentsCol(db, caseId), consentId(label, to));

export const guardChecksCol = (db: Firestore, caseId: string): CollectionReference<GuardCheck> =>
  collection(db, "cases", caseId, "guard_checks").withConverter(converters.guardCheck);

export const applicationsCol = (db: Firestore, caseId: string): CollectionReference<Application> =>
  collection(db, "cases", caseId, "applications").withConverter(converters.application);

/** The Guard log view: newest first (single-field index, automatic). */
export const guardLog = (db: Firestore, caseId: string, max = 50): Query<GuardCheck> =>
  query(guardChecksCol(db, caseId), orderBy("at", "desc"), limit(max));

/** Refusals only, newest first, for the "blocked actions" panel (composite index). */
export const guardRefusals = (db: Firestore, caseId: string, max = 20): Query<GuardCheck> =>
  query(guardChecksCol(db, caseId), where("decision", "in", ["deny", "needs_consent"]), orderBy("at", "desc"), limit(max));

/** Consents currently in force for a case (single-field index, automatic). */
export const activeConsents = (db: Firestore, caseId: string): Query<Consent> =>
  query(consentsCol(db, caseId), where("active", "==", true));

/** Applications still moving, most recently updated first (composite index). */
export const openApplications = (db: Firestore, caseId: string): Query<Application> =>
  query(
    applicationsCol(db, caseId),
    where("status", "in", ["submitted", "under_review", "needs_info"]),
    orderBy("updated_at", "desc"),
  );

/** An employer's cases by status, most recent activity first (composite index). */
export const companyCases = (db: Firestore, companyId: string, status: Case["status"]): Query<Case> =>
  query(
    collection(db, "cases").withConverter(converters.case),
    where("company_id", "==", companyId),
    where("status", "==", status),
    orderBy("summary.last_activity_at", "desc"),
  );

/** A newcomer's own cases (composite index). */
export const newcomerCases = (db: Firestore, uid: string): Query<Case> =>
  query(
    collection(db, "cases").withConverter(converters.case),
    where("newcomer_uid", "==", uid),
    orderBy("updated_at", "desc"),
  );
