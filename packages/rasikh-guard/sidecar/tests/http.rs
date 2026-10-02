//! The sidecar endpoints of INTEGRATION.md 3.3, driven through the router.

use std::sync::Arc;

use axum::Router;
use axum::body::Body;
use axum::http::{Method, Request, StatusCode};
use http_body_util::BodyExt;
use rasikh_guard::UPSTREAM_COMMIT;
use rasikh_guard::http::{App, router};
use rasikh_guard::policy::Policy;
use rasikh_guard::store::Store;
use serde_json::{Value, json};
use tower::ServiceExt;

fn app(demo_mode: bool) -> Router {
    router(Arc::new(App {
        store: Store::new(Policy::default_policy()),
        demo_mode,
    }))
}

async fn call(app: &Router, method: Method, uri: &str, body: Option<Value>) -> (StatusCode, Value) {
    let request = Request::builder()
        .method(method)
        .uri(uri)
        .header("content-type", "application/json")
        .body(body.map_or_else(Body::empty, |body| Body::from(body.to_string())))
        .expect("valid request");
    let response = app.clone().oneshot(request).await.expect("router answers");
    let status = response.status();
    let bytes = response.into_body().collect().await.expect("body").to_bytes();
    (status, serde_json::from_slice(&bytes).expect("JSON body"))
}

