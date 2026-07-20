# @anticapture/address-enrichment

## 1.1.1

### Patch Changes

- [#2055](https://github.com/blockful/anticapture/pull/2055) [`248a451`](https://github.com/blockful/anticapture/commit/248a4518fd7d22c24ceaa23ad4692e1a5cb18aa6) Thanks [@pikonha](https://github.com/pikonha)! - Make request log messages human-readable in Loki (`GET /path 200` instead of `request`) and stop logging `/metrics` and `/health` scrapes

- [#2053](https://github.com/blockful/anticapture/pull/2053) [`633b628`](https://github.com/blockful/anticapture/commit/633b6287869693b8c707677d7b0af62a4b2c6ad7) Thanks [@pikonha](https://github.com/pikonha)! - add pg pool config to avoid hanging db connections

## 1.1.0

### Minor Changes

- [#1993](https://github.com/blockful/anticapture/pull/1993) [`add9bd1`](https://github.com/blockful/anticapture/commit/add9bd1e96ea89dd26f892fcd30353919d905126) Thanks [@caveman-eth](https://github.com/caveman-eth)! - Surface ENS social records and EFP stats for addresses.
  - `address-enrichment` now reads the EFP `/details` endpoint, capturing the ENS `com.twitter`, `org.telegram`, `email`, and `com.github` text records plus EFP follower/following counts. These are exposed under `ens` (socials) and a new `efp` object, cached under the existing ENS TTL. EFP counts are returned even when the address has no primary ENS name.
  - The Holders & Delegates drawer header now shows follower/following counts (linked to the EFP profile) and social links (X, Telegram, GitHub, email) for the selected address.

### Patch Changes

- [#2010](https://github.com/blockful/anticapture/pull/2010) [`325fccb`](https://github.com/blockful/anticapture/commit/325fccbed3d6693be643127c0ef71fb90cf1e0bd) Thanks [@pikonha](https://github.com/pikonha)! - Add committed Drizzle migrations and apply them at startup.
