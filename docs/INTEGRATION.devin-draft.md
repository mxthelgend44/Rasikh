# INTEGRATION.md

Contract version: 1.0.0
Status: active

This file is the single source of truth for how the three parts of Rasikh talk to each other. Every agent working on this repo builds against it exactly.

| Part                                  | Path                    | Owner                              |
| ------------------------------------- | ----------------------- | ---------------------------------- |
| Web app and agent                     | `apps/web`              | Claude                             |
| Shared types                          | `packages/shared`       | Claude (Devin may propose changes) |
| Rasikh Guard (OpenAPPA fork, sidecar) | `packages/rasikh-guard` | Devin                              |
| TAMM MCP server                       | `packages/tamm-mcp`     | Devin                              |

> **Provenance note.** Sections 0 to 4.3 and the start of 4.4 were supplied by the project owner. The source
> text was truncated in transit partway through 4.4 (`search_services` output). The remainder of 4.4 and
> sections 5 and 6 were drafted by Devin to be consistent with the rest of the contract, and are marked
> _(drafted)_. The owner should confirm or replace them.

## 0. Rules for changing this contract

Nobody changes this file silently. A change is a PR that edits only this file, explains why, and bumps the version (patch for clarifications, minor for additive changes, major for breaking changes).

Until a change is merged, everyone keeps building against the current version.

Every response from every service includes `contract_version`. The app logs a warning if versions differ.

## 1. Repo layout

