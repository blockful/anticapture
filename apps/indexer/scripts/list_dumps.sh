#!/usr/bin/env bash
#
# list_dumps.sh — List files in S3 bucket
#
# S3 credentials are read from .env (S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY).
#
# Usage:
#   ./scripts/list_dumps.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/_s3.sh"

echo "=== S3 Bucket: ${S3_BUCKET} ==="
echo ""

EMPTY_HASH="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
s3_sign "GET" "" "$EMPTY_HASH"

RESPONSE=$(curl -s \
  -H "Host: ${S3_HOST}" \
  -H "x-amz-content-sha256: ${EMPTY_HASH}" \
  -H "x-amz-date: ${S3_DATE_ISO}" \
  -H "Authorization: ${S3_AUTH}" \
  "https://${S3_HOST}/")

# Parse XML response — extract Key and Size pairs
echo "$RESPONSE" | grep -oP '<Key>[^<]+</Key>\s*<LastModified>[^<]+</LastModified>\s*<Size>[^<]+</Size>' | \
  sed 's/<Key>/  /; s/<\/Key>/  /; s/<LastModified>//; s/<\/LastModified>/  /; s/<Size>//; s/<\/Size>//' | \
  while read -r name date size; do
    if [ -n "$name" ]; then
      human_size=$(numfmt --to=iec "$size" 2>/dev/null || echo "${size}B")
      printf "  %-50s %s  %s\n" "$name" "$date" "$human_size"
    fi
  done

echo ""
