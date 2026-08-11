# eRPC deployment configs

The eRPC image copies one environment-specific config into `/root/erpc.yaml` at
build time.

Dev and staging use the default build arg:

```sh
docker build -f infra/erpc/Dockerfile infra/erpc
```

Production must set the production config explicitly:

```sh
docker build \
  -f infra/erpc/Dockerfile \
  --build-arg ERPC_CONFIG=erpc.prod.yaml \
  infra/erpc
```

## Dashboard integration

The dashboard sends wallet JSON-RPC requests through its same-origin
`/api/rpc/<chainId>` route. Configure that dashboard service with `ERPC_URL`
(the `dashboard` project base URL) and `ERPC_SECRET` (`RPC_SECRET` on the eRPC
service). Both variables must remain server-only; never use a `NEXT_PUBLIC_`
prefix for the secret. Both are required; the route fails closed when either is
absent.

The proxy validates Railway's `X-Real-IP` and sends exactly one
`X-Anticapture-Client-IP` value. eRPC prefers that header, then Railway's own
`X-Real-IP`, only when the request arrives from a loopback or private-network
peer. This preserves browser IPs for `perIP` rate limits without trusting
caller-supplied forwarding headers. Prefer a Railway private URL for `ERPC_URL`
so the proxy-to-eRPC hop stays within those trusted ranges.

Rate limits are split because the deployments share provider API keys and the
configured rate limiter uses the in-memory driver. Provider-level budgets are
allocated 80% to production and 20% to dev/staging. Per-IP budgets stay the same
in both configs.

| Budget            | Production | Dev/staging | Purpose                                        |
| ----------------- | ---------: | ----------: | ---------------------------------------------- |
| `nodeful`         |      700/s |       100/s | Ethereum requests to the self-hosted Reth node |
| `chainstack`      |      180/s |        30/s | Paid-provider cap and L2 capacity              |
| `indexer-limit`   |      600/s |       150/s | Aggregate indexer project capacity             |
| `api-limit`       |    20/s/IP |     20/s/IP | Public API project protection                  |
| `dashboard-limit` |    20/s/IP |     20/s/IP | Authenticated dashboard protection             |

## Nodeful capacity split across projects

The rate limiter uses the in-memory driver, so each eRPC deployment enforces its
budgets independently. What the Reth node actually receives is the **sum** of the
`nodeful` budgets across every deployment, so adding a consumer means taking
capacity away from the others rather than configuring a new 200/s of its own.

Railway private networks are per-project, so each consumer project runs its own
`nodeful` Tailscale proxy plus its own eRPC (built from `erpc.consumer.dev.yaml`
or `erpc.consumer.prod.yaml`) and receives a fixed slice:

| Deployment                  |        Dev config        | Dev `nodeful` | Dev `chainstack` |
| --------------------------- | :----------------------: | ------------: | ---------------: |
| `anticapture-infra`         |     `erpc.dev.yaml`      |         100/s |             30/s |
| `thority`                   | `erpc.consumer.dev.yaml` |          50/s |             10/s |
| `ENS-Incentives`            | `erpc.consumer.dev.yaml` |          50/s |             10/s |
| **total reaching the node** |                          |     **200/s** |         **50/s** |

| Deployment                  |        Prod config        | Prod `nodeful` | Prod `chainstack` |
| --------------------------- | :-----------------------: | -------------: | ----------------: |
| `anticapture-infra`         |     `erpc.prod.yaml`      |          700/s |             180/s |
| `ENS-Incentives`            | `erpc.consumer.prod.yaml` |          100/s |              20/s |
| **total reaching the node** |                           |      **800/s** |         **200/s** |

The totals match the pre-split single-deployment budgets, so node load is
unchanged. A slice is a hard ceiling: a project cannot borrow another's idle
capacity, because nothing shares limiter state between them. Changing one row
means changing another to keep the totals fixed — a shared Redis
`rateLimiters.store` would be the alternative, at the cost of exposing Redis
across projects.

`erpc.consumer.prod.yaml` grants 100/s, so promoting a **second** consumer to
production means cutting anticapture's row again rather than deploying the file
as-is; otherwise the node sees 900/s. thority currently runs in dev only.

`indexer-limit` stays at 150/s in `erpc.dev.yaml` (600/s in `erpc.prod.yaml`)
even though it now exceeds the upstream capacity behind it; the upstream budgets
are the binding constraint, and lowering the project budget would only throttle
L2 traffic that Chainstack still serves.

Consumer configs cache in memory only — no `pg-main` connector, so they need no
`DATABASE_URL`. Add one (see `erpc.prod.yaml`) if a consumer's finalized-block
reads grow enough to be worth persisting.

`MAX_REQUESTS_PER_SECOND` is a per-indexer, per-instance limit. Keep the sum of
that value across concurrently running indexer instances below the environment's
`indexer-limit`; otherwise eRPC rejects excess calls and Ponder retries them.

Mainnet routes to Nodeful first; Chainstack carries the `tier:fallback` tag, so
eRPC's default selection policy holds it out of rotation until Nodeful is
excluded (unhealthy, throttled, or lagging) or cannot serve a method — this
keeps the paid provider off hedges and transient failover. L2 requests always
use Chainstack because Nodeful serves Ethereum only.

## Block response cache

Both configs cache raw `eth_getBlockByNumber` result bodies in two tiers:

- finalized blocks go to the existing `rpc_cache` PostgreSQL table with no
  expiry because their contents are immutable;
- unfinalized blocks use a bounded 128 MB in-process cache with a 10-second TTL,
  matching the indexers' default polling interval;
- realtime blocks use the same bounded cache with chain-specific freshness
  windows (12 seconds for Ethereum, 2 for Optimism, 1 for Scroll).

Set `DATABASE_URL` on each eRPC service to a private Railway PostgreSQL URL.
eRPC creates and maintains the `rpc_cache` table automatically; the
database user therefore needs `CREATE` access on the target schema. Cache reads
are best-effort and fall through to the configured upstreams if PostgreSQL is
slow or unavailable.

Use the PostgreSQL exporter described in `infra/monitoring/README.md` to watch
connection pressure, buffer hit ratio, transaction rate, and deadlocks. The
consolidated dashboard also shows eRPC's own cache hit/miss/error counters.

## Monitoring

eRPC exposes Prometheus metrics on port `4001`:

```yaml
metrics:
  enabled: true
  hostV4: "0.0.0.0"
  port: 4001
```

Use the unified monitoring stack in `infra/monitoring` for Railway deployments.
Set this variable on the Prometheus service, not on the eRPC service:

```text
ERPC_METRICS_ENDPOINT=${{<erpc-service-name>.RAILWAY_PRIVATE_DOMAIN}}:4001
```

Replace `<erpc-service-name>` with the actual Railway service reference.
Grafana shows eRPC metrics in the "eRPC (Upstream RPC)" section of the
consolidated dashboard, `infra/monitoring/grafana/dashboards/anticapture.json`.

`Dockerfile.monitoring` is a legacy standalone Prometheus + Grafana image that
depends on upstream eRPC templates and `SERVICE_ENDPOINT` / `SERVICE_PORT`.
Prefer the unified monitoring stack so all Anticapture service metrics stay in
one Prometheus and one Grafana deployment.
