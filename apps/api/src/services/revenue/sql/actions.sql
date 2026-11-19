-- ENS Actions per Month (Registration, Premium, Renewal). Replaces Dune query 7531705 (actions_per_month).
-- Columns: month, category, actions (unchanged; mapped by fetchActions).
-- One action = one paid event; cost-0 rows are dropped everywhere (wrapper syncs, renew(name, 0), duplicates).
--   Registration  paid NameRegistered with no premium
--   Premium       paid NameRegistered with premium > 0 (its base is still Registration revenue in revenue_totals)
--   Renewal       paid NameRenewed
-- Sources: the five v1 ETH controllers for blocks < 26,282,117 (ENSv2 freeze), and ENSv2 ETHRegistrar
-- (NameRegistered, NameRenewed) plus ETHRenewerV1 (NameRenewed) from ethereum.logs. c3 (2020 controller) emits
-- base + premium as one cost, so its premium flag uses the same exact split as revenue_totals.sql (see there and
-- README.md). An unknown ENSv2 payment token fails the query, as in revenue_totals.sql.

WITH
v1_reg_raw AS (
  SELECT 'c1' AS ctrl, evt_block_time AS block_time, evt_block_number AS block_number, evt_index AS log_index,
    name, CAST(expires AS bigint) AS expires,
    CAST(CAST(cost AS varchar) AS decimal(38, 0)) AS paid_wei, CAST(NULL AS decimal(38, 0)) AS premium_field_wei
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_1_evt_nameregistered
  UNION ALL
  SELECT 'c2', evt_block_time, evt_block_number, evt_index, name, CAST(expires AS bigint),
    CAST(CAST(cost AS varchar) AS decimal(38, 0)), NULL
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_2_evt_nameregistered
  UNION ALL
  SELECT 'c3', evt_block_time, evt_block_number, evt_index, name, CAST(expires AS bigint),
    CAST(CAST(cost AS varchar) AS decimal(38, 0)), NULL
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_3_evt_nameregistered
  UNION ALL
  SELECT 'c4', evt_block_time, evt_block_number, evt_index, name, CAST(expires AS bigint),
    CAST(CAST(baseCost AS varchar) AS decimal(38, 0)) + CAST(CAST(premium AS varchar) AS decimal(38, 0)),
    CAST(CAST(premium AS varchar) AS decimal(38, 0))
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_4_evt_nameregistered
  UNION ALL
  SELECT 'c5', evt_block_time, evt_block_number, evt_index, label, CAST(expires AS bigint),
    CAST(CAST(baseCost AS varchar) AS decimal(38, 0)) + CAST(CAST(premium AS varchar) AS decimal(38, 0)),
    CAST(CAST(premium AS varchar) AS decimal(38, 0))
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_5_evt_nameregistered
),

v1_reg AS (
  SELECT * FROM v1_reg_raw WHERE block_number < 26282117 AND paid_wei > 0
),

-- c3 premium split: identical to revenue_totals.sql section 2 (kept in sync by hand; the README lists both).
answer_updated AS (
  SELECT contract_address AS aggregator, block_number, index AS log_index,
    CAST(CAST(varbinary_to_int256(topic1) AS varchar) AS decimal(38, 0)) AS answer
  FROM ethereum.logs
  WHERE topic0 = 0x0559884fd3a460db3073b7fc896cc77986f16e378210ded43186175bf646fc5f -- AnswerUpdated(int256,uint256,uint256)
    AND contract_address IN (
      0xf79d6afbb6da890132f9d7c355e3015f15f3406f, 0x00c7a37b03690fb9f41b5c5af8131735c7275446,
      0xd3fcd40153e56110e6eeae13e12530e26c9cb4fd, 0x37bc7498f4ff12c19678ee8fe19d713b87f6a9e6,
      0xe62b71cf983019bff55bc83b48601ce8419650cc, 0x7d4e742018fb52e48b08be73d041c18b21de6fb5)
    AND block_number >= 10000000 AND block_number < 26282117
    AND block_date >= DATE '2020-05-01' AND block_date <= DATE '2026-10-27'
),

