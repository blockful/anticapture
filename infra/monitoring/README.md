# Monitoring

The unified monitoring stack provisions Prometheus and Grafana for Anticapture
services.

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

Grafana provisions the eRPC dashboard from `grafana/dashboards/erpc.json`. The
dashboard uses the existing Prometheus datasource UID, `prometheus`.

The standalone `infra/erpc/Dockerfile.monitoring` image is legacy. Use this
unified monitoring stack for the normal Anticapture Railway deployment.
