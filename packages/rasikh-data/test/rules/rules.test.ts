/** Security rules, run against the Firestore emulator (`npm run test:rules`). */
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, it } from "node:test";
import {
  type RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { Timestamp, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";

const NOW = Timestamp.fromDate(new Date("2026-10-10T09:41:12+04:00"));
let env: RulesTestEnvironment;

const newcomer = () => env.authenticatedContext("uid_hire").firestore();
const employer = () => env.authenticatedContext("uid_hr").firestore();
const stranger = () => env.authenticatedContext("uid_stranger").firestore();

const document = (ref: string, labels: string[]) => ({
  ref,
  kind: "scan",
  labels,
  derived: false,
  source_ref: null,
  storage_path: null,
  observed_at: null,
  created_at: NOW,
});

const consent = (label: string, destination: string) => ({
  label,
  destination,
  granted_by: "newcomer",
  guard_consent_id: null,
  active: true,
  expires_at: null,
  granted_at: NOW,
  revoked_at: null,
});

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-rasikh",
    firestore: { rules: readFileSync(new URL("../../firestore.rules", import.meta.url), "utf8") },
  });
});

after(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "companies/company_demo_001"), {
      name: "Falcon Analytics",
      setup_path: "mainland",
      member_uids: ["uid_hr"],
      created_at: NOW,
      updated_at: NOW,
    });
    await setDoc(doc(db, "cases/hire_demo_001"), {
      case_type: "hire",
      subject_ref: "hire_demo_001",
      newcomer_uid: "uid_hire",
      company_id: "company_demo_001",
      guard_session_id: "gs_1",
      status: "active",
      summary: { documents: 2, open_applications: 0, last_guard_decision: null, last_activity_at: NOW },
      created_at: NOW,
      updated_at: NOW,
    });
    await setDoc(doc(db, "cases/hire_demo_001/documents/doc_passport"), document("doc_passport", ["passport"]));
    await setDoc(doc(db, "cases/hire_demo_001/documents/doc_medical"), document("doc_medical", ["health"]));
    await setDoc(doc(db, "cases/hire_demo_001/guard_checks/chk_1"), { decision: "allow", at: NOW });
  });
});

describe("cases", () => {
  it("are readable by the newcomer and the employer, not by strangers", async () => {
    await assertSucceeds(getDoc(doc(newcomer(), "cases/hire_demo_001")));
    await assertSucceeds(getDoc(doc(employer(), "cases/hire_demo_001")));
    await assertFails(getDoc(doc(stranger(), "cases/hire_demo_001")));
  });

  it("can be listed only with a filter the rules can prove (the newcomer's own cases)", async () => {
    await assertSucceeds(getDocs(query(collection(newcomer(), "cases"), where("newcomer_uid", "==", "uid_hire"))));
    await assertFails(getDocs(collection(newcomer(), "cases")));
  });

  it("can only have their status changed, by the employer", async () => {
    await assertSucceeds(updateDoc(doc(employer(), "cases/hire_demo_001"), { status: "settled", updated_at: NOW }));
    await assertFails(updateDoc(doc(employer(), "cases/hire_demo_001"), { newcomer_uid: "uid_hr" }));
    await assertFails(updateDoc(doc(newcomer(), "cases/hire_demo_001"), { status: "closed" }));
    await assertFails(setDoc(doc(employer(), "cases/new_case"), { company_id: "company_demo_001" }));
  });
});

