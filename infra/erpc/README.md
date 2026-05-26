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

Rate limits are split because the deployments share provider API keys and the
configured rate limiter uses the in-memory driver. Provider-level budgets are
allocated 80% to production and 20% to dev/staging. Per-IP budgets stay the same
in both configs.

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
Grafana provisions the eRPC dashboard from
`infra/monitoring/grafana/dashboards/erpc.json`.

`Dockerfile.monitoring` is a legacy standalone Prometheus + Grafana image that
depends on upstream eRPC templates and `SERVICE_ENDPOINT` / `SERVICE_PORT`.
Prefer the unified monitoring stack so all Anticapture service metrics stay in
one Prometheus and one Grafana deployment.
