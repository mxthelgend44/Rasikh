//! Rasikh Guard: decides whether the Rasikh agent may send a newcomer's labelled data to a
//! destination, and serves that decision over HTTP (INTEGRATION.md section 3).
//!
//! - [`policy`]: the label x destination matrix, loaded from `policies/rasikh.toml`.
//! - [`decide`]: pure decision core, including what observed data can flow into a call.
//! - [`store`]: sessions, observations, consents and the decision log.
//! - [`http`]: the sidecar endpoints.
//!
//! - [`appa`]: the gate. Every allow is decided by the vendored OpenAPPA engine's label algebra
//!   (`appa_engine::label`): the restrictive meet of each flowing label's reachable audience.
//!
//! Built in the OpenAPPA fork (`vendor/`, see `UPSTREAM.md`).

pub mod appa;
pub mod contract;
pub mod decide;
pub mod http;
pub mod policy;
pub mod store;

/// The OpenAPPA commit vendored under `vendor/`, reported by `GET /health`.
pub const UPSTREAM_COMMIT: &str = "5060566a0d9fed034a5e68ec782a1b00714c7014";
