---
"@anticapture/hypersync-indexer": minor
---

Migrate hypersync-indexer to HyperIndex V3.

- Bump `envio` from `^2.32.12` to `^3.0.2`.
- Switch package to ESM (`"type": "module"`) and bump `engines.node` to `>=22.0.0`.
- Rewrite handlers to use the unified `indexer.onEvent({ contract, event }, handler)` API; drop imports from the per-contract `generated` module in favour of `envio`'s `indexer`, `EvmOnEventContext`, and `Enum<...>` exports.
- Update `config.yaml` for the V3 schema (`networks` → `chains`).
- Wire up generated types through `envio-env.d.ts` (`.envio/` is now gitignored; the old `generated/` package directory and its bootstrap `postinstall` are gone).
- Refresh tsconfig for ESM (`moduleDetection: force`, `verbatimModuleSyntax: true`, `noImplicitOverride: true`).
- Bump `Dockerfile.hypersync-indexer` to `node:22-slim` and drop the obsolete `ts-node` global install and `npm install --prefix generated` step.
- Add a dedicated `@anticapture/hypersync-indexer#codegen` Turbo entry pointing at `.envio/**`.
