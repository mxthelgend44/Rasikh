//! In-memory sessions, observations, consents and the decision log.
//!
//! Every method takes the one lock, does synchronous work and releases it, so `/check` is a
//! single consistent read of observations and consents.

use std::collections::{HashMap, hash_map::Entry};
use std::sync::Mutex;

use chrono::{DateTime, FixedOffset, Utc};
use rand::Rng;
use serde::Serialize;
use thiserror::Error;

use crate::contract::{
    CheckRequest, ConsentRequest, DataLabel, Destination, GuardDecision, ObserveRequest, SessionRequest,
};
use crate::decide::{ObservedRef, Verdict, evaluate};
use crate::policy::{Effect, Policy};

/// Abu Dhabi time (UTC+4, no daylight saving), used for log timestamps.
const ABU_DHABI_OFFSET_SECS: i32 = 4 * 3600;

#[derive(Debug, Error, PartialEq, Eq)]
pub enum StoreError {
    #[error("unknown session")]
    UnknownSession,
    #[error("consent not found")]
    ConsentNotFound,
    #[error("{0}")]
    InvalidRequest(String),
}

/// One `/log` entry (INTEGRATION.md 3.3).
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct LogEntry {
    pub check_id: String,
    pub at: String,
    pub tool: String,
    pub destination: Destination,
    pub decision: GuardDecision,
    pub reason: String,
    pub policy_rule: String,
}

#[derive(Debug)]
struct Session {
    observed: HashMap<String, ObservedRef>,
    log: Vec<LogEntry>,
}

#[derive(Debug)]
struct Consent {
    session_id: String,
    label: DataLabel,
    destination: Destination,
    expires_at: Option<DateTime<FixedOffset>>,
    active: bool,
}

impl Consent {
    fn in_force(&self, now: DateTime<Utc>) -> bool {
        self.active && self.expires_at.is_none_or(|expiry| expiry > now)
    }
}

#[derive(Debug, Default)]
struct State {
    sessions: HashMap<String, Session>,
    consents: HashMap<String, Consent>,
}

/// A recorded `/check` decision.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CheckOutcome {
    pub check_id: String,
    pub verdict: Verdict,
}

/// A consent's id and whether it is active.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ConsentStatus {
    pub consent_id: String,
    pub active: bool,
}

pub struct Store {
    policy: Policy,
    state: Mutex<State>,
}

/// A fresh id like `gs_3f9a01c2`, unique among `taken`.
fn new_id<V>(prefix: &str, taken: &HashMap<String, V>) -> String {
    loop {
        let id = format!("{prefix}_{:08x}", rand::rng().random::<u32>());
        if !taken.contains_key(&id) {
            return id;
        }
    }
}

fn abu_dhabi_now() -> String {
    let offset = FixedOffset::east_opt(ABU_DHABI_OFFSET_SECS).expect("+04:00 is a valid offset");
    Utc::now()
        .with_timezone(&offset)
        .format("%Y-%m-%dT%H:%M:%S%:z")
        .to_string()
}

impl Store {
    pub fn new(policy: Policy) -> Store {
        Store {
            policy,
            state: Mutex::new(State::default()),
        }
    }

    pub fn policy(&self) -> &Policy {
        &self.policy
    }

