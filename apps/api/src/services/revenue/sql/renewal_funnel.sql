-- ENS Renewal Rate per Month (cohort = expiry month)
-- Columns: expiry_month, terms_expiring, renewed_count, churned_count, renewal_rate_pct (unchanged; mapped by
-- fetchRenewalFunnel).
-- Each paid event (registration or renewal, v1 before the ENSv2 freeze or ENSv2) is one term that expires at
-- expires_dt (v1-equivalent for v1-origin names, see below). The term was "renewed" if the label's next event, in
-- (block_number, log_index) order, happens no later than the end of the term's grace period (expiry + 90 d, or + 28 d
-- for a v2-native term); otherwise it churned. Early renewals count as renewed. Grace-keeping micro-renewals (the
-- name is still expired after the payment) are not terms; see classified.
-- Only cohorts whose 90-day window has closed (expires_dt < now - 90 d) are counted.

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

-- paid_expires_dt: the expiry the payment bought, in the registry of record at the tx: the v1 expiry before the
-- freeze, the ENSv2 newExpiry after it (v1-equivalent + 5,356,800 s for v1-origin names, already raw for v2-native).
with_next AS (
  SELECT
    labelhash,
    block_time,
    expires_dt,
    release_dt,
    CASE WHEN block_number >= 26282117 AND grace_days = 90
         THEN date_add('second', 5356800, expires_dt)
         ELSE expires_dt END AS paid_expires_dt,
    LEAD(block_time) OVER (PARTITION BY labelhash ORDER BY block_number, log_index) AS next_event_time
  FROM all_events
),

-- Grace-keeping micro-renewals (paid_expires_dt <= block_time: the name is still expired after paying, often 1-day
-- renewals repeated daily) are not terms: they stay events above, so they still renew the term before them, but they
-- are not counted in any cohort.
classified AS (
  SELECT
    date_trunc('month', expires_dt) AS expiry_month,
    CASE WHEN next_event_time IS NOT NULL
              AND next_event_time <= release_dt
         THEN 1 ELSE 0 END AS renewed
  FROM with_next
  WHERE expires_dt < current_timestamp - INTERVAL '90' DAY
    AND paid_expires_dt > block_time
)

SELECT
  expiry_month,
  COUNT(*) AS terms_expiring,
  SUM(renewed) AS renewed_count,
  COUNT(*) - SUM(renewed) AS churned_count,
  ROUND(100.0 * SUM(renewed) / COUNT(*), 2) AS renewal_rate_pct
FROM classified
GROUP BY 1
ORDER BY 1
