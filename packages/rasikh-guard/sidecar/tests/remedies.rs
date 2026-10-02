//! Remedy plans (contract 1.2.0): each refused call carries the smallest verified fix, and
//! carrying that fix out through the real store makes the call allowed.

mod common;

use common::*;
use rasikh_guard::contract::{DataLabel, Destination, GuardDecision, PayloadRef};
use rasikh_guard::remedy::RemedyStep;
use rasikh_guard::store::Store;

/// Carries out every step the way the app would, then re-checks the same call.
fn follow_remedy(store: &Store, sid: &str, destination: Destination, tool: &str, refs: &[PayloadRef]) -> GuardDecision {
    let verdict = check(store, sid, destination).tool(tool).refs(refs).run();
    let remedy = verdict.remedy.expect("a refused call carries a remedy");
    assert!(remedy.verified, "{remedy:?}");
    let mut refs = refs.to_vec();
    let mut tool = tool.to_string();
    for step in &remedy.steps {
        match step {
            RemedyStep::GrantConsent { label, destination } => {
                grant(store, sid, *label, *destination);
            }
            RemedyStep::UseTool { tool: next, .. } => tool = next.clone(),
            RemedyStep::SendDerivedSignal { label } => {
                let signal = derived(&format!("derived_{}", label.as_str()), &[*label]);
                observe(store, sid, std::slice::from_ref(&signal));
                refs.iter_mut().for_each(|r| r.labels.retain(|l| l != label));
                refs.push(signal);
            }
            RemedyStep::Redact { label } | RemedyStep::RemoveLabel { label } => {
                refs = refs
                    .into_iter()
                    .map(|mut r| {
                        if r.labels.contains(label) {
                            r.labels.retain(|l| l != label);
                            r.r#ref = format!("{}_without_{}", r.r#ref, label.as_str());
                            observe(store, sid, std::slice::from_ref(&r));
                        }
                        r
                    })
                    .collect();
            }
        }
    }
    check(store, sid, destination).tool(&tool).refs(&refs).run().decision
}

#[test]
fn every_refused_cell_has_a_remedy_that_works_when_followed() {
    let mut refused = 0;
    for label in DataLabel::ALL {
        for destination in Destination::ALL {
            let store = store();
            let sid = session(&store);
            let doc = [raw("doc_under_test", &[label])];
            let first = check(&store, &sid, destination).tool("send_message").refs(&doc).run();
            if first.decision == GuardDecision::Allow {
                assert!(first.remedy.is_none(), "no remedy on allow");
                continue;
            }
            refused += 1;
            assert_eq!(
                follow_remedy(&store, &sid, destination, "send_message", &doc),
                GuardDecision::Allow,
                "{label:?} -> {destination:?}"
            );
        }
    }
    assert_eq!(refused, 37, "non-allow cells in the 3.4 matrix: 4+4+4+6+2+4+3+4+6");
}

#[test]
fn passport_to_landlord_asks_for_exactly_that_consent() {
    let store = store();
    let sid = session(&store);
    let verdict = check(&store, &sid, Landlord)
        .refs(&[
            raw("employment_letter", &[Employment]),
            raw("doc_passport", &[Passport]),
        ])
        .run();
    let remedy = verdict.remedy.expect("remedy");
    assert_eq!(
        remedy.steps,
        vec![RemedyStep::GrantConsent {
            label: Passport,
            destination: Landlord
        }]
    );
    assert!(remedy.verified);
    assert_eq!(verdict.allowed_destinations, vec![Tamm, Employer, Newcomer]);
}

#[test]
fn each_effect_gets_its_cheapest_step() {
    let cases: [(DataLabel, Destination, RemedyStep); 5] = [
        (
            Passport,
            LlmProvider,
            RemedyStep::UseTool {
                label: Passport,
                tool: "extract_document".into(),
            },
        ),
        (Salary, Landlord, RemedyStep::SendDerivedSignal { label: Salary }),
        (Employment, LlmProvider, RemedyStep::Redact { label: Employment }),
        (
            Family,
            School,
            RemedyStep::GrantConsent {
                label: Family,
                destination: School,
            },
        ),
        (Health, Employer, RemedyStep::RemoveLabel { label: Health }),
    ];
    for (label, destination, expected) in cases {
        let store = store();
        let sid = session(&store);
        let verdict = check(&store, &sid, destination)
            .tool("reason_about_case")
            .refs(&[raw("doc", &[label])])
            .run();
        assert_eq!(verdict.remedy.expect("remedy").steps, vec![expected]);
    }
}

#[test]
fn mixed_refusals_combine_into_one_verified_plan() {
    let store = store();
    let sid = session(&store);
    let refs = [
        raw("doc_passport", &[Passport]),
        raw("doc_payslip", &[Salary]),
        raw("doc_medical", &[Health]),
    ];
    let verdict = check(&store, &sid, LlmProvider)
        .tool("reason_about_case")
        .refs(&refs)
        .run();
    let remedy = verdict.remedy.expect("remedy");
    assert!(remedy.verified);
    assert_eq!(
        remedy.steps,
        vec![
            RemedyStep::UseTool {
                label: Passport,
                tool: "extract_document".into()
            },
            RemedyStep::Redact { label: Salary },
            RemedyStep::RemoveLabel { label: Health },
        ]
    );
    assert_eq!(
        follow_remedy(&store, &sid, LlmProvider, "reason_about_case", &refs),
        GuardDecision::Allow
    );
}

#[test]
fn indirect_leak_remedy_removes_the_inherited_data() {
    let store = store();
    let sid = session(&store);
    observe(&store, &sid, &[raw("doc_passport", &[Passport])]);
    let verdict = check(&store, &sid, School).refs(&[raw("summary_fresh", &[])]).run();
    assert_eq!(verdict.decision, GuardDecision::Deny);
    assert_eq!(
        verdict.remedy.expect("remedy").steps,
        vec![RemedyStep::RemoveLabel { label: Passport }]
    );
    assert_eq!(verdict.allowed_destinations, vec![Tamm, Employer, Newcomer]);
}

#[test]
fn allowed_calls_report_every_reachable_destination_and_no_remedy() {
    let store = store();
    let sid = session(&store);
    let verdict = check(&store, &sid, Employer)
        .refs(&[raw("employment_letter", &[Employment])])
        .run();
    assert_eq!(verdict.decision, GuardDecision::Allow);
    assert!(verdict.remedy.is_none());
    assert_eq!(
        verdict.allowed_destinations,
        vec![Tamm, Employer, Landlord, Bank, Newcomer]
    );
}
