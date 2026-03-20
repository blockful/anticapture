# Indexer Sync Migration

Index locally on reth (free), ship the RPC cache to the cloud (no RPC cost).

## Scripts

### Database

| Script                                  | What it does                            |
| --------------------------------------- | --------------------------------------- |
| `dump.sh <database_url>`                | Dumps `ponder_sync` to `scripts/dumps/` |
| `restore.sh <dump_file> <database_url>` | Restores dump to target database        |

### S3 Bucket

Credentials are read from `apps/indexer/.env` (`S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_REGION`). See `.env.example`.

| Script                        | What it does                                   |
| ----------------------------- | ---------------------------------------------- |
| `backup_dump.sh <dump_file>`  | Uploads dump to bucket                         |
| `download_dump.sh <filename>` | Downloads dump from bucket to `scripts/dumps/` |
| `list_dumps.sh`               | Lists files in bucket                          |
| `delete_dump.sh <filename>`   | Deletes file from bucket                       |

## Quick Start

```bash
cd apps/indexer

# 1. Index locally
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lil_nouns \
DAO_ID=LIL_NOUNS pnpm dev

# 2. Stop indexer (Ctrl+C), then dump
./scripts/dump.sh postgresql://postgres:postgres@localhost:5432/lil_nouns

# 3. Restore to cloud DB
./scripts/restore.sh scripts/dumps/lil_nouns_sync_*.dump \
  postgresql://user:pass@cloud-host:5432/lil_nouns

# 4. (Optional) Back up dump to S3
./scripts/backup_dump.sh scripts/dumps/lil_nouns_sync_*.dump

# 5. Start indexer on cloud
DATABASE_URL=postgresql://user:pass@cloud-host:5432/lil_nouns \
DAO_ID=LIL_NOUNS RPC_URL=<cloud-rpc> pnpm indexer dev
```

## How It Works

Ponder stores raw blockchain data (blocks, logs, txs) in `ponder_sync`.
Application tables are derived from this cache by running event handlers —
CPU work, no RPC calls needed.

Dumping `ponder_sync` and restoring it on the cloud skips the expensive
historical RPC backfill entirely. Ponder only calls RPC for new blocks
after the cached range.

## Options

`FORCE=1` with restore.sh overwrites existing ponder_sync data on the target.

## Troubleshooting

| Error                               | Fix                                        |
| ----------------------------------- | ------------------------------------------ |
| Ponder still makes RPC calls        | Expected for blocks after the cached range |
| "schema ponder_sync already exists" | Use `FORCE=1` with restore.sh              |
