# Indexer Package Guide

## Overview

- **Service ID**: `<dao>-indexer`
- **Port**: 42069
- **Stack**: Ponder 0.16, Hono 4.10, viem 2.37, Zod 3.25
- **Purpose**: Real-time blockchain event indexing for DAO governance contracts

## What It Does

Monitors and indexes governance-related smart contracts including:

- Proposals, votes, delegations
- Token transfers and balances
- Historical balance snapshots
- Integration with external APIs (CoinGecko, Dune Analytics)

## Critical Warnings

⚠️ **EVERY CODE CHANGE TRIGGERS A FULL REINDEX**

- Only run the indexer when explicitly asked
- Avoid unnecessary changes to indexer code
- Full reindexing can take significant time depending on chain history
- Coordinate with team before making schema changes

## Commands

```bash
# Development (use with caution!)
pnpm indexer dev --config config/<dao>    # Triggers full reindex!

# Verification (run after every change)
pnpm indexer typecheck                    # Type checking
pnpm indexer lint                         # Lint checking
pnpm indexer lint:fix                     # Auto-fix lint issues
```

## Dependencies

- **PostgreSQL**: Database for storing indexed data
- **Ethereum RPC**: Blockchain node connection
- **Environment Variables**: See root `.env` for RPC URLs and database connection

## File Structure

```
apps/indexer/
├── src/
│   ├── eventHandlers/          # Event processing logic
│   ├── indexer/<dao>/          # Per-DAO implementations
│   └── ponder.schema.ts        # Source of truth for database schema
├── config/
│   └── <dao>.config.ts         # DAO-specific configurations
└── ponder.config.ts            # Main Ponder configuration
```

## Where to Put New Code

| What you're adding          | Where it goes                       |
| --------------------------- | ----------------------------------- |
| Event handler               | `src/eventHandlers/`                |
| DAO-specific implementation | `src/indexer/<dao>/`                |
| DAO configuration           | `config/<dao>.config.ts`            |
| Database schema changes     | `src/ponder.schema.ts` (ask first!) |

## Database Schema

**Important**: The schema in `src/ponder.schema.ts` is the **source of truth**.

When schema changes are needed:

1. Modify `src/ponder.schema.ts` first
2. Ask before proceeding (triggers reindex + API changes)
3. Update corresponding Drizzle schema in `apps/api/src/database/schema/`

## Development Workflow

1. **Before making changes**: Confirm with team that indexer changes are needed
2. **Make changes**: Edit event handlers or schema
3. **Test locally**: Run `pnpm indexer dev --config config/<dao>` (be prepared to wait for reindex)
4. **Verify**: Run `pnpm indexer typecheck && pnpm indexer lint`
5. **Commit**: Follow conventional commits
6. **Deploy**: Ask before deploying (coordinate with team)

## Testing

Currently, the indexer relies on:

- Ponder's built-in validation
- Manual testing with development runs
- Integration testing through API layer

## Common Issues

- **Long reindex times**: Expected behavior when schema or handlers change
- **RPC rate limits**: Configure appropriate RPC endpoints in `.env`
- **Database connection errors**: Ensure PostgreSQL is running and accessible
- **Missing events**: Check contract addresses and start blocks in config

## Related Documentation

- [Ponder Documentation](https://ponder.sh)
- Root `AGENTS.md` for general guidelines
- `apps/api/AGENTS.md` for database schema mapping
