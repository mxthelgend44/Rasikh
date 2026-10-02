# Rasikh Guard

Rasikh Guard decides whether the Rasikh agent may send a newcomer's labelled data (passport, salary, health and so on)
to a destination (TAMM, a landlord, a bank, the LLM provider and so on). It runs as an HTTP sidecar that implements
INTEGRATION.md section 3. It is a fork of [OpenAPPA](https://github.com/archestra-ai/OpenAPPA) (MIT). The pinned commit
and the vendored files are listed in [UPSTREAM.md](UPSTREAM.md).

## Layout

| Path                   | Contents                                                                     |
| ---------------------- | ---------------------------------------------------------------------------- |
| `policies/rasikh.toml` | The default policy: the full 9 label x 7 destination matrix from INTEGRATION.md 3.4 |
| `sidecar/`             | The `rasikh-guard` crate: policy loader, decision core, session store, HTTP |
| `vendor/`              | Unmodified OpenAPPA engine crates at the pinned commit                       |

## Run

```sh
cd packages/rasikh-guard
docker compose up --build                            # one command; demo mode on, http://localhost:8787
# or without Docker:
RASIKH_DEMO_MODE=1 cargo run --release -p rasikh-guard
```

| Variable              | Default             | Meaning                                              |
| --------------------- | ------------------- | ---------------------------------------------------- |
| `RASIKH_GUARD_BIND`   | `127.0.0.1:8787,[::1]:8787` | Comma-separated listen addresses (`0.0.0.0:8787` in the container). Both loopbacks, because a client resolving `localhost` to `::1` first otherwise pays ~200 ms per call on Windows |
| `RASIKH_GUARD_POLICY` | compiled-in policy  | Path to an alternative policy TOML                   |
| `RASIKH_DEMO_MODE`    | `0`                 | `1` enables `POST /dev/reset`                        |

## How a decision is made

`sidecar/src/decide.rs` is pure, with no IO and no clock. For each `/check`:

1. **What flows into the call.** The declared `data_labels`, the labels on every payload ref, and the session's
   observations:
   - a ref that was observed keeps its observed labels and `derived` flag, so re-declaring it does not shed labels;
   - a ref that was never observed carries what it declares (this is how redacted refs and derived signals arrive);
   - a call with **no payload refs** is free-form content, so everything observed in the session flows into it.
2. **Each label against the matrix.** The effects are `allow`, `deny`, `consent`, `derived_only`, `extraction_only`
   (`tool == extract_document`), `redacted_only` and `insurance_only` (`tool == start_application` and the service tag
   is `insurance`).
3. **The most severe outcome wins:** deny, then needs_consent, then allow. `blocked_labels` lists every non-allow label.
   The first such label in contract order supplies `reason` (plain language) and `policy_rule`
   (`<label>.<destination>.<effect>`, e.g. `passport.landlord.requires_consent`).

**Consent** comes from the newcomer's trust passport and acts as a per-session override. It covers exactly one label
and one destination, only for cells whose effect is `consent`; a `deny` cell cannot be unlocked. It can be revoked with
`DELETE /consent/{id}` and can carry an `expires_at`. Only `granted_by: "newcomer"` is accepted.

The policy file says in its header that these are product defaults for the demo, not legal statements. The loader
refuses unknown keys, labels, destinations or effects, and any missing cell, so nothing falls through to an implicit allow.

## Test

```sh
cargo test --workspace          # vendored upstream suites (571) + Rasikh Guard (96)
cargo test -p rasikh-guard      # Rasikh Guard only
```

| Suite                        | Tests | What it proves                                                                       |
| ---------------------------- | ----: | ------------------------------------------------------------------------------------ |
| `tests/policy_rules.rs`      |    64 | One test per matrix cell (63), each on both sides of its condition, plus a coverage check |
| `tests/adversarial.rs`       |    21 | Indirect leaks are denied (table below)                                              |
| `tests/policy_file.rs`       |     6 | Loader refusals, the legal disclaimer, plain-language reasons, rule ids              |
| `tests/http.rs`              |     5 | Every endpoint, the contract example flow, error codes, demo-only reset              |
| upstream (`vendor/`)         |   571 | OpenAPPA engine unchanged at the pinned commit                                       |

The expected matrix in `policy_rules.rs` is transcribed from INTEGRATION.md separately from the TOML. Mutation check:
flipping `passport -> school` to `allow` in the TOML fails 4 adversarial tests, plus `passport_school` in
`policy_rules.rs`.

### Adversarial flows (all non-allow)

| Attempt                                                                | Result                                   |
| ---------------------------------------------------------------------- | ---------------------------------------- |
| Read passport, then free-form "summary" to a school                    | deny `passport.school.denied`            |
| Read passport, then rental application declaring only employment       | needs_consent `passport.landlord.requires_consent` |
| Re-send an observed passport ref with `labels: []`                     | deny                                     |
| Send a passport ref with empty `data_labels`                           | deny                                     |
| Read health declaration, then free-form message to employer            | deny `health.employer.denied`            |
| Re-label an observed raw salary slip as `derived: true` for a landlord | deny `salary.landlord.derived_only`      |
| Derived affordability signal plus the raw slip in the same call        | deny                                     |
| Declare `salary` with no ref behind it                                 | deny (counts as raw)                     |
| Re-send an observed salary slip as "redacted" (`labels: []`) to the LLM | deny `salary.llm_provider.redacted_only` |
| Reasoning call with no refs after reading a passport                   | deny `passport.llm_provider.extraction_only` |
| Use the `extract_document` tool name to reach a school                 | deny                                     |
| Health to TAMM with the wrong tool, or without the `insurance` tag     | deny `health.tamm.insurance_only`        |
| Health read, then free-form TAMM call on a housing service             | deny                                     |
| Bank statement hidden next to an employment letter, to the employer    | deny `bank_statement.employer.denied`    |
| Passport plus degree to a landlord                                     | deny (deny wins; both labels listed)     |
| Consent for passport -> landlord reused for bank, or for Emirates ID   | needs_consent                            |
| Consent from another session                                           | needs_consent                            |
| Retry after revoking consent                                           | needs_consent                            |
| Grant an already expired consent                                       | refused                                  |
| Consent with `granted_by` other than `newcomer`                        | refused                                  |
| Observations in one session tainting another                           | isolated (control)                       |

## Known limits

- **The vendored OpenAPPA engine is not on the decision path yet.** Decisions come from the Rasikh matrix evaluator in
  `sidecar/`, which takes the same approach (labels follow observed data into the agent's later calls, then are
  checked where the data leaves). Compiling the Rasikh matrix into OpenAPPA's policy dialect and driving `appa-engine`
  per check is open work (see `packages/DEVIN_LOG.md`).
- **Granularity is per payload ref, not per value.** Guard cannot see content, so it trusts the app to describe outbound
  content with refs. A ref that was never observed is taken at its declared labels; only ref-less calls inherit the
  whole session.
- **`service_tags` on `/check`** (contract 1.1.0) is optional. A caller that omits it gets deny for health to TAMM.
- **Strict input:** unknown JSON fields are rejected with `invalid_request`, and callers treat that as deny.
- State is in memory, so a restart clears sessions, consents and logs.

## License

MIT. Copyright 2026 Archestra Inc. for the upstream code (see [LICENSE.md](LICENSE.md)). Rasikh additions are under the same license.