-- Phase 3 (0x00c7A37B...) is a FluxAggregator. When a round starts, the previous round, if it timed out before
-- reaching maxSubmissions, is overwritten with the answer of the round before it (updateTimedOutRoundInfo) and no
-- AnswerUpdated is emitted; latestAnswer() follows it if that round was the latest answered one. Modelled from its
-- NewRound / SubmissionReceived / RoundDetailsUpdated / AnswerUpdated logs: 158 such silent changes, each verified
-- against latestAnswer() on an archive node (README.md, Validation).
flux_logs AS (
  SELECT block_number, index AS log_index, topic0, topic1, topic2, topic3, data
  FROM ethereum.logs
  WHERE contract_address = 0x00c7a37b03690fb9f41b5c5af8131735c7275446
    AND topic0 IN (0x0109fc6f55cf40689f02fbaad7af7fe7bbac8a3d2186600afc7d3e10cac60271,  -- NewRound
                   0x92e98423f8adac6e64d0608e519fd1cefb861498385c6dee70d58fc926ddc68c,  -- SubmissionReceived
                   0x56800c9d1ed723511246614d15e58cfcde15b6a33c245b5c961b689c1890fd8f,  -- RoundDetailsUpdated
                   0x0559884fd3a460db3073b7fc896cc77986f16e378210ded43186175bf646fc5f)  -- AnswerUpdated
    AND block_number >= 10900000 AND block_number < 12187957
    AND block_date >= DATE '2020-09-01' AND block_date <= DATE '2021-04-30'
),

