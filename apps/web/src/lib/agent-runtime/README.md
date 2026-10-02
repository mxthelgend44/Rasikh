# agent-runtime

One AI journey: **document extraction -> human review -> grounded next step -> approved action**.

```
POST /api/agent/journey  { action: "extract" | "confirm" | "decide", ... }
```

1. `extract`: Guard `session` + `observe` + `check(extract_document -> llm_provider)`. Only on `allow` is the document
   sent to the extractor. Output is validated against a strict schema; each value must be backed by a quote found in the
   document or it is dropped. Fields below 0.8 confidence, or dropped, must be corrected by the newcomer.
2. `confirm`: the newcomer confirms or corrects every field (corrections are labelled `user_corrected`). The existing
   `@rasikh/engine` (`getBlockers`, `planRoadmap`, `getCriticalPath`) then picks the next step. Output separates
   `extracted_fact`, `estimate` (illustrative) and `recommendation`.
3. `decide`: the newcomer approves the exact proposal (id + digest). Guard checks `request_document -> employer`;
   only an explicit `allow` calls the action tool. `deny`, `needs_consent`, errors, malformed answers and an
   unreachable Guard all stop before the tool call.

Modes (`RASIKH_AI_MODE`): `demo` (default) uses `DeterministicDemoExtractor`, which makes **no model call** and says so in
`provenance` (`provider: "none"`, `live_model_call: false`). `live` uses the OpenAI Responses API server-side
(`store: false`, strict JSON schema) and requires `OPENAI_API_KEY`, `OPENAI_MODEL` and an explicit
`acknowledge_provider_disclosure: true` in the request. Live mode never falls back to demo.

Audit records (`MemoryAuditSink`) hold ids, labels, Guard decision/rule/check id, contract version and provider
provenance. They never contain document text, field values or evidence quotes.

Tests: `npm run test:agent` (add `RASIKH_GUARD_E2E=1` with a running Guard for the real-sidecar test).
