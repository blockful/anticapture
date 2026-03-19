#!/usr/bin/env bash
set -euo pipefail

DAO_ID="${1:-}"

# Colors per service
C_API="\033[34m"       # blue
C_GATEWAY="\033[35m"   # magenta
C_GATEFUL="\033[36m"   # cyan
C_CODEGEN="\033[33m"   # yellow
C_DASHBOARD="\033[32m" # green
C_SCRIPT="\033[90m"    # gray (script-level logs)
C_RESET="\033[0m"

log() {
  printf "${C_SCRIPT}[dev]${C_RESET} %s\n" "$*"
}

# Run a command silently, only showing lines that contain error/ERR/Error
run_errors_only() {
  local color=$1
  local label=$2
  shift 2
  "$@" 2>&1 | while IFS= read -r line; do
    if [[ "$line" =~ [Ee][Rr][Rr][Oo][Rr] ]] || [[ "$line" =~ [Ff][Aa][Ii][Ll] ]]; then
      printf "${color}[%s]${C_RESET} %s\n" "$label" "$line"
    fi
  done
}

# Prefix each line of a command's output with a colored tag
# Optional: pass a ready_file and ready_pattern to signal when a log line matches
run_with_prefix() {
  local color=$1
  local label=$2
  local ready_file=$3
  local ready_pattern=$4
  shift 4
  "$@" 2>&1 | while IFS= read -r line; do
    printf "${color}[%s]${C_RESET} %s\n" "$label" "$line"
    if [ -n "$ready_file" ] && [ -n "$ready_pattern" ] && [[ "$line" == *"$ready_pattern"* ]]; then
      touch "$ready_file"
      ready_pattern="" # only match once
    fi
  done
}

# Wait until a marker file exists
wait_for_ready() {
  local ready_file=$1
  local name=$2
  local timeout=${3:-120}
  local elapsed=0
  log "Waiting for $name to be ready..."
  while [ ! -f "$ready_file" ]; do
    sleep 1
    elapsed=$((elapsed + 1))
    if [ "$elapsed" -ge "$timeout" ]; then
      log "Timed out waiting for $name"
      exit 1
    fi
  done
  log "$name is ready"
}

# Kill the entire process tree on exit
cleanup() {
  echo ""
  log "Shutting down..."
  # Send TERM to all processes in our process group
  trap - INT TERM EXIT
  rm -f "${GATEWAY_READY:-}" "${GATEFUL_READY:-}" 2>/dev/null
  kill 0 2>/dev/null || true
  wait 2>/dev/null
}
trap cleanup INT TERM EXIT

wait_for_port() {
  local port=$1
  local name=$2
  local timeout=${3:-60}
  local elapsed=0
  log "Waiting for $name on port $port..."
  while ! (lsof -i ":$port" -sTCP:LISTEN >/dev/null 2>&1 || ss -tlnH "sport = :$port" 2>/dev/null | grep -q LISTEN); do
    sleep 1
    elapsed=$((elapsed + 1))
    if [ "$elapsed" -ge "$timeout" ]; then
      log "Timed out waiting for $name on port $port"
      exit 1
    fi
  done
  log "$name is ready on port $port"
}

# Wrap a command with `railway run` for env injection, with fallback to running locally
railway_run() {
  local service=$1
  shift
  if railway run -e dev -s "$service" echo ok >/dev/null 2>&1; then
    railway run -e dev -s "$service" "$@"
  else
    log "Railway service $service not found, running locally with .env"
    "$@"
  fi
}

if [ -n "$DAO_ID" ]; then
  DAO_UPPER=$(echo "$DAO_ID" | tr '[:lower:]' '[:upper:]')

  # 1. Start API
  log "Starting API for $DAO_ID..."
  run_with_prefix "$C_API" "🐙 api" "" "" railway_run "$DAO_UPPER-api" pnpm api dev -- "$DAO_ID" &

  # 2. Wait for API
  wait_for_port 42069 "API"
  export "DAO_API_${DAO_UPPER}=http://localhost:42069"
else
  log "No DAO_ID provided, skipping local API"
fi

GATEWAY_READY=$(mktemp)
rm -f "$GATEWAY_READY"

log "Starting Gateway..."
run_with_prefix "$C_GATEWAY" "🌎 gateway" "$GATEWAY_READY" "Mesh running at" railway_run api-gateway pnpm gateway dev &

# 3. Wait for Gateway
wait_for_ready "$GATEWAY_READY" "Gateway"

GATEFUL_READY=$(mktemp)
rm -f "$GATEFUL_READY"

log "Starting Gateful..."
run_with_prefix "$C_GATEFUL" "🚪 gateful" "$GATEFUL_READY" "🚀 REST Gateway running" railway_run gateful pnpm gateful dev &

# 4. Wait for Gateful
wait_for_ready "$GATEFUL_READY" "Gateful"

# 5. Start Client (codegen + build watch, errors only)
#    Point codegen at the local gateway so types stay in sync
export ANTICAPTURE_GRAPHQL_ENDPOINT="http://localhost:4000/graphql"
log "Starting Client (silent, errors only)..."
run_errors_only "$C_CODEGEN" "🤝 client" pnpm client dev &

# 6. Start Dashboard – point it at the local Gateful so local backend changes are visible
export NEXT_PUBLIC_BASE_URL="http://localhost:4000/graphql"
log "Starting Dashboard..."
run_with_prefix "$C_DASHBOARD" "📺 dashboard" "" "" pnpm dashboard dev &

echo ""
log "All services running:"
if [ -n "$DAO_ID" ]; then
  printf "  ${C_API}🐙 API${C_RESET}       http://localhost:42069  ($DAO_ID)\n"
fi
printf "  ${C_GATEWAY}🌎 Gateway${C_RESET}   http://localhost:4000\n"
printf "  ${C_GATEFUL}🚪 Gateful${C_RESET}   http://localhost:4001\n"
printf "  ${C_CODEGEN}🤝 Client${C_RESET}    codegen + build watch\n"
printf "  ${C_DASHBOARD}📺 Dashboard${C_RESET} http://localhost:3000\n"
echo ""
log "Press Ctrl+C to stop all services."

wait
