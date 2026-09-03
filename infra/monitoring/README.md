# Monitoring

The unified monitoring stack provisions Prometheus and Grafana for Anticapture
services.

## Per-DAO scrape jobs

Prometheus's per-DAO scrape jobs (`anticapture-<dao>-indexer`, `-indexer-ponder`,
`-api`) are generated at container start by `entrypoint.prometheus.sh` from the
space-separated `DAOS` env var (defaults to the current DAO list). To add a DAO,
append its name to `DAOS` and set `<DAO>_INDEXER_ENDPOINT` and
`<DAO>_API_ENDPOINT` on the Prometheus service.

The `-api` job uses DNS service discovery (`dns_sd_configs`, AAAA) on the
`<DAO>_API_ENDPOINT` hostname instead of a static target: DAO APIs run with
several Railway replicas behind one private hostname, and a static target is
answered by a different replica at every scrape. Each replica then looks like a
counter reset, and `rate()` / `increase()` over `http_server_requests_total` or
`http_server_request_duration_seconds_count` inflate real traffic by orders of
magnitude (in September 2026 the ENS API metric showed ~32,000 req/min against
~8 req/min in its logs). With one target per replica the counters are
monotonic again and can be summed by `job`. `<DAO>_API_ENDPOINT` must stay in
`<host>:<port>` form.

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

`grafana/dashboards/validation.json` provisions the restricted User API
Validation dashboard. Its per-user table includes email addresses or wallet
addresses as Prometheus labels, so keep both the User API `/metrics` bearer
token and Grafana authentication enabled outside local development.

PR preview environments disable Google OAuth and expose Grafana's username and
password login form. They inherit `GF_SECURITY_ADMIN_USER` and
`GF_SECURITY_ADMIN_PASSWORD` from the source Railway environment; keep those
credentials configured there rather than committing them. Persistent
environments continue using their configured authentication provider.

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

Not collected. A `railway-exporter` service (an API-backed exporter, since
process metrics carry no container limits or public-network egress) ran here
until 2026-07-27 and never produced a single `railway_service_*` sample in
either environment — its account-level `RAILWAY_API_KEY` was rejected for the
whole retained history, so the only visible effect was a permanently firing
critical alert. Removed rather than left red. Railway's own dashboard still
shows per-service CPU/RAM/egress; what is gone is _alerting_ on them.

If you reinstate it, the blocker to solve first is the token: it must be scoped
to the **workspace**, not to a personal account, or the Railway GraphQL API
answers `Not Authorized`.

The consolidated dashboard adds eRPC cache and PostgreSQL panels. Prometheus
alerts when:

- PostgreSQL is unreachable, stays above 80% of `max_connections`, or reports a deadlock;
- eRPC cache hit rate stays below 25% for an hour under active traffic, or cache operations fail.

These thresholds are intentionally cost/availability guardrails. Tune them in
`alerts.yml` after observing a full production traffic cycle.
