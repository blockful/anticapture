-- ENS Active .eth Names per Month (variation + cumulative)
-- Columns: month, net_change, cumulative_active, cumulative_onchain (mapped by fetchActiveNames).
-- Method: build per-name "active intervals" from paid v1 controller events (before the ENSv2 freeze) and ENSv2
-- ETHRegistrar / ETHRenewerV1 events. An event continues the label's current interval if it happens no later than
-- the interval's release date so far (max expiry + grace: 90 d for v1-equivalent expiries, 28 d for v2-native
-- terms); otherwise it starts a new interval (re-registration). Each interval contributes +1 at its start month and
-- -1 at (end month + 1) once its end has passed.
--   net_change, cumulative_active: the end is the end of the last PAID term (max expiry). The 62 days ENSv2 added
--     to every v1 name for free are not a paid term and are not counted.
--   cumulative_onchain: the end is the expiry in the registry of record (the ENSv2 expiry for v1-origin names after
--     the freeze, see intervals): names still registered on chain.
-- Month-granular: a name whose term ended earlier in the current month still counts for that month.

WITH
-- Name events, keyed by labelhash = keccak256(label bytes). See README.lifecycle.md for every definition.
-- v1: the five ETH controllers, paid rows only, before the ENSv2 freeze (block 26,282,117). Cost-0 NameRenewed
--     rows are wrapper syncs (ETHRenewerV1 syncWrapper, renew(name, 0)) that duplicate a paid renewal in the same
--     tx or carry no new term. expires is the v1 expiry; grace 90 days.
-- v2: ETHRegistrar 0xD6D8...CC81 (NameRegistered, NameRenewed) and ETHRenewerV1 0x56c4...Cb68 (NameRenewed), read
--     from ethereum.logs (no decoded tables exist for them). Expiry is expressed so that it is comparable with v1:
--       ETHRegistrar registration       -> block time + duration, a v2-native term, grace 28 days
--       ETHRenewerV1 renewal            -> newExpiry - 5,356,800 s (v1-equivalent, the 62-day v2 bonus removed), grace 90
--       ETHRegistrar renewal            -> newExpiry with grace 28 if the label's latest registration is an
--                                          ETHRegistrar registration; otherwise (v1-origin name, migrated or
--                                          reserved) newExpiry - 5,356,800 s with grace 90
--     Both graces give the same release date for v1-origin names (v1 expiry + 90 d = v2 expiry + 28 d).
--     BaseRegistrar is never read (the Graveyard writes expiries of 2^64-1-90d there).
-- Event order is (block_number, log_index): deterministic, unlike evt_block_time alone.

v1_events AS (
  SELECT label AS labelhash, evt_block_time AS block_time, evt_block_number AS block_number, evt_index AS log_index,
    from_unixtime(CAST(expires AS bigint)) AS expires_dt, 90 AS grace_days, 'register' AS kind
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_1_evt_nameregistered
  WHERE CAST(cost AS double) > 0 AND evt_block_number < 26282117
  UNION ALL
  SELECT label, evt_block_time, evt_block_number, evt_index,
    from_unixtime(CAST(expires AS bigint)), 90, 'renew'
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_1_evt_namerenewed
  WHERE CAST(cost AS double) > 0 AND evt_block_number < 26282117
  UNION ALL
  SELECT label, evt_block_time, evt_block_number, evt_index,
    from_unixtime(CAST(expires AS bigint)), 90, 'register'
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_2_evt_nameregistered
  WHERE CAST(cost AS double) > 0 AND evt_block_number < 26282117
  UNION ALL
  SELECT label, evt_block_time, evt_block_number, evt_index,
    from_unixtime(CAST(expires AS bigint)), 90, 'renew'
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_2_evt_namerenewed
  WHERE CAST(cost AS double) > 0 AND evt_block_number < 26282117
  UNION ALL
  SELECT label, evt_block_time, evt_block_number, evt_index,
    from_unixtime(CAST(expires AS bigint)), 90, 'register'
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_3_evt_nameregistered
  WHERE CAST(cost AS double) > 0 AND evt_block_number < 26282117
  UNION ALL
  SELECT label, evt_block_time, evt_block_number, evt_index,
    from_unixtime(CAST(expires AS bigint)), 90, 'renew'
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_3_evt_namerenewed
  WHERE CAST(cost AS double) > 0 AND evt_block_number < 26282117
  UNION ALL
  SELECT label, evt_block_time, evt_block_number, evt_index,
    from_unixtime(CAST(expires AS bigint)), 90, 'register'
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_4_evt_nameregistered
  WHERE CAST(baseCost AS double) + CAST(premium AS double) > 0 AND evt_block_number < 26282117
  UNION ALL
  SELECT label, evt_block_time, evt_block_number, evt_index,
    from_unixtime(CAST(expires AS bigint)), 90, 'renew'
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_4_evt_namerenewed
  WHERE CAST(cost AS double) > 0 AND evt_block_number < 26282117
  UNION ALL
  SELECT labelhash, evt_block_time, evt_block_number, evt_index,
    from_unixtime(CAST(expires AS bigint)), 90, 'register'
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_5_evt_nameregistered
  WHERE CAST(baseCost AS double) + CAST(premium AS double) > 0 AND evt_block_number < 26282117
  UNION ALL
  SELECT labelhash, evt_block_time, evt_block_number, evt_index,
    from_unixtime(CAST(expires AS bigint)), 90, 'renew'
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_5_evt_namerenewed
  WHERE CAST(cost AS double) > 0 AND evt_block_number < 26282117
),

