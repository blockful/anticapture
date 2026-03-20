#!/usr/bin/env bash
#
# dump.sh — Dump Ponder's ponder_sync schema from a database
#
# Usage:
#   ./scripts/dump.sh <database_url> [output_file]
#
# Examples:
#   ./scripts/dump.sh postgresql://postgres:postgres@localhost:5432/lil_nouns
#   ./scripts/dump.sh $DATABASE_URL ./my_dump.dump

set -euo pipefail

DB_URL="${1:?Usage: $0 <database_url> [output_file]}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DUMPS_DIR="${SCRIPT_DIR}/dumps"
mkdir -p "$DUMPS_DIR"

DB_NAME=$(echo "$DB_URL" | sed 's|.*/||' | sed 's|\?.*||')
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT="${2:-${DUMPS_DIR}/${DB_NAME}_sync_${TIMESTAMP}.dump}"

echo "=== Ponder Sync Dump ==="
echo ""

# --- Verify ---
echo "[1/2] Verifying database..."

if ! psql "$DB_URL" -c "SELECT 1" &>/dev/null; then
  echo "ERROR: Cannot connect to database"
  exit 1
fi

INTERVAL_COUNT=$(psql "$DB_URL" -tAc "SELECT count(*) FROM ponder_sync.intervals;" 2>/dev/null || echo "0")
if [ "$INTERVAL_COUNT" = "0" ]; then
  echo "ERROR: No sync data found in this database."
  exit 1
fi

echo "  Synced intervals: ${INTERVAL_COUNT}"
psql "$DB_URL" -c "
  SELECT 'blocks' as data, count(*) as rows, pg_size_pretty(pg_total_relation_size('ponder_sync.blocks')) as size FROM ponder_sync.blocks
  UNION ALL SELECT 'logs', count(*), pg_size_pretty(pg_total_relation_size('ponder_sync.logs')) FROM ponder_sync.logs
  UNION ALL SELECT 'transactions', count(*), pg_size_pretty(pg_total_relation_size('ponder_sync.transactions')) FROM ponder_sync.transactions
  ORDER BY data;" 2>/dev/null
echo ""

# --- Dump ---
echo "[2/2] Dumping ponder_sync to '${OUTPUT}'..."

pg_dump -Fc --no-owner --no-privileges --schema=ponder_sync "$DB_URL" > "$OUTPUT"

DUMP_SIZE=$(du -h "$OUTPUT" | cut -f1)
echo "  Done: ${OUTPUT} (${DUMP_SIZE})"
echo ""
echo "Next steps:"
echo "  Backup to S3:  ./scripts/backup_dump.sh ${OUTPUT}"
echo "  Restore to DB: ./scripts/restore.sh ${OUTPUT} <target_database_url>"
echo ""
