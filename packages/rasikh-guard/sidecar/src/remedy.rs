//! Remedy planning (contract 1.2.0): when a call is not allowed, the smallest set of steps
//! that would make it allowed, verified by re-deciding the call with every step applied.
//!
//! Each blocked label gets the cheapest step its policy cell admits, in this cost order:
//!
//! | Cost | Step                  | Offered for            | Information kept               |
//! | ---: | --------------------- | ---------------------- | ------------------------------ |
//! |    1 | `use_tool`            | `extraction_only`      | all of it, via the right tool  |
//! |    2 | `send_derived_signal` | `derived_only`         | a yes/no signal                |
//! |    3 | `redact`              | `redacted_only`        | the rest of the document       |
//! |    4 | `grant_consent`       | `consent`              | all of it, after a human yes   |
//! |    5 | `remove_label`        | anything else          | none of this label             |
//!
//! Steps are then applied together to a copy of the call and the call is decided again
//! ([`decide::decide_flows`]). Any label still blocked (for example because a `use_tool` step
//! changed the tool for another label) is downgraded to `remove_label` and the plan is
//! re-verified. Removing every remaining label always yields `allow`, so the loop ends after at
//! most one pass per label and every returned plan is `verified`.

use std::collections::BTreeMap;

use serde::Serialize;

use crate::contract::{CheckRequest, DataLabel, Destination, GuardDecision};
use crate::decide::{self, Flow};
use crate::policy::{Effect, Policy};

/// One step of a remedy, serialized as `{ "action": "...", ... }`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "action", rename_all = "snake_case")]
pub enum RemedyStep {
    UseTool { label: DataLabel, tool: String },
    SendDerivedSignal { label: DataLabel },
    Redact { label: DataLabel },
    GrantConsent { label: DataLabel, destination: Destination },
    RemoveLabel { label: DataLabel },
}

impl RemedyStep {
    fn label(&self) -> DataLabel {
        match self {
            RemedyStep::UseTool { label, .. }
            | RemedyStep::SendDerivedSignal { label }
            | RemedyStep::Redact { label }
            | RemedyStep::GrantConsent { label, .. }
            | RemedyStep::RemoveLabel { label } => *label,
        }
    }
}

/// A plan of steps and whether re-deciding the call with all of them applied gave `allow`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Remedy {
    pub steps: Vec<RemedyStep>,
    pub verified: bool,
}

/// The cheapest step the policy cell for `label` at the call's destination admits.
fn cheapest_step(policy: &Policy, request: &CheckRequest, label: DataLabel) -> RemedyStep {
    match policy.effect(label, request.destination) {
        Effect::ExtractionOnly => RemedyStep::UseTool {
            label,
            tool: policy.conditions().extraction_tool.clone(),
        },
        Effect::DerivedOnly => RemedyStep::SendDerivedSignal { label },
        Effect::RedactedOnly => RemedyStep::Redact { label },
        Effect::Consent => RemedyStep::GrantConsent {
            label,
            destination: request.destination,
        },
        Effect::Allow | Effect::Deny | Effect::InsuranceOnly => RemedyStep::RemoveLabel { label },
    }
}

/// Re-decides the call as if every step were applied. Returns the labels still blocked.
fn still_blocked(
    policy: &Policy,
    request: &CheckRequest,
    flows: &BTreeMap<DataLabel, Flow>,
    consented: &dyn Fn(DataLabel, Destination) -> bool,
    steps: &[RemedyStep],
) -> Vec<DataLabel> {
    let mut request = request.clone();
    let mut flows = flows.clone();
    let mut grants = Vec::new();
    for step in steps {
        match step {
            RemedyStep::UseTool { tool, .. } => request.tool = tool.clone(),
            RemedyStep::SendDerivedSignal { label } => {
                if let Some(flow) = flows.get_mut(label) {
                    flow.raw = false;
                }
            }
            RemedyStep::Redact { label } | RemedyStep::RemoveLabel { label } => {
                flows.remove(label);
            }
            RemedyStep::GrantConsent { label, destination } => grants.push((*label, *destination)),
        }
    }
    let with_grants = |label: DataLabel, destination: Destination| {
        consented(label, destination) || grants.contains(&(label, destination))
    };
    let verdict = decide::decide_flows(policy, &request, &flows, &with_grants);
    match verdict.decision {
        GuardDecision::Allow => Vec::new(),
        _ => verdict.blocked_labels,
    }
}

/// Plans the smallest verified remedy for a call whose `blocked` labels stopped it.
pub fn plan(
    policy: &Policy,
    request: &CheckRequest,
    flows: &BTreeMap<DataLabel, Flow>,
    consented: &dyn Fn(DataLabel, Destination) -> bool,
    blocked: &[DataLabel],
) -> Remedy {
    let mut steps: Vec<RemedyStep> = blocked
        .iter()
        .map(|label| cheapest_step(policy, request, *label))
        .collect();
    for _ in 0..=flows.len() {
        let remaining = still_blocked(policy, request, flows, consented, &steps);
        if remaining.is_empty() {
            return Remedy { steps, verified: true };
        }
        for label in remaining {
            match steps.iter_mut().find(|step| step.label() == label) {
                Some(step) => *step = RemedyStep::RemoveLabel { label },
                None => steps.push(RemedyStep::RemoveLabel { label }),
            }
        }
    }
    let verified = still_blocked(policy, request, flows, consented, &steps).is_empty();
    Remedy { steps, verified }
}
