//! HTTP sidecar: the endpoints of INTEGRATION.md section 3.3. Every response carries
//! `contract_version`; every error uses the contract's `ErrorBody`.

use std::sync::Arc;

use axum::extract::rejection::{JsonRejection, QueryRejection};
use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::routing::{delete, get, post};
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::{Value, json};

use crate::UPSTREAM_COMMIT;
use crate::contract::{CONTRACT_VERSION, CheckRequest, ConsentRequest, ObserveRequest, SessionRequest};
use crate::store::{Store, StoreError};

/// Shared state for all handlers.
pub struct App {
    pub store: Store,
    /// `RASIKH_DEMO_MODE=1`: enables `POST /dev/reset`.
    pub demo_mode: bool,
}

/// A contract error: HTTP status plus `ErrorBody`.
#[derive(Debug)]
pub struct ApiError {
    status: StatusCode,
    code: &'static str,
    message: String,
}

impl ApiError {
    fn new(status: StatusCode, code: &'static str, message: impl Into<String>) -> ApiError {
        ApiError {
            status,
            code,
            message: message.into(),
        }
    }

    fn invalid(message: impl Into<String>) -> ApiError {
        ApiError::new(StatusCode::BAD_REQUEST, "invalid_request", message)
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let body =
            json!({ "contract_version": CONTRACT_VERSION, "error": { "code": self.code, "message": self.message } });
        (self.status, Json(body)).into_response()
    }
}

impl From<StoreError> for ApiError {
    fn from(error: StoreError) -> ApiError {
        match error {
            StoreError::UnknownSession => {
                ApiError::new(StatusCode::NOT_FOUND, "unknown_session", "Guard session not found.")
            }
            StoreError::ConsentNotFound => {
                ApiError::new(StatusCode::NOT_FOUND, "consent_not_found", "Consent not found.")
            }
            StoreError::InvalidRequest(message) => ApiError::invalid(message),
        }
    }
}

impl From<JsonRejection> for ApiError {
    fn from(rejection: JsonRejection) -> ApiError {
        ApiError::invalid(format!("Malformed request body: {}", rejection.body_text()))
    }
}

impl From<QueryRejection> for ApiError {
    fn from(rejection: QueryRejection) -> ApiError {
        ApiError::invalid(format!("Malformed query: {}", rejection.body_text()))
    }
}

type ApiResult = Result<Json<Value>, ApiError>;
type Shared = State<Arc<App>>;

/// Builds the router for the sidecar.
pub fn router(app: Arc<App>) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/session", post(open_session))
        .route("/observe", post(observe))
        .route("/check", post(check))
        .route("/consent", post(grant_consent))
        .route("/consent/{consent_id}", delete(revoke_consent))
        .route("/log", get(log))
        .route("/dev/reset", post(dev_reset))
        .fallback(|| async { ApiError::new(StatusCode::NOT_FOUND, "invalid_request", "No such route.") })
        .method_not_allowed_fallback(|| async {
            ApiError::new(
                StatusCode::METHOD_NOT_ALLOWED,
                "invalid_request",
                "Method not allowed on this route.",
            )
        })
        .with_state(app)
}

async fn health() -> Json<Value> {
    Json(json!({ "contract_version": CONTRACT_VERSION, "status": "ok", "upstream_commit": UPSTREAM_COMMIT }))
}

async fn open_session(State(app): Shared, body: Result<Json<SessionRequest>, JsonRejection>) -> ApiResult {
    let session_id = app.store.open_session(&body?.0)?;
    Ok(Json(
        json!({ "contract_version": CONTRACT_VERSION, "session_id": session_id }),
    ))
}

async fn observe(State(app): Shared, body: Result<Json<ObserveRequest>, JsonRejection>) -> ApiResult {
    app.store.observe(&body?.0)?;
    Ok(Json(json!({ "contract_version": CONTRACT_VERSION, "recorded": true })))
}

async fn check(State(app): Shared, body: Result<Json<CheckRequest>, JsonRejection>) -> ApiResult {
    let outcome = app.store.check(&body?.0)?;
    let verdict = outcome.verdict;
    let mut response = json!({
        "contract_version": CONTRACT_VERSION,
        "check_id": outcome.check_id,
        "decision": verdict.decision,
        "reason": verdict.reason,
        "policy_rule": verdict.policy_rule,
        "blocked_labels": verdict.blocked_labels,
    });
    if let Some(consent_request) = verdict.consent_request {
        response["consent_request"] = json!(consent_request);
    }
    Ok(Json(response))
}

async fn grant_consent(State(app): Shared, body: Result<Json<ConsentRequest>, JsonRejection>) -> ApiResult {
    let status = app.store.grant_consent(&body?.0)?;
    Ok(Json(
        json!({ "contract_version": CONTRACT_VERSION, "consent_id": status.consent_id, "active": status.active }),
    ))
}

async fn revoke_consent(State(app): Shared, Path(consent_id): Path<String>) -> ApiResult {
    let status = app.store.revoke_consent(&consent_id)?;
    Ok(Json(
        json!({ "contract_version": CONTRACT_VERSION, "consent_id": status.consent_id, "active": status.active }),
    ))
}

#[derive(Deserialize)]
struct LogQuery {
    session_id: String,
}

async fn log(State(app): Shared, query: Result<Query<LogQuery>, QueryRejection>) -> ApiResult {
    let entries = app.store.log(&query?.0.session_id)?;
    Ok(Json(
        json!({ "contract_version": CONTRACT_VERSION, "entries": entries }),
    ))
}

async fn dev_reset(State(app): Shared) -> ApiResult {
    if !app.demo_mode {
        return Err(ApiError::new(
            StatusCode::NOT_FOUND,
            "demo_mode_only",
            "Set RASIKH_DEMO_MODE=1 to use /dev/reset.",
        ));
    }
    app.store.reset();
    Ok(Json(json!({ "contract_version": CONTRACT_VERSION, "reset": true })))
}
