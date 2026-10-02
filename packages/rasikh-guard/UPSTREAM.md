# Upstream: OpenAPPA

Rasikh Guard is a fork of [OpenAPPA](https://github.com/archestra-ai/OpenAPPA) by Archestra Inc.,
used under the MIT license (see [LICENSE.md](LICENSE.md), copied unchanged from upstream).

| Field          | Value                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| Repository     | https://github.com/archestra-ai/OpenAPPA                                 |
| Pinned commit  | `5060566a0d9fed034a5e68ec782a1b00714c7014`                               |
| Commit date    | 2026-10-01 23:12:05 +0100                                                |
| Commit subject | feat(runtime): event-source tracked file workspaces (#577)               |
| Upstream crate version | 0.30.0                                                           |

OpenAPPA is a preview/RFC and its interfaces may change. Never float to upstream `main`.
Update by re-vendoring a new pinned commit and recording it here.

## What is vendored

Only the policy-engine crates are vendored. They are copied byte-for-byte; no file under
`vendor/` is modified.

| Path                                                       | Upstream path                                   |
| ---------------------------------------------------------- | ----------------------------------------------- |
| `vendor/appa-runtime-api/`                                 | `appa-runtime-api/`                             |
| `vendor/appa-engine/`                                      | `appa-engine/`                                  |
| `vendor/appa-policy/`                                      | `appa-policy/`                                  |
| `vendor/marketplace/plugins/claude-code/default.appa.toml` | same path (fixture read by an `appa-policy` test) |
| `Cargo.lock`                                               | `Cargo.lock` (cargo prunes crates not in this workspace) |
| `rustfmt.toml`                                             | `rustfmt.toml`                                  |

Not vendored: the runtime binary, adapters, Python agent bindings (`appa-agent-python`),
event log, website and benches. The sidecar does not need them.

The root `Cargo.toml` copies upstream's `[workspace.package]`, `[workspace.lints]`,
the needed `[workspace.dependencies]` entries and the release/dev profiles, so the vendored crates build
with the same settings as upstream.

## Re-vendoring

```sh
git clone https://github.com/archestra-ai/OpenAPPA /tmp/openappa
git -C /tmp/openappa checkout <new-commit>
for c in appa-runtime-api appa-engine appa-policy; do
  rm -rf vendor/$c && cp -r /tmp/openappa/$c vendor/$c
done
cp /tmp/openappa/marketplace/plugins/claude-code/default.appa.toml vendor/marketplace/plugins/claude-code/
cargo test --workspace   # upstream tests must pass unchanged
```

Then update the pinned commit above and `UPSTREAM_COMMIT` in the sidecar.
