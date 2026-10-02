//! The decision core: which labels can flow into a call, and what the policy says about them.
//!
//! Pure functions, no IO or clock. The HTTP layer supplies the session's observations and a
//! consent lookup.
//!
//! # What flows into a call
//!
//! Guard evaluates the declared `data_labels` *plus* everything observed in the session that
//! could flow into the call (INTEGRATION.md 3.3), so under-declaring never makes a leak pass:
//!
//! 1. A payload ref that was observed carries the union of its declared and observed labels,
//!    and its observed `derived` flag. Re-declaring a raw document as `derived` or with fewer
//!    labels changes nothing.
//! 2. A payload ref that was never observed carries what it declares. This is how the app's
//!    redaction step (a new ref with the label removed) and derived signals reach Guard.
//! 3. A declared label that no payload ref carries counts as raw data.
//! 4. A call with no payload refs is free-form content (for example a "summary" the agent
//!    wrote). Anything the agent has read may be in it, so every observed ref flows into it.

use std::collections::{BTreeMap, BTreeSet, HashMap};

use crate::contract::{CheckRequest, ConsentRequestInfo, DataLabel, Destination, GuardDecision};
use crate::policy::{Effect, Policy, ReasonKind};

/// What the session knows about one observed data item.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ObservedRef {
    pub labels: BTreeSet<DataLabel>,
    /// True only if every observation of this ref said it was derived.
    pub derived: bool,
}

/// How a label reaches a call: `raw` if any occurrence of it is not a derived signal.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Flow {
    pub raw: bool,
}

/// Guard's answer for one call. Matches the `/check` response minus ids and version.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Verdict {
    pub decision: GuardDecision,
    pub reason: String,
    pub policy_rule: String,
    pub blocked_labels: Vec<DataLabel>,
    pub consent_request: Option<ConsentRequestInfo>,
}

/// Stable rule id when a call carries no labelled data.
pub const NO_DATA_RULE: &str = "no_labelled_data.allowed";

/// Every label that can flow into `request`, given what the session has observed.
pub fn flowing_labels(request: &CheckRequest, observed: &HashMap<String, ObservedRef>) -> BTreeMap<DataLabel, Flow> {
    let mut flows: BTreeMap<DataLabel, Flow> = BTreeMap::new();
    for payload in &request.payload_refs {
        match observed.get(&payload.r#ref) {
            Some(known) => {
                for label in payload.labels.iter().chain(&known.labels) {
                    add_flow(&mut flows, *label, !known.derived);
                }
            }
            None => payload
                .labels
                .iter()
                .for_each(|label| add_flow(&mut flows, *label, !payload.derived)),
        }
    }
    if request.payload_refs.is_empty() {
        for known in observed.values() {
            known
                .labels
                .iter()
                .for_each(|label| add_flow(&mut flows, *label, !known.derived));
        }
    }
    for label in &request.data_labels {
        if !flows.contains_key(label) {
            add_flow(&mut flows, *label, true);
        }
    }
    flows
}

fn add_flow(flows: &mut BTreeMap<DataLabel, Flow>, label: DataLabel, raw: bool) {
    flows
        .entry(label)
        .and_modify(|flow| flow.raw |= raw)
        .or_insert(Flow { raw });
}

/// One label's outcome under the policy.
fn decide_label(
    policy: &Policy,
    request: &CheckRequest,
    label: DataLabel,
    flow: Flow,
    consented: &dyn Fn(DataLabel, Destination) -> bool,
) -> (GuardDecision, ReasonKind) {
    let conditions = policy.conditions();
    let effect = policy.effect(label, request.destination);
    let allowed = match effect {
        Effect::Allow => true,
        Effect::Deny | Effect::RedactedOnly => false,
        Effect::Consent if consented(label, request.destination) => {
            return (GuardDecision::Allow, ReasonKind::ConsentGranted);
        }
        Effect::Consent => return (GuardDecision::NeedsConsent, ReasonKind::Consent),
        Effect::DerivedOnly => !flow.raw,
        Effect::ExtractionOnly => request.tool == conditions.extraction_tool,
        Effect::InsuranceOnly => {
            request.tool == conditions.insurance_tool
                && request.service_tags.contains(&conditions.insurance_service_tag)
        }
    };
    match allowed {
        true => (GuardDecision::Allow, ReasonKind::Allow),
        false => (GuardDecision::Deny, effect.into()),
    }
}

fn severity(decision: GuardDecision) -> u8 {
    match decision {
        GuardDecision::Allow => 0,
        GuardDecision::NeedsConsent => 1,
        GuardDecision::Deny => 2,
    }
}

/// Evaluates a `/check` request. The most severe label outcome wins (deny over needs_consent
/// over allow); the first label in contract order with that outcome supplies the reason and rule.
pub fn evaluate(
    policy: &Policy,
    request: &CheckRequest,
    observed: &HashMap<String, ObservedRef>,
    consented: &dyn Fn(DataLabel, Destination) -> bool,
) -> Verdict {
    let outcomes: Vec<(DataLabel, GuardDecision, ReasonKind)> = flowing_labels(request, observed)
        .into_iter()
        .map(|(label, flow)| {
            let (decision, kind) = decide_label(policy, request, label, flow, consented);
            (label, decision, kind)
        })
        .collect();

    let Some(decision) = outcomes
        .iter()
        .map(|(_, decision, _)| *decision)
        .max_by_key(|d| severity(*d))
    else {
        return Verdict {
            decision: GuardDecision::Allow,
            reason: policy.no_data_reason().to_string(),
            policy_rule: NO_DATA_RULE.to_string(),
            blocked_labels: Vec::new(),
            consent_request: None,
        };
    };
    let (label, _, kind) = *outcomes
        .iter()
        .find(|(_, outcome, _)| *outcome == decision)
        .expect("the most severe decision belongs to some label");
    let destination = request.destination;
    Verdict {
        decision,
        reason: policy.reason(kind, label, destination),
        policy_rule: policy.rule_id(label, destination),
        blocked_labels: outcomes
            .iter()
            .filter(|(_, outcome, _)| *outcome != GuardDecision::Allow)
            .map(|(label, _, _)| *label)
            .collect(),
        consent_request: (decision == GuardDecision::NeedsConsent).then_some(ConsentRequestInfo { label, destination }),
    }
}
