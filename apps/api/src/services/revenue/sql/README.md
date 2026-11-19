# ENS revenue queries (revenue totals, actions, new wallets)

Dune SQL for the three revenue series on the ENS revenue page. The name-lifecycle queries (active names, renewal
funnel, upcoming expirations) are documented in `README.lifecycle.md`.

| File                 | Replaces Dune query               | API key         | Env var holding the query ID           |
| -------------------- | --------------------------------- | --------------- | -------------------------------------- |
| `revenue_totals.sql` | 7531730 `revenue_usd_by_category` | `revenueTotals` | `REVENUE_DUNE_REVENUE_TOTALS_QUERY_ID` |
| `actions.sql`        | 7531705 `actions_per_month`       | `actions`       | `REVENUE_DUNE_ACTIONS_QUERY_ID`        |
| `new_wallets.sql`    | 7531718 `new_wallets_per_month`   | `newWallets`    | `REVENUE_DUNE_NEW_WALLETS_QUERY_ID`    |

None of these files has been run on Dune: the production key's account cannot execute queries. They were validated
against an offline DuckDB port over raw chain data (see [Validation](#validation)). The first Dune run must be
checked against the [acceptance values](#acceptance-values).

## Output columns

The columns are the ones `dune-client.ts` validates, so the API mappers need no change. `month` is
`date_trunc('month', <timestamp with time zone>)`, which Dune serialises as `YYYY-MM-DD 00:00:00.000 UTC`.

- `revenue_totals.sql`: `month`, `registration_usd`, `premium_usd`, `renewal_usd`, `total_usd`, `registration_eth`,
  `premium_eth`, `renewal_eth`, plus a new `stablecoin_usd` (the USDC + DAI part of `total_usd`). The API ignores
  extra columns. USD is rounded to 2 decimals and ETH to 6 (production used 4).
- `actions.sql`: `month`, `category` (`Registration`, `Premium`, `Renewal`), `actions`.
- `new_wallets.sql`: `month`, `new_wallets`, `cumulative_wallets`.

## What is counted

Cash basis: a payment counts in the month of its block, at what the protocol kept.

**Sources.**

- **v1** (ETH): the five ETH controllers through Dune's decoded tables
  `ethereumnameservice_ethereum.ethregistrarcontroller_{1..5}_evt_{nameregistered,namerenewed}`, only for blocks
  below **26,282,117** (the ENSv2 freeze, 2026-10-27 06:01:59 UTC). After it, the 2023 controller still emits cost-0
  `NameRenewed` from ETHRenewerV1's permissionless `syncWrapper`; those are side effects, not revenue.
- **ENSv2** (USDC or DAI at $1 face value): `ethereum.logs` of ETHRegistrar
  `0xD6D8369e55c94Ae8AFA714E6cF7AB5bE54D5CC81` (`NameRegistered` `0xebd3982e...`, `NameRenewed` `0xbd0c01e5...`) and
  ETHRenewerV1 `0x56c447F308F463A01121C41E72b0E7e7557fCb68` (`NameRenewed` `0xbd0c01e5...`), decoded in SQL. Dune has no
  decoded tables for them. USDC `0xA0b8...eB48` has 6 decimals and DAI `0x6B17...1d0F` 18. **Any other payment token
  makes the query fail** (`fail('unknown ENSv2 payment token ...')`) instead of being dropped.
- **Cost-0 rows are dropped from every count**: wrapper syncs, `renew(name, 0)` and post-freeze side effects.

**Streams** (`revenue_totals.sql`, wei amounts kept exact as `decimal(38,0)` until the final ETH conversion):

| Stream       | v1 (ETH)                                                                     | ENSv2 (USDC/DAI)            |
| ------------ | ---------------------------------------------------------------------------- | --------------------------- |
| Registration | c1/c2 `cost`; c3 base rent (split below); c4/c5 `baseCost`                   | `NameRegistered.base`       |
| Premium      | c3 `cost` - base rent; c4/c5 `premium`                                       | `NameRegistered.premium`    |
| Renewal      | c1/c2/c3/c5 `cost`; c4: ETH kept = `msg.value` - refund, from traces (below) | `NameRenewed.amount` (both) |

The base of a premium registration stays in Registration, as before. ETH columns hold ETH-paid amounts only; ENSv2
adds 0 ETH and shows up in the USD columns and `stablecoin_usd`.

**USD.** Each ETH payment is priced at its hour: ETH is summed per `date_trunc('hour', block_time)` and multiplied by
`prices.hour` (WETH, `blockchain = 'ethereum'`), whose `timestamp` is the hour start. Production used one monthly
average (`prices.usd`), which moved months by -1.6% to +3.9%. Dune's docs recommend `prices.hour` over the
interpolated `prices.minute` for valuation. Every ETH payment predates the freeze, so a missing hourly price is a
data gap and fails the query rather than pricing at $0.

### c4 (2023 controller) renewals: exact ETH kept, from traces

`0x2535...303b` emits `NameRenewed(cost = msg.value)` and refunds `msg.value - price.base` afterwards. Production
fixed this only for Dec 2024 to Sep 2025 with the curated table
`dune.ethereumnameservice.result_ethregistrarcontroller4_namerenewed` and overstated other months by 81.8 ETH. The
new query computes, for every transaction with a paid c4 `NameRenewed`:

```
kept = Σ value of calls into c4 - Σ value of calls out of c4      (effective value calls in ethereum.traces)
       - Σ (baseCost + premium) of c4 NameRegistered in that tx   (register() keeps exactly that)
```

- **Effective** means the transaction succeeded and neither the call nor any ancestor failed. Ancestors are tested
  through `trace_address` prefixes, so the logic does not depend on how Dune's `success` treats reverted parents.
- **Why it is exact.** c4 has no receive or fallback function, so every value call into it is a `register()` or
  `renew()` frame, and every value call out of it is that frame's refund to `msg.sender`. Offline, no c4 renewal
  transaction contains any other outflow, such as `withdraw()`.
- **Guard.** `kept` must lie in `[0, Σ emitted cost]`, or the query fails. A transaction with no traces also fails.
  `kept = 0` occurs once: tx `0x0277af0b...` (2023-12-11) called `renew(name, 0)` with 1e13 wei and was fully refunded.
  It still counts as one Renewal action, because `actions.sql` does not read traces, but it adds $0 of revenue.
- **Cost.** This is the heaviest part of the query. The `block_date` range covers the whole c4 lifetime
  (2023-03-28 → 2026-10-27), so it prunes almost nothing. The filter keeps every trace to or from c4 and every failed
  trace on the chain until the semi-join on 329,267 transaction hashes, which is too many for Trino's dynamic filter
  to prune files. See [Create and schedule on Dune](#create-and-schedule-on-dune) for what this means for the schedule.

### c3 (2020 controller) premium: exact split

`0x283A...F7F5` emits one `cost = attoUSDToWei(rent(len) × duration + premium)`, and production booked all of it as
Registration: $14.66M of premium all time. The new queries split it exactly:

- **Before block 10,451,343** (2020-07-13), c3's oracle `0xb9d374d0` had no premium, so premium = 0.
- **From that block**, the split is:
  - `base_wei = floor(rent(len) × duration × 1e8 / answer)`
  - `premium_wei = cost - base_wei`
  - `rent` per second is 20,294,266,869,609 (3 chars), 5,073,566,717,402 (4) and 158,548,959,919 (5+). These were
    read with `rentPrices()` on all four c3 oracles; none ever changed them.
  - `len = length(name)`.
  - `duration = expires - block timestamp`.
- **`answer`** is the ETH/USD answer the oracle read at that log: the latest `AnswerUpdated` before it, ordered by
  (block, log index), from the aggregator behind the feed at that block. From block 10,739,273 (2020-08-27) the
  oracle reads the proxy `0x5f4e...8419`.

  | Blocks                   | Aggregator                       | Notes                                                              |
  | ------------------------ | -------------------------------- | ------------------------------------------------------------------ |
  | 10,451,343 to 11,008,984 | `0xF79D...406F`                  | read directly, then through proxy phases 1-2 (phase 2 is a facade) |
  | 11,008,985 to 12,187,956 | `0x00c7...5446` (FluxAggregator) | plus modelled silent reverts, see below                            |
  | 12,187,957 to 12,453,812 | `0xd3fC...B4fD`                  |                                                                    |
  | 12,453,813 to 17,217,054 | `0x37bC...A9E6`                  |                                                                    |
  | 17,217,055 to 20,822,020 | `0xE62B...50cc`                  |                                                                    |
  | 20,822,021 to 26,282,116 | `0x7d4E...6fB5`                  |                                                                    |

  The proxy emits no event when its phase changes, so the phase start blocks were found by bisecting `phaseId()`. No
  c3 registration falls in a boundary block.

- **FluxAggregator reverts.** When a new round starts, the previous round, if it timed out before `maxSubmissions`,
  is overwritten with the answer of the round before it, and no `AnswerUpdated` is emitted. `latestAnswer()` follows
  it. The `flux_*` CTEs rebuild these silent changes from `NewRound`, `SubmissionReceived`, `RoundDetailsUpdated` and
  `AnswerUpdated`. There are 158, and each one was checked against `latestAnswer()` on an archive node. Without the
  model, 4 registrations would have base > cost.
- **Guard.** A missing answer, a base of 0 or base > cost fails the query. c3 is frozen, so this is deterministic.
  A base of 0 means `rent` matched no length: a NULL `name` or one shorter than 3 code points. No such c3 row exists
  offline. One candidate on Dune is the registration at block 24,026,216 (2025-12-16), whose name is 100,000 bytes of
  `0xff` (invalid UTF-8). Offline it decodes to 100,000 replacement characters (length ≥ 5, which matches the oracle's
  `strlen`). If Dune decodes it to NULL, the first run fails at that block instead of booking its whole cost as
  premium.
- **Effect.** A c3 registration with premium > 0 becomes a Premium action, as c4/c5 ones already were.

### New wallets: definition change

**Old definition:** the first transaction sender (`evt_tx_from`) of any v1 registration or renewal.

**New definition:** the month in which an address first becomes the **registrant (owner)** of a .eth name, meaning
the first paid `NameRegistered` that names it as `owner`. That covers v1 controllers before the freeze, plus ENSv2
`ETHRegistrar.NameRegistered`, where the owner is data word 1.

**Why it changed:**

- Senders include relayers, bulk renewers and routers. 86% of ENSv2 registrations (1,261 of 1,465 to 2026-11-03)
  are sent by an address other than the owner.
- Owners who never send a transaction themselves were missed.
- Renewals no longer create wallets: a renewal needs an earlier registration, whose owner was already counted.

**Effect:** the 1Y KPI moves from 22,377 to 22,106 (-1.2%), because owner-based counting gives a different first
month for some addresses.

**Not covered:** names created outside the controllers (the 2019 auction, claims, legacy migrations) count from
their first controller registration, if any.

**Dashboard copy changes with the query.** The dashboard copy now describes these new queries:
revenue basis (ENSv2, hourly ETH price), the c3 premium split in the stream tooltips, the owner-based new wallets
(KPI, chart title and caption, OpenAPI description), the renewal-rate grace periods (28 days on ENSv2) and the
micro-renewal exclusion, the ENSv2 expiry for v1-origin names, and the ETH-only meaning of the ETH columns. Apply it
with `git apply` in the same release as step 5 below, not before: until then, the old queries still match the old
text.

## Create and schedule on Dune

1. **Create the queries** on a Dune account with credits; the current owner `ffquenomelv` has none. Paste each file
   as a new query and keep the queries public, as before.
2. **Run each query once** on the Large engine and record its runtime and credits. `revenue_totals.sql` scans
   `ethereum.traces` over 3.5 years (c4 refunds) and `ethereum.logs` over 6.5 years (Chainlink answers);
   `actions.sql` scans the same logs. Dune caps an execution at 30 minutes on every engine. If `revenue_totals.sql`
   hits the cap, split the c4 traces scan into block ranges (for example one frozen query per year that outputs
   per-transaction c4 `kept_wei`) and combine them through `query_<id>`.
   - **Before the full run, check `prices.hour` coverage.** Every hour with an ETH payment needs a WETH price, or
     the query fails on purpose (`prices.hour` forward-fills gaps of up to 7 days only). Run the query once with the
     final `SELECT` replaced by
     `SELECT count(*) AS missing_hours, min(h.hour) AS first_missing, max(h.hour) AS last_missing FROM eth_hourly h LEFT JOIN eth_usd_hourly p ON p.hour = h.hour WHERE p.price IS NULL`.
     Expect `missing_hours = 0`. Otherwise decide an explicit fallback (for example the `prices.day` price for that
     date), document it here, and keep the guard for anything the fallback does not cover.
3. **Compare with the acceptance values below.** Any difference beyond the stated tolerance is a finding: do not
   ship it.
4. **Schedule a refresh.** Daily is enough: v1 history is frozen and ENSv2 adds about $10k per day. Dune results
   expire 90 days after execution, so the schedule is what keeps `/revenue/*` from going empty.
   - As written, every run recomputes the v1 part, which can never change after block 26,282,117, at the cost
     measured in step 2. If that cost or runtime is too high for a daily schedule, split the queries before
     scheduling. Save the v1 part once as an unscheduled query:
     - the hourly v1 ETH sums (`eth_hourly`) for `revenue_totals.sql`;
     - the monthly v1 counts for `actions.sql`.
   - Then have the scheduled queries read that result through `query_<id>` and add only ENSv2 logs from block
     26,282,117. A result read by `query_<id>` must stay fresh too, so re-run the frozen query at least every 80 days.
     The split queries are not written or validated yet.
5. **Point the API at the new queries.** Set `REVENUE_DUNE_REVENUE_TOTALS_QUERY_ID`,
   `REVENUE_DUNE_ACTIONS_QUERY_ID` and `REVENUE_DUNE_NEW_WALLETS_QUERY_ID` to the new IDs, and
   `REVENUE_DUNE_ACTIVE_NAMES_QUERY_ID`, `REVENUE_DUNE_RENEWAL_FUNNEL_QUERY_ID` and
   `REVENUE_DUNE_RENEWAL_TENURE_QUERY_ID` to the new lifecycle queries, created, run and checked against the
   acceptance values in `README.lifecycle.md` the same way. Switch all six together: the copy patch in step 6
   describes all six. The API reads `GET /query/{id}/results`.
6. **Ship the copy.** The dashboard and API copy for these queries is applied in the same change as this note;
   deploy it together with the ID switch.

`fail(varchar)` is Trino's built-in hidden scalar function (`io.trino.operator.scalar.FailureFunction`). If Dune ever
rejects it, replace each call with a cast that errors on the same branch, e.g.
`CAST('unknown ENSv2 payment token' AS integer)`. Do not drop the guard.

## Acceptance values

**Tolerances:**

- ETH columns, counts and stablecoin amounts are **exact**: ETH to the 6th decimal, counts and stablecoins to the
  unit/cent.
- USD of ETH payments depends on Dune's `prices.hour`. The offline port used Coinbase hourly candles (mean of OHLC),
  so expect **±0.5%** per month on the ETH part of `registration_usd`, `premium_usd`, `renewal_usd` and `total_usd`.
- November 2026 is partial: the offline data ends at block 26,337,700 (2026-11-03 23:55 UTC).

### revenue_totals

| month   | registration_eth | premium_eth | renewal_eth | stablecoin_usd | registration_usd | premium_usd | renewal_usd |   total_usd |
| ------- | ---------------: | ----------: | ----------: | -------------: | ---------------: | ----------: | ----------: | ----------: |
| 2026-06 |        43.700793 |   48.399651 |  106.774843 |           0.00 |        73,507.82 |   83,021.52 |  183,661.65 |  340,190.99 |
| 2026-07 |        31.046061 |   18.148520 |  123.322537 |           0.00 |        56,507.29 |   33,611.16 |  226,079.25 |  316,197.70 |
| 2026-08 |        44.966924 |   59.880830 |  106.779015 |           0.00 |        96,249.50 |  123,300.90 |  232,020.75 |  451,571.15 |
| 2026-09 |        32.690291 |   20.593084 |   84.171243 |           0.00 |        83,246.59 |   52,300.65 |  216,951.80 |  352,499.04 |
| 2026-10 |        20.880215 |   12.868926 |   74.386292 |      55,615.78 |        68,663.52 |   35,421.47 |  222,290.33 |  326,375.32 |
| 2026-11 |                0 |           0 |           0 |    ≥ 28,278.31 |       ≥ 6,159.14 |  ≥ 6,241.08 | ≥ 15,878.10 | ≥ 28,278.31 |

**Breakdown of October 2026:**

- ETH (exact): before the freeze, 108.135433 ETH. The ETH part of the USD is 52,392.08 / 32,667.29 / 185,700.17
  (registration / premium / renewal), ±0.5%.
- Stablecoins (exact), ENSv2 from 2026-10-27 06:01:59 to 2026-10-31 23:59:59 UTC: base 16,271.441301, premium
  2,754.177625, renewals 36,590.160010 USDC (ETHRegistrar 3,619.122461, ETHRenewerV1 32,971.037549). That is 980
  registrations (18 with premium) and 4,243 renewals (173 + 4,070). DAI is 0.
- USD columns = ETH part + stablecoins.

**Anchors elsewhere** (ETH exact):

| month   | Exercises                       | registration_eth | premium_eth | renewal_eth |
| ------- | ------------------------------- | ---------------: | ----------: | ----------: |
| 2019-05 | c1                              |        98.178306 |           0 |   17.437070 |
| 2020-08 | c3 split, feed 0xF79D           |       278.199812 |  743.180408 |  126.251347 |
| 2021-01 | c3 split, FluxAggregator phase  |       139.483438 |  158.730103 |  114.241176 |
| 2023-04 | c4 refund                       |       246.943630 |  108.043038 |  659.602641 |
| 2024-12 | c4 refund, curated-table window |        94.136418 |   72.902739 |  144.555439 |

**All months through 2026-10:**

- 36,474.154 ETH registration, 10,218.722 ETH premium, 18,442.445 ETH renewal.
- 55,615.78 USD in stablecoins.
- About $129.79M total USD.

### actions

| month   | Registration | Premium | Renewal |
| ------- | -----------: | ------: | ------: |
| 2026-06 |        4,897 |     597 |  25,292 |
| 2026-07 |        4,447 |     504 |  23,746 |
| 2026-08 |        6,227 |   1,331 |  25,960 |
| 2026-09 |        5,776 |     702 |  26,712 |
| 2026-10 |        5,454 |     497 |  30,385 |
| 2026-11 |        ≥ 448 |    ≥ 37 | ≥ 1,499 |

- **October:** v1 before the freeze is 4,492 / 479 / 26,142 (Registration / Premium / Renewal); ENSv2 is 962 / 18 /
  4,243.
- **Other anchors:** 2020-08 is 4,279 / 1,979 / 5,175; 2023-04 is 25,886 / 1,263 / 39,176.

### new_wallets

| month   | new_wallets | cumulative_wallets |
| ------- | ----------: | -----------------: |
| 2026-06 |       1,157 |          1,054,274 |
| 2026-07 |       1,164 |          1,055,438 |
| 2026-08 |       1,297 |          1,056,735 |
| 2026-09 |       1,361 |          1,058,096 |
| 2026-10 |       1,186 |          1,059,282 |
| 2026-11 |       ≥ 218 |        ≥ 1,059,500 |

Anchors: 2019-05 is 907 / 907; 2022-05 is 49,891 / 375,192.

### ENSv2 window check (blocks 26,282,117 to 26,298,000)

This window is not a row of any query. To check it, run the `v2_decoded` CTE with
`block_number BETWEEN 26282117 AND 26298000`. The results should be:

- ETHRegistrar: 752 registrations, base 12,722.975213 and premium 2,247.119322 USDC (1 premium name, `rabby`), plus
  142 renewals for 3,076.902837.
- ETHRenewerV1: 2,496 renewals for 22,465.574246.
- Total 40,512.571618 USDC, 0 DAI.

## Validation

The offline port lives in `/Users/netto/work/ens-revenue-audit/sql-validation/revenue/`:

- `port_revenue_totals.sql`, `port_actions.sql` and `port_new_wallets.sql` keep the same CTEs in the same order.
- `port_prelude.sql` maps the Dune functions to DuckDB.
- `scripts/build_port_db.py` builds the data.
- `scripts/validate.py` runs the checks; results are in `out/validation.json` and the outputs in `out/*.csv`.

**Data stand-ins, all built from raw chain data:**

- `events.duckdb` stands in for the decoded v1 tables (Etherscan `getLogs`, checked against drpc).
- The raw ENSv2 and Chainlink logs stand in for `ethereum.logs`.
- Etherscan `txlist` and `txlistinternal` of c4 stand in for `ethereum.traces`.
- Coinbase hourly candles stand in for `prices.hour`.

All 81 checks pass:

- **Ground truth (Jun to Oct 2026)** in `readable_ground-truth.md`. Monthly total and renewal ETH match to 1e-6 ETH.
  Registrations, Premium-flag counts and paid renewals match exactly. The ground truth split premium proportionally
  for 85 c3 registrations, so premium ETH differs by up to 3e-5 ETH per month. Sep 1-22 total is 102.767290 ETH.
- **c3 premium (GT-3):** Jun 16 / 0.904108 ETH, Jul 17 / 0.314285, Aug 29 / 1.417961, Sep 1-22 4 / 0.138592,
  Sep 23-30 4 / 0.107606, Oct 11 / 0.111056. The counts are exact and the ETH is within 3e-5.
  - **On-chain check** (`scripts/verify_c3_onchain.py`). The sample is every premium below 0.001 ETH (4,116), 200
    random premiums and 200 random zero-premium registrations. For the 4,295 of them whose answer did not move inside
    the block, `base_wei` equals the oracle's own `price(name, 0, duration)` at block - 1, to the wei.
  - **Release-window check.** All 44,419 premiums > 0 whose name has a prior controller event fall inside the
    post-grace premium window (28 days, or 21 days on the exponential oracle). No zero-premium registration falls
    strictly inside one.
  - **All time to 2026-09-22:** 46,961 premium registrations and 8,077.044 ETH. The audit's own reconstruction gave
    46,924 and 8,076.995, but it did not model the FluxAggregator reverts. The difference (0.08%) is informational.
- **c4 refund:**
  - The overstatement by year outside the curated window is 2023 56.5612, 2024 20.5683, 2025 2.1454 and 2026
    2.5463 ETH. These equal the audit's figures.
  - In the curated window (Dec 2024 to Sep 2025) the query keeps 1,473.48 ETH, the same as production's curated
    table.
  - Lifetime kept is 6,874.144921 ETH, which equals the audit's cash-implied figure.
  - c4's ETH in - out equals its balance at block 26,282,116 (7.227407172845990325 ETH) to the wei.
  - Every outflow in a renewal transaction is a refund to an in-transaction sender.
- **ENSv2:** the window above matches exactly, and so does the full range to the head (83,894.091461 USDC).
  - The monthly split also matches an independent UTC `GROUP BY` month of the raw events for 2026-10 and 2026-11:
    `stablecoin_usd` and the Registration, Premium and Renewal counts.
  - The port's `logs.block_time` equals each block timestamp. A local session time zone (UTC+5:30) had once shifted
    every ENSv2 log and moved the evening of Oct 31 into November.
- **New wallets:** the owner-based 1Y figure (2025-10-01 to 2026-09-22) is 22,106 and the prior year
  (Oct 2024 to Sep 2025) is 75,156. Both equal the audit's owner-based figures (SQLV1-10).
- **USD:** Jun to Sep at hourly prices are within 0.5% of the ground truth's per-event daily-price USD.

**Port vs Dune SQL.** The port is semantically the same SQL with these stand-ins:

- `fail()` → `error()`.
- `decimal(38,0)` → `HUGEINT`.
- `varbinary_substring` and `varbinary_to_*` → hex-string macros with the same 1-based byte offsets.
- `max_by` → `arg_max`.
- The c4 trace step works per transaction from Etherscan's `isError` flags, because Etherscan's `traceId` is not a
  call path. The c4 checks above prove the two agree on this history: the balance identity is exact and there are no
  foreign outflows.

## Known limits

- **2019 paths are excluded.** The short-name auction (5,390 WETH) and ShortNameClaims (72.17 ETH) bypassed the
  controllers, as in production.
- **Renewal counts still include grace-period top-ups.** About half of all paid renewals leave the name expired.
  This is a definition question for the dashboard, not a SQL error.
- **v1 relies on Dune's decoded controller tables.** The audit verified them as complete (89/89 months replicated).
- **The Chainlink phase list must be extended if c3 ever uses a new aggregator.** It cannot: c3 was removed as a
  controller at the freeze.

## ENSv2 daily series (`ensv2_daily.sql`)

Dune query 9155159, read by `/revenue/ensv2-daily` through `REVENUE_DUNE_ENSV2_DAILY_QUERY_ID`. The variable is
optional: without it the route answers empty and degraded and the other revenue routes are unaffected.

One row per UTC day from the ENSv2 launch (block 26,282,117, 2026-10-27 06:01:59 UTC) through today, including days
with no event. The launch day and the current day are partial.

**Revenue** uses the same events, decoding, pricing and zero-amount filter as the ENSv2 part of `revenue_totals.sql`
(USDC and DAI at face value, any other token on a paid event fails the query), grouped by day instead of by month.

**Migration** reads the ENSv2 `.eth` registry, ETHRegistry `0xf60aBa43E1F7f3daB1186fF03b561401C9dF85e2`
(a `PermissionedRegistry`):

| Column                | Definition                                                                                                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reserved_names`      | Distinct labels in `LabelReserved` sent by the BatchRegistrar `0xf0Cc…9721`, which reserved every v1 name there between 2026-10-03 and the launch day (last at block 26,282,548). The names that can migrate. |
| `names_migrated`      | `LabelRegistered` whose `sender` is the UnlockedMigrationController `0xab82…eb64` or the LockedMigrationController `0x3cea…e51a`, one per name, on its first event.                                           |
| `cumulative_migrated` | Running total of `names_migrated`.                                                                                                                                                                            |
| `migrated_pct`        | `cumulative_migrated / reserved_names * 100`, 4 decimals.                                                                                                                                                     |
| `registrations`       | `LabelRegistered` whose `sender` is the ETHRegistrar: names registered on ENSv2, not migrations.                                                                                                              |
| `renewals`            | Paid `NameRenewed` on the ETHRegistrar and on ETHRenewerV1.                                                                                                                                                   |
| `renewals_unmigrated` | The ETHRenewerV1 part of `renewals`. It only renews v1 names that have not migrated.                                                                                                                          |

The denominator is fixed: only the BatchRegistrar's reservations count, and it stopped on the launch day. A reserved
name that expires without migrating stays in it, so `migrated_pct` cannot reach 100. A reserved name that expired and
was registered again on ENSv2 is a registration, not a migration.

### Acceptance values (run of 2026-11-19 15:50 UTC)

- 24 rows, 2026-10-27 to 2026-11-19.
- `cumulative_usd` on 2026-10-31 = 55,615.78, the October ENSv2 total of `revenue_totals.sql`.
- `reserved_names` = 919,728, all sent by the BatchRegistrar.
- `cumulative_migrated` = 31,310, every one of them a reserved label (checked at 31,308: 31,281 unlocked and 27
  locked).
- `registrations` sum to 3,471. At 3,468, 587 were on labels that had been reserved.
- `renewals` sum to 15,241, of which 14,783 on ETHRenewerV1. No zero-amount payment event exists so far.
- Cost: 1 to 3 credits per run.

### Why `reserved_names` is larger than the active names count

`reserved_names` (919,728) is the list of v1 names that could migrate, fixed at the launch. It is not the number of
active names. By the same interval logic as `active_names.sql`, at the launch (2026-10-27 06:01:59 UTC):

- 781,187 names were inside a paid term;
- 117,442 had expired but were still in their 90-day grace period, so their owners could still renew them;
- the remaining 21,099 were reserved earlier in October and their grace period ran out before the launch.

The dashboard calls them "eligible v1 names" and says in the tooltip that the list includes names in their grace
period.
