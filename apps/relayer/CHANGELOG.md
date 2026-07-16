# @anticapture/relayer

## 1.1.1

### Patch Changes

- [#2055](https://github.com/blockful/anticapture/pull/2055) [`248a451`](https://github.com/blockful/anticapture/commit/248a4518fd7d22c24ceaa23ad4692e1a5cb18aa6) Thanks [@pikonha](https://github.com/pikonha)! - Make request log messages human-readable in Loki (`GET /path 200` instead of `request`) and stop logging `/metrics` and `/health` scrapes

## 1.1.0

### Minor Changes

- [#1976](https://github.com/blockful/anticapture/pull/1976) [`4e5f06a`](https://github.com/blockful/anticapture/commit/4e5f06a261211b9a94eb0e40047468000ba40363) Thanks [@LeonardoVieira1630](https://github.com/LeonardoVieira1630)! - Switch relayer rate limiting from a shared daily window to per-operation monthly limits (separate caps for votes and delegations), configurable via `MAX_VOTES_PER_ADDRESS_PER_MONTH` and `MAX_DELEGATIONS_PER_ADDRESS_PER_MONTH` (each defaulting to 3). The `/relay/config` and `/relay/rate-limit/{address}` responses now expose per-operation `limits`/`limit` and a monthly `resetsAt`; the client SDK is regenerated to match. The dashboard `useGaslessRelayer` hook now exposes `voteLimit`/`delegationLimit` in place of the removed `maxRelayPerAddressPerDay`/`maxPerDay` fields.
