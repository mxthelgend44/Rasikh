# INTEGRATION.md

Contract version: **1.2.0**
Status: active

This file is the single source of truth for how the three parts of Rasikh talk to each other. Every agent working on this repo builds against it exactly.

| Part | Path | Owner |
|---|---|---|
| Web app and agent | `apps/web` | Claude |
| Shared types | `packages/shared` | Claude (Devin may propose changes) |
| Rasikh Guard (OpenAPPA fork, sidecar) | `packages/rasikh-guard` | Devin |
| TAMM MCP server | `packages/tamm-mcp` | Devin |
| Firestore data layer (schema, converters, rules, indexes) | `packages/rasikh-data` | Devin |

## 0. Rules for changing this contract

1. Nobody changes this file silently. A change is a PR that edits only this file, explains why, and bumps the version (patch for clarifications, minor for additive changes, major for breaking changes).
2. Until a change is merged, everyone keeps building against the current version.
3. Every response from every service includes `contract_version`. The app logs a warning if versions differ.

## 1. Repo layout

```
apps/web                  Next.js app: newcomer, employer, expansion, landlord, bank surfaces + agent
packages/shared           TypeScript types and enums used by everything below
packages/rasikh-guard     OpenAPPA fork + Rasikh policies + HTTP sidecar
packages/tamm-mcp         MCP server over a mocked TAMM service catalogue
packages/rasikh-data      Firestore schema, typed converters, security rules and indexes
```

## 2. Shared types (`packages/shared`)

These enums are closed. Adding a value is a minor version bump.

```ts
export type DataLabel =
  | "passport"
  | "emirates_id"
  | "salary"
  | "bank_statement"
  | "employment"
  | "family"
  | "address"
  | "degree"
  | "health";

export type Destination =
  | "tamm"
  | "employer"
  | "landlord"
  | "bank"
  | "school"
  | "llm_provider"
  | "newcomer";

export type GuardDecision = "allow" | "deny" | "needs_consent";

export type Audience = "individual" | "business";

export type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "needs_info"
  | "approved"
  | "rejected";

export interface PayloadRef {
  ref: string;          // stable id of the data item, e.g. "doc_passport_hire_demo_001"
  labels: DataLabel[];  // every label that applies to this item
  derived?: boolean;    // true if this is a derived signal, e.g. affordability yes/no
}

export interface ErrorBody {
  contract_version: string;
  error: {
    code: string;       // see section 6
    message: string;    // plain language, safe to show in logs
  };
}
```

## 3. Rasikh Guard sidecar

### 3.1 Basics

- Base URL from env `RASIKH_GUARD_URL`, default `http://localhost:8787`
- JSON over HTTP, UTF-8
- **Fail closed:** if Guard is unreachable or returns an error, the caller treats the action as `deny`. No tool call proceeds without an explicit `allow`.
- Latency target: p95 under 50 ms for `/check`

### 3.2 How the agent uses Guard

Guard tracks what the agent has read so it can catch indirect leaks (for example, reading a passport and then writing a "summary" to a landlord). So the app reports reads, not just writes.

For every agent step:

1. When the agent **reads** labelled data, call `POST /observe`.
2. Before the agent **sends** anything to any destination (including the LLM provider), call `POST /check`.
3. Proceed only on `allow`. On `needs_consent`, show the consent prompt in the newcomer app. On `deny`, show the reason and stop that action.

### 3.3 Endpoints

#### `GET /health`

```json
{ "contract_version": "1.0.0", "status": "ok", "upstream_commit": "<pinned OpenAPPA hash>" }
```

#### `POST /session`

Starts a Guard session for one hire or one company expansion case.

Request:
```json
{ "case_id": "hire_demo_001", "case_type": "hire" }
```
Response:
```json
{ "contract_version": "1.0.0", "session_id": "gs_8f2a1c" }
```

#### `POST /observe`

Records that the agent has read labelled data in this session.

