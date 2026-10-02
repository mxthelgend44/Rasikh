# Rasikh

Rasikh is an early-stage hackathon concept for making an employer-led move to Abu Dhabi easier and quicker. The proposed product would help an employer and a new hire coordinate the steps for employment and residence, housing, banking, family needs, and, when relevant, setting up a company. Landlords and banks are proposed participants in the same workflow. Its effect on elapsed time and effort still needs to be tested.

## Deployed app

- App: https://rasikh--rasikh-f0207.europe-west4.hosted.app
- Bank surface: https://rasikh--rasikh-f0207.europe-west4.hosted.app/bank

The deployment is run by the main coordinator. These links were supplied by the team and have not been checked from this repository.

## Hackathon materials

1. [Problem evidence](docs/problem-evidence.md): Abu Dhabi and UAE proof, counterevidence, source limits and open questions
2. [Fact check](docs/fact-check.md): stage-safe process claims and sources
3. [Validation interviews](docs/validation-interviews.md): three short scripts and an evidence template
4. [Market and competitors](docs/market-and-competitors.md): published counts, calculation limits and alternatives
5. [Three-minute pitch](docs/pitch-script.md): spoken script and exact demo cues
6. [Deck outline](docs/deck-outline.md): nine visual slides
7. [Judge Q&A](docs/judge-qa.md): fifteen difficult questions and honest answers
8. [Demo rehearsal](docs/demo-rehearsal.md): timing, roles and failure switches

## What has been built so far

Work lives on several branches and is not all merged into `main`:

- **Contract** (`INTEGRATION.md`, 1.2.0): data labels, destinations, Guard and TAMM wire types and demo fixtures.
- **Rasikh Guard** (`packages/rasikh-guard`): OpenAPPA-based policy sidecar that checks every outbound agent action, with consent and indirect-leak tracking.
- **TAMM MCP** (`packages/tamm-mcp`): mocked TAMM catalogue over MCP, with ranked search and readiness planning. Every response is marked `mock: true` and fees and durations are illustrative.
- **Data layer** (`packages/rasikh-data`): Firestore schema, validating converters, rules and indexes.
- **Engine and evals** (branch stack ending at `codex/trust-evidence`): deterministic roadmap, recommendation, risk and simulation engine, and an evaluation harness. Existing live evaluations use Vertex AI and synthetic data; they are not evidence for OpenAI.
- **AI journey** ([PR #27](https://github.com/mxthelgend44/Rasikh/pull/27), branch `codex/claude-ai-integration`, draft): Guard-gated document extraction, newcomer review, an engine-grounded next-step recommendation, and an approval-gated action. Guard is checked before the model sees a document and before any action; anything other than an explicit allow stops the flow, including an unreachable Guard. Demo mode uses a deterministic extractor that makes no model call and labels itself so. Live mode uses the OpenAI Responses API server-side, but no live OpenAI call has been made yet, so it is tested only against a fake transport. Audit records never contain document contents.

## Status

The application is currently a Next.js scaffold with Firebase browser analytics. The relocation workflows, four role dashboards, TAMM adapter, partner actions and OpenAPPA guard are not implemented in the checked commits. References to those capabilities in the hackathon materials are proposals or demo plans until implementation and permissions are separately verified.
