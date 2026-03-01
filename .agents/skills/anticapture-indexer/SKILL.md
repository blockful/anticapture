---
name: anticapture-indexer
description: Used whenever adding a new DAO, changing the indexed data
---

# Indexer Package Guide

## Overview

- **Service ID**: `<dao>-indexer`
- **Port**: 42069
- **Stack**: Ponder, viem

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
- Avoid complex logic and external calls during indexing since it increases the indexing time

## Dependencies

- **PostgreSQL**: Database for storing indexed data
- **Ethereum RPC**: Blockchain node connection
- **Environment Variables**: See root `.env` for RPC URLs and database connection

## File Structure

```
apps/indexer/
├── src/
│   ├── eventHandlers/          # Event processing logic
│   ├── indexer/<dao>/          # Per-DAO implementations (ABIs)
│   └── ponder.schema.ts        # Ponder database schema
├── config/
│   └── <dao>.config.ts         # DAO-specific configurations
└── ponder.config.ts            # Main Ponder configuration
```

## Where to Put New Code

| What you're adding          | Where it goes            | Further information        |
| --------------------------- | ------------------------ | -------------------------- |
| Event handler               | `src/eventHandlers/`     |                            |
| DAO-specific implementation | `src/indexer/<dao>/`     |                            |
| DAO configuration           | `config/<dao>.config.ts` |                            |
| Database schema changes     | `src/ponder.schema.ts`   | `./references/database.md` |
