# ENS lifecycle queries (active names, renewal funnel, upcoming expirations)

Dune SQL for the three name-lifecycle series on the ENS revenue page. Revenue, actions and new wallets are documented
in `README.md`.

**Release.** Create, run and check these three queries as described in `README.md` (Create and schedule on Dune), and
switch their IDs together with the three revenue queries (step 5 there). The dashboard copy for them ships in the
same release (step 6).

| File                 | Dune query (production)          | API key         | Columns (unchanged)                                                                    |
| -------------------- | -------------------------------- | --------------- | -------------------------------------------------------------------------------------- |
| `active_names.sql`   | 7531711 `active_names_per_month` | `activeNames`   | `month`, `net_change`, `cumulative_active`                                             |
| `renewal_funnel.sql` | 7531722 `renewal_rate_per_month` | `renewalFunnel` | `expiry_month`, `terms_expiring`, `renewed_count`, `churned_count`, `renewal_rate_pct` |
| `renewal_tenure.sql` | 7531738 `upcoming_expirations`   | `renewalTenure` | `expiry_month`, `tenure_bucket`, `names`, `total_renewals_in_bucket`                   |

The column names, types and `tenure_bucket` labels (`0 renewals (one-shot)`, `1 renewal`, `2 renewals`,
`3+ renewals`) are the ones `dune-client.ts` validates, so the API mappers need no change. Month columns come from
`date_trunc('month', <timestamp with time zone>)`, which Dune serialises as `YYYY-MM-DD 00:00:00.000 UTC`.

