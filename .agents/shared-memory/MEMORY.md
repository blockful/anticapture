# Shared agent memory (auto-managed)

Auto-memory Claude writes across the team, git-tracked so it's shared (setup + caveats in
`./README.md`). Writing rules — no secrets, no machine-local paths — are in the repo
`CLAUDE.md`.

## Testing

- **API tests need a local Redis running.** `apps/api` uses Redis for caching
  (`apps/api/src/cache/dao-cache.ts`), so integration tests connect to a Redis instance.
  Start one locally before running `pnpm api test` (e.g. `docker run -p 6379:6379 redis`).
  Pure unit runs that don't touch the cache can use `pnpm api test:unit`.
