# Authful

Per-tenant API token issuance, validation, and 30-day daily usage storage for
Gateful (DEV-758).

Plaintext tokens are **never stored or logged** — only their sha256 hash.

## Environment

| Variable               | Required        | Description                                                                                                            |
| ---------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`         | yes             | Dedicated Postgres (schema `authful`)                                                                                  |
| `ADMIN_API_KEY`        | yes             | Guards unrestricted `/tokens` operations, min 16 chars                                                                 |
| `INTERNAL_API_KEY`     | yes             | Guards `/validate`; shared with Gateful as `TOKEN_SERVICE_API_KEY`                                                     |
| `PROVISIONING_API_KEY` | user keys       | Guards `user:*` token operations and usage reads; shared with the User API as its Authful provisioning credential      |
| `USAGE_API_KEY`        | usage recording | May only `POST /tokens/usage`; shared with Gateful as `TOKEN_SERVICE_USAGE_API_KEY` (the edge never holds mint/revoke) |
| `PORT`                 | no              | Default `4002`                                                                                                         |
| `SEED_TOKEN_PLAINTEXT` | CI/preview only | Token seeded on boot in PR previews (min 16 chars) — see below                                                         |

## CI / preview seeding

On Railway PR previews (`RAILWAY_ENVIRONMENT_NAME` is neither `dev` nor
`production`) the service seeds a fixed token from `SEED_TOKEN_PLAINTEXT` on
boot, so the rest of the preview stack can authenticate with a known key.
`SEED_TOKEN_PLAINTEXT` is **required** in those environments and ignored on
`dev`/`production`. Seeding is idempotent — it survives restarts and re-deploys
without creating duplicates.

## Endpoints

- `POST /tokens` · `GET /tokens` · `DELETE /tokens/:id` — token surface
- `POST /tokens/usage` · `GET /tokens/usage?tenant=...` — daily usage surface
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

`rateLimitPerMin` is optional (defaults to 600). Set it to `0` to make the
token unbounded — Gateful exempts it from rate limiting entirely.

## Migrations

```bash
pnpm authful db:generate   # after schema changes
pnpm authful db:migrate    # apply (also runs automatically on deploy)
```