Request:
```json
{
  "session_id": "gs_8f2a1c",
  "source": "newcomer",
  "payload_refs": [
    { "ref": "doc_passport_hire_demo_001", "labels": ["passport"] }
  ]
}
```
Response:
```json
{ "contract_version": "1.0.0", "recorded": true }
```

#### `POST /check`

Asks whether an outbound action is allowed.

Request:
```json
{
  "session_id": "gs_8f2a1c",
  "tool": "submit_rental_application",
  "destination": "landlord",
  "data_labels": ["employment", "passport"],
  "payload_refs": [
    { "ref": "employment_letter_hire_demo_001", "labels": ["employment"] },
    { "ref": "doc_passport_hire_demo_001", "labels": ["passport"] }
  ]
}
```

Response:
```json
{
  "contract_version": "1.0.0",
  "check_id": "chk_19b0",
  "decision": "needs_consent",
  "reason": "Your passport has not been shared with landlords yet.",
  "policy_rule": "passport.landlord.requires_consent",
  "blocked_labels": ["passport"],
  "consent_request": {
    "label": "passport",
    "destination": "landlord"
  }
}
```

Additional response fields since 1.2.0 (example for the request above):
```json
{
  "remedy": {
    "steps": [{ "action": "grant_consent", "label": "passport", "destination": "landlord" }],
    "verified": true
  },
  "allowed_destinations": ["tamm", "employer", "newcomer"]
}
```

Field rules:
- `reason` is plain language and is shown to users as is. No jargon, no rule ids in it.
- `policy_rule` is the stable id of the matched rule, shown only in the Guard log.
- `blocked_labels` lists only the labels that caused a non-allow decision.
- `consent_request` is present only when `decision` is `needs_consent`.
- Guard evaluates `data_labels` **plus** everything observed in the session that could flow into this call. Declaring fewer labels than were read does not make a leak pass.
- A payload ref that was observed carries its observed labels and `derived` flag. A payload ref that was **never observed**, or a call with no payload refs, is treated as content the agent produced: everything observed in the session flows into it, and an unobserved `derived: true` is ignored. So the app must `POST /observe` every redacted ref and every derived signal it creates before the agent sends it.
- `remedy` (added in 1.2.0, present only when `decision` is not `allow`): the smallest set of steps that would make this call allowed, or `null` if none exists. `verified: true` means Guard re-evaluated the call with every step applied and got `allow`. Step `action` is one of:
  - `grant_consent` (`label`, `destination`): the newcomer grants consent. Only offered for `consent` cells.
  - `send_derived_signal` (`label`): send an observed derived signal (e.g. affordability yes/no) instead of the raw data.
  - `redact` (`label`): send an observed redacted ref without this label.
  - `use_tool` (`label`, `tool`): this label may only go to this destination through `tool` (e.g. `extract_document`).
  - `remove_label` (`label`): leave this data out. Always possible; offered when nothing better exists.
- `allowed_destinations` (added in 1.2.0): every destination the same payload could be sent to as it stands, in section 2 order. Lets the agent pick a different route instead of stopping.
- `service_tags` (optional, added in 1.1.0): tags of the TAMM service the call targets, for example `["health", "insurance"]`. TAMM MCP sends it on every `destination: "tamm"` check. Guard needs it for the "insurance services only" rule in 3.4; when it is absent, that rule denies.

#### `POST /consent`

Grants consent from the newcomer's trust passport. Scoped to exactly one label and one destination.

Request:
```json
{
  "session_id": "gs_8f2a1c",
  "label": "passport",
  "destination": "landlord",
  "granted_by": "newcomer",
  "expires_at": null
}
```
Response:
```json
{ "contract_version": "1.0.0", "consent_id": "cns_44d1", "active": true }
```

#### `DELETE /consent/{consent_id}`

Revokes consent immediately. Later checks that relied on it return `needs_consent` again.

