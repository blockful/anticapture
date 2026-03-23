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

# Parse XML response — extract Key, LastModified, Size from each <Contents> block
KEYS=($(echo "$RESPONSE" | grep -oP '<Key>[^<]+</Key>' | sed 's/<[^>]*>//g'))
DATES=($(echo "$RESPONSE" | grep -oP '<LastModified>[^<]+</LastModified>' | sed 's/<[^>]*>//g'))
SIZES=($(echo "$RESPONSE" | grep -oP '<Size>[^<]+</Size>' | sed 's/<[^>]*>//g'))

if [ ${#KEYS[@]} -eq 0 ]; then
  echo "  (empty)"
else
  for i in "${!KEYS[@]}"; do
    human_size=$(numfmt --to=iec "${SIZES[$i]}" 2>/dev/null || echo "${SIZES[$i]}B")
    printf "  %-50s %s  %s\n" "${KEYS[$i]}" "${DATES[$i]}" "$human_size"
  done
fi

echo ""
