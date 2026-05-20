---
"@anticapture/api": patch
---

Harden ENS revenue Dune env validation and switch URL config to query IDs.

`REVENUE_DUNE_*_URL` env vars are replaced with `REVENUE_DUNE_*_QUERY_ID` (numeric Dune query IDs); the API now interpolates them into `https://api.dune.com/api/v1/query/{ID}/results`. All seven IDs are required when `REVENUE_DUNE_API_KEY` is set, so a partial-env typo fails fast at startup instead of returning 503s from `/revenue/*` at request time.
