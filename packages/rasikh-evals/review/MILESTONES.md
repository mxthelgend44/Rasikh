# Review-ready evaluation milestone

Suggested PR title: `Add synthetic quality and Guard privacy evaluation harness`

Rasikh needs repeatable extraction, roadmap, summary and privacy checks. Add 75 fake
golden cases with independently cached demo responses, engine-grounded roadmap decisions,
field/fact/forbidden-content metrics and explicit Guard leak/denial/coverage metrics.
One command writes a Markdown report and JSON for the future Quality screen. Reports
identify cached, HTTP, unavailable and custom evidence; connection errors never count
as verified Guard denials. Live app/OpenAI/Guard adapters are included with no app edits.

Validation: 18 harness tests and strict TypeScript pass. Covers actual local HTTP request
sequencing, fail-closed transport/protocol errors, version mismatches, explicit allows
and needs-consent cases, missing/hallucinated extraction fields, summary contradictions,
forbidden salary variants, OpenAI refusal/incomplete responses and app transport shapes.
Demo: 75/75 passing; 105/105 fields, 15/15 roadmaps/blockers, 60/60 required facts,
0/15 forbidden summaries, 25 cached denials. No verified Guard leak rate is claimed.

Live Guard probe: service unavailable; 25 errors and null verified leak rate. Live AI
credentials and app eval routes are absent. Real app/model/security validation remains
unverified until those inputs are available. Text fixtures do not evaluate OCR quality.

Git has no remote; this is the local PR description pending remote configuration.
