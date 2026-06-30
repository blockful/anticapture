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
PORT_GATEFUL=4001
PORT_DASHBOARD=3000
PORT_ADDRESS_ENRICHMENT=3001
PORT_RELAYER=3002
PORTS=("$PORT_INDEXER" "$PORT_API" "$PORT_GATEFUL" "$PORT_DASHBOARD" "$PORT_ADDRESS_ENRICHMENT" "$PORT_RELAYER")

# DAO name → short ID mapping (used to run the API)
dao_id_for() {
  case "$1" in
    uniswap)  echo "uni" ;;
    gitcoin)  echo "gtc" ;;
    scroll)   echo "scr" ;;
    tornado)  echo "torn" ;;
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
C_GATEFUL="\033[36m"           # cyan
C_CODEGEN="\033[33m"           # yellow
C_DASHBOARD="\033[32m"         # green
C_ADDRESS_ENRICHMENT="\033[96m" # bright cyan
C_RELAYER="\033[93m"           # bright yellow
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

wait_for_optional_port() {
  local port=$1 name=$2 timeout=${3:-20} elapsed=0
  log "Waiting for optional $name on port $port..."
  while ! (lsof -i ":$port" -sTCP:LISTEN >/dev/null 2>&1 || ss -tlnH "sport = :$port" 2>/dev/null | grep -q LISTEN); do
    sleep 1
    elapsed=$((elapsed + 1))
    if [ "$elapsed" -ge "$timeout" ]; then
      log "Optional $name did not become ready; continuing without it"
      return 1
    fi
  done
  log "$name is ready on port $port"
  return 0
}

start_gateful() {
  log "Starting Gateful..."
  run_with_prefix "$C_GATEFUL" "🚪 gateful" "" "" railway_run gateful pnpm gateful dev &
  wait_for_port "$PORT_GATEFUL" "Gateful" 120
}

start_relayer() {
  export DAO_RELAYER_ENS="http://localhost:${PORT_RELAYER}"
  # The relayer reaches the chain via RPC_URL, which in dev points at an
  # erpc.railway.internal host unreachable from a laptop. Set LOCAL_RELAYER_RPC_URL
  # to a reachable RPC (e.g. https://erpc-dev.up.railway.app/api/evm/1) to run it
  # locally; REDIS_URL is already a public proxy in dev. Without the override the
  # relayer crashes on startup, gateful can't fetch its OpenAPI spec, and the
  # @anticapture/client codegen omits the relayer hooks the dashboard imports.
  if [ -n "${LOCAL_RELAYER_RPC_URL:-}" ]; then
    run_with_prefix "$C_RELAYER" "📡 relayer" "" "" railway run -e dev -s ens-relayer bash -c 'RPC_URL="$LOCAL_RELAYER_RPC_URL" exec pnpm relayer dev' &
  else
    run_with_prefix "$C_RELAYER" "📡 relayer" "" "" railway run -e dev -s ens-relayer pnpm relayer dev &
  fi
  # Optional: a slow/unavailable relayer must not tear down the rest of the stack.
  wait_for_optional_port "$PORT_RELAYER" "Relayer" || true
}

if [ "${BASH_SOURCE[0]}" != "$0" ]; then
  return 0
fi

cleanup() {
  echo ""
  log "Shutting down..."
  trap - INT TERM EXIT
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
    log "railway_run: railway run -e dev -s $service $*"
    railway run -e dev -s "$service" "$@"
  else
    log "railway_run (no --rw): $*"
    "$@"
  fi
}