```json
{ "contract_version": "1.0.0", "consent_id": "cns_44d1", "active": false }
```

#### `GET /log?session_id=gs_8f2a1c`

Feeds the Guard log view. Newest first.

```json
{
  "contract_version": "1.0.0",
  "entries": [
    {
      "check_id": "chk_19b0",
      "at": "2026-10-10T09:41:12+04:00",
      "tool": "submit_rental_application",
      "destination": "landlord",
      "decision": "needs_consent",
      "reason": "Your passport has not been shared with landlords yet.",
      "policy_rule": "passport.landlord.requires_consent"
    }
  ]
}
```

#### `POST /dev/reset`

Demo mode only (`RASIKH_DEMO_MODE=1`). Clears all sessions, consents and logs. Returns `404` when demo mode is off.

### 3.4 Default policy

Product defaults for the demo. They are not legal statements and the policy file says so in comments.

| Label | tamm | employer | landlord | bank | school | llm_provider | newcomer |
|---|---|---|---|---|---|---|---|
| passport | allow | allow | consent | consent | deny | extraction only | allow |
| emirates_id | allow | allow | consent | consent | deny | extraction only | allow |
| salary | allow | allow | derived signal only | consent | deny | redacted | allow |
| bank_statement | deny | deny | derived signal only | consent | deny | extraction only | allow |
| employment | allow | allow | allow | allow | deny | redacted | allow |
| family | allow | allow | consent | deny | consent | redacted | allow |
| address | allow | allow | allow | consent | consent | redacted | allow |
| degree | allow | allow | deny | deny | deny | extraction only | allow |
| health | insurance services only | deny | deny | deny | deny | deny | allow |

Meaning of the special cells:
- **consent:** returns `needs_consent` until a matching `/consent` exists.
- **derived signal only:** raw values are denied. A payload ref with `derived: true` (for example "affordability: yes") is allowed, if the app observed it as derived.
- **extraction only:** allowed only when `tool` is `extract_document`. Any other tool sending this label to `llm_provider` is denied.
- **redacted:** allowed only if the payload ref has the label removed by the app's redaction step (the app observes and then sends the redacted ref, whose `labels` no longer include it). Unredacted is denied.
- **insurance services only:** allowed only when `tool` is `start_application` and the TAMM service is tagged `insurance`.

## 4. TAMM MCP server

### 4.1 Basics

- MCP server built with the official TypeScript MCP SDK
- Transports: stdio for local dev, Streamable HTTP for the app. HTTP base URL from env `TAMM_MCP_URL`, default `http://localhost:8790/mcp`
- There is no public TAMM API in use. Everything is served from a mocked catalogue through a `TammBackend` interface with a `MockTammBackend` implementation, so a real backend can replace it later without touching tool code.
- Every tool response includes `"mock": true`. The UI never displays this. Code and docs always state it.
- Fees, durations and requirements in the catalogue are illustrative. Each such field carries `"illustrative": true`.

### 4.2 Simulated UAE PASS

Every tool call needs a simulated UAE PASS session, passed as tool argument `uaepass_session`.

Dev endpoint (HTTP, not an MCP tool): `POST /dev/uaepass/login`
```json
{ "subject_ref": "hire_demo_001", "audience": "individual" }
```
Response:
```json
{ "contract_version": "1.0.0", "uaepass_session": "uap_sim_7c3e", "simulated": true }
```

### 4.3 Guard integration

Before executing any tool that sends data, the server calls Guard `/check` with `destination: "tamm"`, the tool name, and the labels of the documents involved. On anything other than `allow`, the tool returns a denial result and does nothing else.

The app also needs the Guard `session_id`, so every data-sending tool takes `guard_session_id`.

### 4.4 Tools

All tools return `contract_version` and `mock`.

#### `search_services`

