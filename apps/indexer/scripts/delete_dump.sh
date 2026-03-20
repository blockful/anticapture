#!/usr/bin/env bash
#
# delete_dump.sh — Delete a dump file from S3 bucket
#
# S3 credentials are read from .env (S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY).
#
# Usage:
#   ./scripts/delete_dump.sh <filename>

set -euo pipefail

KEY="${1:?Usage: $0 <filename>}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/_s3.sh"

echo "=== S3 Delete ==="
echo "  Bucket: ${S3_BUCKET}/${KEY}"
echo ""

EMPTY_HASH="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
s3_sign "DELETE" "$KEY" "$EMPTY_HASH"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X DELETE \
  -H "Host: ${S3_HOST}" \
  -H "x-amz-content-sha256: ${EMPTY_HASH}" \
  -H "x-amz-date: ${S3_DATE_ISO}" \
  -H "Authorization: ${S3_AUTH}" \
  "https://${S3_HOST}/${KEY}")

if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
  echo "  Deleted."
else
  echo "  FAILED (HTTP ${HTTP_CODE})"
  exit 1
fi
echo ""
