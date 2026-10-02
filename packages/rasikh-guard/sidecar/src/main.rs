//! `rasikh-guard` binary: serves the Guard sidecar.
//!
//! Environment:
//! - `RASIKH_GUARD_BIND` (default `127.0.0.1:8787,[::1]:8787`): comma-separated listen addresses.
//!   Both loopbacks by default, because clients resolving `localhost` to `::1` first would otherwise
//!   pay a ~200 ms fallback per call. Use `0.0.0.0:8787` in containers.
//! - `RASIKH_GUARD_POLICY` (optional): path to a policy TOML; defaults to the compiled-in `policies/rasikh.toml`.
//! - `RASIKH_DEMO_MODE=1`: enables `POST /dev/reset`.

use std::sync::Arc;

use rasikh_guard::http::{App, router};
use rasikh_guard::policy::Policy;
use rasikh_guard::store::Store;
use tokio::net::TcpListener;

const DEFAULT_BIND: &str = "127.0.0.1:8787,[::1]:8787";

fn load_policy() -> Policy {
    match std::env::var("RASIKH_GUARD_POLICY") {
        Ok(path) => {
            let text =
                std::fs::read_to_string(&path).unwrap_or_else(|error| panic!("cannot read policy {path}: {error}"));
            Policy::from_toml_str(&text).unwrap_or_else(|error| panic!("invalid policy {path}: {error}"))
        }
        Err(_) => Policy::default_policy(),
    }
}

/// Binds every address that can be bound; at least one must succeed.
async fn bind_all(addresses: &str) -> Vec<TcpListener> {
    let mut listeners = Vec::new();
    for address in addresses.split(',').map(str::trim).filter(|a| !a.is_empty()) {
        match TcpListener::bind(address).await {
            Ok(listener) => {
                eprintln!("[rasikh-guard] listening on http://{address}");
                listeners.push(listener);
            }
            Err(error) => eprintln!("[rasikh-guard] skipping {address}: {error}"),
        }
    }
    assert!(!listeners.is_empty(), "could not bind any of {addresses}");
    listeners
}

#[tokio::main]
async fn main() {
    let bind = std::env::var("RASIKH_GUARD_BIND").unwrap_or_else(|_| DEFAULT_BIND.to_string());
    let demo_mode = std::env::var("RASIKH_DEMO_MODE").is_ok_and(|value| value == "1");
    let app = router(Arc::new(App {
        store: Store::new(load_policy()),
        demo_mode,
    }));
    eprintln!("[rasikh-guard] demo mode {}", if demo_mode { "on" } else { "off" });

    let mut servers = tokio::task::JoinSet::new();
    for listener in bind_all(&bind).await {
        let app = app.clone();
        servers.spawn(async move {
            axum::serve(listener, app)
                .with_graceful_shutdown(async {
                    let _ = tokio::signal::ctrl_c().await;
                })
                .await
        });
    }
    while let Some(result) = servers.join_next().await {
        result
            .expect("server task does not panic")
            .expect("server runs until shutdown");
    }
}