Input:
```json
{ "query": "tenancy contract", "audience": "individual", "uaepass_session": "uap_sim_7c3e" }
```
Output:
```json
{
  "contract_version": "1.0.0",
  "mock": true,
  "results": [
    {
      "service_id": "svc_tawtheeq_register",
      "name": "Register a tenancy contract (Tawtheeq)",
      "entity": "Abu Dhabi Municipality",
      "audience": "individual",
      "tags": ["housing"],
      "score": 7.42
    }
  ]
}
```
Since 1.2.0, results are ranked by relevance and each carries `score` (higher is better). Matching uses BM25 over service names, keywords and tags, with synonyms, common Arabic terms and transliterations (for example "iqama", "إقامة"), and tolerates one typo in words of five or more letters.

#### `get_service_requirements`

Input:
```json
{ "service_id": "svc_tawtheeq_register", "uaepass_session": "uap_sim_7c3e" }
```
Optional inputs since 1.2.0: `documents_on_file` (`PayloadRef[]`, what the newcomer already holds) and `completed_services` (service ids already approved).
Output:
```json
{
  "contract_version": "1.0.0",
  "mock": true,
  "service_id": "svc_tawtheeq_register",
  "required_documents": [
    { "label": "passport", "description": "Tenant passport copy" },
    { "label": "emirates_id", "description": "Tenant Emirates ID or application" }
  ],
  "depends_on": ["svc_residency_visa"],
  "est_fee_aed": { "value": 0, "illustrative": true },
  "est_duration_days": { "value": 0, "illustrative": true }
}
```
Additional output fields since 1.2.0:
```json
{
  "prerequisite_order": ["svc_residency_visa"],
  "missing_prerequisites": ["svc_residency_visa"],
  "missing_documents": [{ "label": "emirates_id", "description": "Tenant Emirates ID or application" }],
  "ready_to_apply": false
}
```
- `prerequisite_order`: every transitive prerequisite, ordered so that each service comes after its own prerequisites.
- `missing_prerequisites`: the entries of `prerequisite_order` not in `completed_services`.
- `missing_documents`: required documents whose label no ref in `documents_on_file` carries.
- `ready_to_apply`: both lists are empty.

#### `start_application`

Input:
```json
{
  "service_id": "svc_tawtheeq_register",
  "applicant_ref": "hire_demo_001",
  "documents": [
    { "ref": "doc_passport_hire_demo_001", "labels": ["passport"] }
  ],
  "uaepass_session": "uap_sim_7c3e",
  "guard_session_id": "gs_8f2a1c"
}
```
Output on success:
```json
{
  "contract_version": "1.0.0",
  "mock": true,
  "application_id": "app_tw_0192",
  "status": "submitted"
}
```
Output on Guard denial:
```json
{
  "contract_version": "1.0.0",
  "mock": true,
  "denied": true,
  "guard": {
    "decision": "deny",
    "reason": "Health details can only be shared for insurance services.",
    "policy_rule": "health.tamm.insurance_only"
  }
}
```

#### `get_application_status`

Input:
```json
{ "application_id": "app_tw_0192", "uaepass_session": "uap_sim_7c3e" }
```
Output:
```json
{
  "contract_version": "1.0.0",
  "mock": true,
  "application_id": "app_tw_0192",
  "status": "under_review",
  "history": [
    { "status": "submitted", "at": "2026-10-10T09:45:00+04:00" },
    { "status": "under_review", "at": "2026-10-10T09:46:30+04:00" }
  ],
  "needs_info": null
}
```
When `status` is `needs_info`, `needs_info` holds `{ "message": "...", "required_labels": [...] }`.

#### `check_trade_name`

Input:
```json
{ "name": "Northwind Analytics", "uaepass_session": "uap_sim_9a1f" }
```
Output:
```json
{
  "contract_version": "1.0.0",
  "mock": true,
  "name": "Northwind Analytics",
  "available": true,
  "notes": "Name appears available. Final approval happens during licensing."
}
```

