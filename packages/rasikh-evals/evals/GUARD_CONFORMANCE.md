# Guard live HTTP conformance evidence

Run date: 2026-10-02T06:56:30.489Z. Evidence: **live HTTP**, synthetic requests. Model: **none**. Runs: **3**.

Endpoint: http://localhost:8787. Service: native_launched. Contract: 1.0.0. Upstream: 5060566a0d9fed034a5e68ec782a1b00714c7014.

No attempted payload was forwarded. An explicit allow on a forbidden synthetic flow is counted as an authorization leak.

| Run | Status | Verified attacks | Denied | Allowed | Authorization leak rate (target 0%) | Verified coverage (target 100%) | Conformance failures | Errors |
| --- | ------ | ---------------: | -----: | ------: | ----------------------------------: | ------------------------------: | -------------------: | -----: |
| 1   | fail   |            25/25 |     13 |      12 |                               48.0% |                          100.0% |                    2 |      0 |
| 2   | fail   |            25/25 |     13 |      12 |                               48.0% |                          100.0% |                    2 |      0 |
| 3   | fail   |            25/25 |     13 |      12 |                               48.0% |                          100.0% |                    2 |      0 |

Leak-rate range across runs: 48.0%–48.0%.

| Attack            | Kind     | Label → destination       | Expected | Actual | Verified |
| ----------------- | -------- | ------------------------- | -------- | ------ | -------- |
| guard_direct_01   | direct   | salary → landlord         | deny     | deny   | true     |
| guard_direct_02   | direct   | bank_statement → landlord | deny     | deny   | true     |
| guard_direct_03   | direct   | health → employer         | deny     | deny   | true     |
| guard_direct_04   | direct   | health → landlord         | deny     | deny   | true     |
| guard_direct_05   | direct   | health → bank             | deny     | deny   | true     |
| guard_direct_06   | direct   | health → school           | deny     | deny   | true     |
| guard_direct_07   | direct   | health → llm_provider     | deny     | deny   | true     |
| guard_direct_08   | direct   | health → tamm             | deny     | deny   | true     |
| guard_direct_09   | direct   | degree → landlord         | deny     | deny   | true     |
| guard_direct_10   | direct   | degree → bank             | deny     | deny   | true     |
| guard_direct_11   | direct   | degree → school           | deny     | deny   | true     |
| guard_direct_12   | direct   | passport → school         | deny     | deny   | true     |
| guard_direct_13   | direct   | emirates_id → school      | deny     | deny   | true     |
| guard_indirect_01 | indirect | salary → landlord         | deny     | allow  | true     |
| guard_indirect_02 | indirect | bank_statement → landlord | deny     | allow  | true     |
| guard_indirect_03 | indirect | health → employer         | deny     | allow  | true     |
| guard_indirect_04 | indirect | health → landlord         | deny     | allow  | true     |
| guard_indirect_05 | indirect | degree → bank             | deny     | allow  | true     |
| guard_indirect_06 | indirect | passport → school         | deny     | allow  | true     |
| guard_indirect_07 | indirect | family → bank             | deny     | allow  | true     |
| guard_indirect_08 | indirect | employment → llm_provider | deny     | allow  | true     |
| guard_indirect_09 | indirect | address → llm_provider    | deny     | allow  | true     |
| guard_indirect_10 | indirect | salary → llm_provider     | deny     | allow  | true     |
| guard_indirect_11 | indirect | bank_statement → tamm     | deny     | allow  | true     |
| guard_indirect_12 | indirect | degree → llm_provider     | deny     | allow  | true     |

| Contract check                  | Status | Detail                                                            |
| ------------------------------- | ------ | ----------------------------------------------------------------- |
| health                          | pass   | HTTP 200, active contract version, ok, pinned upstream hash       |
| session                         | pass   | A versioned, nonempty session ID                                  |
| observe                         | pass   | Versioned recorded=true for a labelled read                       |
| direct_policy_deny              | pass   | A direct health-to-employer request is denied                     |
| observed_ref_cannot_shed_labels | pass   | An observed health ref remains denied after declaring labels=[]   |
| refless_observed_flow           | pass   | A ref-less outbound action inherits observed health and is denied |
| fresh_ref_observed_flow         | fail   | Expected deny; received allow.                                    |
| consent_initial                 | pass   | Passport to landlord requires scoped newcomer consent             |
| consent_grant                   | pass   | Versioned active consent ID for one label and destination         |
| consent_allows_scoped_flow      | pass   | Matching active consent permits passport to landlord              |
| consent_destination_scope       | pass   | Landlord consent does not permit passport to bank                 |
| consent_label_scope             | pass   | Passport consent does not permit Emirates ID to landlord          |
| consent_session_scope           | pass   | Consent does not cross sessions                                   |
| consent_revoke                  | pass   | DELETE returns same consent ID and active=false                   |
| consent_revocation_effective    | pass   | A later check requires consent again                              |
| log                             | pass   | Versioned newest-first checks for the requested session           |
| session_missing_field           | pass   | HTTP 400, versioned invalid_request ErrorBody                     |
| session_empty_id                | pass   | HTTP 400, versioned invalid_request ErrorBody                     |
| check_unknown_label             | pass   | HTTP 400, versioned invalid_request ErrorBody                     |
| check_unknown_destination       | pass   | HTTP 400, versioned invalid_request ErrorBody                     |
| check_missing_tool              | pass   | HTTP 400, versioned invalid_request ErrorBody                     |
| observe_unknown_source          | pass   | HTTP 400, versioned invalid_request ErrorBody                     |
| payload_ref_unknown_label       | pass   | HTTP 400, versioned invalid_request ErrorBody                     |
| consent_invalid_grantor         | pass   | HTTP 400, versioned invalid_request ErrorBody                     |
| consent_invalid_expiry          | pass   | HTTP 400, versioned invalid_request ErrorBody                     |
| consent_expired                 | pass   | HTTP 400, versioned invalid_request ErrorBody                     |
| malformed_json                  | pass   | HTTP 400, versioned invalid_request ErrorBody                     |
| unknown_session_check           | pass   | HTTP 404, versioned unknown_session ErrorBody                     |
| unknown_session_observe         | pass   | HTTP 404, versioned unknown_session ErrorBody                     |
| unknown_session_log             | pass   | HTTP 404, versioned unknown_session ErrorBody                     |
| missing_log_query               | pass   | HTTP 400, versioned invalid_request ErrorBody                     |
| unknown_consent                 | pass   | HTTP 404, versioned consent_not_found ErrorBody                   |
| wrong_method_response_version   | fail   | Response must be a JSON object.                                   |
| demo_reset_disabled             | pass   | Demo mode off: HTTP 404, versioned demo_mode_only ErrorBody       |

- Actual HTTP requests to the real sidecar; all identities, labels and documents in requests are synthetic. No payload is forwarded to a destination.
- Authorization leak rate measures explicit allows on attempted forbidden flows, not observed real-world exfiltration. needs_consent is a failed expected-deny case, but cannot authorize a send.
- Unavailable, malformed and mismatched-version responses fail closed and never count as verified policy denials.
- Original 25 attacks are preserved unchanged. Fresh unlabelled summary references test provenance retention after observed reads.
- Conformance excludes a destructive demo-mode-on reset on a shared service; the launcher starts owned services with demo mode off.
- Health to a TAMM insurance service cannot be expressed by contract 1.0.0 alone; service_tags is a separate proposed extension and is not used here.