describe("documents", () => {
  it("the employer reads only documents whose labels the Guard policy allows to employers", async () => {
    await assertSucceeds(getDoc(doc(employer(), "cases/hire_demo_001/documents/doc_passport")));
    await assertFails(getDoc(doc(employer(), "cases/hire_demo_001/documents/doc_medical")));
    await assertSucceeds(getDoc(doc(newcomer(), "cases/hire_demo_001/documents/doc_medical")));
  });

  it("only the newcomer adds documents; the id must be the ref and observed_at is server-only", async () => {
    const path = "cases/hire_demo_001/documents/doc_salary";
    await assertSucceeds(setDoc(doc(newcomer(), path), document("doc_salary", ["salary"])));
    await assertFails(setDoc(doc(employer(), "cases/hire_demo_001/documents/doc_x"), document("doc_x", [])));
    await assertFails(setDoc(doc(newcomer(), "cases/hire_demo_001/documents/doc_y"), document("doc_other", [])));
    await assertFails(
      setDoc(doc(newcomer(), "cases/hire_demo_001/documents/doc_z"), { ...document("doc_z", []), observed_at: NOW }),
    );
    await assertFails(setDoc(doc(newcomer(), "cases/hire_demo_001/documents/doc_w"), document("doc_w", ["blood_type"])));
  });

  it("labels cannot be rewritten after the fact", async () => {
    await assertFails(updateDoc(doc(newcomer(), "cases/hire_demo_001/documents/doc_medical"), { labels: [] }));
    await assertSucceeds(updateDoc(doc(newcomer(), "cases/hire_demo_001/documents/doc_medical"), { kind: "pdf" }));
  });
});

describe("consents", () => {
  it("the newcomer grants consentable pairs only, with the deterministic id", async () => {
    await assertSucceeds(setDoc(doc(newcomer(), "cases/hire_demo_001/consents/passport__landlord"), consent("passport", "landlord")));
    await assertFails(setDoc(doc(newcomer(), "cases/hire_demo_001/consents/passport__school"), consent("passport", "school")));
    await assertFails(setDoc(doc(newcomer(), "cases/hire_demo_001/consents/whatever"), consent("passport", "bank")));
    await assertFails(setDoc(doc(employer(), "cases/hire_demo_001/consents/passport__bank"), consent("passport", "bank")));
    await assertFails(
      setDoc(doc(newcomer(), "cases/hire_demo_001/consents/passport__bank"), { ...consent("passport", "bank"), guard_consent_id: "cns_x" }),
    );
  });

  it("revoking toggles active and keeps the record; deleting is refused", async () => {
    const path = "cases/hire_demo_001/consents/passport__landlord";
    await assertSucceeds(setDoc(doc(newcomer(), path), consent("passport", "landlord")));
    await assertSucceeds(updateDoc(doc(newcomer(), path), { active: false, revoked_at: NOW }));
    await assertFails(updateDoc(doc(newcomer(), path), { label: "health" }));
    await assertFails(deleteDoc(doc(newcomer(), path)));
  });
});

describe("server-owned collections", () => {
  it("guard checks are readable by case parties and never writable by clients", async () => {
    await assertSucceeds(getDoc(doc(employer(), "cases/hire_demo_001/guard_checks/chk_1")));
    await assertFails(getDoc(doc(stranger(), "cases/hire_demo_001/guard_checks/chk_1")));
    await assertFails(setDoc(doc(newcomer(), "cases/hire_demo_001/guard_checks/chk_2"), { decision: "allow" }));
    await assertFails(setDoc(doc(newcomer(), "cases/hire_demo_001/applications/app_1"), { status: "approved" }));
  });

  it("users cannot promote themselves or attach to a company", async () => {
    const profile = { role: "newcomer", subject_ref: "hire_demo_001", company_id: null, display_name: "Sara", created_at: NOW };
    await assertSucceeds(setDoc(doc(newcomer(), "users/uid_hire"), profile));
    await assertFails(updateDoc(doc(newcomer(), "users/uid_hire"), { role: "employer" }));
    await assertFails(setDoc(doc(stranger(), "users/uid_stranger"), { ...profile, role: "bank" }));
    await assertFails(setDoc(doc(stranger(), "users/uid_stranger"), { ...profile, company_id: "company_demo_001" }));
    await assertFails(getDoc(doc(stranger(), "users/uid_hire")));
  });

  it("trust passports are private to their owner", async () => {
    await assertSucceeds(setDoc(doc(newcomer(), "trust_passports/uid_hire"), { shares: {}, updated_at: NOW }));
    await assertFails(getDoc(doc(employer(), "trust_passports/uid_hire")));
  });
});