# Always try railway for the API; fall back to plain execution (.env) if service not found.
# Railway injects dev values that point at *.railway.internal hosts which only resolve
# inside Railway's private network, so from a laptop the API can't reach them:
#   - LOCAL_DATABASE_URL overrides DATABASE_URL (DB; e.g. the public proxy URL)
#   - LOCAL_RPC_URL overrides RPC_URL (chain; e.g. https://erpc-dev.up.railway.app/api/evm/1)
# Each is applied inside the railway-run child only when set, so default behavior is unchanged.
railway_run_api() {
  local service=$1
  shift
  if railway run -e dev -s "$service" true >/dev/null 2>&1; then
    local overrides=""
    [ -n "${LOCAL_DATABASE_URL:-}" ] && overrides="${overrides}DATABASE_URL=\"\$LOCAL_DATABASE_URL\" "
    [ -n "${LOCAL_RPC_URL:-}" ] && overrides="${overrides}RPC_URL=\"\$LOCAL_RPC_URL\" "
    if [ -n "$overrides" ]; then
      log "railway_run_api: railway run -e dev -s $service (local overrides: ${overrides}) $*"
      railway run -e dev -s "$service" bash -c "${overrides}exec \"\$@\"" _ "$@"
    else
      log "railway_run_api: railway run -e dev -s $service $*"
      railway run -e dev -s "$service" "$@"
    fi
  else
    log "railway_run_api: Railway service '$service' not found, falling back to: $*"
    "$@"
  fi
}

railway_service_available() {
  local service=$1
  railway run -e dev -s "$service" true >/dev/null 2>&1
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

# 3. Address Enrichment (optional; do not block the rest of the stack)
ADDRESS_ENRICHMENT_AVAILABLE=false
if railway_service_available "address-enrichment"; then
  log "Starting optional Address Enrichment..."
  run_with_prefix "$C_ADDRESS_ENRICHMENT" "💰 enrichment" "" "" railway run -e dev -s address-enrichment pnpm address dev &
  if wait_for_optional_port "$PORT_ADDRESS_ENRICHMENT" "Address Enrichment"; then
    ADDRESS_ENRICHMENT_AVAILABLE=true
    export ADDRESS_ENRICHMENT_API_URL="http://localhost:${PORT_ADDRESS_ENRICHMENT}"
  fi
else
  log "Skipping optional Address Enrichment (Railway CLI/service unavailable)"
fi

# Watchdog: when API recovers after being down, touch the sentinel file so tsx reloads the gateful
if [ "$RUN_API" = true ]; then
  (
    api_was_up=true
    while true; do
      sleep 3
      if lsof -i ":$PORT_API" -sTCP:LISTEN >/dev/null 2>&1; then
        if [ "$api_was_up" = false ]; then
          log "API recovered — reloading Gateful..."
          touch "$(dirname "$0")/../apps/gateful/src/_dev-reload.ts"
          api_was_up=true
        fi
      else
        api_was_up=false
      fi
    done
  ) &
fi

# 5. Relayer (ENS service, but its OpenAPI schema is shared across DAOs and is
# required for @anticapture/client codegen — the dashboard imports relayer hooks
# unconditionally — so it runs for every DAO).
start_relayer

# 6. Gateful
start_gateful

# 7. Clients — codegen + build watch
export ANTICAPTURE_API_URL="http://localhost:${PORT_GATEFUL}"
log "Starting REST Client (silent, errors only)..."
run_errors_only "$C_CODEGEN" "🤝 client" pnpm client dev &

# 8. Dashboard
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
if [ "$ADDRESS_ENRICHMENT_AVAILABLE" = true ]; then
  printf "  ${C_ADDRESS_ENRICHMENT}💰 Enrichment${C_RESET} http://localhost:${PORT_ADDRESS_ENRICHMENT}\n"
else
  printf "  ${C_ADDRESS_ENRICHMENT}💰 Enrichment${C_RESET} skipped (optional)\n"
fi
printf "  ${C_GATEFUL}🚪 Gateful${C_RESET}   http://localhost:${PORT_GATEFUL}\n"
printf "  ${C_RELAYER}📡 Relayer${C_RESET}   http://localhost:${PORT_RELAYER}\n"
printf "  ${C_CODEGEN}🤝 REST Client${C_RESET}    codegen + build watch\n"
printf "  ${C_DASHBOARD}📺 Dashboard${C_RESET} http://localhost:${PORT_DASHBOARD}\n"
echo ""
log "Press Ctrl+C to stop all services."

wait
