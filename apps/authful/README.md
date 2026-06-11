# Authful

Per-tenant API token issuance, validation and usage tracking for Gateful
(DEV-758). Design: [docs/specs/dev-758-gateful-token-service.md](../../docs/specs/dev-758-gateful-token-service.md).

Plaintext tokens are **never stored or logged** — only their sha256 hash.

## Environment

| Variable           | Required | Description                                                                        |
| ------------------ | -------- | ---------------------------------------------------------------------------------- |
| `DATABASE_URL`     | yes      | Dedicated Postgres (schema `authful`)                                              |
| `ADMIN_API_KEY`    | yes      | Guards `/tokens` (mint/list/revoke), min 16 chars                                  |
| `INTERNAL_API_KEY` | yes      | Guards `/validate` + `/usage/batch`; shared with Gateful (`TOKEN_SERVICE_API_KEY`) |
| `PORT`             | no       | Default `4002`                                                                     |

## Endpoints

- `POST /tokens` · `GET /tokens` · `DELETE /tokens/:id` — admin surface
- `POST /validate` · `POST /usage/batch` — internal surface (Gateful)
- `GET /health` — public · `GET /docs` — Swagger UI

## Minting tokens (v1 is manual)

```bash
# Generate a new tenant token (plaintext printed exactly once)
pnpm authful mint -- acme "acme mcp prod" --rate-limit 600

# Seed an EXISTING credential without rotating it (migration path for the
# legacy shared keys). Plaintext comes from env, never argv:
TOKEN_PLAINTEXT=<existing-key> pnpm authful mint -- uniswap "uniswap mcp prod"
```

## Migrations

```bash
pnpm authful db:generate   # after schema changes
pnpm authful db:migrate    # apply (also runs automatically on deploy)
```
