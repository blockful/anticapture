## Cursor Cloud specific instructions

### Environment

- **Node.js 22** and **pnpm 10.10.0** are pre-installed (corepack-managed).
- After `pnpm install`, you must rebuild esbuild (`pnpm rebuild esbuild`) because pnpm 10 blocks postinstall scripts by default in this repo. Without this, `tsx` (used by gateway and gateful dev commands) will fail.
- After install, build the `@anticapture/observability` package (`pnpm --filter @anticapture/observability build`) since it is a `workspace:*` dependency required by most apps before they can lint or typecheck.

### Codegen

Generated types are **not** committed. Run codegen before typecheck or lint:

```bash
pnpm gql-client codegen   # generates packages/graphql-client/generated/
pnpm client codegen        # generates packages/anticapture-client/generated/
pnpm client build          # builds the client dist/ for dashboard imports
```

Both codegen steps read static schema files already in the repo (`apps/api-gateway/schema.graphql` and `apps/gateful/openapi/gateful.json`), so no running services are needed.

### Running services locally

See `CLAUDE.md` for the canonical startup order and `.claude/skills/local-dev/SKILL.md` for full details.

**Without Railway CLI / database credentials** (common in Cloud Agent):

| Service   | Command                                                                                                                 | Notes                                                              |
| --------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Gateful   | `cd apps/gateful && npx tsx watch src/index.ts`                                                                         | Starts on :4001 with 0 DAO APIs (health + docs work)               |
| Dashboard | `NEXT_PUBLIC_BASE_URL=http://localhost:4000/graphql NEXT_PUBLIC_GATEFUL_URL=http://localhost:4001 npx next dev --turbo` | Starts on :3000, renders full UI with governance data from Gateful |

The API Gateway (`apps/api-gateway`) requires at least one reachable `DAO_API_*` endpoint to boot successfully (it fetches OpenAPI specs from upstream APIs during initialization). Without Railway access or a local API+database, the gateway will crash on startup.

### Lint / Typecheck / Test

```bash
pnpm lint          # all packages (dashboard has 2 pre-existing prettier errors)
pnpm typecheck     # all 14 packages
pnpm test          # unit tests (no DB or network needed)
```

### Key caveats

- The dashboard fetches DAO governance data from a remote Gateful API configured via `NEXT_PUBLIC_GATEFUL_URL`. When running against a local Gateful with 0 DAO APIs, the Panel page still renders with cached/default data from the build.
- `pnpm dev` (the full-stack dev script at `scripts/dev.sh`) requires Railway CLI authentication. Use individual service commands instead in Cloud Agent.
- The `pnpm approve-builds` command is interactive and should not be used in CI/Cloud. Use `pnpm rebuild <package>` for specific native dependencies instead.
