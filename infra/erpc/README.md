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
