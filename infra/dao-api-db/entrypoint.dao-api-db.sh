#!/bin/bash
# Derive the memory-dependent Postgres settings from the container's own cgroup
# limit, then hand off to the base image's entrypoint with them appended as -c
# flags.
#
# Why derive instead of hardcode: the DAO databases run on four different memory
# tiers (2 / 4 / 6 / 8 GB) off this one image, and Railway plan changes move a
# service between tiers without touching the repo. Reading the limit at boot
# keeps the settings correct through both.
#
# Why -c flags instead of ALTER SYSTEM: command-line options outrank
# postgresql.auto.conf, so this also neutralises the hand-applied
# `max_connections = 500` currently baked into every DAO volume — without
# writing to the volumes, and revertible by pointing a service back at the
# stock image.
set -euo pipefail

# Smallest tier in the fleet. Used when the limit is unreadable or unset ("max"),
# because under-provisioning degrades and over-provisioning OOMs.
readonly FALLBACK_BYTES=2000000000

# $1 = memory limit in bytes. Echoes "<max_connections> <effective_cache_size_mb>".
derive() {
  local bytes=$1 gb mc ecs_mb

  # Non-numeric covers both "max" (no limit set) and a missing cgroup file.
  if [[ ! $bytes =~ ^[0-9]+$ ]] || (( bytes == 0 )); then
    bytes=$FALLBACK_BYTES
  fi

  # Round to the nearest GB: cgroup reports 1999998976 for a 2 GB tier, and
  # truncating that to 1 would put every tier a notch too low.
  gb=$(( (bytes + 500000000) / 1000000000 ))

  # ~20 backends per GB, floored so Ponder's two default-30 pools always fit and
  # capped so a large tier can't authorise more unreclaimable memory than the
  # page cache can spare. 500 backends against the 2 GB tier is ~2.5 GB of
  # non-reclaimable memory — the OOM path this exists to close.
  mc=$(( gb * 20 ))
  (( mc < 75 )) && mc=75
  (( mc > 200 )) && mc=200

  # Planner hint only — allocates nothing. shared_buffers stays at its 128 MB
  # default, so effectively all of this is kernel page cache.
  ecs_mb=$(( bytes * 65 / 100 / 1048576 ))

  echo "$mc $ecs_mb"
}

# Asserts the tiers actually in the fleet plus both clamp boundaries.
# Run locally or in CI with: bash entrypoint.dao-api-db.sh --self-test
self_test() {
  local failed=0
  check() {
    local got
    got=$(derive "$1")
    if [[ $got != "$2" ]]; then
      echo "FAIL: derive($1) = '$got', expected '$2'" >&2
      failed=1
    fi
  }

  check 1999998976 "75 1239"    # 2 GB tier (nouns, shutter) — floored
  check 3999997952 "80 2479"    # 4 GB tier (ens, compound, uniswap@dev)
  check 5999996928 "120 3719"   # 6 GB tier (aave)
  check 8000000000 "160 4959"   # 8 GB tier (uniswap@prod)
  check 1000000000 "75 619"     # below the floor
  check 16000000000 "200 9918"  # above the cap
  check "max" "75 1239"         # no limit set -> fallback
  check 0 "75 1239"             # unreadable -> fallback

  (( failed )) && { echo "self-test FAILED" >&2; return 1; }
  echo "self-test OK"
}

if [[ ${1:-} == "--self-test" ]]; then
  self_test
  exit $?
fi

limit_bytes=$(cat /sys/fs/cgroup/memory.max 2>/dev/null || echo max)
read -r max_connections effective_cache_size_mb <<<"$(derive "$limit_bytes")"

# Escape hatches, in case one database needs to deviate without a redeploy of
# the image.
max_connections=${PG_MAX_CONNECTIONS:-$max_connections}
effective_cache_size=${PG_EFFECTIVE_CACHE_SIZE:-${effective_cache_size_mb}MB}

echo "[anticapture] memory.max=${limit_bytes} -> max_connections=${max_connections} effective_cache_size=${effective_cache_size}"

exec /usr/local/bin/wrapper.sh "$@" \
  -c max_connections="$max_connections" \
  -c effective_cache_size="$effective_cache_size"
