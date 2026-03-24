#!/usr/bin/env bash
set -euo pipefail

USE_RAILWAY=false
DAO_ID=""

# Parse arguments
for arg in "$@"; do
  case "$arg" in
    --rw) USE_RAILWAY=true ;;
    *) DAO_ID="$arg" ;;
  esac
done

# Colors per service
C_INDEXER="\033[31m"   # red
C_API="\033[34m"       # blue
C_GATEWAY="\033[35m"   # magenta
C_GATEFUL="\033[36m"   # cyan
C_CODEGEN="\033[33m"   # yellow
C_DASHBOARD="\033[32m" # green
C_SCRIPT="\033[90m"    # gray
C_RESET="\033[0m"

log() { printf "${C_SCRIPT}[dev]${C_RESET} %s\n" "$*"; }

run_with_prefix() {
  local color=$1 label=$2 ready_file=$3 ready_pattern=$4
  shift 4
  "$@" 2>&1 | while IFS= read -r line; do
    printf "${color}[%s]${C_RESET} %s\n" "$label" "$line"
    if [ -n "$ready_file" ] && [ -n "$ready_pattern" ] && [[ "$line" == *"$ready_pattern"* ]]; then
      touch "$ready_file"
      ready_pattern=""
    fi
  done
}

run_errors_only() {
  local color=$1 label=$2
  shift 2
  "$@" 2>&1 | while IFS= read -r line; do
    if [[ "$line" =~ [Ee][Rr][Rr][Oo][Rr] ]] || [[ "$line" =~ [Ff][Aa][Ii][Ll] ]]; then
      printf "${color}[%s]${C_RESET} %s\n" "$label" "$line"
    fi
  done
}

wait_for_ready() {
  local ready_file=$1 name=$2 timeout=${3:-120} elapsed=0
  log "Waiting for $name..."
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

wait_for_port() {
  local port=$1 name=$2 timeout=${3:-60} elapsed=0
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

cleanup() {
  echo ""
  log "Shutting down..."
  trap - INT TERM EXIT
  rm -f "${GATEWAY_READY:-}" "${GATEFUL_READY:-}" 2>/dev/null
  kill 0 2>/dev/null || true
  wait 2>/dev/null
}
trap cleanup INT TERM EXIT

# Wrap a command with `railway run` for env injection when --rw flag is set
railway_run() {
  local service=$1
  shift
  if [ "$USE_RAILWAY" = true ]; then
    pnpm railway run -e dev -s "$service" "$@"
  else
    "$@"
  fi
}

# Kill anything already running on our ports
for port in "${PORTS[@]}"; do
  pid=$(lsof -ti ":$port" 2>/dev/null || true)
  if [ -n "$pid" ]; then
    log "Killing existing process on port $port (pid $pid)"
    kill "$pid" 2>/dev/null || true
  fi
done
sleep 1

# 1. Indexer (only with --indexer flag, requires API)
if [ "$RUN_INDEXER" = true ] && [ "$RUN_API" = true ]; then
  log "Starting Indexer for $DAO_ID..."
  export RAILWAY_DEPLOYMENT_ID="${DAO_ID}-dev"
  run_with_prefix "$C_INDEXER" "⛓ indexer" "" "" pnpm indexer start -- --port "$PORT_INDEXER" &
elif [ "$RUN_INDEXER" = true ]; then
  log "Skipping Indexer (requires DAO_ID to run)"
else
  log "Skipping Indexer (use --indexer to enable)"
fi

# 2. API (only when DAO_ID is provided)
if [ "$RUN_API" = true ]; then
  log "Starting API for $DAO_ID..."
  run_with_prefix "$C_API" "🐙 api" "" "" railway_run "${DAO_ID}-api" pnpm api dev -- "$DAO_ID" &

  wait_for_port "$PORT_API" "API"
  export "DAO_API_${DAO_ID}=http://localhost:${PORT_API}"
else
  log "Skipping API (no DAO_ID provided, using DAO_API_* from .env)"
fi

# 3. Gateway
GATEWAY_READY=$(mktemp)
rm -f "$GATEWAY_READY"
log "Starting Gateway..."
run_with_prefix "$C_GATEWAY" "🌎 gateway" "$GATEWAY_READY" "Mesh running at" railway_run api-gateway pnpm gateway dev &
wait_for_ready "$GATEWAY_READY" "Gateway"

# 4. Gateful
GATEFUL_READY=$(mktemp)
rm -f "$GATEFUL_READY"
log "Starting Gateful..."
run_with_prefix "$C_GATEFUL" "🚪 gateful" "$GATEFUL_READY" "🚀 REST Gateway running" railway_run gateful pnpm gateful dev &
wait_for_ready "$GATEFUL_READY" "Gateful"

# 5. Client — codegen + build watch
export ANTICAPTURE_GRAPHQL_ENDPOINT="http://localhost:${PORT_GATEWAY}/graphql"
log "Starting Client (silent, errors only)..."
run_errors_only "$C_CODEGEN" "🤝 client" pnpm client dev &

# 6. Dashboard
export NEXT_PUBLIC_BASE_URL="http://localhost:${PORT_GATEWAY}/graphql"
log "Starting Dashboard..."
run_with_prefix "$C_DASHBOARD" "📺 dashboard" "" "" pnpm dashboard dev &

echo ""
log "All services running:"
if [ "$RUN_INDEXER" = true ] && [ "$RUN_API" = true ]; then
  printf "  ${C_INDEXER}⛓ Indexer${C_RESET}   http://localhost:${PORT_INDEXER}  ($DAO_ID)\n"
fi
if [ "$RUN_API" = true ]; then
  printf "  ${C_API}🐙 API${C_RESET}       http://localhost:${PORT_API}  ($DAO_ID)\n"
fi
printf "  ${C_GATEWAY}🌎 Gateway${C_RESET}   http://localhost:${PORT_GATEWAY}\n"
printf "  ${C_GATEFUL}🚪 Gateful${C_RESET}   http://localhost:${PORT_GATEFUL}\n"
printf "  ${C_CODEGEN}🤝 Client${C_RESET}    codegen + build watch\n"
printf "  ${C_DASHBOARD}📺 Dashboard${C_RESET} http://localhost:${PORT_DASHBOARD}\n"
echo ""
log "Press Ctrl+C to stop all services."

wait
