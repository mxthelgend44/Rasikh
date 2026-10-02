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
docker compose -f ../compose.yaml up --build         # Guard + TAMM MCP wired together
docker run -p 8787:8787 -e RASIKH_DEMO_MODE=1 ghcr.io/mxthelgend44/rasikh-guard   # published image
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
   - a ref that was **never observed** is content the agent produced (for example a "summary"), so everything observed
     in the session flows into it, and an unobserved `derived` claim is ignored;
   - a call with **no payload refs** is treated the same way;
   - so a redacted ref or a derived signal is trusted only after the app reports it with `POST /observe` (contract 1.1.1).
2. **Each label against the matrix.** The effects are `allow`, `deny`, `consent`, `derived_only`, `extraction_only`
   (`tool == extract_document`), `redacted_only` and `insurance_only` (`tool == start_application` and the service tag
   is `insurance`).
3. **The OpenAPPA gate.** `sidecar/src/appa.rs` turns each flowing label into an `appa_engine::label::Label` whose
   audience is the set of destinations that label may reach in this call's context (literal readers such as
   `rasikh-landlord`). The call's label is the engine's restrictive meet (`Label::combine`, which intersects audiences),
   and **only a folded audience that admits the destination yields `allow`**. Mutation check: making the gate refuse
   everything fails 55 of the 104 tests.
4. **Explanation when the gate refuses:** deny wins over needs_consent. `blocked_labels` lists every non-allow label.
   The first such label in contract order supplies `reason` (plain language) and `policy_rule`
   (`<label>.<destination>.<effect>`, e.g. `passport.landlord.requires_consent`).

## Remedies and routing (contract 1.2.0)

A refused `/check` is not a dead end. Every non-allow response carries:

- **`remedy`**: the smallest set of steps that would make this call allowed (`sidecar/src/remedy.rs`). Each blocked
  label gets the cheapest step its cell admits, from cheapest to most expensive: `use_tool` (send via
  `extract_document`), `send_derived_signal`, `redact`, `grant_consent`, `remove_label`. Guard then re-decides a copy
  of the call with every step applied. If steps interact (under a custom policy a `use_tool` step can change how
  another label is judged), an exact search tries every combination of no step, cheapest step or `remove_label` per
  label in ascending total cost, so the first plan that verifies is a minimum-cost plan. Every plan is
  `verified: true`. Tests follow the remedy for all 37 refused cells through the real store
  (grant the consent, observe the derived or redacted ref, switch the tool) and get `allow` each time.
- **`allowed_destinations`**: where the same payload may go as it stands. This is the OpenAPPA fold's audience,
  so the agent can pick another route.

**Consent** comes from the newcomer's trust passport and acts as a per-session override. It covers exactly one label
and one destination, only for cells whose effect is `consent`; a `deny` cell cannot be unlocked. It can be revoked with
`DELETE /consent/{id}` and can carry an `expires_at`. Only `granted_by: "newcomer"` is accepted.

The policy file says in its header that these are product defaults for the demo, not legal statements. The loader
refuses unknown keys, labels, destinations or effects, and any missing cell, so nothing falls through to an implicit allow.

## Test

```sh
cargo test --workspace          # vendored upstream suites (571) + Rasikh Guard (123)
PROPTEST_CASES=50000 cargo test -p rasikh-guard --test laws   # deeper property search
cargo test -p rasikh-guard      # Rasikh Guard only
```

| Suite                        | Tests | What it proves                                                                       |
| ---------------------------- | ----: | ------------------------------------------------------------------------------------ |
| `tests/policy_rules.rs`      |    64 | One test per matrix cell (63), each on both sides of its condition, plus a coverage check |
| `tests/adversarial.rs`       |    27 | Indirect leaks are denied (table below), including the 12 fresh-ref attacks from `packages/rasikh-evals` |
| `tests/laws.rs`              |    10 | Security laws over random requests, observations and consents (2,000 cases each by default) |
| `tests/policy_file.rs`       |     6 | Loader refusals, the legal disclaimer, plain-language reasons, rule ids              |
| `tests/remedies.rs`          |     7 | Every refused cell's remedy works when followed; cheapest step per effect; mixed plans; routing; minimum-cost search under a custom policy |
| `tests/http.rs`              |     6 | Every endpoint, the contract example flow, error codes, demo-only reset, versioned 405 |
| upstream (`vendor/`)         |   571 | OpenAPPA engine unchanged at the pinned commit                                       |

The expected matrix in `policy_rules.rs` is transcribed from INTEGRATION.md separately from the TOML. Mutation check:
flipping `passport -> school` to `allow` in the TOML fails 4 adversarial tests, plus `passport_school` in
`policy_rules.rs`.

### Laws (property-based, `tests/laws.rs`)

Each holds for every generated input: decisions are deterministic; sending more data, declaring more labels or (for
agent-written content) reading more never turns a refusal into an allow; a fresh unlabelled ref never launders what was
read; a consent only affects its own label and destination, and never unlocks a `deny` cell; every refusal carries a
verified remedy; the OpenAPPA fold agrees with the per-label analysis; verdict fields are consistent.

The laws found two real flaws that hand-written tests missed, both now fixed and pinned as adversarial tests: a
declared raw `salary` was treated as covered by a derived salary signal the session had observed, either on its own or
next to agent-written content. A declared label now counts as raw unless an observed ref carries it and the call has no
agent-written content. Mutation check: making unobserved refs stop inheriting the session fails the laundering law and
2 adversarial tests.

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
| Declare `salary` after observing only a derived salary signal          | deny (found by the laws)                 |
| Declare `salary` with the signal ref beside an agent-written draft     | deny (found by the laws)                 |
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
| Read a sensitive document, then send a fresh unlabelled "summary" ref (12 label/destination pairs) | deny |
| Fresh ref claiming `derived: true` without being observed              | deny                                     |
| Observations in one session tainting another                           | isolated (control)                       |
| Observed redacted ref / observed derived signal after the raw read     | allow (control)                          |

## Known limits

- **OpenAPPA is used for its label algebra, not its full runtime.** Every allow goes through `appa_engine::label`
  (the audience meet). The engine's trajectory replay, tool contracts and remedy plans need the OpenAPPA runtime, which
  is not vendored; Guard's own session store plays that role (observations, consents, log).
- **Granularity is per payload ref, not per value.** Guard cannot see content. Any unobserved ref inherits the whole
  session, which is safe but coarse: if the session has read a bank statement, a TAMM call that includes an unobserved
  ref is denied. The app should `/observe` every document it holds as it reads it.
- **`service_tags` on `/check`** (contract 1.1.0) is optional. A caller that omits it gets deny for health to TAMM.
- **Strict input:** unknown JSON fields are rejected with `invalid_request`, and callers treat that as deny.
- State is in memory, so a restart clears sessions, consents and logs.

## License

MIT. Copyright 2026 Archestra Inc. for the upstream code (see [LICENSE.md](LICENSE.md)). Rasikh additions are under the same license.