async fn open_session(app: &Router) -> String {
    let (status, body) = call(
        app,
        Method::POST,
        "/session",
        Some(json!({ "case_id": "hire_demo_001", "case_type": "hire" })),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    body["session_id"].as_str().expect("session id").to_string()
}

fn rental_check(session_id: &str) -> Value {
    json!({
        "session_id": session_id,
        "tool": "submit_rental_application",
        "destination": "landlord",
        "data_labels": ["employment", "passport"],
        "payload_refs": [
            { "ref": "employment_letter_hire_demo_001", "labels": ["employment"] },
            { "ref": "doc_passport_hire_demo_001", "labels": ["passport"] }
        ]
    })
}

#[tokio::test]
async fn health_reports_version_and_upstream_commit() {
    let (status, body) = call(&app(false), Method::GET, "/health", None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(
        body,
        json!({ "contract_version": "1.0.0", "status": "ok", "upstream_commit": UPSTREAM_COMMIT })
    );
}

#[tokio::test]
async fn contract_example_flow_check_consent_revoke_log() {
    let app = app(false);
    let sid = open_session(&app).await;
    assert!(sid.starts_with("gs_"));

    let (status, observed) = call(
        &app,
        Method::POST,
        "/observe",
        Some(json!({ "session_id": sid, "source": "newcomer",
                     "payload_refs": [{ "ref": "doc_passport_hire_demo_001", "labels": ["passport"] }] })),
    )
    .await;
    assert_eq!(
        (status, observed),
        (StatusCode::OK, json!({ "contract_version": "1.0.0", "recorded": true }))
    );

    let (_, first) = call(&app, Method::POST, "/check", Some(rental_check(&sid))).await;
    assert_eq!(first["decision"], "needs_consent");
    assert_eq!(first["reason"], "Your passport has not been shared with landlords yet.");
    assert_eq!(first["policy_rule"], "passport.landlord.requires_consent");
    assert_eq!(first["blocked_labels"], json!(["passport"]));
    assert_eq!(
        first["consent_request"],
        json!({ "label": "passport", "destination": "landlord" })
    );

    let (_, consent) = call(
        &app,
        Method::POST,
        "/consent",
        Some(
            json!({ "session_id": sid, "label": "passport", "destination": "landlord",
                     "granted_by": "newcomer", "expires_at": null }),
        ),
    )
    .await;
    assert_eq!(consent["active"], true);
    let consent_id = consent["consent_id"].as_str().expect("consent id").to_string();

    let (_, allowed) = call(&app, Method::POST, "/check", Some(rental_check(&sid))).await;
    assert_eq!(allowed["decision"], "allow");
    assert_eq!(allowed["blocked_labels"], json!([]));
    assert!(
        allowed.get("consent_request").is_none(),
        "consent_request only on needs_consent"
    );

    let (_, revoked) = call(&app, Method::DELETE, &format!("/consent/{consent_id}"), None).await;
    assert_eq!(
        revoked,
        json!({ "contract_version": "1.0.0", "consent_id": consent_id, "active": false })
    );
    let (_, again) = call(&app, Method::POST, "/check", Some(rental_check(&sid))).await;
    assert_eq!(again["decision"], "needs_consent");

    let (status, log) = call(&app, Method::GET, &format!("/log?session_id={sid}"), None).await;
    assert_eq!(status, StatusCode::OK);
    let entries = log["entries"].as_array().expect("entries");
    let decisions: Vec<&str> = entries
        .iter()
        .map(|entry| entry["decision"].as_str().unwrap())
        .collect();
    assert_eq!(decisions, ["needs_consent", "allow", "needs_consent"], "newest first");
    assert_eq!(entries[0]["check_id"], again["check_id"]);
    assert_eq!(entries[0]["tool"], "submit_rental_application");
    assert_eq!(entries[0]["destination"], "landlord");
    assert!(entries[0]["at"].as_str().unwrap().ends_with("+04:00"));
}

#[tokio::test]
async fn errors_use_contract_codes() {
    let app = app(false);
    let (status, body) = call(&app, Method::POST, "/check", Some(rental_check("gs_missing"))).await;
    assert_eq!(
        (status, &body["error"]["code"]),
        (StatusCode::NOT_FOUND, &json!("unknown_session"))
    );
    assert_eq!(body["contract_version"], "1.0.0");

    let (status, body) = call(&app, Method::DELETE, "/consent/cns_missing", None).await;
    assert_eq!(
        (status, &body["error"]["code"]),
        (StatusCode::NOT_FOUND, &json!("consent_not_found"))
    );

    let (status, body) = call(&app, Method::GET, "/log?session_id=gs_missing", None).await;
    assert_eq!(
        (status, &body["error"]["code"]),
        (StatusCode::NOT_FOUND, &json!("unknown_session"))
    );

    let sid = open_session(&app).await;
    let mut bad = rental_check(&sid);
    bad["destination"] = json!("neighbour");
    let (status, body) = call(&app, Method::POST, "/check", Some(bad)).await;
    assert_eq!(
        (status, &body["error"]["code"]),
        (StatusCode::BAD_REQUEST, &json!("invalid_request"))
    );

    let (status, body) = call(
        &app,
        Method::POST,
        "/consent",
        Some(json!({ "session_id": sid, "label": "passport", "destination": "school",
                     "granted_by": "newcomer", "expires_at": null })),
    )
    .await;
    assert_eq!(
        (status, &body["error"]["code"]),
        (StatusCode::BAD_REQUEST, &json!("invalid_request"))
    );
}

#[tokio::test]
async fn dev_reset_only_in_demo_mode() {
    let (status, body) = call(&app(false), Method::POST, "/dev/reset", None).await;
    assert_eq!(
        (status, &body["error"]["code"]),
        (StatusCode::NOT_FOUND, &json!("demo_mode_only"))
    );

    let demo = app(true);
    let sid = open_session(&demo).await;
    let (status, _) = call(&demo, Method::POST, "/dev/reset", None).await;
    assert_eq!(status, StatusCode::OK);
    let (status, _) = call(&demo, Method::GET, &format!("/log?session_id={sid}"), None).await;
    assert_eq!(status, StatusCode::NOT_FOUND, "reset clears sessions");
}

#[tokio::test]
async fn tamm_service_tags_unlock_health_for_insurance() {
    let app = app(false);
    let sid = open_session(&app).await;
    let check = |tags: Value| {
        json!({ "session_id": sid, "tool": "start_application", "destination": "tamm",
                "data_labels": ["health"], "payload_refs": [{ "ref": "doc_medical", "labels": ["health"] }],
                "service_tags": tags })
    };
    let (_, insurance) = call(
        &app,
        Method::POST,
        "/check",
        Some(check(json!(["health", "insurance"]))),
    )
    .await;
    assert_eq!(insurance["decision"], "allow");
    let (_, housing) = call(&app, Method::POST, "/check", Some(check(json!(["housing"])))).await;
    assert_eq!(housing["decision"], "deny");
    assert_eq!(
        housing["reason"],
        "Health details can only be shared for insurance services."
    );
}
