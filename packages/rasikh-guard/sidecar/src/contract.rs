//! Wire types from INTEGRATION.md sections 2 and 3. Closed enums: unknown values are rejected
//! at the HTTP boundary.

use serde::{Deserialize, Serialize};

/// Contract version this sidecar implements.
pub const CONTRACT_VERSION: &str = "1.1.1";

/// The kinds of personal data Guard tracks.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DataLabel {
    Passport,
    EmiratesId,
    Salary,
    BankStatement,
    Employment,
    Family,
    Address,
    Degree,
    Health,
}

impl DataLabel {
    /// Every label, in contract order.
    pub const ALL: [DataLabel; 9] = [
        DataLabel::Passport,
        DataLabel::EmiratesId,
        DataLabel::Salary,
        DataLabel::BankStatement,
        DataLabel::Employment,
        DataLabel::Family,
        DataLabel::Address,
        DataLabel::Degree,
        DataLabel::Health,
    ];

    /// The wire spelling, also used in policy rule ids.
    pub fn as_str(self) -> &'static str {
        match self {
            DataLabel::Passport => "passport",
            DataLabel::EmiratesId => "emirates_id",
            DataLabel::Salary => "salary",
            DataLabel::BankStatement => "bank_statement",
            DataLabel::Employment => "employment",
            DataLabel::Family => "family",
            DataLabel::Address => "address",
            DataLabel::Degree => "degree",
            DataLabel::Health => "health",
        }
    }
}

/// Where the agent can send data.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Destination {
    Tamm,
    Employer,
    Landlord,
    Bank,
    School,
    LlmProvider,
    Newcomer,
}

impl Destination {
    /// Every destination, in contract order.
    pub const ALL: [Destination; 7] = [
        Destination::Tamm,
        Destination::Employer,
        Destination::Landlord,
        Destination::Bank,
        Destination::School,
        Destination::LlmProvider,
        Destination::Newcomer,
    ];

    /// The wire spelling, also used in policy rule ids.
    pub fn as_str(self) -> &'static str {
        match self {
            Destination::Tamm => "tamm",
            Destination::Employer => "employer",
            Destination::Landlord => "landlord",
            Destination::Bank => "bank",
            Destination::School => "school",
            Destination::LlmProvider => "llm_provider",
            Destination::Newcomer => "newcomer",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GuardDecision {
    Allow,
    Deny,
    NeedsConsent,
}

/// A reference to one data item and every label that applies to it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PayloadRef {
    pub r#ref: String,
    pub labels: Vec<DataLabel>,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub derived: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SessionRequest {
    pub case_id: String,
    pub case_type: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ObserveRequest {
    pub session_id: String,
    pub source: Destination,
    pub payload_refs: Vec<PayloadRef>,
}

/// `POST /check` request. `service_tags` (optional, contract 1.1.0) carries the TAMM service's
/// tags so the "insurance services only" rule can be evaluated; without it that rule denies.
#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CheckRequest {
    pub session_id: String,
    pub tool: String,
    pub destination: Destination,
    pub data_labels: Vec<DataLabel>,
    #[serde(default)]
    pub payload_refs: Vec<PayloadRef>,
    #[serde(default)]
    pub service_tags: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct ConsentRequestInfo {
    pub label: DataLabel,
    pub destination: Destination,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ConsentRequest {
    pub session_id: String,
    pub label: DataLabel,
    pub destination: Destination,
    pub granted_by: String,
    pub expires_at: Option<String>,
}
