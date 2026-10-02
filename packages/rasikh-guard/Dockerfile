# Rasikh Guard sidecar. Build context: packages/rasikh-guard
#   docker compose up --build        (from packages/rasikh-guard)
FROM rust:1.96-slim-bookworm AS build
WORKDIR /src
COPY Cargo.toml Cargo.lock rustfmt.toml ./
COPY vendor ./vendor
COPY policies ./policies
COPY sidecar ./sidecar
RUN cargo build --release --locked -p rasikh-guard

FROM debian:bookworm-slim
RUN useradd --system --uid 10001 guard
COPY --from=build /src/target/release/rasikh-guard /usr/local/bin/rasikh-guard
USER guard
ENV RASIKH_GUARD_BIND=0.0.0.0:8787
EXPOSE 8787
ENTRYPOINT ["/usr/local/bin/rasikh-guard"]
