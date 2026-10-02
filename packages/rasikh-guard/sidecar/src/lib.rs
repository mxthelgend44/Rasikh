//! Rasikh Guard: decides whether the Rasikh agent may send a newcomer's labelled data to a
//! destination, and serves that decision over HTTP (INTEGRATION.md section 3).
//!
//! - [`policy`]: the label x destination matrix, loaded from `policies/rasikh.toml`.
//! - [`decide`]: pure decision core, including what observed data can flow into a call.
//! - [`store`]: sessions, observations, consents and the decision log.
//! - [`http`]: the sidecar endpoints.
//!
//! Built in the OpenAPPA fork (`vendor/`, see `UPSTREAM.md`). This layer does not call the
//! vendored engine yet; see the package README for the status of that integration.

pub mod contract;
pub mod decide;
pub mod http;
pub mod policy;
pub mod store;

/// The OpenAPPA commit vendored under `vendor/`, reported by `GET /health`.
pub const UPSTREAM_COMMIT: &str = "5060566a0d9fed034a5e68ec782a1b00714c7014";
