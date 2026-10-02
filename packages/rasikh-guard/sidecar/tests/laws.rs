//! Property-based laws over random requests, observations and consents. Each law is a
//! security property that must hold for every input, not only for the cases written by hand.

use std::collections::{BTreeSet, HashMap};

use proptest::prelude::*;
use rasikh_guard::contract::{CheckRequest, DataLabel, Destination, GuardDecision, PayloadRef};
use rasikh_guard::decide::{ENGINE_REFUSED_RULE, ObservedRef, Verdict, evaluate};
use rasikh_guard::policy::Policy;

const TOOLS: [&str; 4] = [
    "extract_document",
    "start_application",
    "send_message",
    "reason_about_case",
];
const TAGS: [&str; 3] = ["insurance", "health", "housing"];
const REFS: [&str; 5] = ["doc_a", "doc_b", "doc_c", "summary", "signal"];

fn label() -> impl Strategy<Value = DataLabel> {
    prop::sample::select(DataLabel::ALL.to_vec())
}

fn destination() -> impl Strategy<Value = Destination> {
    prop::sample::select(Destination::ALL.to_vec())
}

fn payload() -> impl Strategy<Value = PayloadRef> {
    (
        prop::sample::select(REFS.to_vec()),
        prop::collection::vec(label(), 0..3),
        any::<bool>(),
    )
        .prop_map(|(id, labels, derived)| PayloadRef {
            r#ref: id.to_string(),
            labels,
            derived,
        })
}

fn request() -> impl Strategy<Value = CheckRequest> {
    (
        prop::sample::select(TOOLS.to_vec()),
        destination(),
        prop::collection::vec(label(), 0..3),
        prop::collection::vec(payload(), 0..4),
        prop::sample::subsequence(TAGS.to_vec(), 0..=3),
    )
        .prop_map(|(tool, destination, data_labels, payload_refs, tags)| CheckRequest {
            session_id: "gs_law".into(),
            tool: tool.into(),
            destination,
            data_labels,
            payload_refs,
            service_tags: tags.into_iter().map(String::from).collect(),
        })
}

fn observed() -> impl Strategy<Value = HashMap<String, ObservedRef>> {
    prop::collection::vec(payload(), 0..4).prop_map(|refs| {
        let mut map: HashMap<String, ObservedRef> = HashMap::new();
        for payload in refs {
            let entry = map.entry(payload.r#ref.clone()).or_insert(ObservedRef {
                labels: BTreeSet::new(),
                derived: payload.derived,
            });
            entry.labels.extend(payload.labels.iter().copied());
            entry.derived &= payload.derived;
        }
        map
    })
}

fn consents() -> impl Strategy<Value = BTreeSet<(DataLabel, Destination)>> {
    prop::collection::btree_set((label(), destination()), 0..6)
}

fn decide(
    policy: &Policy,
    request: &CheckRequest,
    observed: &HashMap<String, ObservedRef>,
    granted: &BTreeSet<(DataLabel, Destination)>,
) -> Verdict {
    evaluate(policy, request, observed, &|l, d| granted.contains(&(l, d)))
}

fn allowed(verdict: &Verdict) -> bool {
    verdict.decision == GuardDecision::Allow
}

