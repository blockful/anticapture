---
name: local-dev-stack
description: Use when you need to hit the running local stack (API, gateful, dashboard, indexer) to test or verify a change. Covers scripts/dev.sh, hot reload, and the ports each service listens on.
---

# Local Dev Stack

The local stack is started with `scripts/dev.sh` (usually already running — check the
ports before starting your own). **All services hot-reload on file save** — after
editing source you do NOT need to restart; just re-hit the endpoint.

## Start it

```bash
./scripts/dev.sh <dao>              # e.g. tornado, uniswap, gitcoin, scroll, shutter, compound
./scripts/dev.sh <dao> --indexer    # also run the indexer for that DAO
./scripts/dev.sh <dao> --debug-api  # wait for API from IDE debugger instead of spawning it
./scripts/dev.sh                    # no DAO → API skipped, uses DAO_API_* from .env
```

### Railway env (per service)

By **default all services run locally** (env from `.env`). Opt into `railway run -e dev`
env injection per service:

| Flag           | API     | Gateful |
| -------------- | ------- | ------- |
| _(none)_       | local   | local   |
| `--rw-api`     | railway | local   |
| `--rw-gateful` | local   | railway |
| `--rw`         | railway | railway |

`--rw-api` falls back to `.env` if the Railway service isn't found. Relayer and
Address Enrichment always use `railway run` when available.

On startup it **kills anything already on the ports below**, so a second run replaces
the first.

## Ports

| Service            | Port  | URL                    | Notes                               |
| ------------------ | ----- | ---------------------- | ----------------------------------- |
| API                | 42069 | http://localhost:42069 | only when a `<dao>` is passed       |
| Indexer            | 42070 | http://localhost:42070 | only with `--indexer`               |
| Gateful (gateway)  | 4001  | http://localhost:4001  | always                              |
| Dashboard          | 3000  | http://localhost:3000  | always                              |
| Address Enrichment | 3001  | http://localhost:3001  | optional, skipped if no Railway svc |
| Relayer (ENS)      | 3002  | http://localhost:3002  | ENS only                            |
| User API           | 4003  | http://localhost:4003  | optional                            |

Client SDK codegen runs in watch mode (no port) and regenerates on API/gateful changes.

## Testing tips

- **Test the API directly** at `http://localhost:42069` — OpenAPI/REST.
- **Test the aggregated surface** through gateful at `http://localhost:4001`.
- The DAO is identified by short id in env: `DAO_API_<UPPER_ID>` (e.g. `DAO_API_TORN`,
  `DAO_API_UNI`). dev.sh exports these automatically.
- When the API restarts, a watchdog touches `apps/gateful/src/_dev-reload.ts` so gateful
  reloads and re-points at the recovered API.

Stop everything with Ctrl+C (dev.sh traps it and kills the whole process group).
