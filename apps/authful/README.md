# Authful

Per-tenant API token issuance and validation for Gateful (DEV-758). Usage is
observed via Gateful's Prometheus metrics, not persisted here.

Plaintext tokens are **never stored or logged** — only their sha256 hash.

## Environment

| Variable                | Required        | Description                                                       |
| ----------------------- | --------------- | ----------------------------------------------------------------- |
| `DATABASE_URL`          | yes             | Dedicated Postgres (schema `authful`)                             |
| `ADMIN_API_KEY`         | yes             | Guards `/tokens` (mint/list/revoke), min 16 chars                 |
| `INTERNAL_API_KEY`      | yes             | Guards `/validate`; shared with Gateful (`TOKEN_SERVICE_API_KEY`) |
| `PORT`                  | no              | Default `4002`                                                    |
| `SEED_TOKEN_PLAINTEXT`  | CI/preview only | Token seeded on boot in PR previews (min 16 chars) — see below    |
| `SEED_TOKEN_TENANT`     | no              | Tenant for the seeded token (default `ci`)                        |
| `SEED_TOKEN_NAME`       | no              | Name for the seeded token (default `ci seed token`)               |
| `SEED_TOKEN_RATE_LIMIT` | no              | Rate limit for the seeded token (default `600`)                   |

## CI / preview seeding

On Railway PR previews (`RAILWAY_ENVIRONMENT_NAME` is neither `dev` nor
`production`) the service seeds a fixed token from `SEED_TOKEN_PLAINTEXT` on
boot, so the rest of the preview stack can authenticate with a known key.
`SEED_TOKEN_PLAINTEXT` is **required** in those environments and ignored on
`dev`/`production`. Seeding is idempotent — it survives restarts and re-deploys
without creating duplicates.

## Endpoints

- `POST /tokens` · `GET /tokens` · `DELETE /tokens/:id` — admin surface
- `POST /validate` — internal surface (Gateful)
- `GET /health` · `GET /metrics` — public · `GET /docs` — Swagger UI

## Minting tokens

Mint via the admin API (guarded by `ADMIN_API_KEY`). The plaintext token is
returned exactly once in the response; only its sha256 hash is stored.

```bash
curl -sX POST http://localhost:4002/tokens \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tenant": "acme", "name": "acme mcp prod", "rateLimitPerMin": 600}'
```

`rateLimitPerMin` is optional (defaults to 600).

## Migrations

```bash
pnpm authful db:generate   # after schema changes
pnpm authful db:migrate    # apply (also runs automatically on deploy)
```