```
apps/web                  Next.js app: newcomer, employer, expansion, landlord, bank surfaces + agent
packages/shared           TypeScript types and enums used by everything below
packages/rasikh-guard     OpenAPPA fork + Rasikh policies + HTTP sidecar
packages/tamm-mcp         MCP server over a mocked TAMM service catalogue
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
- Fail closed: if Guard is unreachable or returns an error, the caller treats the action as `deny`. No tool call proceeds without an explicit `allow`.
- Latency target: p95 under 50 ms for `/check`

### 3.2 How the agent uses Guard

Guard tracks what the agent has read so it can catch indirect leaks (for example, reading a passport and then writing a "summary" to a landlord). So the app reports reads, not just writes.

For every agent step:

1. When the agent reads labelled data, call `POST /observe`.
2. Before the agent sends anything to any destination (including the LLM provider), call `POST /check`.
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

Field rules:

- `reason` is plain language and is shown to users as is. No jargon, no rule ids in it.
- `policy_rule` is the stable id of the matched rule, shown only in the Guard log.
- `blocked_labels` lists only the labels that caused a non-allow decision.
- `consent_request` is present only when `decision` is `needs_consent`.
- Guard evaluates `data_labels` plus everything observed in the session that could flow into this call. Declaring fewer labels than were read does not make a leak pass.

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

| Label          | tamm                    | employer | landlord            | bank    | school  | llm_provider    | newcomer |
| -------------- | ----------------------- | -------- | ------------------- | ------- | ------- | --------------- | -------- |
| passport       | allow                   | allow    | consent             | consent | deny    | extraction only | allow    |
| emirates_id    | allow                   | allow    | consent             | consent | deny    | extraction only | allow    |
| salary         | allow                   | allow    | derived signal only | consent | deny    | redacted        | allow    |
| bank_statement | deny                    | deny     | derived signal only | consent | deny    | extraction only | allow    |
| employment     | allow                   | allow    | allow               | allow   | deny    | redacted        | allow    |
| family         | allow                   | allow    | consent             | deny    | consent | redacted        | allow    |
| address        | allow                   | allow    | allow               | consent | consent | redacted        | allow    |
| degree         | allow                   | allow    | deny                | deny    | deny    | extraction only | allow    |
| health         | insurance services only | deny     | deny                | deny    | deny    | deny            | allow    |

Meaning of the special cells:

- **consent**: returns `needs_consent` until a matching `/consent` exists.
- **derived signal only**: raw values are denied. A payload ref with `derived: true` (for example "affordability: yes") is allowed.
- **extraction only**: allowed only when `tool` is `extract_document`. Any other tool sending this label to `llm_provider` is denied.
- **redacted**: allowed only if the payload ref has the label removed by the app's redaction step (the app sends the redacted ref, whose `labels` no longer include it). Unredacted is denied.
- **insurance services only**: allowed only when `tool` is `start_application` and the TAMM service is tagged `insurance`.

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

Output _(drafted from here on: the source text was truncated inside this example)_:

```json
{
  "contract_version": "1.0.0",
  "mock": true,
  "results": [
    {
      "service_id": "svc_tawtheeq_registration",
      "name": "Register a Tenancy Contract (Tawtheeq)",
      "entity": "Abu Dhabi Department of Municipalities and Transport",
      "audience": "individual",
      "tags": ["housing", "tenancy"],
      "summary": "Register a residential tenancy contract so it is officially recorded."
    }
  ]
}
```

#### `get_service_requirements` _(drafted)_

Input:

```json
{ "service_id": "svc_tawtheeq_registration", "uaepass_session": "uap_sim_7c3e" }
```

Output:

```json
{
  "contract_version": "1.0.0",
  "mock": true,
  "service": { "service_id": "svc_tawtheeq_registration", "name": "...", "entity": "...", "audience": "individual", "tags": ["housing", "tenancy"], "summary": "..." },
  "requirements": [
    { "requirement_id": "req_passport", "description": "Tenant passport copy", "labels": ["passport"], "mandatory": true, "illustrative": true }
  ],
  "fee": { "amount_aed": 0, "note": "...", "illustrative": true },
  "processing_time": { "text": "...", "illustrative": true }
}
```

#### `start_application` _(drafted, data-sending)_

Input:

```json
{
  "service_id": "svc_residency_visa_employment",
  "uaepass_session": "uap_sim_7c3e",
  "guard_session_id": "gs_8f2a1c",
  "payload_refs": [{ "ref": "doc_passport_hire_demo_001", "labels": ["passport"] }]
}
```

Output:

```json
{
  "contract_version": "1.0.0",
  "mock": true,
  "application_id": "app_0001",
  "service_id": "svc_residency_visa_employment",
  "status": "submitted",
  "submitted_at": "2026-10-10T09:41:12+04:00",
  "guard_check_id": "chk_19b0"
}
```

#### `get_application_status` _(drafted)_

Input:

```json
{ "application_id": "app_0001", "uaepass_session": "uap_sim_7c3e" }
```

Output:

```json
{
  "contract_version": "1.0.0",
  "mock": true,
  "application_id": "app_0001",
  "service_id": "svc_residency_visa_employment",
  "status": "under_review",
  "history": [
    { "status": "submitted", "at": "2026-10-10T09:41:12+04:00", "note": "Application received." },
    { "status": "under_review", "at": "2026-10-10T09:42:00+04:00", "note": "An officer is reviewing the application." }
  ]
}
```

Allowed transitions: `submitted → under_review`; `under_review → needs_info | approved | rejected`; `needs_info → under_review`. `approved` and `rejected` are final.

#### `check_trade_name` _(drafted, data-sending)_

Input:

```json
{
  "proposed_name": "Falcon Analytics",
  "licensing_authority": "ded",
  "uaepass_session": "uap_sim_7c3e",
  "guard_session_id": "gs_8f2a1c"
}
```

`licensing_authority` is one of `ded`, `adgm`, `kezad`, `masdar`, `twofour54`.

Output:

```json
{
  "contract_version": "1.0.0",
  "mock": true,
  "proposed_name": "Falcon Analytics",
  "available": true,
  "issues": [],
  "suggestions": [],
  "illustrative": true
}
```

#### `register_tenancy_tawtheeq` _(drafted, data-sending)_

Input:

```json
{
  "uaepass_session": "uap_sim_7c3e",
  "guard_session_id": "gs_8f2a1c",
  "property_ref": "unit_reem_1204",
  "landlord_name": "Example Properties LLC",
  "annual_rent_aed": 95000,
  "start_date": "2026-11-01",
  "end_date": "2027-10-31",
  "payload_refs": [
    { "ref": "doc_passport_hire_demo_001", "labels": ["passport"] },
    { "ref": "doc_emirates_id_hire_demo_001", "labels": ["emirates_id"] }
  ]
}
```

Output: the same shape as `start_application`, with `service_id: "svc_tawtheeq_registration"`.

#### Denial result _(drafted)_

When Guard does not return `allow`, or Guard is unreachable, a data-sending tool does nothing and returns an MCP result with `isError: true` and this `structuredContent`:

```json
{
  "contract_version": "1.0.0",
  "mock": true,
  "denied": true,
  "decision": "needs_consent",
  "reason": "Your passport has not been shared with landlords yet.",
  "policy_rule": "passport.landlord.requires_consent",
  "blocked_labels": ["passport"],
  "consent_request": { "label": "passport", "destination": "landlord" },
  "guard_check_id": "chk_19b0"
}
```

If Guard is unreachable, `decision` is `deny`, `policy_rule` is `guard.unreachable`, and `guard_check_id` is `null`.

## 5. Environment and ports _(drafted)_

| Variable           | Used by          | Default                     |
| ------------------ | ---------------- | --------------------------- |
| `RASIKH_GUARD_URL` | app, tamm-mcp    | `http://localhost:8787`     |
| `RASIKH_DEMO_MODE` | guard, tamm-mcp  | unset (off); `1` turns it on |
| `TAMM_MCP_URL`     | app              | `http://localhost:8790/mcp` |

In demo mode, TAMM application status advances one step per `get_application_status` call along a fixed script, so a scripted demo is repeatable.

## 6. Error codes _(drafted)_

Errors use `ErrorBody`. MCP tools put the same body in `structuredContent` with `isError: true`.

| Code                       | HTTP | Meaning                                           |
| -------------------------- | ---- | ------------------------------------------------- |
| `invalid_request`          | 400  | Body or arguments failed validation               |
| `unknown_session`          | 404  | Guard `session_id` does not exist                 |
| `unknown_consent`          | 404  | `consent_id` does not exist                       |
| `not_found`                | 404  | Route, service or application does not exist     |
| `invalid_uaepass_session`  | 401  | Missing or unknown simulated UAE PASS session     |
| `audience_mismatch`        | 403  | UAE PASS session audience does not fit the service |
| `guard_unavailable`        | 503  | Guard could not be reached (caller fails closed)  |
| `internal`                 | 500  | Unexpected server error                           |
