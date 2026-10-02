//! One test per policy rule: every cell of INTEGRATION.md 3.4, exercised on both sides of its
//! condition. The expected effects below are transcribed from the contract independently of
//! `policies/rasikh.toml`, so a drift in either one fails here.

mod common;

use common::{assert_decision, check, derived, grant, raw, session, store};
use rasikh_guard::contract::{DataLabel, Destination, GuardDecision};

#[derive(Clone, Copy)]
enum Expect {
    Allow,
    Deny,
    Consent,
    DerivedOnly,
    ExtractionOnly,
    RedactedOnly,
    InsuranceOnly,
}

fn rule(label: DataLabel, destination: Destination, suffix: &str) -> String {
    format!("{}.{}.{}", label.as_str(), destination.as_str(), suffix)
}

fn assert_rule(label: DataLabel, destination: Destination, expect: Expect) {
    let store = store();
    let sid = session(&store);
    let doc = raw("doc_under_test", &[label]);
    match expect {
        Expect::Allow => {
            let verdict = check(&store, &sid, destination).labels(&[label]).refs(&[doc]).run();
            assert_decision(&verdict, GuardDecision::Allow, &rule(label, destination, "allowed"));
            assert!(verdict.blocked_labels.is_empty());
        }
        Expect::Deny => {
            let id = rule(label, destination, "denied");
            assert_decision(
                &check(&store, &sid, destination).refs(std::slice::from_ref(&doc)).run(),
                GuardDecision::Deny,
                &id,
            );
            assert_decision(
                &check(&store, &sid, destination)
                    .tool("extract_document")
                    .refs(&[doc])
                    .run(),
                GuardDecision::Deny,
                &id,
            );
            assert!(
                store
                    .grant_consent(&rasikh_guard::contract::ConsentRequest {
                        session_id: sid.clone(),
                        label,
                        destination,
                        granted_by: "newcomer".into(),
                        expires_at: None,
                    })
                    .is_err(),
                "consent cannot unlock a deny cell"
            );
        }
        Expect::Consent => {
            let id = rule(label, destination, "requires_consent");
            let before = check(&store, &sid, destination).refs(std::slice::from_ref(&doc)).run();
            assert_decision(&before, GuardDecision::NeedsConsent, &id);
            let request = before.consent_request.expect("needs_consent carries a consent request");
            assert_eq!((request.label, request.destination), (label, destination));
            assert_eq!(before.blocked_labels, vec![label]);

            let consent = grant(&store, &sid, label, destination);
            assert_decision(
                &check(&store, &sid, destination).refs(std::slice::from_ref(&doc)).run(),
                GuardDecision::Allow,
                &id,
            );

            store.revoke_consent(&consent).expect("revocable");
            assert_decision(
                &check(&store, &sid, destination).refs(&[doc]).run(),
                GuardDecision::NeedsConsent,
                &id,
            );
        }
        Expect::DerivedOnly => {
            let id = rule(label, destination, "derived_only");
            assert_decision(
                &check(&store, &sid, destination).refs(&[doc]).run(),
                GuardDecision::Deny,
                &id,
            );
            let signal = derived("affordability_signal", &[label]);
            assert_decision(
                &check(&store, &sid, destination).refs(&[signal]).run(),
                GuardDecision::Allow,
                &id,
            );
        }
        Expect::ExtractionOnly => {
            let id = rule(label, destination, "extraction_only");
            assert_decision(
                &check(&store, &sid, destination)
                    .tool("reason_about_case")
                    .refs(std::slice::from_ref(&doc))
                    .run(),
                GuardDecision::Deny,
                &id,
            );
            assert_decision(
                &check(&store, &sid, destination)
                    .tool("extract_document")
                    .refs(&[doc])
                    .run(),
                GuardDecision::Allow,
                &id,
            );
        }
        Expect::RedactedOnly => {
            let id = rule(label, destination, "redacted_only");
            assert_decision(
                &check(&store, &sid, destination).refs(&[doc]).run(),
                GuardDecision::Deny,
                &id,
            );
            let redacted = raw("doc_under_test_redacted", &[]);
            let verdict = check(&store, &sid, destination).refs(&[redacted]).run();
            assert_eq!(
                verdict.decision,
                GuardDecision::Allow,
                "a redacted ref passes: {verdict:?}"
            );
        }
        Expect::InsuranceOnly => {
            let id = rule(label, destination, "insurance_only");
            let insurance = check(&store, &sid, destination)
                .tool("start_application")
                .tags(&["health", "insurance"]);
            assert_decision(
                &insurance.refs(std::slice::from_ref(&doc)).run(),
                GuardDecision::Allow,
                &id,
            );
            assert_decision(
                &check(&store, &sid, destination)
                    .tool("start_application")
                    .tags(&["housing"])
                    .refs(std::slice::from_ref(&doc))
                    .run(),
                GuardDecision::Deny,
                &id,
            );
            assert_decision(
                &check(&store, &sid, destination)
                    .tool("send_message")
                    .tags(&["insurance"])
                    .refs(&[doc])
                    .run(),
                GuardDecision::Deny,
                &id,
            );
        }
    }
}

