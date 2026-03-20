#!/usr/bin/env bash
#
# backup_dump.sh — Upload a dump file to S3 bucket
#
# S3 credentials are read from .env (S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY).
#
# Usage:
#   ./scripts/backup_dump.sh <dump_file>

set -euo pipefail

FILE="${1:?Usage: $0 <dump_file>}"

if [ ! -f "$FILE" ]; then
  echo "ERROR: File not found: ${FILE}"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/_s3.sh"

KEY="$(basename "$FILE")"
FILE_SIZE=$(du -h "$FILE" | cut -f1)
CONTENT_HASH=$(sha256sum "$FILE" | cut -d' ' -f1)

echo "=== S3 Upload ==="
echo "  File:   ${FILE} (${FILE_SIZE})"
echo "  Bucket: ${S3_BUCKET}/${KEY}"
echo ""

s3_sign "PUT" "$KEY" "$CONTENT_HASH" "content-type:application/octet-stream"

echo "  Uploading..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X PUT \
  -H "Content-Type: application/octet-stream" \
  -H "Host: ${S3_HOST}" \
  -H "x-amz-content-sha256: ${CONTENT_HASH}" \
  -H "x-amz-date: ${S3_DATE_ISO}" \
  -H "Authorization: ${S3_AUTH}" \
  --data-binary "@${FILE}" \
  "https://${S3_HOST}/${KEY}")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo "  Done."
else
  echo "  FAILED (HTTP ${HTTP_CODE})"
  exit 1
fi
echo ""
