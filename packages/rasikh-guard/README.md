# Rasikh Guard

Rasikh Guard is the data-flow guard for Rasikh. It decides whether the agent can send a newcomer's
labelled data (passport, salary, health, and so on) to a destination (TAMM, a landlord, a bank, the LLM provider,
and so on). It is a fork of [OpenAPPA](https://github.com/archestra-ai/OpenAPPA) (MIT). The pinned commit and
the vendored files are listed in [UPSTREAM.md](UPSTREAM.md).

The HTTP contract is defined in the repo-root `INTEGRATION.md`, section 3.

## Layout

| Path      | Contents                                                     |
| --------- | ------------------------------------------------------------ |
| `vendor/` | Unmodified OpenAPPA engine crates at the pinned commit       |

## Build and test

You need Rust 1.96 or later (edition 2024).

```sh
cd packages/rasikh-guard
cargo test --workspace
```

This runs the vendored upstream test suites unchanged: 571 tests at the pinned commit.

> On Windows, if the repo is under a OneDrive-synced or antivirus-scanned folder, builds can fail with
> `os error 32` (file in use). Set `CARGO_TARGET_DIR` to a path outside that folder.

## Known limits

- Upstream OpenAPPA is a preview/RFC. Its interfaces may change between commits, which is why the commit is pinned.
- Only the engine crates are vendored, not the upstream runtime binary or the Python bindings.

## License

MIT. Copyright 2026 Archestra Inc. for the upstream code (see [LICENSE.md](LICENSE.md)). Rasikh additions are under the same license.