    fn lock(&self) -> std::sync::MutexGuard<'_, State> {
        self.state.lock().unwrap_or_else(std::sync::PoisonError::into_inner)
    }

    /// Starts a session for one hire or company case and returns its id.
    pub fn open_session(&self, request: &SessionRequest) -> Result<String, StoreError> {
        if request.case_id.trim().is_empty() || request.case_type.trim().is_empty() {
            return Err(StoreError::InvalidRequest("case_id and case_type are required.".into()));
        }
        let mut state = self.lock();
        let id = new_id("gs", &state.sessions);
        state.sessions.insert(
            id.clone(),
            Session {
                observed: HashMap::new(),
                log: Vec::new(),
            },
        );
        Ok(id)
    }

    /// Records that the agent read these refs. Labels accumulate per ref; a ref stays derived
    /// only if every observation said so.
    pub fn observe(&self, request: &ObserveRequest) -> Result<(), StoreError> {
        let mut state = self.lock();
        let session = state
            .sessions
            .get_mut(&request.session_id)
            .ok_or(StoreError::UnknownSession)?;
        for payload in &request.payload_refs {
            match session.observed.entry(payload.r#ref.clone()) {
                Entry::Occupied(mut known) => {
                    let known = known.get_mut();
                    known.labels.extend(payload.labels.iter().copied());
                    known.derived &= payload.derived;
                }
                Entry::Vacant(slot) => {
                    slot.insert(ObservedRef {
                        labels: payload.labels.iter().copied().collect(),
                        derived: payload.derived,
                    });
                }
            }
        }
        Ok(())
    }

    /// Decides a `/check` request and appends it to the session log.
    pub fn check(&self, request: &CheckRequest) -> Result<CheckOutcome, StoreError> {
        let mut state = self.lock();
        let State { sessions, consents } = &mut *state;
        let session = sessions
            .get_mut(&request.session_id)
            .ok_or(StoreError::UnknownSession)?;
        let now = Utc::now();
        let consented = |label: DataLabel, destination: Destination| {
            consents.values().any(|consent| {
                consent.session_id == request.session_id
                    && consent.label == label
                    && consent.destination == destination
                    && consent.in_force(now)
            })
        };
        let verdict = evaluate(&self.policy, request, &session.observed, &consented);
        let check_id = loop {
            let id = format!("chk_{:08x}", rand::rng().random::<u32>());
            if session.log.iter().all(|entry| entry.check_id != id) {
                break id;
            }
        };
        session.log.push(LogEntry {
            check_id: check_id.clone(),
            at: abu_dhabi_now(),
            tool: request.tool.clone(),
            destination: request.destination,
            decision: verdict.decision,
            reason: verdict.reason.clone(),
            policy_rule: verdict.policy_rule.clone(),
        });
        Ok(CheckOutcome { check_id, verdict })
    }

    /// Grants consent for exactly one label and destination in one session. Only cells whose
    /// effect is `consent` can be granted; granting an already active consent returns it.
    pub fn grant_consent(&self, request: &ConsentRequest) -> Result<ConsentStatus, StoreError> {
        if request.granted_by != "newcomer" {
            return Err(StoreError::InvalidRequest(
                "Only the newcomer can grant consent.".into(),
            ));
        }
        if self.policy.effect(request.label, request.destination) != Effect::Consent {
            return Err(StoreError::InvalidRequest(
                "This data cannot be shared with this destination, even with consent.".into(),
            ));
        }
        let expires_at = request
            .expires_at
            .as_deref()
            .map(DateTime::parse_from_rfc3339)
            .transpose()
            .map_err(|_| StoreError::InvalidRequest("expires_at must be an RFC 3339 timestamp or null.".into()))?;
        let now = Utc::now();
        if expires_at.is_some_and(|expiry| expiry <= now) {
            return Err(StoreError::InvalidRequest("expires_at must be in the future.".into()));
        }

        let mut state = self.lock();
        if !state.sessions.contains_key(&request.session_id) {
            return Err(StoreError::UnknownSession);
        }
        let existing = state.consents.iter().find(|(_, consent)| {
            consent.session_id == request.session_id
                && consent.label == request.label
                && consent.destination == request.destination
                && consent.expires_at == expires_at
                && consent.in_force(now)
        });
        if let Some((id, _)) = existing {
            return Ok(ConsentStatus {
                consent_id: id.clone(),
                active: true,
            });
        }
        let id = new_id("cns", &state.consents);
        state.consents.insert(
            id.clone(),
            Consent {
                session_id: request.session_id.clone(),
                label: request.label,
                destination: request.destination,
                expires_at,
                active: true,
            },
        );
        Ok(ConsentStatus {
            consent_id: id,
            active: true,
        })
    }

    /// Revokes a consent immediately. Revoking twice is harmless.
    pub fn revoke_consent(&self, consent_id: &str) -> Result<ConsentStatus, StoreError> {
        let mut state = self.lock();
        let consent = state.consents.get_mut(consent_id).ok_or(StoreError::ConsentNotFound)?;
        consent.active = false;
        Ok(ConsentStatus {
            consent_id: consent_id.to_string(),
            active: false,
        })
    }

    /// Every decision in the session, newest first.
    pub fn log(&self, session_id: &str) -> Result<Vec<LogEntry>, StoreError> {
        let state = self.lock();
        let session = state.sessions.get(session_id).ok_or(StoreError::UnknownSession)?;
        Ok(session.log.iter().rev().cloned().collect())
    }

    /// Clears all sessions, consents and logs (demo reset).
    pub fn reset(&self) {
        *self.lock() = State::default();
    }
}