-- every round start, with the maxSubmissions / timeout configured at that moment
flux_round_start AS (
  SELECT round_id, block_number, log_index, started_at, is_round,
    last_value(max_subs) IGNORE NULLS OVER (
      ORDER BY block_number, log_index ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS max_subs,
    last_value(timeout_sec) IGNORE NULLS OVER (
      ORDER BY block_number, log_index ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS timeout_sec
  FROM (
    -- NewRound(uint256 indexed roundId, address indexed startedBy, uint256 startedAt)
    SELECT varbinary_to_bigint(varbinary_substring(topic1, 25, 8)) AS round_id, block_number, log_index,
      varbinary_to_bigint(varbinary_substring(data, 25, 8)) AS started_at,
      CAST(NULL AS bigint) AS max_subs, CAST(NULL AS bigint) AS timeout_sec, 1 AS is_round
    FROM flux_logs WHERE topic0 = 0x0109fc6f55cf40689f02fbaad7af7fe7bbac8a3d2186600afc7d3e10cac60271
    UNION ALL
    -- RoundDetailsUpdated(uint128 indexed payment, uint32 indexed minSubs, uint32 indexed maxSubs, uint32 restartDelay, uint32 timeout)
    SELECT NULL, block_number, log_index, NULL,
      varbinary_to_bigint(varbinary_substring(topic3, 25, 8)), varbinary_to_bigint(varbinary_substring(data, 57, 8)), 0
    FROM flux_logs WHERE topic0 = 0x56800c9d1ed723511246614d15e58cfcde15b6a33c245b5c961b689c1890fd8f
  ) u
),

flux_next AS (
  SELECT r.round_id, r.started_at, r.max_subs, r.timeout_sec,
    n.block_number AS next_block, n.log_index AS next_log, n.started_at AS next_ts
  FROM flux_round_start r
  LEFT JOIN flux_round_start n ON n.is_round = 1 AND n.round_id = r.round_id + 1
  WHERE r.is_round = 1
),

-- SubmissionReceived(int256 indexed submission, uint32 indexed round, address indexed oracle) and
-- AnswerUpdated(int256 indexed current, uint256 indexed roundId, uint256 updatedAt): the round is topic2 in both
flux_round_events AS (
  SELECT varbinary_to_bigint(varbinary_substring(topic2, 25, 8)) AS round_id, topic0, block_number, log_index,
    CASE WHEN topic0 = 0x0559884fd3a460db3073b7fc896cc77986f16e378210ded43186175bf646fc5f
         THEN CAST(CAST(varbinary_to_int256(topic1) AS varchar) AS decimal(38, 0)) END AS answer
  FROM flux_logs
  WHERE topic0 IN (0x92e98423f8adac6e64d0608e519fd1cefb861498385c6dee70d58fc926ddc68c,
                   0x0559884fd3a460db3073b7fc896cc77986f16e378210ded43186175bf646fc5f)
),

flux_rounds AS (
  SELECT x.round_id, x.started_at, x.max_subs, x.timeout_sec, x.next_block, x.next_log, x.next_ts,
    count_if(e.topic0 = 0x92e98423f8adac6e64d0608e519fd1cefb861498385c6dee70d58fc926ddc68c
             AND (e.block_number < x.next_block OR (e.block_number = x.next_block AND e.log_index < x.next_log))) AS subs_before_next,
    count_if(e.topic0 = 0x0559884fd3a460db3073b7fc896cc77986f16e378210ded43186175bf646fc5f
             AND (e.block_number < x.next_block OR (e.block_number = x.next_block AND e.log_index < x.next_log))) AS answers_before_next,
    max_by(e.answer, e.block_number * 1000000 + e.log_index)
      FILTER (WHERE e.topic0 = 0x0559884fd3a460db3073b7fc896cc77986f16e378210ded43186175bf646fc5f) AS last_answer
  FROM flux_next x
  LEFT JOIN flux_round_events e ON e.round_id = x.round_id
  GROUP BY 1, 2, 3, 4, 5, 6, 7
),

flux_reverts AS (
  SELECT *,
    lag(effective_answer) OVER (ORDER BY round_id) AS prev_effective_answer
  FROM (
    SELECT *,
      -- a reverted round carries the answer of the last round before it that was not reverted
      last_value(CASE WHEN NOT reverted THEN last_answer END) IGNORE NULLS
        OVER (ORDER BY round_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS effective_answer
    FROM (
      SELECT *,
        COALESCE(next_block IS NOT NULL AND timeout_sec > 0 AND started_at + timeout_sec < next_ts
                 AND subs_before_next < max_subs, false) AS reverted
      FROM flux_rounds
    ) a
  ) b
),

feed_answers AS (
  SELECT aggregator, block_number, log_index, answer FROM answer_updated
  UNION ALL
  -- the silent change happens at the next round's NewRound log
  SELECT 0x00c7a37b03690fb9f41b5c5af8131735c7275446, next_block, next_log, prev_effective_answer
  FROM flux_reverts
  WHERE reverted AND answers_before_next > 0
),

c3_premium_era AS (
  SELECT block_number, log_index, paid_wei,
    CASE
      WHEN block_number < 11008985 THEN 0xf79d6afbb6da890132f9d7c355e3015f15f3406f
      WHEN block_number < 12187957 THEN 0x00c7a37b03690fb9f41b5c5af8131735c7275446
      WHEN block_number < 12453813 THEN 0xd3fcd40153e56110e6eeae13e12530e26c9cb4fd
      WHEN block_number < 17217055 THEN 0x37bc7498f4ff12c19678ee8fe19d713b87f6a9e6
      WHEN block_number < 20822021 THEN 0xe62b71cf983019bff55bc83b48601ce8419650cc
      ELSE 0x7d4e742018fb52e48b08be73d041c18b21de6fb5
    END AS aggregator,
    CAST(CASE
      WHEN length(name) >= 5 THEN 158548959919
      WHEN length(name) = 4 THEN 5073566717402
      WHEN length(name) = 3 THEN 20294266869609
      ELSE 0
    END AS decimal(38, 0)) AS rent_atto_usd_per_sec,
    CAST(expires - CAST(to_unixtime(block_time) AS bigint) AS decimal(38, 0)) AS duration_sec
  FROM v1_reg
  WHERE ctrl = 'c3' AND block_number >= 10451343
),

c3_with_answer AS (
  SELECT block_number, log_index, paid_wei, rent_atto_usd_per_sec, duration_sec,
    last_value(answer) IGNORE NULLS OVER (
      PARTITION BY aggregator ORDER BY block_number, log_index, is_reg
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS answer,
    is_reg
  FROM (
    SELECT aggregator, block_number, log_index, answer, 0 AS is_reg,
      CAST(NULL AS decimal(38, 0)) AS paid_wei, CAST(NULL AS decimal(38, 0)) AS rent_atto_usd_per_sec,
      CAST(NULL AS decimal(38, 0)) AS duration_sec
    FROM feed_answers
    UNION ALL
    SELECT aggregator, block_number, log_index, NULL, 1, paid_wei, rent_atto_usd_per_sec, duration_sec
    FROM c3_premium_era
  ) s
),

c3_split AS (
  SELECT block_number, log_index,
    CASE
      WHEN answer IS NULL OR answer <= 0 OR base_wei <= 0 OR base_wei > paid_wei
        THEN CAST(fail('c3 premium split: no ETH/USD answer, base 0 (name NULL or under 3 chars) or base > cost at block '
                       || CAST(block_number AS varchar)) AS decimal(38, 0))
      ELSE paid_wei - base_wei
    END AS premium_wei
  FROM (
    SELECT block_number, log_index, paid_wei, answer,
      (rent_atto_usd_per_sec * duration_sec * DECIMAL '100000000'
        - mod(rent_atto_usd_per_sec * duration_sec * DECIMAL '100000000', answer)) / answer AS base_wei
    FROM c3_with_answer
    WHERE is_reg = 1
  ) b
),

v1_reg_actions AS (
  SELECT r.block_time,
    CASE
      WHEN r.ctrl IN ('c4', 'c5') AND r.premium_field_wei > 0 THEN 'Premium'
      WHEN r.ctrl = 'c3' AND COALESCE(s.premium_wei, 0) > 0 THEN 'Premium'
      ELSE 'Registration'
    END AS category
  FROM v1_reg r
  LEFT JOIN c3_split s
    ON r.ctrl = 'c3' AND s.block_number = r.block_number AND s.log_index = r.log_index
),

v1_ren_actions AS (
  SELECT block_time, 'Renewal' AS category
  FROM (
    SELECT evt_block_time AS block_time, evt_block_number AS block_number, CAST(cost AS double) AS cost
    FROM ethereumnameservice_ethereum.ethregistrarcontroller_1_evt_namerenewed
    UNION ALL
    SELECT evt_block_time, evt_block_number, CAST(cost AS double)
    FROM ethereumnameservice_ethereum.ethregistrarcontroller_2_evt_namerenewed
    UNION ALL
    SELECT evt_block_time, evt_block_number, CAST(cost AS double)
    FROM ethereumnameservice_ethereum.ethregistrarcontroller_3_evt_namerenewed
    UNION ALL
    SELECT evt_block_time, evt_block_number, CAST(cost AS double)
    FROM ethereumnameservice_ethereum.ethregistrarcontroller_4_evt_namerenewed
    UNION ALL
    SELECT evt_block_time, evt_block_number, CAST(cost AS double)
    FROM ethereumnameservice_ethereum.ethregistrarcontroller_5_evt_namerenewed
  ) r
  WHERE block_number < 26282117 AND cost > 0
),

-- ENSv2: same filters and byte offsets as revenue_totals.sql section 5.
v2_logs AS (
  SELECT block_time, contract_address, topic0, data
  FROM ethereum.logs
  WHERE block_number >= 26282117 AND block_date >= DATE '2026-10-27'
    AND ((contract_address = 0xd6d8369e55c94ae8afa714e6cf7ab5be54d5cc81 -- ETHRegistrar
          AND topic0 IN (0xebd3982eafd13b820e3edb2a4abd57a82ce3b8802e0cd45637a5de51383f9fac,   -- NameRegistered
                         0xbd0c01e5bf66003280556423db4a8bf79043c146ac57f657c30049dd43316649))  -- NameRenewed
      OR (contract_address = 0x56c447f308f463a01121c41e72b0e7e7557fcb68 -- ETHRenewerV1
          AND topic0 = 0xbd0c01e5bf66003280556423db4a8bf79043c146ac57f657c30049dd43316649))
),

v2_decoded AS (
  SELECT block_time,
    topic0 = 0xebd3982eafd13b820e3edb2a4abd57a82ce3b8802e0cd45637a5de51383f9fac AS is_registration,
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
  FROM v2_logs
),

v2_actions AS (
  SELECT block_time,
    CASE
      WHEN payment_token NOT IN (0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48,  -- USDC
                                 0x6b175474e89094c44da98b954eedeac495271d0f)  -- DAI
        THEN CAST(fail('unknown ENSv2 payment token ' || to_hex(payment_token)) AS varchar)
      WHEN NOT is_registration THEN 'Renewal'
      WHEN premium_raw > 0 THEN 'Premium'
      ELSE 'Registration'
    END AS category
  FROM v2_decoded
  WHERE base_raw + premium_raw + renewal_raw > 0
),

all_actions AS (
  SELECT block_time, category FROM v1_reg_actions
  UNION ALL
  SELECT block_time, category FROM v1_ren_actions
  UNION ALL
  SELECT block_time, category FROM v2_actions
)

SELECT date_trunc('month', block_time) AS month, category, COUNT(*) AS actions
FROM all_actions
GROUP BY 1, 2
ORDER BY 1, 2