None of these files has been run on Dune: the production key's account cannot execute queries. They were validated
against an offline port (see [Validation](#validation)).

## Data sources

- **v1**: the decoded tables `ethereumnameservice_ethereum.ethregistrarcontroller_{1..5}_evt_{nameregistered,namerenewed}`.
  These are the five ETH controllers, c1 `0xF0AD5cAd...` to c5 `0x59E16fcC...`. The Dune catalog lists them as Public
  decoded tables (checked on dune.com/data, 2026-11-04).
- **ENSv2**: `ethereum.logs`, filtered on contract and topic0 and decoded in SQL, because Dune has no decoded tables
  for the ENSv2 contracts (the `ethereumnameservice` namespace has none on 2026-11-04). The logs come from:
  - ETHRegistrar `0xD6D8369e55c94Ae8AFA714E6cF7AB5bE54D5CC81`: `NameRegistered` `0xebd3982e...` and `NameRenewed`
    `0xbd0c01e5...`.
  - ETHRenewerV1 `0x56c447F308F463A01121C41E72b0E7e7557fCb68`: `NameRenewed` `0xbd0c01e5...`.

  The scan is pruned with `block_date >= 2026-10-27` and `block_number >= 26,282,117`.

- **Never read**:
  - BaseRegistrar. The Graveyard `0xDa021A2C...` registers expired v1 names there with expiry 2^64-1-90 d, and every
    ETHRenewerV1 renewal emits two `NameRenewed` there.
  - Spellbook `ens.*` views. They are hidden, they miss v5, and they map the v4 cost wrongly.
  - Query-result tables.

### Why 7531738 (renewal_tenure) failed with "Deprecated dataset"

The saved text of version 4 reads the same ten decoded controller tables as `active_names` (7531711). That query ran
on 2026-09-23, and its Data sources panel lists those ten tables. Version 4 itself has no execution, so Dune shows no
lineage for it. The catalog shows all ten tables as Public, and the docs' data changelog (Aug-Oct 2026) deprecates
nothing in `ethereumnameservice_ethereum`.

So the error cannot be pinned to a table in the current text from public information. The likely explanation is an
earlier version: the query was created about six months ago. If that version read the Spellbook ENS views, the error
fits, because `ens.view_registrations` and the other curated ENS spells were bulk-hidden on 2026-01-28 (Spellbook PR
#9245). This is unconfirmed: the version history needs a logged-in owner.

Either way, the new file depends only on the decoded controller tables and `ethereum.logs`. Both are part of Dune's
"stays public" set (every decoded event table and every raw chain table).

## Event model (shared `all_events` CTE, identical in the three files)

Each row is one paid name event: `labelhash`, `block_time`, `block_number`, `log_index`, `expires_dt`,
`grace_days`, `kind` (`register` | `renew`), plus `release_dt = expires_dt + grace_days`.

| Source                                                                                                  | Rows kept                                                                                                                                                    | `expires_dt`                                  | Grace |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- | ----- |
| v1 controllers c1-c5                                                                                    | `evt_block_number < 26,282,117` (the ENSv2 freeze) and paid: `cost > 0` (c1-c3 registrations, every renewal), `baseCost + premium > 0` (c4/c5 registrations) | `expires` (v1 expiry)                         | 90 d  |
| ETHRegistrar `NameRegistered`                                                                           | all                                                                                                                                                          | `block_time + duration` (a brand-new v2 term) | 28 d  |
| ETHRenewerV1 `NameRenewed`                                                                              | all                                                                                                                                                          | `newExpiry - 5,356,800 s` (v1-equivalent)     | 90 d  |
| ETHRegistrar `NameRenewed`, label has an earlier ETHRegistrar registration                              | all                                                                                                                                                          | `newExpiry` (v2-native)                       | 28 d  |
| ETHRegistrar `NameRenewed`, no earlier ETHRegistrar registration (v1-origin name, migrated or reserved) | all                                                                                                                                                          | `newExpiry - 5,356,800 s` (v1-equivalent)     | 90 d  |

Notes on the event model:

- **Name key.** `labelhash = keccak256(label bytes)`. For v1 this is the decoded `label` (c1-c4) or `labelhash` (c5)
  column. For v2 it is `keccak(label)` decoded from `data`. The v2 `tokenId` is not the labelhash (its low 32 bits are
  a version).
- **v2 decoding.** All offsets are 1-indexed bytes, and a uint64 sits in the last 8 bytes of its 32-byte word.
  - Label offset: `data[25..32]`. The label length is at `offset+25..offset+32`, and the label bytes start at
    `offset+33`.
  - Registration duration: word 4, `data[153..160]`.
  - Renewal newExpiry: word 2, `data[89..96]`.
  - The computed start and length passed to `varbinary_substring` are `CAST(... AS integer)`: Dune documents the
    function as `varbinary_substring(varbinary, integer, integer)` and Trino does not coerce `bigint` to `integer`.
- **Why 5,356,800 s.** Every v1-origin name received a 62-day bonus in v2 (v2 expiry = v1 expiry + 5,356,800 s). This
  was verified on all 2,496 ETHRenewerV1 renewals in the ground-truth window and on 75 of 75 sampled migrations.
  Subtracting the bonus keeps one time scale per name across the freeze.
- **Grace periods.** The release date is the same in both systems for v1-origin names: v1 expiry + 90 d = v2 expiry
  - 28 d.
- **"Latest registration is an ETHRegistrar registration".** All v1 registrations predate the freeze. So this is
  equivalent to "an ETHRegistrar registration of the label precedes the renewal" in `(block_number, log_index)`
  order. The SQL computes that with a running `MAX` over the v2 events of the label.
- **Cost-0 v1 rows are dropped.** Before the freeze there were 760 `renew(name, 0)` rows: 170 on c3 and 590 on c4,
  690 of them before 2026-09-23 00:08:43. After the freeze, ETHRenewerV1's `syncWrapper` makes c4 emit a cost-0
  `NameRenewed` per renewal (5,577 up to block 26,337,700). These rows either duplicate a paid renewal in the same tx
  or carry no new term, and the post-freeze ones are mirrored by the ETHRenewerV1 row: 5,529 of 5,529 have
  c4 `expires` = `newExpiry - 5,356,800`.
- **Event order.** `(block_number, log_index)` everywhere. Production ordered by `evt_block_time` alone, which is
  nondeterministic for the 1,841 (label, timestamp) ties.

## Metric definitions

### Active names (`active_names.sql`)

**Intervals.** Per label, events are walked in `(block_number, log_index)` order. An event continues the current
interval if `block_time <= max(release_dt)` of the label's earlier events. Otherwise (first event, or after the
release date) it opens a new interval, which is a re-registration. An interval runs from its first event's
`block_time` to `end_time`, its expiry in the registry of record:

- `max(expires_dt)` in general;
- for v1-origin intervals (grace 90) whose v1-equivalent end is on or after 2026-09-01, once `now` is past the freeze
  (2026-10-27 06:01:59 UTC): the ENSv2 expiry, `max(expires_dt) + 5,356,800 s`. These names are unexpired on ENSv2
  until that date.

Continuity (`release_dt`) is not affected: the release date is the same on both scales.

**Series.** Each interval adds `+1` in the month it starts and `-1` in the month after `end_time`'s month, but only
once `end_time < now`. `cumulative_active` is the running sum, and rows run to the current month.

**Month-granular.** A name counts as active in every month that its interval touches, so names that expired earlier
in the current month still count. As of the production cutoff, the alternatives were:

- strictly unexpired: 806,482
- unexpired or in grace: 929,602

Both are from the audit.

**v1-origin names after the freeze.** ENSv2 is the registry of record, and every v1-origin name's ENSv2 expiry is its
v1 expiry + 62 d, so the series counts them until their ENSv2 expiry. Ending them at the v1-equivalent expiry would
drop names that are still unexpired on chain: at block 26,337,700, 68,807 of them in 2026-11 (780,354 instead of
849,161) and about 69.7k from the upcoming expirations.

- **The 2026-09-01 bound** keeps every pre-freeze month unchanged: the shifted intervals had their `-1` in 2026-10 or
  later. The cost is 8,503 names with a v1 expiry on 2026-08-26..31, whose ENSv2 expiry falls on 2026-10-27..11-01:
  they stay out of 2026-10 although they were unexpired on ENSv2 for up to 5 days after the freeze.
- **Migrated names** have no paid event at migration. They keep their v1 interval, now ending at the ENSv2 expiry.
  Any later ETHRegistrar renewal continues that interval. They are never churned by the migration itself.
- **Tooltip copy**: "v1 names count until their ENSv2 expiry (v1 expiry + 62 days)".

### Renewal funnel (`renewal_funnel.sql`)

**Terms.** Every paid event (registration or renewal) is one term, ending at `expires_dt`, except grace-keeping
micro-renewals. The cohort is `date_trunc('month', expires_dt)`, on the v1-equivalent scale for v1-origin names.

**Grace-keeping micro-renewals are not terms.** A renewal whose bought expiry is not in the future at the time of the
payment leaves the name expired; these are often 1-day renewals repeated daily (audit GT-8). The test uses the expiry
in the registry of the tx: `expires_dt` before the freeze, the ENSv2 newExpiry after it (`expires_dt + 5,356,800 s`
for v1-origin names). They stay events, so they still renew the term before them, and the interval logic is unchanged.

- Before the freeze: 268,537 paid v1 renewals on 47,813 labels. After it, to block 26,337,700: 2,190 ETHRenewerV1
  renewals on 1,271 labels (2,656 by the v1-equivalent expiry; 466 of those are unexpired on ENSv2).
- In the 1Y KPI window at the 2026-09-23 cutoff they were 137,670 of 781,702 terms (17.6%), 91% of them "renewed",
  on 20,787 labels. Counting them gave 42.19% (prior year 31.83%, YoY +10.36 pp); without them the KPI is 31.77%
  (prior year 27.36%, YoY +4.41 pp).
- **Tooltip copy**: "Each paid registration or renewal is a term; renewals that leave the name expired (grace-keeping
  micro-renewals) are not counted".

**Renewed.** A term is renewed if the label's next event, by `LEAD` in `(block_number, log_index)` order, happens at
or before the term's `release_dt`. That is expiry + 90 d, or + 28 d for a v2-native term. Otherwise the term churned.

- Early renewals (before expiry) count as renewed. They are 35% of renewed terms in the 1Y KPI window.
- A re-registration by anyone after the release date is churn.

**Resolved cohorts only.** A term is counted only when `expires_dt < now - 90 d`, the same as production. Cohort
months ending within 90 days of `now` are partial: the last row covers expiries up to `now - 90 d`. That is why the
dashboard ends Renewal Rate windows at `asOf - 90 d`.

**`renewal_rate_pct`** = `ROUND(100 * renewed / terms, 2)`. The dashboard KPI weights months by `terms_expiring`.

### Upcoming expirations by tenure (`renewal_tenure.sql`)

**Which intervals.** The intervals are built as in active names, keeping those with `end_time > now`. `end_time` and
the month bucket are the ENSv2 expiry for v1-origin names (see active names).

**Tenure.** `renewal_count` is the number of paid renewal events inside the interval:

- v1 renewals with cost > 0 before the freeze
- ETHRenewerV1 renewals
- ETHRegistrar renewals

Registrations are not counted. Grace-keeping micro-renewals do count here (one paid renewal each); excluding them
would move 289 names to another bucket at the 2026-09-23 cutoff.

**Rows.** One row per (`date_trunc('month', end_time)`, bucket), with `names = COUNT(*)` and
`total_renewals_in_bucket = SUM(renewal_count)`. The UI's "never renewed, next 12 months" figure sums the
`0 renewals (one-shot)` bucket over 12 month buckets, starting with the cutoff's month.

## Changes vs the production SQL (version 4) and their measured effect

| Change                                                         | Effect                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ENSv2 events added                                             | Without them, every v1 name renewed after 2026-10-27 would churn and every v2 registration would be missing. At block 26,337,700 (2026-11-03 23:55): active names 2026-10 rise from 809,107 to 811,652, and 2026-11 from 776,628 to 780,354 (both measured without v2 and without the cost-0 rows). Without v2, the 5,577 post-freeze c4 cost-0 sync rows were production's only renewal signal, and they miss ETHRegistrar renewals and registrations. |
| v1 rows restricted to `block_number < 26,282,117` and cost > 0 | At the 2026-09-23 cutoff: active names 2026-09 unchanged (834,170). KPI Jul 2025-Jun 2026 goes from 781,747 / 329,856 to 781,702 / 329,811 (-45 terms, -45 renewed): 42.1947% → 42.1914%. Prior year: -13 / -13. One-shot names in the next 12 buckets: 272,446 → 272,451. Total (378,784) unchanged; the 1 / 2 / 3+ buckets change by +140 / -68 / -77, as cost-0 renewals no longer count.                                                            |
| `LEAD` / windows ordered by `(block_number, log_index)`        | The production result is not reproducible on the 1,841 same-timestamp ties. The replica differs from the served rows by +205 renewed in total (0.0145%); in the KPI window +19 (42.1923% served vs 42.1947%).                                                                                                                                                                                                                                           |
| Per-row grace (90 d v1-equivalent, 28 d v2-native)             | Identical to production for v1 rows (`prev_max_release < block_time` ≡ `prev_max_expires + 90 d < evt_block_time`).                                                                                                                                                                                                                                                                                                                                     |
| Decoded controller tables + `ethereum.logs` only               | Removes the dependency behind 7531738's "Deprecated dataset".                                                                                                                                                                                                                                                                                                                                                                                           |
| Funnel: grace-keeping micro-renewals are not terms             | At the 2026-09-23 cutoff: KPI Jul 2025-Jun 2026 644,032 terms / 204,615 renewed = 31.7709% (42.1914% with them); prior year 829,966 / 227,057 = 27.3574% (31.8339%). Every cohort from 2019-06 changes. At block 26,337,700: KPI Aug 2025-Jul 2026 31.8557% (43.1085%).                                                                                                                                                                                 |
| Active / tenure: v1-origin intervals end at the ENSv2 expiry   | No change at the 2026-09-23 cutoff, and no change to any month up to 2026-09 at any cutoff. At block 26,337,700: active names 2026-10 811,652 → 848,676, 2026-11 780,354 → 849,161; one-shot names expiring 2026-11..2027-10 267,337 → 286,437 (total 374,648 → 405,166).                                                                                                                                                                               |

## Caveats to state in tooltips

- **"Terms" are payments, not years.** A renewal of any length is one term: ETHRenewerV1 renewals have a median
  duration of 23 days (10th percentile 1 day, 5,529 rows up to block 26,337,700), and short v1 renewals predate the
  freeze. Grace-keeping micro-renewals are excluded from the funnel (see Renewal funnel) but still add to tenure.
- **Two expiry scales.** The funnel uses v1-equivalent expiries for v1-origin names (cohort months stay continuous
  across the freeze); active names and upcoming expirations use the ENSv2 expiry after the freeze, 62 days later.
- **Recent months revise.** A renewal inside the grace period removes a `-1` already placed in a later month, so
  recent active-name months and the current tenure counts change retroactively, as in production.
- **Names not counted before their first controller event.** Names created outside the controllers (2019 auction,
  claims, legacy migrated names, admin registrations) only appear from their first controller or ENSv2 event.
- **The KPI text "expiry + 90 days" is incomplete.** For v2-native terms the window is expiry + 28 days, which is the
  same release date for v1-origin names.

## Validation

The SQL could not be run on Dune. The logic was ported to DuckDB over the offline chain dataset
`/Users/netto/work/ens-revenue-audit/data/events.duckdb`, which holds every v1 controller and ENSv2 log up to block
26,337,700. Everything is in `/Users/netto/work/ens-revenue-audit/sql-validation/lifecycle/`:

- `port.py`: the port, CTE by CTE (`variant='new'` is these files; `variant='prod'` replicates version 4).
- `validate.py` → `results.json`: checks (a) and (b), plus the post-freeze series.
- `check_post_freeze.py` → `post_freeze_checks.json`: check (c).
- `check_v2_decoding.py` → `v2_decoding_check.json`: applies this SQL's byte offsets and keccak to the 7,207 raw v2
  logs. It finds 0 mismatches in labelhash, duration and newExpiry.
- `export.py [cutoff]` → `export/<cutoff>/*.csv`: full outputs, for row-by-row comparison with a Dune run.

### Acceptance values

The cutoff is 2026-09-23 00:08:43 UTC, the production execution. ENSv2 rows are excluded; there were none before
that date anyway.

| Check                                                      | Production (served)          | Production replica (port)                                                                                                       | New SQL (port)                     |
| ---------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Active names 2026-09                                       | 834,170                      | 834,170 (89 months: 75 equal the served rows; `cumulative_active` is 1 lower for 2022-08..2023-08, see the 2022-08 dataset gap) | **834,170**                        |
| Renewal KPI, cohorts 2025-07..2026-06 (weighted)           | 42.1923% (329,837 / 781,747) | 42.1947% (329,856 / 781,747)                                                                                                    | **31.7709%** (204,615 / 644,032)   |
| Renewal KPI, cohorts 2024-07..2025-06                      | 31.8332% (282,853 / 888,548) | 31.8349% (282,868 / 888,548)                                                                                                    | **27.3574%** (227,057 / 829,966)   |
| One-shot names expiring 2026-09..2027-08 (UI's 12 buckets) | 0 (no execution)             | 272,446                                                                                                                         | **272,451**                        |
| Renewal KPI with micro-terms kept (production definition)  |                              |                                                                                                                                 | 42.1914% / 31.8339%                |
| By renewals: 1 / 2 / 3+ / total                            | n/a                          | 45,819 / 22,333 / 38,186 / 378,784                                                                                              | 45,959 / 22,265 / 38,109 / 378,784 |

Post-freeze, at block 26,337,700 (2026-11-03 23:55 UTC), with ENSv2:

| Check                                                                                 | Value                                                                                                               |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| ETHRegistrar registrations opening a new interval                                     | 1,465 of 1,465. 902 are re-registrations of v1-origin labels, all after release (0 inside v1 grace).                |
| ETHRenewerV1 renewals continuing the label's interval                                 | 5,529 of 5,529 (0 opened a new interval). v1-equivalent expiry = c4 sync row expiry in the same tx: 5,529 of 5,529. |
| ETHRegistrar renewals classified v1-origin / v2-native, blocks 26,282,117..26,298,000 | 120 / 22, equal to the ENSv2 audit ground truth                                                                     |
| ETHRegistrar renewals continuing the interval (v1-origin / v2-native)                 | 180 of 180 / 33 of 33                                                                                               |
| Active names 2026-10 / 2026-11                                                        | 848,676 / 849,161 (846,495 / no 2026-11 row without ENSv2: no +1 or -1 falls in that month)                         |
| One-shot names expiring 2026-11..2027-10                                              | 286,437 (286,781 without ENSv2)                                                                                     |
| Renewal KPI, cohorts 2025-08..2026-07                                                 | 31.8557% (203,402 / 638,510)                                                                                        |

### Rows that a later Dune run must reproduce exactly

These rows no longer depend on the execution time:

- `renewal_funnel` rows for expiry months up to 2026-07. Their grace windows closed before the dataset head.
- `active_names` rows up to 2026-08. Their `-1`s come from intervals released before the head.

Compare them with `export/2026-11-03T235500/*.csv`. Expected deviations:

- **2022-08 dataset gap.** Dune's decoded tables hold one 2022-08 registration more than the offline dataset
  (production actions 301,693 vs 301,692). On Dune, `active_names` should be +1 for months 2022-08..2023-08 and equal
  from 2023-09. The `renewal_funnel` 2023-08 row should be +1 term and +1 renewed (port: 188,545 / 37,105).
- **Rows that depend on the execution time.** Compare `renewal_tenure` and the latest `active_names` months only by
  re-running `export.py` at the Dune `execution_ended_at`, on a dataset that reaches that block.

### Line-by-line correspondence (Dune SQL → DuckDB port)

| Dune CTE                                                    | Port                                    | Differences                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v1_events` (10 decoded tables)                             | `v1_events` over `v1_controller_events` | The `dune_table` column maps controller to table. The cost test is the same: c4/c5 registrations use `base_cost_wei + premium_wei`, everything else `cost_wei`. `from_unixtime(expires)` = `expires_time`. Plus `block_time <= cutoff` (what Dune sees at `now`). |
| `v2_logs`, `v2_decoded`                                     | `v2_decoded` over `v2_events`           | The byte decoding is checked separately (`check_v2_decoding.py`: same offsets, same keccak, 0 mismatches). `topic0`/contract filters ≡ `event`/`contract` columns.                                                                                                |
| `v2_with_origin`                                            | same                                    | identical window                                                                                                                                                                                                                                                  |
| `v2_events`                                                 | `v2_events_`                            | `from_unixtime(to_unixtime(block_time) + duration)` ≡ `make_timestamp((epoch(block_time) + duration) * 1e6)`; same CASEs                                                                                                                                          |
| `all_events`                                                | same                                    | `date_add('day', grace_days, expires_dt)` ≡ `expires_dt + grace_days * INTERVAL 1 DAY`                                                                                                                                                                            |
| `with_prev_max`, `flagged`, `with_interval_id`, `intervals` | same                                    | identical; `current_timestamp` → cutoff. The ENSv2-expiry `end_time` is off for `variant='prod'`                                                                                                                                                                  |
| `deltas`, `monthly_delta`, final SELECT (active)            | same                                    | identical                                                                                                                                                                                                                                                         |
| `with_next`, `classified`, final SELECT (funnel)            | same                                    | identical; `date_add('second', 5356800, x)` ≡ `x + 5356800 * INTERVAL 1 SECOND`                                                                                                                                                                                   |
| `active_intervals`, final SELECT (tenure)                   | same                                    | identical                                                                                                                                                                                                                                                         |