#### `register_tenancy_tawtheeq`

Shortcut for the demo, equivalent to `start_application` on `svc_tawtheeq_register`.

Input:
```json
{
  "lease_ref": "lease_reem_2207",
  "applicant_ref": "hire_demo_001",
  "uaepass_session": "uap_sim_7c3e",
  "guard_session_id": "gs_8f2a1c"
}
```
Output: same shape as `start_application`.

### 4.5 Application state machine

```
submitted -> under_review -> approved
                          -> needs_info -> under_review
                          -> rejected
```

- Normal mode: transitions are time-based with small random delays.
- Demo mode (`RASIKH_DEMO_MODE=1`): transitions are deterministic and advanced by the dev endpoint below.

Dev endpoints (HTTP, demo mode only):
- `POST /dev/advance` with `{ "application_id": "app_tw_0192" }` moves to the next scripted status
- `POST /dev/reset` clears all applications

### 4.6 Catalogue coverage (minimum)

Individual: residency visa, Emirates ID, tenancy registration (Tawtheeq), health insurance enrolment (tagged `insurance`), school registration.

Business: trade name reservation, economic license (mainland), free zone setup entries for ADGM, KEZAD, Masdar City Free Zone, twofour54, establishment card, visa quota.

Entity names must be real and correct. Anything numeric is illustrative.

## 5. Demo fixtures

Both packages and the app seed the same ids so demo paths line up.

| Id | What it is |
|---|---|
| `hire_demo_001` | International hire, path 1 |
| `company_demo_001` | Foreign company opening an Abu Dhabi branch, path 2 |
| `hire_demo_002` to `hire_demo_004` | First three transferred employees in path 2 |
| `lease_reem_2207` | Apartment on Al Reem Island used in the rental moment |
| `doc_passport_hire_demo_001` | Passport document for the main hire |

Reset order for a clean demo: app reset, then `POST /dev/reset` on TAMM MCP, then `POST /dev/reset` on Guard. The app's "Reset demo" button does all three.

## 6. Error codes

All errors use `ErrorBody` from section 2.

| Code | HTTP | Meaning |
|---|---|---|
| `invalid_request` | 400 | Missing or malformed fields |
| `unknown_session` | 404 | Guard or UAE PASS session not found |
| `unknown_service` | 404 | TAMM service id not in catalogue |
| `unknown_application` | 404 | Application id not found |
| `consent_not_found` | 404 | Consent id not found |
| `demo_mode_only` | 404 | Dev endpoint called with demo mode off |
| `guard_unavailable` | 503 | Guard could not be reached. Callers treat as deny |
| `internal` | 500 | Anything else |

## 7. Environment variables

| Variable | Used by | Default |
|---|---|---|
| `RASIKH_GUARD_URL` | app, tamm-mcp | `http://localhost:8787` |
| `TAMM_MCP_URL` | app | `http://localhost:8790/mcp` |
| `RASIKH_DEMO_MODE` | all | `0` |
| `OPENAI_API_KEY` | app | none, required for live mode |

## 8. Changelog

- **1.2.0** Additive: `remedy` and `allowed_destinations` on `/check` responses; `score` on `search_services` results; optional `documents_on_file` and `completed_services` inputs, and prerequisite and gap fields, on `get_service_requirements`; `packages/rasikh-data` added to the layout.
- **1.1.1** Clarification: how observed data flows into a check. Unobserved refs inherit the session, and redacted refs and derived signals must be observed before they are sent. Found by the independent Guard evaluation (12 of 25 attacks used a fresh unlabelled summary ref).
- **1.1.0** Additive: optional `service_tags` on `POST /check`, so Guard can evaluate "insurance services only". Without it the rule can't be evaluated, because `/check` does not say which TAMM service a call targets.
- **1.0.0** Initial contract: Guard sidecar with observe, check, consent and log; TAMM MCP tools; shared types; demo fixtures.
