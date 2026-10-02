import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { type QueryDocumentSnapshot, Timestamp } from "firebase/firestore";
import {
  CONSENTABLE,
  type Consent,
  DataValidationError,
  type GuardCheck,
  type TrustPassport,
  consentId,
  converters,
  planConsentSync,
} from "../../src/index.js";

const NOW = new Date("2026-10-10T09:41:12+04:00");

/** A stand-in snapshot: converters only call `data()`. */
const snapshot = (data: object) => ({ data: () => data }) as unknown as QueryDocumentSnapshot;

const check: GuardCheck = {
  check_id: "chk_19b0",
  at: NOW,
  tool: "submit_rental_application",
  destination: "landlord",
  decision: "needs_consent",
  reason: "Your passport has not been shared with landlords yet.",
  policy_rule: "passport.landlord.requires_consent",
  blocked_labels: ["passport"],
  allowed_destinations: ["tamm", "employer", "newcomer"],
  remedy: { steps: [{ action: "grant_consent", label: "passport", destination: "landlord" }], verified: true },
};

describe("validating converters", () => {
  it("round-trips a Guard check, storing dates as Timestamps", () => {
    const stored = converters.guardCheck.toFirestore(check) as Record<string, unknown>;
    assert.ok(stored.at instanceof Timestamp);
    assert.deepEqual(converters.guardCheck.fromFirestore(snapshot(stored)), check);
  });

  it("refuses to write a document that breaks the schema", () => {
    assert.throws(
      () => converters.guardCheck.toFirestore({ ...check, destination: "neighbour" } as unknown as GuardCheck),
      (error: unknown) => error instanceof DataValidationError && /destination/.test(error.message),
    );
  });

  it("refuses unknown fields and unknown labels on read", () => {
    const stored = converters.guardCheck.toFirestore(check) as Record<string, unknown>;
    assert.throws(() => converters.guardCheck.fromFirestore(snapshot({ ...stored, surprise: 1 })), DataValidationError);
    assert.throws(
      () => converters.guardCheck.fromFirestore(snapshot({ ...stored, blocked_labels: ["blood_type"] })),
      DataValidationError,
    );
  });

  it("maps nested dates (application history) in both directions", () => {
    const application = {
      service_id: "svc_tawtheeq_register",
      applicant_ref: "hire_demo_001",
      status: "under_review" as const,
      history: [
        { status: "submitted" as const, at: new Date("2026-10-10T09:45:00Z") },
        { status: "under_review" as const, at: new Date("2026-10-10T09:46:30Z") },
      ],
      needs_info: null,
      updated_at: NOW,
    };
    const stored = converters.application.toFirestore(application) as { history: { at: unknown }[] };
    assert.ok(stored.history.every((event) => event.at instanceof Timestamp));
    assert.deepEqual(converters.application.fromFirestore(snapshot(stored)), application);
  });
});

describe("trust passport sync", () => {
  const consent = (label: Consent["label"], destination: Consent["destination"], extra: Partial<Consent> = {}): Consent => ({
    label,
    destination,
    granted_by: "newcomer",
    guard_consent_id: `cns_${label}`,
    active: true,
    expires_at: null,
    granted_at: NOW,
    revoked_at: null,
    ...extra,
  });
  const passport = (shares: TrustPassport["shares"]): TrustPassport => ({ shares, updated_at: NOW });

  it("grants what is wanted and missing, revokes what is no longer wanted", () => {
    const plan = planConsentSync(
      passport({ passport: { landlord: true }, family: { school: true } }),
      [consent("passport", "landlord"), consent("emirates_id", "bank")],
      NOW,
    );
    assert.deepEqual(plan.ops, [
      { op: "revoke", label: "emirates_id", destination: "bank", guard_consent_id: "cns_emirates_id" },
      { op: "grant", label: "family", destination: "school" },
    ]);
    assert.deepEqual(plan.ignored, []);
  });

  it("is a no-op when Guard already matches the passport", () => {
    const plan = planConsentSync(passport({ passport: { landlord: true } }), [consent("passport", "landlord")], NOW);
    assert.deepEqual(plan.ops, []);
  });

  it("re-grants an expired or revoked consent the newcomer still wants", () => {
    const plan = planConsentSync(
      passport({ passport: { landlord: true, bank: true } }),
      [consent("passport", "landlord", { expires_at: new Date("2026-01-01") }), consent("passport", "bank", { active: false })],
      NOW,
    );
    assert.deepEqual(
      plan.ops.map((op) => `${op.op}:${op.label}:${op.destination}`),
      ["grant:passport:landlord", "grant:passport:bank"],
    );
  });

  it("never grants a pair consent cannot unlock, and reports it", () => {
    const plan = planConsentSync(passport({ health: { employer: true }, passport: { school: true } }), [], NOW);
    assert.deepEqual(plan.ops, []);
    assert.deepEqual(plan.ignored, [
      { label: "passport", destination: "school" },
      { label: "health", destination: "employer" },
    ]);
  });

  it("matches the consentable pairs in firestore.rules and the 3.4 matrix", () => {
    const rules = readFileSync(new URL("../../firestore.rules", import.meta.url), "utf8");
    const listed = /consentablePairs\(\) \{\s*return \[([^\]]+)\]/.exec(rules)?.[1] ?? "";
    const fromRules = new Set([...listed.matchAll(/'([a-z_]+)'/g)].map((match) => match[1]));
    assert.deepEqual([...fromRules].sort(), [...CONSENTABLE].sort());
    assert.equal(CONSENTABLE.size, 10);
    assert.ok(CONSENTABLE.has(consentId("passport", "landlord")));
  });
});
