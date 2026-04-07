# Gateway Cache Layer Design

**Date:** 2026-04-07
**Status:** Approved
**Scope:** Gateful (REST gateway) + DAO APIs

---

## Problem

All API requests currently go directly to the database. Many requests are identical across clients and fetch data that changes infrequently. This causes unnecessary database load and higher latency for the dashboard.

---

## Goals

- Reduce redundant database queries
- Improve response latency for the dashboard
- Keep cache policy close to domain knowledge (the API knows how stale its data can be)
- Zero downtime if the cache layer becomes unavailable

---

## Non-Goals

- Caching at the API level (services/repositories)
- Client-side caching
- Write-through or read-through patterns
- Strong consistency guarantees (this is a read-only analytics dashboard)
- Cache invalidation on Indexer writes

---

## Architecture

```
Client
  │
  ▼
Gateful (REST Gateway)
  │
  ├─ Cache Middleware ◄──► Redis
  │     │ miss                 │ hit
  │     ▼                     │
  ├─ Proxy routes: /:dao/*    │
  │     └──► DAO API ─────────┘
  │           (sets Cache-Control header)
  │
  └─ Aggregation routes: /daos, /aggregations/*
        ├──► DAO API 1 (Cache-Control: max-age=X)
        ├──► DAO API 2 (Cache-Control: max-age=Y)
        └──► DAO API N (Cache-Control: max-age=Z)
              TTL = min(X, Y, Z)
```

---

## Decisions

| Decision        | Choice                                        | Rationale                                                                                   |
| --------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Cache location  | Gateful (REST gateway)                        | Single entry point for all consumers; avoids coupling TTL logic across 14 DAO API instances |
| Pattern         | Cache-aside                                   | Fits read-only API; no write-side complexity                                                |
| Store           | Redis (external)                              | Survives API restarts; independent component                                                |
| TTL strategy    | Cache-Control headers from API                | API owns domain knowledge; no cross-package coupling; supports per-response granularity     |
| Cache key       | Raw request URL                               | Simple; duplicate keys from param reordering are negligible at current scale                |
| Cached methods  | GET only                                      | POST/PUT/DELETE are never safe to cache                                                     |
| Aggregation TTL | `Math.min()` of all upstream `max-age` values | Most conservative; automatic                                                                |
| API-side impl   | Per-controller `c.header()` call              | Explicit, no hidden magic                                                                   |
| Redis failure   | Fail open + auto-reconnect                    | Cache is an optimization, not a requirement                                                 |
| Redis client    | `ioredis`                                     | Built-in reconnection with exponential backoff                                              |

---

## Component Changes

### 1. Gateful

**New: Redis client** (`src/cache/redis.ts`)

- Connects via `REDIS_URL` environment variable
- Auto-reconnects on connection loss (ioredis default behavior)
- Logs connection events (connected, reconnecting, error)

**New: Cache middleware** (`src/middlewares/cache.ts`)

- Registered globally before all route handlers
- Request phase:
  1. Skip if method is not `GET`
  2. Build cache key from raw request URL
  3. Check Redis — on hit, return cached response immediately
- Response phase (after handler):
  1. Skip if response status is not 2xx
  2. Read `Cache-Control` response header
  3. Skip if header is absent, `no-store`, or `max-age=0`
  4. Parse `max-age` value
  5. Store `{ body, status, contentType }` in Redis with parsed TTL
- Redis errors are caught silently — requests proceed normally

**New: Environment variable**

- `REDIS_URL` — Redis connection string (required)

**No changes to:** proxy logic, aggregation services, routing, auth middleware.

### 2. DAO APIs (apps/api)

Each controller adds a single header before returning:

```ts
c.header("Cache-Control", "public, max-age=<TTL>");
```

**TTL values by data type:**

| Data type                | Endpoints                                                  | TTL   |
| ------------------------ | ---------------------------------------------------------- | ----- |
| Static governance config | `/dao`                                                     | 1800s |
| Token metadata           | `/token`                                                   | 900s  |
| Token prices             | `/token` (with price)                                      | 300s  |
| Historical metrics       | `/delegation-percentage`, `/token-metrics`, `/dao-metrics` | 300s  |
| Account data             | `/account-balances`, `/voting-power`, `/delegations`       | 120s  |
| Active governance        | `/proposals`, `/votes`, `/feed`                            | 60s   |
| Offchain data            | `/offchain-proposals`, `/offchain-votes`                   | 120s  |

These TTLs are initial values to be tuned after observing real usage patterns.

---

## Cache Behavior Details

### Cache key

Raw request URL string. Example: `http://localhost:4001/uni/proposals?limit=10&offset=0`

Duplicate keys from different query parameter ordering are acceptable at current traffic scale.

### What is stored in Redis

```json
{
  "body": "<serialized response body>",
  "status": 200,
  "contentType": "application/json"
}
```

### Aggregation endpoints

`GET /daos` and `GET /aggregations/average-delegation-percentage` fan out to all DAO APIs in parallel. The cache middleware uses `Math.min()` across all `max-age` values from upstream responses as the TTL for the aggregated result. If any upstream response is missing a `Cache-Control` header, the aggregation is not cached.

### Redis failure handling

- **Startup failure:** Log warning, continue without cache
- **Runtime disconnection:** Fail open — requests are proxied normally, cache reads/writes are skipped
- **Reconnection:** Automatic via ioredis retry strategy, no restart required

---

## Infrastructure

A Redis instance must be provisioned and accessible to Gateful. Railway provides a managed Redis add-on suitable for this. The `REDIS_URL` environment variable must be added to Gateful's deployment configuration.

---

## Out of Scope

- Cache invalidation triggered by the Indexer
- Per-response TTL variation based on proposal status (e.g., longer TTL for completed proposals) — this can be added later
- Monitoring/metrics for cache hit rate — can be added with existing OpenTelemetry setup
- Admin endpoint for manual cache invalidation
