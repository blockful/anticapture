-- ENSv2 daily series: revenue and v1 -> ENSv2 migration progress, one row per UTC day since the ENSv2 launch
-- (block 26,282,117, 2026-10-27 06:01:59 UTC), through today. The launch day and the current day are partial.
--
-- Revenue (cash basis, what the protocol kept, USDC 6 dec / DAI 18 dec at $1), same events as revenue_totals.sql:
--   ETHRegistrar 0xD6D8...CC81  NameRegistered  -> registration_usd (base) + premium_usd (premium)
--   ETHRegistrar 0xD6D8...CC81  NameRenewed     -> renewal_usd
--   ETHRenewerV1 0x56c4...Cb68  NameRenewed     -> renewal_usd (renewal of a v1 name that has not migrated)
--   Any other payment token fails the query instead of being dropped.
--
-- Migration (ETHRegistry 0xf60A...85e2, the ENSv2 .eth registry):
--   reserved_names  = distinct labels the BatchRegistrar 0xf0Cc...9721 reserved for v1 names before and at the
--                     launch (LabelReserved). This is the set of v1 names that can migrate. It is fixed.
--   names_migrated  = LabelRegistered sent by the UnlockedMigrationController 0xab82...eb64 or the
--                     LockedMigrationController 0x3cea...e51a on that day (one per name).
--   migrated_pct    = cumulative_migrated / reserved_names * 100.
--   registrations   = LabelRegistered sent by the ETHRegistrar: names registered directly on ENSv2 (not migrations).
--
-- Output: day, registration_usd, premium_usd, renewal_usd, total_usd, cumulative_usd, registrations, renewals,
--         renewals_unmigrated, names_migrated, cumulative_migrated, reserved_names, migrated_pct

WITH
pay_logs AS (
  SELECT block_time, contract_address, topic0, data
  FROM ethereum.logs
  WHERE block_number >= 26282117 AND block_date >= DATE '2026-10-27'
    AND ((contract_address = 0xd6d8369e55c94ae8afa714e6cf7ab5be54d5cc81 -- ETHRegistrar
          AND topic0 IN (0xebd3982eafd13b820e3edb2a4abd57a82ce3b8802e0cd45637a5de51383f9fac,   -- NameRegistered
                         0xbd0c01e5bf66003280556423db4a8bf79043c146ac57f657c30049dd43316649))  -- NameRenewed
      OR (contract_address = 0x56c447f308f463a01121c41e72b0e7e7557fcb68 -- ETHRenewerV1
          AND topic0 = 0xbd0c01e5bf66003280556423db4a8bf79043c146ac57f657c30049dd43316649))
),

-- Data words (1-based byte offsets into data):
--   NameRegistered: w5 paymentToken = bytes 173..192, w6 base = 193..224, w7 premium = 225..256
--   NameRenewed:    w3 paymentToken = bytes 109..128, w4 amount = 129..160
pay_decoded AS (
  SELECT
    date_trunc('day', block_time) AS day,
    topic0 = 0xebd3982eafd13b820e3edb2a4abd57a82ce3b8802e0cd45637a5de51383f9fac AS is_registration,
    contract_address = 0x56c447f308f463a01121c41e72b0e7e7557fcb68 AS is_renewer_v1,
    CASE WHEN topic0 = 0xebd3982eafd13b820e3edb2a4abd57a82ce3b8802e0cd45637a5de51383f9fac
         THEN varbinary_substring(data, 173, 20) ELSE varbinary_substring(data, 109, 20) END AS payment_token,
    CASE WHEN topic0 = 0xebd3982eafd13b820e3edb2a4abd57a82ce3b8802e0cd45637a5de51383f9fac
         THEN CAST(CAST(varbinary_to_uint256(varbinary_substring(data, 193, 32)) AS varchar) AS decimal(38, 0))
         ELSE CAST(0 AS decimal(38, 0)) END AS base_raw,
    CASE WHEN topic0 = 0xebd3982eafd13b820e3edb2a4abd57a82ce3b8802e0cd45637a5de51383f9fac
         THEN CAST(CAST(varbinary_to_uint256(varbinary_substring(data, 225, 32)) AS varchar) AS decimal(38, 0))
         ELSE CAST(0 AS decimal(38, 0)) END AS premium_raw,
    CASE WHEN topic0 = 0xbd0c01e5bf66003280556423db4a8bf79043c146ac57f657c30049dd43316649
         THEN CAST(CAST(varbinary_to_uint256(varbinary_substring(data, 129, 32)) AS varchar) AS decimal(38, 0))
         ELSE CAST(0 AS decimal(38, 0)) END AS renewal_raw
  FROM pay_logs
),

pay_priced AS (
  SELECT day, is_registration, is_renewer_v1,
    CASE payment_token
      WHEN 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48 THEN 1e6  -- USDC, 6 decimals
      WHEN 0x6b175474e89094c44da98b954eedeac495271d0f THEN 1e18 -- DAI, 18 decimals
      ELSE CAST(fail('unknown ENSv2 payment token ' || to_hex(payment_token)) AS double)
    END AS unit,
    base_raw, premium_raw, renewal_raw
  FROM pay_decoded
  -- Paid events only, as in revenue_totals.sql and actions.sql. A zero-amount event is not a payment, and its token
  -- word is not priced (so an unset token on such an event cannot fail the query).
  WHERE base_raw + premium_raw + renewal_raw > 0
),