macro_rules! rules {
    ($($name:ident: $label:ident -> $destination:ident = $expect:ident;)*) => {
        $(
            #[test]
            fn $name() {
                assert_rule(DataLabel::$label, Destination::$destination, Expect::$expect);
            }
        )*

        #[test]
        fn every_cell_has_a_test() {
            let covered = [$((DataLabel::$label, Destination::$destination)),*];
            for label in DataLabel::ALL {
                for destination in Destination::ALL {
                    assert!(covered.contains(&(label, destination)), "no test for {label:?} -> {destination:?}");
                }
            }
            assert_eq!(covered.len(), DataLabel::ALL.len() * Destination::ALL.len());
        }
    };
}

rules! {
    passport_tamm: Passport -> Tamm = Allow;
    passport_employer: Passport -> Employer = Allow;
    passport_landlord: Passport -> Landlord = Consent;
    passport_bank: Passport -> Bank = Consent;
    passport_school: Passport -> School = Deny;
    passport_llm_provider: Passport -> LlmProvider = ExtractionOnly;
    passport_newcomer: Passport -> Newcomer = Allow;

    emirates_id_tamm: EmiratesId -> Tamm = Allow;
    emirates_id_employer: EmiratesId -> Employer = Allow;
    emirates_id_landlord: EmiratesId -> Landlord = Consent;
    emirates_id_bank: EmiratesId -> Bank = Consent;
    emirates_id_school: EmiratesId -> School = Deny;
    emirates_id_llm_provider: EmiratesId -> LlmProvider = ExtractionOnly;
    emirates_id_newcomer: EmiratesId -> Newcomer = Allow;

    salary_tamm: Salary -> Tamm = Allow;
    salary_employer: Salary -> Employer = Allow;
    salary_landlord: Salary -> Landlord = DerivedOnly;
    salary_bank: Salary -> Bank = Consent;
    salary_school: Salary -> School = Deny;
    salary_llm_provider: Salary -> LlmProvider = RedactedOnly;
    salary_newcomer: Salary -> Newcomer = Allow;

    bank_statement_tamm: BankStatement -> Tamm = Deny;
    bank_statement_employer: BankStatement -> Employer = Deny;
    bank_statement_landlord: BankStatement -> Landlord = DerivedOnly;
    bank_statement_bank: BankStatement -> Bank = Consent;
    bank_statement_school: BankStatement -> School = Deny;
    bank_statement_llm_provider: BankStatement -> LlmProvider = ExtractionOnly;
    bank_statement_newcomer: BankStatement -> Newcomer = Allow;

    employment_tamm: Employment -> Tamm = Allow;
    employment_employer: Employment -> Employer = Allow;
    employment_landlord: Employment -> Landlord = Allow;
    employment_bank: Employment -> Bank = Allow;
    employment_school: Employment -> School = Deny;
    employment_llm_provider: Employment -> LlmProvider = RedactedOnly;
    employment_newcomer: Employment -> Newcomer = Allow;

    family_tamm: Family -> Tamm = Allow;
    family_employer: Family -> Employer = Allow;
    family_landlord: Family -> Landlord = Consent;
    family_bank: Family -> Bank = Deny;
    family_school: Family -> School = Consent;
    family_llm_provider: Family -> LlmProvider = RedactedOnly;
    family_newcomer: Family -> Newcomer = Allow;

    address_tamm: Address -> Tamm = Allow;
    address_employer: Address -> Employer = Allow;
    address_landlord: Address -> Landlord = Allow;
    address_bank: Address -> Bank = Consent;
    address_school: Address -> School = Consent;
    address_llm_provider: Address -> LlmProvider = RedactedOnly;
    address_newcomer: Address -> Newcomer = Allow;

    degree_tamm: Degree -> Tamm = Allow;
    degree_employer: Degree -> Employer = Allow;
    degree_landlord: Degree -> Landlord = Deny;
    degree_bank: Degree -> Bank = Deny;
    degree_school: Degree -> School = Deny;
    degree_llm_provider: Degree -> LlmProvider = ExtractionOnly;
    degree_newcomer: Degree -> Newcomer = Allow;

    health_tamm: Health -> Tamm = InsuranceOnly;
    health_employer: Health -> Employer = Deny;
    health_landlord: Health -> Landlord = Deny;
    health_bank: Health -> Bank = Deny;
    health_school: Health -> School = Deny;
    health_llm_provider: Health -> LlmProvider = Deny;
    health_newcomer: Health -> Newcomer = Allow;
}
