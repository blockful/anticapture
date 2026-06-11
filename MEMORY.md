# MEMORY.md — shared agent memory

Durable, hard-won knowledge about this codebase, written by agents and humans for the
next agent or human. See "Shared memory" in `AGENTS.md` for what belongs here (and what
doesn't). Entries are short, dated, factual, and grouped by topic. Prune what goes stale.

## Tooling & environment

- 2026-06-11 — `pnpm <service> <task>` aliases go through turbo: a task only resolves if
  it's registered in `turbo.json` (see `@anticapture/indexer#db:*` for the wildcard
  pattern). `pnpm --filter <pkg> <script>` bypasses turbo and runs the script directly.
- 2026-06-11 — `pnpm install --filter <pkg>` prunes other workspace packages'
  `node_modules`. After a filtered install, run a full `pnpm install` before building or
  testing siblings.
- 2026-06-11 — Gateful's `index.test.ts` can flake on cold vitest cache (dynamic import
  of the app graph exceeds the 10s hook timeout). Re-run before treating it as a real
  failure.

## Architecture decisions

- 2026-06-11 — Per-tenant API tokens (DEV-758): Tokenful owns the token store; Gateful is
  the single auth guardian; the MCP server forwards the caller's bearer instead of
  swapping identities. Legacy `BLOCKFUL_API_TOKEN` / `ANTICAPTURE_MCP_API_KEY` paths must
  survive until rollout step 4 (see `docs/specs/dev-758-gateful-token-service.md`) —
  deleting them early breaks prod or opens the MCP unauthenticated between deploys.

## Gotchas

- 2026-06-11 — drizzle-kit cannot serialize `bigint` column defaults (JSON.stringify
  throws on BigInt in snapshot generation). Omit the default and supply the value on
  insert.
- 2026-06-11 — drizzle-orm ≥0.45 wraps driver errors in `DrizzleQueryError`; the Postgres
  error `code` (e.g. `23505` unique violation) lives down the `cause` chain, not on the
  thrown error itself.