pay_daily AS (
  SELECT day,
    SUM(CAST(base_raw AS double) / unit) AS registration_usd,
    SUM(CAST(premium_raw AS double) / unit) AS premium_usd,
    SUM(CAST(renewal_raw AS double) / unit) AS renewal_usd,
    count_if(NOT is_registration) AS renewals,
    count_if(NOT is_registration AND is_renewer_v1) AS renewals_unmigrated
  FROM pay_priced
  GROUP BY 1
),

registry_logs AS (
  SELECT block_time, topic0, topic2 AS label_hash, varbinary_substring(topic3, 13, 20) AS sender
  FROM ethereum.logs
  WHERE contract_address = 0xf60aba43e1f7f3dab1186ff03b561401c9df85e2 -- ETHRegistry
    AND block_date >= DATE '2026-10-01'
    AND topic0 IN (0x734822851860327a80c624af1471efac6bb0ac641852fc6c7bfeeee3202ae6a8,  -- LabelReserved
                   0x2fe093918572373e9f1f0368f414dffd0043a74ae8c9fd7b0e390b26a0d20b6e)  -- LabelRegistered
),

-- Only the BatchRegistrar's reservations: the pre-migration sync of v1 names, which ended on the launch day
-- (block 26,282,548). A LabelReserved from any other sender is not a v1 name waiting to migrate, so the denominator
-- stays fixed.
reserved AS (
  SELECT count(DISTINCT label_hash) AS reserved_names
  FROM registry_logs
  WHERE topic0 = 0x734822851860327a80c624af1471efac6bb0ac641852fc6c7bfeeee3202ae6a8
    AND sender = 0xf0ccfbf6dba1e01ccb833ced6d551a8f000e9721 -- BatchRegistrar
),

-- One row per migrated name, at its first migration event.
migrations AS (
  SELECT label_hash, min(block_time) AS migrated_at
  FROM registry_logs
  WHERE topic0 = 0x2fe093918572373e9f1f0368f414dffd0043a74ae8c9fd7b0e390b26a0d20b6e
    AND sender IN (0xab821ca676cf2e0790fa273526a165cfa86aeb64,  -- UnlockedMigrationController
                   0x3cea18620883a69ed349b23328a3b6302598e51a)  -- LockedMigrationController
  GROUP BY 1
),

migrated_daily AS (
  SELECT date_trunc('day', migrated_at) AS day, count(*) AS names_migrated
  FROM migrations
  GROUP BY 1
),

registered_daily AS (
  SELECT date_trunc('day', block_time) AS day, count(*) AS registrations
  FROM registry_logs
  WHERE topic0 = 0x2fe093918572373e9f1f0368f414dffd0043a74ae8c9fd7b0e390b26a0d20b6e
    AND sender = 0xd6d8369e55c94ae8afa714e6cf7ab5be54d5cc81 -- ETHRegistrar
  GROUP BY 1
),

-- Through today, whether or not anything happened: a day with no event is a row of zeros, not a missing row.
days AS (
  SELECT CAST(d AS timestamp(3) with time zone) AS day
  FROM unnest(sequence(DATE '2026-10-27', current_date, INTERVAL '1' DAY)) AS t(d)
),

joined AS (
  SELECT d.day,
    COALESCE(p.registration_usd, 0) AS registration_usd,
    COALESCE(p.premium_usd, 0) AS premium_usd,
    COALESCE(p.renewal_usd, 0) AS renewal_usd,
    COALESCE(g.registrations, 0) AS registrations,
    COALESCE(p.renewals, 0) AS renewals,
    COALESCE(p.renewals_unmigrated, 0) AS renewals_unmigrated,
    COALESCE(m.names_migrated, 0) AS names_migrated
  FROM days d
  LEFT JOIN pay_daily p ON p.day = d.day
  LEFT JOIN migrated_daily m ON m.day = d.day
  LEFT JOIN registered_daily g ON g.day = d.day
)

SELECT
  j.day,
  ROUND(j.registration_usd, 2) AS registration_usd,
  ROUND(j.premium_usd, 2) AS premium_usd,
  ROUND(j.renewal_usd, 2) AS renewal_usd,
  ROUND(j.registration_usd + j.premium_usd + j.renewal_usd, 2) AS total_usd,
  ROUND(SUM(j.registration_usd + j.premium_usd + j.renewal_usd) OVER (ORDER BY j.day), 2) AS cumulative_usd,
  j.registrations,
  j.renewals,
  j.renewals_unmigrated,
  j.names_migrated,
  SUM(j.names_migrated) OVER (ORDER BY j.day) AS cumulative_migrated,
  r.reserved_names,
  ROUND(100e0 * SUM(j.names_migrated) OVER (ORDER BY j.day) / r.reserved_names, 4) AS migrated_pct
FROM joined j
CROSS JOIN reserved r
ORDER BY 1
