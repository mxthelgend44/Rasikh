# Section 1: real Guard HTTP evidence

Suggested PR title: `Measure real Guard policy and contract conformance`

The existing 25 attacks now run against the actual native sidecar. Three runs each
verify every attack over HTTP. All 13 direct attacks are denied; all 12 indirect
attacks that replace an observed sensitive ref with a new unlabelled summary ref
are allowed. The observed authorization leak rate is 48% in every run, with 100%
verified coverage. No test forwards a payload to the forbidden destination.

The conformance suite records the observed-read and consent grant/scope/revoke
flows, response versions, validation/error bodies, newest-first logs, and a
non-destructive demo-disabled reset check. It also exposes the fresh-ref provenance
failure and the unversioned, non-JSON 405 response on a wrong-method request.

One command from this package, `node scripts/with-guard.mjs`, reuses a healthy
service or builds `cargo build --locked` with target artifacts confined to this
package's `.runtime/guard-target`, starts an owned service, polls health, runs three
conformance/attack repetitions, and stops only its own child processes. A requested
command can be supplied after `--`. Reused services are never reset or stopped.

Validation: nine unit tests and strict TypeScript; an actual native startup/command
smoke run on port 18787 confirmed the owned process is gone after command exit.
Actual sidecar HTTP evidence is in `evals/GUARD_CONFORMANCE.md` and `.json`.
The failure exit code is intentional; failures are preserved for the Guard owner.

Open questions: the Guard owner must resolve observed provenance on new outbound
references and version method-error responses. A destructive demo-enabled reset
is deliberately untested on a shared service. Insurance tags are outside the
active 1.0.0 contract and are not silently added by this suite.
