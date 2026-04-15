#!/usr/bin/env bash
set -euo pipefail

USE_RAILWAY=false
RUN_INDEXER=false
DEBUG_API=false
DAO_NAME=""

# Parse arguments
for arg in "$@"; do
  case "$arg" in
    --rw) USE_RAILWAY=true ;;
    --indexer) RUN_INDEXER=true ;;
    --debug-api) DEBUG_API=true ;;
    *) DAO_NAME="$arg" ;;
  esac
done

# Ports
PORT_INDEXER=42070
PORT_API=42069
PORT_GATEWAY=4000
PORT_GATEFUL=4001
PORT_DASHBOARD=3000
PORT_ADDRESS_ENRICHMENT=3001
PORTS=("$PORT_INDEXER" "$PORT_API" "$PORT_GATEWAY" "$PORT_GATEFUL" "$PORT_DASHBOARD" "$PORT_ADDRESS_ENRICHMENT")

# DAO name → short ID mapping (used to run the API)
dao_id_for() {
  case "$1" in
    uniswap)  echo "uni" ;;
    gitcoin)  echo "gtc" ;;
    scroll)   echo "scr" ;;
    shutter)  echo "shu" ;;
    compound) echo "comp" ;;
    *)        echo "$1" ;;
  esac
}

# Derived flags
RUN_API=false
DAO_ID=""
if [ -n "$DAO_NAME" ]; then
  RUN_API=true
  DAO_ID=$(dao_id_for "$DAO_NAME")
fi

# Colors per service
C_INDEXER="\033[31m"           # red
C_API="\033[34m"               # blue
C_GATEWAY="\033[35m"           # magenta
C_GATEFUL="\033[36m"           # cyan
C_CODEGEN="\033[33m"           # yellow
C_DASHBOARD="\033[32m"         # green
C_ADDRESS_ENRICHMENT="\033[96m" # bright cyan
C_SCRIPT="\033[90m"            # gray
C_RESET="\033[0m"

log() { printf "${C_SCRIPT}[dev]${C_RESET} %s\n" "$*"; }

run_with_prefix() {
  local color=$1 label=$2 ready_file=$3 ready_pattern=$4
  shift 4
  log "Running: $*"
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
  log "Running: $*"
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
  local -a overrides=()
  while [[ "${1:-}" == *=* ]]; do
    overrides+=("$1")
    shift
  done

  local service=$1
  shift
  if [ "$USE_RAILWAY" = true ]; then
    log "railway_run: pnpm railway run -e dev -s $service $*"
    pnpm railway run -e dev -s "$service" "$@"
  else
    log "railway_run (no --rw): $*"
    "$@"
  fi
}

