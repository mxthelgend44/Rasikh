//! Helpers shared by the integration tests. Each test binary uses a different subset.
#![allow(dead_code, unused_imports)]

use rasikh_guard::contract::{
    CheckRequest, ConsentRequest, DataLabel, Destination, GuardDecision, ObserveRequest, PayloadRef, SessionRequest,
};
use rasikh_guard::decide::Verdict;
use rasikh_guard::policy::Policy;
use rasikh_guard::store::Store;

pub use DataLabel::*;
pub use Destination::*;

pub fn store() -> Store {
    Store::new(Policy::default_policy())
}

pub fn session(store: &Store) -> String {
    store
        .open_session(&SessionRequest {
            case_id: "hire_demo_001".into(),
            case_type: "hire".into(),
        })
        .expect("session opens")
}

/// A raw payload ref.
pub fn raw(id: &str, labels: &[DataLabel]) -> PayloadRef {
    PayloadRef {
        r#ref: id.into(),
        labels: labels.to_vec(),
        derived: false,
    }
}

/// A derived-signal payload ref.
pub fn derived(id: &str, labels: &[DataLabel]) -> PayloadRef {
    PayloadRef {
        r#ref: id.into(),
        labels: labels.to_vec(),
        derived: true,
    }
}

pub fn observe(store: &Store, session_id: &str, refs: &[PayloadRef]) {
    store
        .observe(&ObserveRequest {
            session_id: session_id.into(),
            source: Newcomer,
            payload_refs: refs.to_vec(),
        })
        .expect("observe succeeds");
}

/// Builder for a `/check` request.
pub struct Check<'a> {
    store: &'a Store,
    request: CheckRequest,
}

pub fn check<'a>(store: &'a Store, session_id: &str, destination: Destination) -> Check<'a> {
    Check {
        store,
        request: CheckRequest {
            session_id: session_id.into(),
            tool: "send_message".into(),
            destination,
            data_labels: Vec::new(),
            payload_refs: Vec::new(),
            service_tags: Vec::new(),
        },
    }
}

impl Check<'_> {
    pub fn tool(mut self, tool: &str) -> Self {
        self.request.tool = tool.into();
        self
    }

    pub fn labels(mut self, labels: &[DataLabel]) -> Self {
        self.request.data_labels = labels.to_vec();
        self
    }

    pub fn refs(mut self, refs: &[PayloadRef]) -> Self {
        self.request.payload_refs = refs.to_vec();
        self
    }

    pub fn tags(mut self, tags: &[&str]) -> Self {
        self.request.service_tags = tags.iter().map(|tag| tag.to_string()).collect();
        self
    }

    pub fn run(self) -> Verdict {
        self.store.check(&self.request).expect("check succeeds").verdict
    }
}

pub fn grant(store: &Store, session_id: &str, label: DataLabel, destination: Destination) -> String {
    store
        .grant_consent(&ConsentRequest {
            session_id: session_id.into(),
            label,
            destination,
            granted_by: "newcomer".into(),
            expires_at: None,
        })
        .expect("consent is grantable")
        .consent_id
}

pub fn assert_decision(verdict: &Verdict, decision: GuardDecision, rule: &str) {
    assert_eq!(verdict.decision, decision, "decision for {rule}: {verdict:?}");
    assert_eq!(verdict.policy_rule, rule, "rule: {verdict:?}");
}
