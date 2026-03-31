#!/usr/bin/env bash
#
# restore.sh — Restore a ponder_sync dump to a target database
#
# Usage:
#   ./scripts/restore.sh <dump_file> <target_database_url>
#
# Options (env vars):
#   FORCE=1   Overwrite if target already has ponder_sync data
#
# Examples:
#   ./scripts/restore.sh scripts/dumps/lil_nouns_sync.dump postgresql://user:pass@host:5432/lil_nouns
#   FORCE=1 ./scripts/restore.sh scripts/dumps/lil_nouns_sync.dump $DATABASE_URL

set -euo pipefail

DUMP_FILE="${1:?Usage: $0 <dump_file> <target_database_url>}"
TARGET_URL="${2:?Usage: $0 <dump_file> <target_database_url>}"

if [ ! -f "$DUMP_FILE" ]; then
  echo "ERROR: Dump file not found: ${DUMP_FILE}"
  exit 1
fi

FORCE="${FORCE:-0}"
DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)

echo "=== Ponder Sync Restore ==="
echo ""
echo "  Dump:   ${DUMP_FILE} (${DUMP_SIZE})"
echo "  Target: ${TARGET_URL%%@*}@***"
echo ""

# --- Connect ---
echo "[1/2] Connecting..."

if ! psql "$TARGET_URL" -c "SELECT 1" &>/dev/null; then
  echo "ERROR: Cannot connect to target database."
  exit 1
fi

# Check existing data
EXISTING=$(psql "$TARGET_URL" -tAc "SELECT count(*) FROM information_schema.schemata WHERE schema_name='ponder_sync';" 2>/dev/null || echo "0")
if [ "$EXISTING" != "0" ]; then
  EXISTING_INTERVALS=$(psql "$TARGET_URL" -tAc "SELECT count(*) FROM ponder_sync.intervals;" 2>/dev/null || echo "0")
  if [ "$EXISTING_INTERVALS" != "0" ]; then
    echo "  Target already has ponder_sync data (${EXISTING_INTERVALS} intervals)."
    if [ "$FORCE" != "1" ]; then
      echo "  Use FORCE=1 to overwrite."
      exit 1
    fi
    echo "  FORCE=1 — dropping existing ponder_sync..."
    psql "$TARGET_URL" -c "DROP SCHEMA ponder_sync CASCADE;" &>/dev/null
  fi
fi
echo "  OK."
echo ""

# --- Restore ---
echo "[2/2] Restoring..."

pg_restore --no-owner --no-privileges -d "$TARGET_URL" "$DUMP_FILE"

RESTORED_INTERVALS=$(psql "$TARGET_URL" -tAc "SELECT count(*) FROM ponder_sync.intervals;" 2>/dev/null || echo "0")
RESTORED_BLOCKS=$(psql "$TARGET_URL" -tAc "SELECT count(*) FROM ponder_sync.blocks;" 2>/dev/null || echo "0")
RESTORED_LOGS=$(psql "$TARGET_URL" -tAc "SELECT count(*) FROM ponder_sync.logs;" 2>/dev/null || echo "0")

echo "  Restored: ${RESTORED_INTERVALS} intervals, ${RESTORED_BLOCKS} blocks, ${RESTORED_LOGS} logs"

if [ "$RESTORED_INTERVALS" = "0" ]; then
  echo "ERROR: No intervals restored."
  exit 1
fi

echo ""
echo "Done. Start the indexer with DATABASE_URL pointing to this database."
echo ""
