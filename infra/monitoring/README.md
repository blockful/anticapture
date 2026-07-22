# Monitoring

The unified monitoring stack provisions Prometheus and Grafana for Anticapture
services.

## Per-DAO scrape jobs

Prometheus's per-DAO scrape jobs (`anticapture-<dao>-indexer`, `-indexer-ponder`,
`-api`) are generated at container start by `entrypoint.prometheus.sh` from the
space-separated `DAOS` env var (defaults to the current DAO list). To add a DAO,
append its name to `DAOS` and set `<DAO>_INDEXER_ENDPOINT` and
`<DAO>_API_ENDPOINT` on the Prometheus service.

## eRPC metrics

eRPC exposes Prometheus metrics on `:4001` at `/metrics`. Prometheus scrapes
that endpoint through the `ERPC_METRICS_ENDPOINT` environment variable:

```text
ERPC_METRICS_ENDPOINT=<host>:4001
```

For Railway, set the Prometheus service value to the eRPC private domain plus
the metrics port:

```text
${{<erpc-service-name>.RAILWAY_PRIVATE_DOMAIN}}:4001
```

Use the actual Railway eRPC service reference name in place of
`<erpc-service-name>`.

Grafana provisions a single consolidated dashboard from
`grafana/dashboards/anticapture.json` (service health, API traffic, gateful
cache, eRPC, resources). It uses the existing Prometheus datasource UID,
`prometheus`.

The standalone `infra/erpc/Dockerfile.monitoring` image is legacy. Use this
unified monitoring stack for the normal Anticapture Railway deployment.

## Alert lifecycle

Every Prometheus rule keeps a fired alert active for 15 minutes after its
condition last matches. This recovery grace prevents brief metric gaps or
short-lived improvements from immediately producing a resolved notification.
The rule's `for` duration still controls how long a condition must persist
before its initial firing notification.

## PostgreSQL metrics

Deploy a PostgreSQL exporter service from this directory with:

- Dockerfile: `Dockerfile.postgres-exporter`
- Railway config: `postgres-exporter.railway.toml`
- `DATA_SOURCE_NAME`: the monitored database's private `DATABASE_URL`. To monitor
  several Postgres instances from the same exporter, comma-separate their URLs;
  each instance's metrics carry a `server` label and the PostgreSQL alerts group
  by it.

The exporter user needs `CONNECT` plus access to PostgreSQL statistics views.
For a dedicated least-privilege user on PostgreSQL 10+, grant `pg_monitor`.
Then set this variable on Prometheus:

```text
POSTGRES_EXPORTER_ENDPOINT=${{<postgres-exporter-service>.RAILWAY_PRIVATE_DOMAIN}}:9187
```

The exporter image is pinned to `postgres-exporter` v0.20.1. Its `/metrics`
endpoint is also the Railway health check.

## Railway RAM and egress metrics

Railway platform metrics need a separate API-backed exporter because service
process metrics do not include container limits or public-network egress.
Deploy a service from this directory with:

- Dockerfile: `Dockerfile.railway-exporter`
- Railway config: `railway-exporter.railway.toml`
- `RAILWAY_API_KEY`: an account-level read token
- `ENVIRONMENT_TARGETS`: comma-separated `projectId:environmentId` pairs
- `PORT`: `9090`

The build pins `MykalMachon/railway-prometheus-exporter` to commit
`ec3ea2243a6d82ab60b64b460eb959cbfc117e07`. Set this variable on Prometheus:

```text
RAILWAY_EXPORTER_ENDPOINT=${{<railway-exporter-service>.RAILWAY_PRIVATE_DOMAIN}}:9090
```

The consolidated dashboard adds eRPC cache, PostgreSQL, Railway RAM, RAM-limit,
and public-egress panels. Prometheus alerts when:

- Railway collection is stale for 5 minutes;
- a service stays above 85% RAM for 10 minutes;
- a service exceeds 5 GB public egress in an hour;
- PostgreSQL is unreachable, stays above 80% of `max_connections`, or reports a deadlock;
- eRPC cache hit rate stays below 50% under active traffic or cache operations fail.

These thresholds are intentionally cost/availability guardrails. Tune them in
`alerts.yml` after observing a full production traffic cycle.
