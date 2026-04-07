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

**Modified: `src/shared/fan-out.ts`**

The current `fanOutGet` function returns only parsed JSON data, discarding the `Response` object and its headers. For the aggregation TTL strategy to work, it must also return the `Cache-Control` header from each upstream response. This change affects `fanOutGet`, `DaosService`, and `DelegationService`.

**No changes to:** proxy logic, routing, auth middleware.

### 2. DAO APIs (apps/api)

Each controller adds a single header before returning:

```ts
c.header("Cache-Control", "public, max-age=<TTL>");
```

**TTL values per route:**

| Route                                          | TTL   | Rationale                                                                 |
| ---------------------------------------------- | ----- | ------------------------------------------------------------------------- |
| `/dao`                                         | 1800s | Governance params rarely change                                           |
| `/token`                                       | 300s  | Fetches both metadata and price; price is the most volatile piece         |
| `/token/historical-data`                       | 300s  | Historical price data; past entries are immutable, new ones arrive slowly |
| `/token-metrics`                               | 300s  | Day-bucketed metrics; past buckets are immutable                          |
| `/delegation-percentage`                       | 300s  | Day-bucketed; past entries immutable                                      |
| `/proposals`                                   | 60s   | Active proposals have ongoing votes                                       |
| `/proposals/{id}`                              | 60s   | Proposal status can change                                                |
| `/proposals-activity`                          | 300s  | Aggregated activity metrics, slower changing                              |
| `/proposals/{id}/votes`                        | 60s   | Votes accumulate during active proposals                                  |
| `/proposals/{id}/non-voters`                   | 60s   | Changes as votes come in                                                  |
| `/votes`                                       | 60s   | Most time-sensitive during active governance                              |
| `/offchain/proposals`                          | 120s  | Off-chain data updated less frequently                                    |
| `/offchain/proposals/{id}`                     | 120s  | Same as above                                                             |
| `/offchain/votes`                              | 120s  | Same as above                                                             |
| `/offchain/proposals/{id}/votes`               | 120s  | Same as above                                                             |
| `/accounts/{address}/delegations`              | 120s  | Changes with delegation events                                            |
| `/accounts/{address}/delegators`               | 120s  | Changes with delegation events                                            |
| `/accounts/{address}/delegations/historical`   | 300s  | Historical; past entries immutable                                        |
| `/balances`                                    | 120s  | Changes with transfer events                                              |
| `/accounts/{address}/balances`                 | 120s  | Changes with transfer events                                              |
| `/balances/variations`                         | 120s  | Derived from balance changes                                              |
| `/accounts/{address}/balances/variations`      | 120s  | Same as above                                                             |
| `/accounts/{address}/balances/historical`      | 300s  | Historical; past entries immutable                                        |
| `/balances/{address}/interactions`             | 120s  | Changes with new interactions                                             |
| `/voting-powers`                               | 120s  | Changes with delegation/transfer events                                   |
| `/voting-powers/{accountId}`                   | 120s  | Same as above                                                             |
| `/voting-powers/historical`                    | 300s  | Historical; past entries immutable                                        |
| `/accounts/{address}/voting-powers/historical` | 300s  | Same as above                                                             |
| `/accounts/voting-powers/variations`           | 120s  | Derived from voting power changes                                         |
| `/accounts/{address}/voting-powers/variations` | 120s  | Same as above                                                             |
| `/accounts/{address}/transfers`                | 120s  | Changes with new transfers                                                |
| `/transactions`                                | 120s  | Changes with new on-chain activity                                        |
| `/treasury/liquid`                             | 300s  | Treasury balances update slowly                                           |
| `/treasury/dao-token`                          | 300s  | Same as above                                                             |
| `/treasury/total`                              | 300s  | Same as above                                                             |
| `/feed/events`                                 | 60s   | Real-time event feed                                                      |
| `/event-relevance/threshold`                   | 1800s | Threshold config; rarely changes                                          |
| `/last-update`                                 | 30s   | Freshness indicator; should reflect indexer progress                      |
| `/active-supply/compare`                       | 300s  | Historical supply comparison                                              |
| `/delegated-supply/compare`                    | 300s  | Historical comparison                                                     |
| `/circulating-supply/compare`                  | 300s  | Historical comparison                                                     |
| `/treasury/compare`                            | 300s  | Historical comparison                                                     |
| `/cex-supply/compare`                          | 300s  | Historical comparison                                                     |
| `/dex-supply/compare`                          | 300s  | Historical comparison                                                     |
| `/lending-supply/compare`                      | 300s  | Historical comparison                                                     |
| `/proposals/compare`                           | 300s  | Historical governance activity                                            |
| `/votes/compare`                               | 300s  | Historical governance activity                                            |
| `/active-supply/compare`                       | 300s  | Historical comparison                                                     |
| `/average-turnout/compare`                     | 300s  | Historical governance activity                                            |
| `/health`                                      | —     | Not cached                                                                |

These TTLs are initial values to be tuned after observing real usage patterns.

---

## Cache Behavior Details

### Cache key

The **inbound Gateful request URL** as received from the client — not the upstream DAO API URL. Example: `http://gateful:4001/uni/proposals?limit=10&offset=0`

Using the inbound URL ensures cache keys are consistent across environments and correctly scoped per DAO (since the DAO prefix is part of the Gateful path, e.g., `/uni/proposals` vs `/ens/proposals`).

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

## Notes

### Existing DaoCache in apps/api

The API already has an in-memory cache (`src/cache/dao-cache.ts`) with a 1-hour TTL for DAO governance parameters, used by the `/dao` endpoint. With this implementation, `/dao` responses will also be cached in Redis via Gateful (1800s). This double-caching is harmless — the in-memory cache means the API responds instantly to Gateful, and Gateful's Redis cache reduces calls to the API entirely. The `DaoCache` does not need to be removed.

### Testing

Each new component should have unit tests with a mocked Redis client:

- Cache middleware: test cache hit, cache miss, Redis failure (fail open), non-GET skip, non-2xx skip, missing header skip
- Aggregation TTL: test `Math.min()` behavior, missing header handling
- Redis client: test connection event logging

---

## Out of Scope

- Cache invalidation triggered by the Indexer
- Per-response TTL variation based on proposal status (e.g., longer TTL for completed proposals) — this can be added later
- Monitoring/metrics for cache hit rate — can be added with existing OpenTelemetry setup
- Admin endpoint for manual cache invalidation
