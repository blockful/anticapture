---
name: anticapture-indexer
description: Use for apps/indexer work: event handlers, DAO indexer implementations, Ponder schema/config changes, and indexer safety checks.
---

# Indexer Package Guide

## Use This Skill When

- You are editing `apps/indexer`.
- You are changing event handling, DAO integrations, or Ponder schema/config.
- You need to assess reindex impact before changes.

## Package Snapshot

- Location: `apps/indexer`
- Stack: Ponder + viem
- Core paths:
  - `src/eventHandlers/`
  - `src/indexer/<dao>/`
  - `ponder.schema.ts`
  - `config/<dao>.config.ts`

## Critical Warnings

**Treat all indexer edits as high-risk for reindex cost.**

- Only run the indexer when explicitly asked
- Avoid unnecessary changes to indexer code
- Full reindexing can take significant time depending on chain history
- Keep handlers deterministic and lightweight; avoid heavy/external calls in hot paths

## Where to Put New Code

| What you're adding          | Where it goes            | Further information        |
| --------------------------- | ------------------------ | -------------------------- |
| Event handler               | `src/eventHandlers/`     |                            |
| DAO-specific implementation | `src/indexer/<dao>/`     |                            |
| DAO configuration           | `config/<dao>.config.ts` |                            |
| Database schema changes     | `src/ponder.schema.ts`   | `./references/database.md` |

## Workflow

1. Minimize scope of changes and prefer surgical updates.
2. If schema changes, assess downstream API mapping impact.
3. Run safe verification:
   - `pnpm run --filter=@anticapture/indexer typecheck`
   - `pnpm run --filter=@anticapture/indexer lint`