-- Raw ENSv2 logs. NameRegistered data: w0 label offset, w1 owner, w2 subregistry, w3 resolver, w4 duration,
-- w5 paymentToken, w6 base, w7 premium, then label (length word + bytes). NameRenewed data: w0 label offset,
-- w1 duration, w2 newExpiry, w3 paymentToken, w4 amount, then label. uint64 fields sit in a word's last 8 bytes.
v2_logs AS (
  SELECT
    contract_address,
    topic0,
    block_time,
    block_number,
    index AS log_index,
    data,
    varbinary_to_bigint(varbinary_substring(data, 25, 8)) AS label_offset
  FROM ethereum.logs
  WHERE block_date >= DATE '2026-10-27'
    AND block_number >= 26282117
    AND (
      (contract_address = 0xD6D8369e55c94Ae8AFA714E6cF7AB5bE54D5CC81
        AND topic0 IN (0xebd3982eafd13b820e3edb2a4abd57a82ce3b8802e0cd45637a5de51383f9fac,
                       0xbd0c01e5bf66003280556423db4a8bf79043c146ac57f657c30049dd43316649))
      OR (contract_address = 0x56c447F308F463A01121C41E72b0E7e7557fCb68
        AND topic0 = 0xbd0c01e5bf66003280556423db4a8bf79043c146ac57f657c30049dd43316649)
    )
),

v2_decoded AS (
  SELECT
    -- Start and length are cast to integer: Dune documents varbinary_substring(varbinary, integer, integer), and
    -- Trino does not coerce bigint to integer implicitly.
    keccak(varbinary_substring(
      data,
      CAST(label_offset + 33 AS integer),
      CAST(varbinary_to_bigint(varbinary_substring(data, CAST(label_offset + 25 AS integer), 8)) AS integer)
    )) AS labelhash,
    block_time,
    block_number,
    log_index,
    CASE WHEN topic0 = 0xebd3982eafd13b820e3edb2a4abd57a82ce3b8802e0cd45637a5de51383f9fac
         THEN 'register' ELSE 'renew' END AS kind,
    contract_address = 0x56c447F308F463A01121C41E72b0E7e7557fCb68 AS is_renewer_v1,
    CASE WHEN topic0 = 0xebd3982eafd13b820e3edb2a4abd57a82ce3b8802e0cd45637a5de51383f9fac
         THEN varbinary_to_bigint(varbinary_substring(data, 153, 8)) END AS reg_duration,
    CASE WHEN topic0 = 0xbd0c01e5bf66003280556423db4a8bf79043c146ac57f657c30049dd43316649
         THEN varbinary_to_bigint(varbinary_substring(data, 89, 8)) END AS new_expiry
  FROM v2_logs
),

-- has_v2_registration: an ETHRegistrar registration of this label precedes the event. v1 registrations all predate
-- the freeze, so this is exactly "the label's latest registration is a v2 ETHRegistrar registration".
v2_with_origin AS (
  SELECT *,
    MAX(CASE WHEN kind = 'register' THEN 1 ELSE 0 END) OVER (
      PARTITION BY labelhash ORDER BY block_number, log_index
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ) AS has_v2_registration
  FROM v2_decoded
),

