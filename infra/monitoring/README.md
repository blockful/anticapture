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
