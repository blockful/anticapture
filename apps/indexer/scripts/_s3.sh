#!/usr/bin/env bash
#
# _s3.sh — Shared S3 credential loader for bucket scripts
#
# Reads S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY, S3_REGION
# from the indexer .env file. Env vars take precedence.

_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
_INDEXER_ENV="${_SCRIPT_DIR}/../.env"

if [ -f "$_INDEXER_ENV" ]; then
  _load_var() {
    local var="$1"
    if [ -z "${!var:-}" ]; then
      local val
      val=$(grep -E "^${var}=" "$_INDEXER_ENV" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
      if [ -n "$val" ]; then
        export "$var=$val"
      fi
    fi
  }
  _load_var S3_ENDPOINT
  _load_var S3_BUCKET
  _load_var S3_ACCESS_KEY
  _load_var S3_SECRET_KEY
  _load_var S3_REGION
fi

S3_ENDPOINT="${S3_ENDPOINT:?Set S3_ENDPOINT in .env or environment}"
S3_BUCKET="${S3_BUCKET:?Set S3_BUCKET in .env or environment}"
S3_ACCESS_KEY="${S3_ACCESS_KEY:?Set S3_ACCESS_KEY in .env or environment}"
S3_SECRET_KEY="${S3_SECRET_KEY:?Set S3_SECRET_KEY in .env or environment}"
S3_REGION="${S3_REGION:-auto}"

# Shared S3 v4 signing function
s3_sign() {
  local METHOD="$1"
  local KEY="$2"
  local CONTENT_HASH="$3"
  local EXTRA_HEADERS="${4:-}"

  local DATE_ISO DATE_SHORT HOST CANONICAL_URI
  DATE_ISO=$(date -u +%Y%m%dT%H%M%SZ)
  DATE_SHORT=$(date -u +%Y%m%d)
  HOST="${S3_BUCKET}.${S3_ENDPOINT#https://}"
  CANONICAL_URI="/${KEY}"
  SERVICE="s3"

  local CANONICAL_HEADERS="host:${HOST}\nx-amz-content-sha256:${CONTENT_HASH}\nx-amz-date:${DATE_ISO}"
  local SIGNED_HEADERS="host;x-amz-content-sha256;x-amz-date"

  if [ -n "$EXTRA_HEADERS" ]; then
    CANONICAL_HEADERS="${EXTRA_HEADERS}\n${CANONICAL_HEADERS}"
    SIGNED_HEADERS="content-type;${SIGNED_HEADERS}"
  fi

  local CANONICAL_REQUEST="${METHOD}\n${CANONICAL_URI}\n\n${CANONICAL_HEADERS}\n\n${SIGNED_HEADERS}\n${CONTENT_HASH}"
  local CANONICAL_REQUEST_HASH
  CANONICAL_REQUEST_HASH=$(printf "${CANONICAL_REQUEST}" | sha256sum | cut -d' ' -f1)

  local CREDENTIAL_SCOPE="${DATE_SHORT}/${S3_REGION}/${SERVICE}/aws4_request"
  local STRING_TO_SIGN="AWS4-HMAC-SHA256\n${DATE_ISO}\n${CREDENTIAL_SCOPE}\n${CANONICAL_REQUEST_HASH}"

  _hmac() {
    printf "$2" | openssl dgst -sha256 -mac HMAC -macopt "hexkey:$1" 2>/dev/null | cut -d' ' -f2
  }

  local DATE_KEY REGION_KEY SERVICE_KEY SIGNING_KEY SIGNATURE
  DATE_KEY=$(printf "${DATE_SHORT}" | openssl dgst -sha256 -mac HMAC -macopt "key:AWS4${S3_SECRET_KEY}" 2>/dev/null | cut -d' ' -f2)
  REGION_KEY=$(_hmac "$DATE_KEY" "$S3_REGION")
  SERVICE_KEY=$(_hmac "$REGION_KEY" "$SERVICE")
  SIGNING_KEY=$(_hmac "$SERVICE_KEY" "aws4_request")
  SIGNATURE=$(printf "${STRING_TO_SIGN}" | openssl dgst -sha256 -mac HMAC -macopt "hexkey:${SIGNING_KEY}" 2>/dev/null | cut -d' ' -f2)

  # Export for caller
  S3_AUTH="AWS4-HMAC-SHA256 Credential=${S3_ACCESS_KEY}/${CREDENTIAL_SCOPE}, SignedHeaders=${SIGNED_HEADERS}, Signature=${SIGNATURE}"
  S3_HOST="$HOST"
  S3_DATE_ISO="$DATE_ISO"
}