v2_events AS (
  SELECT
    labelhash,
    block_time,
    block_number,
    log_index,
    CASE
      WHEN kind = 'register' THEN from_unixtime(to_unixtime(block_time) + reg_duration)
      WHEN NOT is_renewer_v1 AND has_v2_registration = 1 THEN from_unixtime(new_expiry)
      ELSE from_unixtime(new_expiry - 5356800)
    END AS expires_dt,
    CASE
      WHEN kind = 'register' THEN 28
      WHEN NOT is_renewer_v1 AND has_v2_registration = 1 THEN 28
      ELSE 90
    END AS grace_days,
    kind
  FROM v2_with_origin
),

all_events AS (
  SELECT *, date_add('day', grace_days, expires_dt) AS release_dt FROM v1_events
  UNION ALL
  SELECT *, date_add('day', grace_days, expires_dt) AS release_dt FROM v2_events
),

with_prev_max AS (
  SELECT
    labelhash,
    block_time,
    expires_dt,
    grace_days,
    MAX(release_dt) OVER (
      PARTITION BY labelhash ORDER BY block_number, log_index
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ) AS prev_max_release,
    block_number,
    log_index
  FROM all_events
),

flagged AS (
  SELECT *,
    CASE WHEN prev_max_release IS NULL OR prev_max_release < block_time
         THEN 1 ELSE 0 END AS is_new_interval
  FROM with_prev_max
),

with_interval_id AS (
  SELECT *,
    SUM(is_new_interval) OVER (
      PARTITION BY labelhash ORDER BY block_number, log_index
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS interval_id
  FROM flagged
),

-- Two ends per interval:
--   paid_end   = the end of the last term that was paid for: max(expires_dt). For v1-origin names this is the
--                v1-equivalent expiry, that is, the ENSv2 expiry without the 62 days ENSv2 added for free.
--   record_end = the expiry in the registry of record. Once the freeze has happened, v1-origin intervals (grace 90)
--                whose paid_end is on or after 2026-09-01 expire on ENSv2 at paid_end + 5,356,800 s. The 2026-09-01
--                bound keeps every pre-freeze month as it was.
-- The series (net_change, cumulative_active) uses paid_end, so the one-off 62-day extension does not pause the
-- departures for two months. cumulative_onchain uses record_end: names still registered on chain.
-- Continuity above is the same on both scales (v1 expiry + 90 d = ENSv2 expiry + 28 d).
intervals AS (
  SELECT
    labelhash,
    interval_id,
    MIN(block_time) AS start_time,
    MAX(expires_dt) AS paid_end,
    MAX(CASE WHEN grace_days = 90
                  AND expires_dt >= TIMESTAMP '2026-09-01 00:00:00 UTC'
                  AND current_timestamp >= TIMESTAMP '2026-10-27 06:01:59 UTC'
             THEN date_add('second', 5356800, expires_dt)
             ELSE expires_dt END) AS record_end
  FROM with_interval_id
  GROUP BY labelhash, interval_id
),

deltas AS (
  SELECT date_trunc('month', start_time) AS month, 1 AS paid_delta, 1 AS onchain_delta
  FROM intervals
  UNION ALL
  SELECT date_trunc('month', paid_end) + INTERVAL '1' MONTH AS month, -1 AS paid_delta, 0 AS onchain_delta
  FROM intervals
  WHERE paid_end < current_timestamp
  UNION ALL
  SELECT date_trunc('month', record_end) + INTERVAL '1' MONTH AS month, 0 AS paid_delta, -1 AS onchain_delta
  FROM intervals
  WHERE record_end < current_timestamp
),

monthly_delta AS (
  SELECT month, SUM(paid_delta) AS net_change, SUM(onchain_delta) AS onchain_change
  FROM deltas
  GROUP BY month
)

SELECT
  month,
  net_change,
  SUM(net_change) OVER (ORDER BY month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_active,
  SUM(onchain_change) OVER (ORDER BY month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_onchain
FROM monthly_delta
WHERE month <= current_timestamp
ORDER BY month
