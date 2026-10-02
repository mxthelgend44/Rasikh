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
//! ([`decide::decide_flows`]). If steps interact (under a custom policy a `use_tool` step can
//! change how another label is judged), an exact search finds the minimum-cost plan that
//! verifies; see [`plan`]. Removing every label always yields `allow`, so every returned plan
//! is `verified`.

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

/// Cost of a step, from the table in the module docs. `None` (leave the label alone) is free.
fn cost(step: Option<&RemedyStep>) -> u32 {
    match step {
        None => 0,
        Some(RemedyStep::UseTool { .. }) => 1,
        Some(RemedyStep::SendDerivedSignal { .. }) => 2,
        Some(RemedyStep::Redact { .. }) => 3,
        Some(RemedyStep::GrantConsent { .. }) => 4,
        Some(RemedyStep::RemoveLabel { .. }) => 5,
    }
}

/// Upper bound on plans the exact search may verify before falling back.
const SEARCH_LIMIT: usize = 4096;

/// Plans the minimum-cost verified remedy for a call whose `blocked` labels stopped it.
///
/// 1. Fast path: the cheapest step for every blocked label. It verifies for the shipped
///    policy, so a normal refusal costs one re-decision.
/// 2. Exact search, when steps interact (a `use_tool` step can change how another label is
///    judged under a custom policy): every flowing label may take no step, its cheapest
///    admissible step, or `remove_label`. Plans are tried in ascending total cost, so the
///    first plan that verifies is a minimum-cost plan. Exact while the plan space fits within
///    `SEARCH_LIMIT` (3 options per label, so up to 7 flowing labels).
/// 3. Fallback: remove every flowing label, which always verifies.
pub fn plan(
    policy: &Policy,
    request: &CheckRequest,
    flows: &BTreeMap<DataLabel, Flow>,
    consented: &dyn Fn(DataLabel, Destination) -> bool,
    blocked: &[DataLabel],
) -> Remedy {
    let greedy: Vec<RemedyStep> = blocked
        .iter()
        .map(|label| cheapest_step(policy, request, *label))
        .collect();
    if still_blocked(policy, request, flows, consented, &greedy).is_empty() {
        return Remedy {
            steps: greedy,
            verified: true,
        };
    }

    let options: Vec<Vec<Option<RemedyStep>>> = flows
        .keys()
        .map(|label| {
            let mut choices = vec![None];
            let cheapest = cheapest_step(policy, request, *label);
            if !matches!(cheapest, RemedyStep::RemoveLabel { .. }) {
                choices.push(Some(cheapest));
            }
            choices.push(Some(RemedyStep::RemoveLabel { label: *label }));
            choices
        })
        .collect();

    let mut plans: Vec<(u32, usize, Vec<RemedyStep>)> = Vec::new();
    let mut indexes = vec![0usize; options.len()];
    loop {
        let steps: Vec<RemedyStep> = indexes
            .iter()
            .zip(&options)
            .filter_map(|(index, choices)| choices[*index].clone())
            .collect();
        let total = steps.iter().map(|step| cost(Some(step))).sum();
        plans.push((total, steps.len(), steps));
        if plans.len() > SEARCH_LIMIT {
            break;
        }
        // Odometer increment over the option lists.
        let mut position = 0;
        while position < indexes.len() {
            indexes[position] += 1;
            if indexes[position] < options[position].len() {
                break;
            }
            indexes[position] = 0;
            position += 1;
        }
        if position == indexes.len() {
            break;
        }
    }
    plans.sort_by_key(|(total, count, _)| (*total, *count));
    for (_, _, steps) in plans.into_iter().take(SEARCH_LIMIT) {
        if still_blocked(policy, request, flows, consented, &steps).is_empty() {
            return Remedy { steps, verified: true };
        }
    }

    let remove_all: Vec<RemedyStep> = flows
        .keys()
        .map(|label| RemedyStep::RemoveLabel { label: *label })
        .collect();
    let verified = still_blocked(policy, request, flows, consented, &remove_all).is_empty();
    Remedy {
        steps: remove_all,
        verified,
    }
}
