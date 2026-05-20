---
"@anticapture/api": minor
---

Split `/health` into a Railway-friendly liveness probe and a richer diagnostic
endpoint.

`GET /health` now returns only `{database: "ok" | "error"}` with HTTP `200` when
the database is reachable and `503` otherwise — designed for orchestrators
(Railway, k8s) that act on status codes alone. The full snapshot, including
chain head and indexer freshness (`status`, `chain.head`, `indexer.*`), moved
to `GET /health/full`. HTTP status on `/health/full` still tracks database
reachability only; a stale indexer surfaces as `status: "degraded"` with `200`.

Also locks in the existing `Number(raw)` coercion in
`HealthRepositoryImpl.getLastEventTimestamp` with a regression test, so the
indexer timestamp can never leak as a bigint-stringified value into the
response and break downstream schema validation.
