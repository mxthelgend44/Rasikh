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
//!    labels changes nothing. This is the only way a redacted ref (the app's redaction step
//!    reports the new ref with the label removed) or a derived signal is trusted.
//! 2. A payload ref that was never observed is content the agent produced, for example a
//!    "summary". Anything the agent has read may be in it, so every observed ref flows into the
//!    call, and its declared labels count as raw (an unobserved `derived` claim is ignored).
//! 3. A call with no payload refs is free-form content and is treated the same way.
//! 4. A declared label that no payload ref carries counts as raw data.

use std::collections::{BTreeMap, BTreeSet, HashMap};

use crate::appa;
use crate::contract::{CheckRequest, ConsentRequestInfo, DataLabel, Destination, GuardDecision};
use crate::policy::{Effect, Policy, ReasonKind};
use crate::remedy::{self, Remedy};

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
    /// Every destination the same payload could reach as it stands (contract 1.2.0).
    pub allowed_destinations: Vec<Destination>,
    /// The smallest verified fix, present only when `decision` is not `allow` (contract 1.2.0).
    pub remedy: Option<Remedy>,
}

/// Stable rule id when a call carries no labelled data.
pub const NO_DATA_RULE: &str = "no_labelled_data.allowed";

/// Every label that can flow into `request`, given what the session has observed.
pub fn flowing_labels(request: &CheckRequest, observed: &HashMap<String, ObservedRef>) -> BTreeMap<DataLabel, Flow> {
    let mut flows: BTreeMap<DataLabel, Flow> = BTreeMap::new();
    let mut carries_agent_content = request.payload_refs.is_empty();
    for payload in &request.payload_refs {
        match observed.get(&payload.r#ref) {
            Some(known) => {
                for label in payload.labels.iter().chain(&known.labels) {
                    add_flow(&mut flows, *label, !known.derived);
                }
            }
            None => {
                carries_agent_content = true;
                payload
                    .labels
                    .iter()
                    .for_each(|label| add_flow(&mut flows, *label, true));
            }
        }
    }
    if carries_agent_content {
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

/// One label's outcome under the policy if this call were sent to `destination`.
fn decide_label(
    policy: &Policy,
    request: &CheckRequest,
    destination: Destination,
    label: DataLabel,
    flow: Flow,
    consented: &dyn Fn(DataLabel, Destination) -> bool,
) -> (GuardDecision, ReasonKind) {
    let conditions = policy.conditions();
    let effect = policy.effect(label, destination);
    let allowed = match effect {
        Effect::Allow => true,
        Effect::Deny | Effect::RedactedOnly => false,
        Effect::Consent if consented(label, destination) => {
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

/// Stable rule id if the OpenAPPA fold refuses a call that no single label refused. The two
/// are computed from the same cells, so this is a fail-closed guard against drift, not a path
/// the policy is expected to take.
pub const ENGINE_REFUSED_RULE: &str = "appa.audience.refused";

/// Evaluates a `/check` request: decides the call ([`decide_flows`]) and, when it is not
/// allowed, attaches the smallest verified remedy ([`crate::remedy::plan`]).
pub fn evaluate(
    policy: &Policy,
    request: &CheckRequest,
    observed: &HashMap<String, ObservedRef>,
    consented: &dyn Fn(DataLabel, Destination) -> bool,
) -> Verdict {
    let flows = flowing_labels(request, observed);
    let mut verdict = decide_flows(policy, request, &flows, consented);
    if verdict.decision != GuardDecision::Allow {
        verdict.remedy = Some(remedy::plan(
            policy,
            request,
            &flows,
            consented,
            &verdict.blocked_labels,
        ));
    }
    verdict
}

/// Decides a call from the labels flowing into it.
///
/// The gate is the OpenAPPA label fold ([`crate::appa`]): every flowing label contributes the
/// destinations it may reach in this context, the engine's meet intersects them, and only a
/// folded audience that admits `request.destination` yields `allow`. When it does not, the
/// most severe label outcome (deny over needs_consent) and the first label in contract order
/// with that outcome supply the decision, reason and rule. The folded audience is also
/// reported as `allowed_destinations`.
pub(crate) fn decide_flows(
    policy: &Policy,
    request: &CheckRequest,
    flows: &BTreeMap<DataLabel, Flow>,
    consented: &dyn Fn(DataLabel, Destination) -> bool,
) -> Verdict {
    let call_label = appa::fold(flows.iter().map(|(label, flow)| {
        appa::label_for(Destination::ALL.into_iter().filter(|destination| {
            decide_label(policy, request, *destination, *label, *flow, consented).0 == GuardDecision::Allow
        }))
    }));
    let engine_allows = appa::admits(&call_label, request.destination);
    let allowed_destinations = appa::admitted(&call_label);

    let outcomes: Vec<(DataLabel, GuardDecision, ReasonKind)> = flows
        .iter()
        .map(|(label, flow)| {
            let (decision, kind) = decide_label(policy, request, request.destination, *label, *flow, consented);
            (*label, decision, kind)
        })
        .collect();

    let worst = outcomes
        .iter()
        .map(|(_, decision, _)| *decision)
        .max_by_key(|d| severity(*d));
    let decision = match (engine_allows, worst) {
        (true, None) => {
            return Verdict {
                decision: GuardDecision::Allow,
                reason: policy.no_data_reason().to_string(),
                policy_rule: NO_DATA_RULE.to_string(),
                blocked_labels: Vec::new(),
                consent_request: None,
                allowed_destinations,
                remedy: None,
            };
        }
        (true, Some(GuardDecision::Allow)) => GuardDecision::Allow,
        (false, Some(worst)) if worst != GuardDecision::Allow => worst,
        (_, _) => {
            return Verdict {
                decision: GuardDecision::Deny,
                reason: "This step was stopped by a privacy safety check.".to_string(),
                policy_rule: ENGINE_REFUSED_RULE.to_string(),
                blocked_labels: outcomes.iter().map(|(label, _, _)| *label).collect(),
                consent_request: None,
                allowed_destinations,
                remedy: None,
            };
        }
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
        allowed_destinations,
        remedy: None,
    }
}
