# Proxy

A lightweight `nginx` reverse proxy that fronts the public-facing Anticapture
surfaces under a single domain:

| Path       | Backend service              | Notes                                             |
| ---------- | ---------------------------- | ------------------------------------------------- |
| `/docs`    | docs (Docusaurus static)     | Forwarded as-is; the site uses `baseUrl /docs/`.  |
| `/mcp`     | mcp-server (Streamable HTTP) | `/mcp` prefix is stripped; backend serves at `/`. |
| `/healthz` | (proxy itself)               | Returns `200 ok` for the Railway healthcheck.     |

`/` redirects to `/docs/`.

## Why a plain nginx image

Everything here is infrastructure-as-code, matching the rest of `infra/`: a
pinned base image plus a committed config template. The config is rendered at
startup by the official nginx image's `envsubst` step
(`/etc/nginx/templates/*.template` -> `/etc/nginx/conf.d/`), so `$PORT` and the
upstreams come straight from Railway environment variables. There is no GUI,
SQLite state, or persistent volume to manage, and Railway already terminates
TLS at the edge.

## Railway setup

1. Create a service from this repo with **Config-as-code** pointing at
   `infra/proxy/railway.json` (Dockerfile builder, repo root as build context).
2. This is the only service in the group that should have a **public domain**.
   Remove the public domains from `docs` and `mcp-server` so they are reachable
   over the private network only.
3. Set these variables on the proxy service, using Railway reference variables
   so they track the real backend service names and ports:

   ```text
   DOCS_UPSTREAM=${{docs.RAILWAY_PRIVATE_DOMAIN}}:${{docs.PORT}}
   MCP_UPSTREAM=${{mcp-server.RAILWAY_PRIVATE_DOMAIN}}:${{mcp-server.PORT}}
   ```

   Replace `docs` / `mcp-server` with the actual Railway service names. The port
   on each upstream must match the port that service listens on (its `PORT`, or
   the Dockerfile default: docs `3001`, mcp-server `3100`). `PORT` on the proxy
   itself is injected by Railway.

## Private DNS

Backends are addressed over Railway's IPv6 private network
(`*.railway.internal`). The config sets `resolver [fd12::10] ipv6=on valid=1s;`
and uses a variable in `proxy_pass`, forcing nginx to re-resolve per request so
it follows internal IP changes across redeploys instead of caching the first
lookup forever.

## Local check

From the repo root:

```bash
docker build -f infra/proxy/Dockerfile -t anticapture-proxy .
docker run --rm -e PORT=8080 -p 8080:8080 anticapture-proxy
```

`http://localhost:8080/healthz` should return `ok`. The `/docs` and `/mcp`
routes only resolve when the Railway private-network backends are reachable.
