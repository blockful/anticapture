# Authful

Per-tenant API token issuance and validation for Gateful (DEV-758).

Plaintext tokens are **never stored or logged** — only their sha256 hash.

## Environment

| Variable           | Required | Description                                                       |
| ------------------ | -------- | ----------------------------------------------------------------- |
| `DATABASE_URL`     | yes      | Dedicated Postgres (schema `authful`)                             |
| `ADMIN_API_KEY`    | yes      | Guards `/tokens` (mint/list/revoke), min 16 chars                 |
| `INTERNAL_API_KEY` | yes      | Guards `/validate`; shared with Gateful (`TOKEN_SERVICE_API_KEY`) |
| `PORT`             | no       | Default `4002`                                                    |

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