# Always try railway for the API; fall back to plain execution (.env) if service not found
railway_run_api() {
  local service=$1
  shift
  if pnpm railway run -e dev -s "$service" true >/dev/null 2>&1; then
    log "railway_run_api: pnpm railway run -e dev -s $service $*"
    pnpm railway run -e dev -s "$service" "$@"
  else
    log "railway_run_api: Railway service '$service' not found, falling back to: $*"
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
  log "Starting Indexer for $DAO_NAME..."
  export RAILWAY_DEPLOYMENT_ID="${DAO_NAME}-dev"
  run_with_prefix "$C_INDEXER" "⛓ indexer" "" "" pnpm indexer start -- --port "$PORT_INDEXER" &
elif [ "$RUN_INDEXER" = true ]; then
  log "Skipping Indexer (requires DAO_ID to run)"
else
  log "Skipping Indexer (use --indexer to enable)"
fi

# 2. API (only when DAO_ID is provided)
if [ "$DEBUG_API" = true ] && [ "$RUN_API" = true ]; then
  log "Waiting for API on port $PORT_API (start it from your IDE debugger)..."
  wait_for_port "$PORT_API" "API (debugger)"
  DAO_ID_UPPER=$(echo "$DAO_ID" | tr '[:lower:]' '[:upper:]')
  export "DAO_API_${DAO_ID_UPPER}=http://localhost:${PORT_API}"
elif [ "$RUN_API" = true ]; then
  log "Starting API for $DAO_NAME..."
  run_with_prefix "$C_API" "🐙 api" "" "" railway_run_api "${DAO_NAME}-api" pnpm api dev -- "$DAO_NAME" &

  wait_for_port "$PORT_API" "API"
  DAO_ID_UPPER=$(echo "$DAO_ID" | tr '[:lower:]' '[:upper:]')
  export "DAO_API_${DAO_ID_UPPER}=http://localhost:${PORT_API}"
else
  log "Skipping API (no DAO_NAME provided, using DAO_API_* from .env)"
fi

# 3. Address Enrichment (always runs with railway env injection)
log "Starting Address Enrichment..."
run_with_prefix "$C_ADDRESS_ENRICHMENT" "💰 enrichment" "" "" pnpm railway run -e dev -s address-enrichment pnpm address dev &
wait_for_port "$PORT_ADDRESS_ENRICHMENT" "Address Enrichment"
export ADDRESS_ENRICHMENT_API_URL="http://localhost:${PORT_ADDRESS_ENRICHMENT}"

# 4. Gateway
GATEWAY_READY=$(mktemp)
rm -f "$GATEWAY_READY"
log "Starting Gateway..."
declare -a GATEWAY_OVERRIDES=()
if [ "$RUN_API" = true ]; then
  GATEWAY_OVERRIDES+=("DAO_API_${DAO_ID}=http://localhost:${PORT_API}")
fi
run_with_prefix "$C_GATEWAY" "🌎 gateway" "$GATEWAY_READY" "Mesh running at" railway_run ${GATEWAY_OVERRIDES[@]+"${GATEWAY_OVERRIDES[@]}"} api-gateway pnpm gateway dev &
wait_for_ready "$GATEWAY_READY" "Gateway"

# Watchdog: when API recovers after being down, touch the sentinel file so tsx reloads the gateway
if [ "$RUN_API" = true ]; then
  (
    api_was_up=true
    while true; do
      sleep 3
      if lsof -i ":$PORT_API" -sTCP:LISTEN >/dev/null 2>&1; then
        if [ "$api_was_up" = false ]; then
          log "API recovered — reloading Gateway and Gateful..."
          touch "$(dirname "$0")/../apps/api-gateway/src/_dev-reload.ts"
          touch "$(dirname "$0")/../apps/gateful/src/_dev-reload.ts"
          api_was_up=true
        fi
      else
        api_was_up=false
      fi
    done
  ) &
fi

# 5. Gateful
GATEFUL_READY=$(mktemp)
rm -f "$GATEFUL_READY"
log "Starting Gateful..."
run_with_prefix "$C_GATEFUL" "🚪 gateful" "$GATEFUL_READY" "🚀 REST Gateway running" railway_run gateful pnpm gateful dev &
wait_for_ready "$GATEFUL_READY" "Gateful"

# 6. Clients — codegen + build watch
export ANTICAPTURE_GRAPHQL_ENDPOINT="http://localhost:${PORT_GATEWAY}/graphql"
log "Starting GraphQL Client (silent, errors only)..."
run_errors_only "$C_CODEGEN" "🤝 gql-client" pnpm gql-client dev &
log "Starting REST Client (silent, errors only)..."
run_errors_only "$C_CODEGEN" "🤝 client" pnpm client dev &

# 7. Dashboard
export NEXT_PUBLIC_BASE_URL="http://localhost:${PORT_GATEWAY}/graphql"
export NEXT_PUBLIC_GATEFUL_URL="http://localhost:${PORT_GATEFUL}"
log "Starting Dashboard..."
run_with_prefix "$C_DASHBOARD" "📺 dashboard" "" "" pnpm dashboard dev &

echo ""
log "All services running:"
if [ "$RUN_INDEXER" = true ] && [ "$RUN_API" = true ]; then
  printf "  ${C_INDEXER}⛓ Indexer${C_RESET}   http://localhost:${PORT_INDEXER}  ($DAO_NAME)\n"
fi
if [ "$RUN_API" = true ]; then
  printf "  ${C_API}🐙 API${C_RESET}       http://localhost:${PORT_API}  ($DAO_NAME)\n"
fi
printf "  ${C_ADDRESS_ENRICHMENT}💰 Enrichment${C_RESET} http://localhost:${PORT_ADDRESS_ENRICHMENT}\n"
printf "  ${C_GATEWAY}🌎 Gateway${C_RESET}   http://localhost:${PORT_GATEWAY}\n"
printf "  ${C_GATEFUL}🚪 Gateful${C_RESET}   http://localhost:${PORT_GATEFUL}\n"
printf "  ${C_CODEGEN}🤝 GraphQL Client${C_RESET} codegen + build watch\n"
printf "  ${C_CODEGEN}🤝 REST Client${C_RESET}    codegen + build watch\n"
printf "  ${C_DASHBOARD}📺 Dashboard${C_RESET} http://localhost:${PORT_DASHBOARD}\n"
echo ""
log "Press Ctrl+C to stop all services."

wait