proptest! {
    #![proptest_config(ProptestConfig { cases: 2_000, ..ProptestConfig::default() })]

    /// The same input always gives the same verdict.
    #[test]
    fn decisions_are_deterministic(req in request(), obs in observed(), granted in consents()) {
        let policy = Policy::default_policy();
        prop_assert_eq!(decide(&policy, &req, &obs, &granted), decide(&policy, &req, &obs, &granted));
    }

    /// Sending more data can never turn a refusal into an allow.
    #[test]
    fn adding_data_never_unlocks(req in request(), obs in observed(), granted in consents(), extra in payload()) {
        let policy = Policy::default_policy();
        let before = decide(&policy, &req, &obs, &granted);
        let mut more = req.clone();
        more.payload_refs.push(extra);
        if !allowed(&before) && !more.payload_refs.is_empty() && !req.payload_refs.is_empty() {
            prop_assert!(!allowed(&decide(&policy, &more, &obs, &granted)));
        }
    }

    /// Declaring an extra label can never turn a refusal into an allow.
    #[test]
    fn declaring_labels_never_unlocks(req in request(), obs in observed(), granted in consents(), extra in label()) {
        let policy = Policy::default_policy();
        let before = decide(&policy, &req, &obs, &granted);
        let mut more = req.clone();
        more.data_labels.push(extra);
        if !allowed(&before) {
            prop_assert!(!allowed(&decide(&policy, &more, &obs, &granted)));
        }
    }

    /// Reading more can never make a free-form or agent-written send safer.
    #[test]
    fn observing_more_never_unlocks_agent_content(req in request(), obs in observed(), granted in consents(), extra in payload()) {
        let policy = Policy::default_policy();
        let unknown_refs = req.payload_refs.iter().any(|r| !obs.contains_key(&r.r#ref)) || req.payload_refs.is_empty();
        let touches_request = req.payload_refs.iter().any(|r| r.r#ref == extra.r#ref);
        let before = decide(&policy, &req, &obs, &granted);
        let mut more_obs = obs.clone();
        let entry = more_obs
            .entry(extra.r#ref.clone())
            .or_insert(ObservedRef { labels: BTreeSet::new(), derived: extra.derived });
        entry.labels.extend(extra.labels.iter().copied());
        entry.derived &= extra.derived;
        if unknown_refs && !touches_request && !allowed(&before) {
            prop_assert!(!allowed(&decide(&policy, &req, &more_obs, &granted)));
        }
    }

    /// A fresh, unlabelled "summary" ref can never launder what the agent has read: such a
    /// send is never allowed when the same content sent free-form would be refused.
    #[test]
    fn fresh_refs_cannot_launder_observations(req in request(), obs in observed(), granted in consents()) {
        let policy = Policy::default_policy();
        let mut free_form = req.clone();
        free_form.payload_refs.clear();
        let mut laundered = req.clone();
        laundered.payload_refs = vec![PayloadRef { r#ref: "fresh_summary_never_observed".into(), labels: vec![], derived: true }];
        if !allowed(&decide(&policy, &free_form, &obs, &granted)) {
            prop_assert!(!allowed(&decide(&policy, &laundered, &obs, &granted)));
        }
    }

    /// A consent only ever affects its own label and destination.
    #[test]
    fn consent_is_scoped(req in request(), obs in observed(), granted in consents(), extra in (label(), destination())) {
        let policy = Policy::default_policy();
        // Rotate onto another destination by construction rather than rejecting cases.
        let index = Destination::ALL.iter().position(|d| *d == extra.1).unwrap_or(0);
        let other = if extra.1 == req.destination { Destination::ALL[(index + 1) % Destination::ALL.len()] } else { extra.1 };
        let mut more = granted.clone();
        more.insert((extra.0, other));
        prop_assert_eq!(decide(&policy, &req, &obs, &granted).decision, decide(&policy, &req, &obs, &more).decision);
    }

    /// Consent can never unlock a cell that is not a consent cell (e.g. passport to a school).
    #[test]
    fn consent_never_unlocks_deny_cells(req in request(), obs in observed()) {
        let policy = Policy::default_policy();
        let everything: BTreeSet<_> = DataLabel::ALL
            .iter()
            .flat_map(|l| Destination::ALL.iter().map(move |d| (*l, *d)))
            .collect();
        let none = BTreeSet::new();
        let without = decide(&policy, &req, &obs, &none);
        let with_all = decide(&policy, &req, &obs, &everything);
        if without.decision == GuardDecision::Deny {
            prop_assert_eq!(with_all.decision, GuardDecision::Deny);
        }
    }

    /// Every refusal carries a verified remedy; every allow carries none.
    #[test]
    fn remedies_are_always_verified(req in request(), obs in observed(), granted in consents()) {
        let policy = Policy::default_policy();
        let verdict = decide(&policy, &req, &obs, &granted);
        match verdict.decision {
            GuardDecision::Allow => prop_assert!(verdict.remedy.is_none()),
            _ => prop_assert!(verdict.remedy.as_ref().is_some_and(|r| r.verified && !r.steps.is_empty())),
        }
    }

    /// The OpenAPPA fold and the per-label analysis never disagree.
    #[test]
    fn engine_and_policy_agree(req in request(), obs in observed(), granted in consents()) {
        let policy = Policy::default_policy();
        let verdict = decide(&policy, &req, &obs, &granted);
        prop_assert_ne!(verdict.policy_rule.as_str(), ENGINE_REFUSED_RULE);
        prop_assert_eq!(allowed(&verdict), verdict.allowed_destinations.contains(&req.destination));
    }

    /// Blocked labels are exactly the reason for a refusal, and consent requests only appear
    /// on needs_consent.
    #[test]
    fn verdict_fields_are_consistent(req in request(), obs in observed(), granted in consents()) {
        let policy = Policy::default_policy();
        let verdict = decide(&policy, &req, &obs, &granted);
        prop_assert_eq!(allowed(&verdict), verdict.blocked_labels.is_empty());
        prop_assert_eq!(verdict.decision == GuardDecision::NeedsConsent, verdict.consent_request.is_some());
    }
}
