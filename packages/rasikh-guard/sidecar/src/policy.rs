//! The Rasikh policy: a complete label x destination matrix of effects, loaded from TOML
//! (`policies/rasikh.toml`). Product defaults for the demo, not legal statements.

use std::collections::BTreeMap;

use serde::Deserialize;
use thiserror::Error;

use crate::contract::{DataLabel, Destination};

/// The default policy shipped with the sidecar.
pub const DEFAULT_POLICY_TOML: &str = include_str!("../../policies/rasikh.toml");

const SUPPORTED_VERSION: u32 = 1;

/// What the policy says about one label flowing to one destination.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Effect {
    Allow,
    Deny,
    Consent,
    DerivedOnly,
    ExtractionOnly,
    RedactedOnly,
    InsuranceOnly,
}

impl Effect {
    /// Suffix of the stable rule id, e.g. `passport.landlord.requires_consent`.
    fn rule_suffix(self) -> &'static str {
        match self {
            Effect::Allow => "allowed",
            Effect::Deny => "denied",
            Effect::Consent => "requires_consent",
            Effect::DerivedOnly => "derived_only",
            Effect::ExtractionOnly => "extraction_only",
            Effect::RedactedOnly => "redacted_only",
            Effect::InsuranceOnly => "insurance_only",
        }
    }
}

/// Which reason template to render.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ReasonKind {
    Allow,
    ConsentGranted,
    Deny,
    Consent,
    DerivedOnly,
    ExtractionOnly,
    RedactedOnly,
    InsuranceOnly,
}

impl From<Effect> for ReasonKind {
    fn from(effect: Effect) -> Self {
        match effect {
            Effect::Allow => ReasonKind::Allow,
            Effect::Deny => ReasonKind::Deny,
            Effect::Consent => ReasonKind::Consent,
            Effect::DerivedOnly => ReasonKind::DerivedOnly,
            Effect::ExtractionOnly => ReasonKind::ExtractionOnly,
            Effect::RedactedOnly => ReasonKind::RedactedOnly,
            Effect::InsuranceOnly => ReasonKind::InsuranceOnly,
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Conditions {
    pub extraction_tool: String,
    pub insurance_tool: String,
    pub insurance_service_tag: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
struct Reasons {
    allow: String,
    consent_granted: String,
    deny: String,
    consent: String,
    derived_only: String,
    extraction_only: String,
    redacted_only: String,
    insurance_only: String,
    no_data: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
struct Names {
    labels: BTreeMap<DataLabel, String>,
    destinations: BTreeMap<Destination, String>,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct RawPolicy {
    version: u32,
    conditions: Conditions,
    names: Names,
    reasons: Reasons,
    matrix: BTreeMap<DataLabel, BTreeMap<Destination, Effect>>,
}

#[derive(Debug, Error, PartialEq, Eq)]
pub enum PolicyError {
    #[error("policy TOML does not parse: {0}")]
    Parse(String),
    #[error("unsupported policy version {found}, expected {SUPPORTED_VERSION}")]
    UnsupportedVersion { found: u32 },
    #[error("policy matrix has no effect for {label} -> {destination}")]
    MissingCell {
        label: &'static str,
        destination: &'static str,
    },
    #[error("policy has no display name for {0}")]
    MissingName(&'static str),
}

/// A validated policy: every label x destination cell has an effect.
#[derive(Debug, Clone)]
pub struct Policy {
    conditions: Conditions,
    names: Names,
    reasons: Reasons,
    matrix: BTreeMap<(DataLabel, Destination), Effect>,
}

impl Policy {
    /// Parses and validates a policy. Refuses unknown keys, unknown labels or destinations,
    /// and any missing cell, so nothing can fall through to an implicit default.
    pub fn from_toml_str(text: &str) -> Result<Policy, PolicyError> {
        let raw: RawPolicy = toml::from_str(text).map_err(|error| PolicyError::Parse(error.to_string()))?;
        if raw.version != SUPPORTED_VERSION {
            return Err(PolicyError::UnsupportedVersion { found: raw.version });
        }
        let mut matrix = BTreeMap::new();
        for label in DataLabel::ALL {
            if !raw.names.labels.contains_key(&label) {
                return Err(PolicyError::MissingName(label.as_str()));
            }
            for destination in Destination::ALL {
                let effect =
                    raw.matrix
                        .get(&label)
                        .and_then(|row| row.get(&destination))
                        .ok_or(PolicyError::MissingCell {
                            label: label.as_str(),
                            destination: destination.as_str(),
                        })?;
                matrix.insert((label, destination), *effect);
            }
        }
        if let Some(destination) = Destination::ALL
            .into_iter()
            .find(|d| !raw.names.destinations.contains_key(d))
        {
            return Err(PolicyError::MissingName(destination.as_str()));
        }
        Ok(Policy {
            conditions: raw.conditions,
            names: raw.names,
            reasons: raw.reasons,
            matrix,
        })
    }

    /// The default policy compiled into the binary.
    pub fn default_policy() -> Policy {
        Policy::from_toml_str(DEFAULT_POLICY_TOML).expect("the shipped policy is valid (covered by tests)")
    }

    pub fn effect(&self, label: DataLabel, destination: Destination) -> Effect {
        *self
            .matrix
            .get(&(label, destination))
            .expect("validated policies have every cell")
    }

    pub fn conditions(&self) -> &Conditions {
        &self.conditions
    }

    /// Stable rule id for a cell, e.g. `health.tamm.insurance_only`.
    pub fn rule_id(&self, label: DataLabel, destination: Destination) -> String {
        let effect = self.effect(label, destination);
        format!("{}.{}.{}", label.as_str(), destination.as_str(), effect.rule_suffix())
    }

    /// Plain-language reason for a label and destination, shown to users as is.
    pub fn reason(&self, kind: ReasonKind, label: DataLabel, destination: Destination) -> String {
        let template = match kind {
            ReasonKind::Allow => &self.reasons.allow,
            ReasonKind::ConsentGranted => &self.reasons.consent_granted,
            ReasonKind::Deny => &self.reasons.deny,
            ReasonKind::Consent => &self.reasons.consent,
            ReasonKind::DerivedOnly => &self.reasons.derived_only,
            ReasonKind::ExtractionOnly => &self.reasons.extraction_only,
            ReasonKind::RedactedOnly => &self.reasons.redacted_only,
            ReasonKind::InsuranceOnly => &self.reasons.insurance_only,
        };
        template
            .replace("{label}", &self.names.labels[&label])
            .replace("{destination}", &self.names.destinations[&destination])
    }

    /// Reason used when a call carries no labelled data at all.
    pub fn no_data_reason(&self) -> &str {
        &self.reasons.no_data
    }
}
