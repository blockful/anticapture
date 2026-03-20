#!/usr/bin/env bash
#
# download_dump.sh — Download a dump file from S3 bucket
#
# S3 credentials are read from .env (S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY).
# Downloads to scripts/dumps/.
#
# Usage:
#   ./scripts/download_dump.sh <filename>

set -euo pipefail

KEY="${1:?Usage: $0 <filename>}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/_s3.sh"

DUMPS_DIR="${SCRIPT_DIR}/dumps"
mkdir -p "$DUMPS_DIR"
OUTPUT="${DUMPS_DIR}/${KEY}"

echo "=== S3 Download ==="
echo "  Bucket: ${S3_BUCKET}/${KEY}"
echo "  Output: ${OUTPUT}"
echo ""

EMPTY_HASH="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
s3_sign "GET" "$KEY" "$EMPTY_HASH"

echo "  Downloading..."
HTTP_CODE=$(curl -s -o "$OUTPUT" -w "%{http_code}" \
  -H "Host: ${S3_HOST}" \
  -H "x-amz-content-sha256: ${EMPTY_HASH}" \
  -H "x-amz-date: ${S3_DATE_ISO}" \
  -H "Authorization: ${S3_AUTH}" \
  "https://${S3_HOST}/${KEY}")

if [ "$HTTP_CODE" = "200" ]; then
  FILE_SIZE=$(du -h "$OUTPUT" | cut -f1)
  echo "  Done: ${OUTPUT} (${FILE_SIZE})"
else
  echo "  FAILED (HTTP ${HTTP_CODE})"
  cat "$OUTPUT" 2>/dev/null | head -5
  rm -f "$OUTPUT"
  exit 1
fi
echo ""
