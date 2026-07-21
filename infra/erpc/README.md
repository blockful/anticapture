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

Rate limits are split because the deployments share provider API keys and the
configured rate limiter uses the in-memory driver. Provider-level budgets are
allocated 80% to production and 20% to dev/staging. Per-IP budgets stay the same
in both configs.

| Budget            | Production | Dev/staging | Purpose                                        |
| ----------------- | ---------: | ----------: | ---------------------------------------------- |
| `nodeful`         |      800/s |       200/s | Ethereum requests to the self-hosted Reth node |
| `chainstack`      |      200/s |        50/s | Paid-provider cap and L2 capacity              |
| `indexer-limit`   |      600/s |       150/s | Aggregate indexer project capacity             |
| `api-limit`       |    20/s/IP |     20/s/IP | Public API project protection                  |
| `dashboard-limit` |    20/s/IP |     20/s/IP | Authenticated dashboard protection             |

`MAX_REQUESTS_PER_SECOND` is a per-indexer, per-instance limit. Keep the sum of
that value across concurrently running indexer instances below the environment's
`indexer-limit`; otherwise eRPC rejects excess calls and Ponder retries them.

Mainnet routes to Nodeful first; Chainstack carries the `tier:fallback` tag, so
eRPC's default selection policy holds it out of rotation until Nodeful is
excluded (unhealthy, throttled, or lagging) or cannot serve a method — this
keeps the paid provider off hedges and transient failover. L2 requests always
use Chainstack because Nodeful serves Ethereum only.

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
