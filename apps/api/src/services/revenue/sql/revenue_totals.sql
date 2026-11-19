-- ENS Monthly Revenue (USD and ETH) by Category, cash basis. Replaces Dune query 7531730 (revenue_usd_by_category).
-- Columns: month, registration_usd, premium_usd, renewal_usd, total_usd, registration_eth, premium_eth, renewal_eth
-- (unchanged; mapped by fetchRevenueTotals), plus stablecoin_usd (USDC + DAI part of total_usd; the API ignores it).
-- See README.md for every definition and the acceptance values of the first run.
--
-- What is counted, per payment:
--   v1 (ETH, the five ETH controllers, blocks < 26,282,117 = ENSv2 freeze; cost-0 rows dropped):
--     registration  c1/c2 cost; c3 base rent (premium split below); c4/c5 baseCost
--     premium       c3 cost - base rent; c4/c5 premium
--     renewal       c1/c2/c3/c5 cost; c4 ETH the controller kept (msg.value minus refund, from ethereum.traces)
--   ENSv2 (USDC 6 dec / DAI 18 dec at $1, ETHRegistrar 0xD6D8...CC81 and ETHRenewerV1 0x56c4...Cb68, from ethereum.logs):
--     registration  NameRegistered.base; premium NameRegistered.premium; renewal NameRenewed.amount (both contracts)
--   Any other ENSv2 payment token fails the query (fail()) instead of being dropped.
-- USD: ETH is priced per payment at the hourly WETH price (prices.hour, the hour of the block); stablecoins at face value.
-- ETH columns hold ETH-paid amounts only (ENSv2 is paid in stablecoins and adds 0 ETH).

WITH
-- ---------------------------------------------------------------------------------------------------------------
-- 1. v1 registrations. Amounts in wei, exact (uint256 -> varchar -> decimal(38,0)).
-- ---------------------------------------------------------------------------------------------------------------
v1_reg_raw AS (
  SELECT 'c1' AS ctrl, evt_block_time AS block_time, evt_block_number AS block_number, evt_index AS log_index,
    evt_tx_hash AS tx_hash, name, CAST(expires AS bigint) AS expires,
    CAST(CAST(cost AS varchar) AS decimal(38, 0)) AS paid_wei, CAST(NULL AS decimal(38, 0)) AS premium_field_wei
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_1_evt_nameregistered
  UNION ALL
  SELECT 'c2', evt_block_time, evt_block_number, evt_index, evt_tx_hash, name, CAST(expires AS bigint),
    CAST(CAST(cost AS varchar) AS decimal(38, 0)), NULL
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_2_evt_nameregistered
  UNION ALL
  SELECT 'c3', evt_block_time, evt_block_number, evt_index, evt_tx_hash, name, CAST(expires AS bigint),
    CAST(CAST(cost AS varchar) AS decimal(38, 0)), NULL
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_3_evt_nameregistered
  UNION ALL
  -- c4/c5: paid_wei = baseCost + premium (what the controller kept); premium_field_wei = premium
  SELECT 'c4', evt_block_time, evt_block_number, evt_index, evt_tx_hash, name, CAST(expires AS bigint),
    CAST(CAST(baseCost AS varchar) AS decimal(38, 0)) + CAST(CAST(premium AS varchar) AS decimal(38, 0)),
    CAST(CAST(premium AS varchar) AS decimal(38, 0))
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_4_evt_nameregistered
  UNION ALL
  SELECT 'c5', evt_block_time, evt_block_number, evt_index, evt_tx_hash, label, CAST(expires AS bigint),
    CAST(CAST(baseCost AS varchar) AS decimal(38, 0)) + CAST(CAST(premium AS varchar) AS decimal(38, 0)),
    CAST(CAST(premium AS varchar) AS decimal(38, 0))
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_5_evt_nameregistered
),

v1_reg AS (
  SELECT * FROM v1_reg_raw WHERE block_number < 26282117 AND paid_wei > 0
),

-- ---------------------------------------------------------------------------------------------------------------
-- 2. c3 (2020 controller, 0x283A...) premium split. Its NameRegistered.cost = oracle.price(name, expires, duration)
--    = (rent(len) * duration + premium) * 1e8 / ETHUSD answer, in one number. From block 10,451,343 (2020-07-13,
--    NewPriceOracle -> LinearPremiumPriceOracle 0x63faf46d) its oracles can charge a premium; before that the
--    StablePriceOracle 0xb9d374d0 had none, so premium = 0 there. In the premium era:
--      base_wei    = floor(rent(len) * duration * 1e8 / answer)     -- attoUSDToWei of the base rent
--      premium_wei = cost - base_wei
--    rent(len), attoUSD per second, identical on all four c3 oracles (rentPrices() read on chain, never changed):
--      len 3 -> 20294266869609, len 4 -> 5073566717402, len >= 5 -> 158548959919 (c3 rejects len < 3)
--    len = length(name) in code points, which is the oracle's StringUtils.strlen for UTF-8 names.
--    duration = expires - block timestamp (BaseRegistrar.register returns now + duration).
--    answer = the ETH/USD answer the oracle's usdOracle returned at that log: the latest AnswerUpdated (plus, for the
--      phase-3 FluxAggregator, its silent timed-out-round reverts, see flux_*), ordered by (block_number, log index),
--      of the aggregator behind it at that block:
--        [10,451,343, 11,008,985) 0xF79D6aFB... (oracle 0x63fa reads it directly until block 10,739,273, then via
--                                 the proxy 0x5f4eC3Df..., whose phases 1-2 are 0xF79D... and a facade over it)
--        [11,008,985, 12,187,957) 0x00c7A37B... (proxy phase 3)
--        [12,187,957, 12,453,813) 0xd3fCD401... (phase 4)
--        [12,453,813, 17,217,055) 0x37bC7498... (phase 5)
--        [17,217,055, 20,822,021) 0xE62B71cF... (phase 6)
--        [20,822,021, 26,282,117) 0x7d4E7420... (phase 7)
--      (phase start blocks found by bisecting phaseId(); no c3 registration falls in any boundary block.)
--    c3 history is frozen at the ENSv2 freeze, so this is deterministic. If an answer is missing, base is 0 (name NULL
--    or under 3 code points, so no rent) or base > cost, the query fails instead of booking a wrong split. Verified
--    offline (README.md, Validation): base_wei equals the oracle's own price(name, 0, duration) at block - 1 to the wei
--    on all 4,295 sampled registrations whose answer did not move inside the block, and premium > 0 exactly when the
--    name was inside its post-grace premium window.
-- ---------------------------------------------------------------------------------------------------------------
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
  SELECT block_number, log_index, name, expires, block_time, paid_wei,
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
  SELECT block_number, log_index, paid_wei, base_wei,
    CASE
      WHEN answer IS NULL OR answer <= 0 OR base_wei <= 0 OR base_wei > paid_wei
        THEN CAST(fail('c3 premium split: no ETH/USD answer, base 0 (name NULL or under 3 chars) or base > cost at block '
                       || CAST(block_number AS varchar)) AS decimal(38, 0))
      ELSE paid_wei - base_wei
    END AS premium_wei
  FROM (
    SELECT block_number, log_index, paid_wei, answer,
      -- exact floor division: (n - n mod d) / d
      (rent_atto_usd_per_sec * duration_sec * DECIMAL '100000000'
        - mod(rent_atto_usd_per_sec * duration_sec * DECIMAL '100000000', answer)) / answer AS base_wei
    FROM c3_with_answer
    WHERE is_reg = 1
  ) b
),

v1_reg_split AS (
  SELECT r.block_time,
    CASE
      WHEN r.ctrl IN ('c4', 'c5') THEN r.paid_wei - r.premium_field_wei
      WHEN s.premium_wei IS NOT NULL THEN r.paid_wei - s.premium_wei
      ELSE r.paid_wei
    END AS registration_wei,
    CASE
      WHEN r.ctrl IN ('c4', 'c5') THEN r.premium_field_wei
      ELSE COALESCE(s.premium_wei, CAST(0 AS decimal(38, 0)))
    END AS premium_wei
  FROM v1_reg r
  LEFT JOIN c3_split s
    ON r.ctrl = 'c3' AND s.block_number = r.block_number AND s.log_index = r.log_index
),

-- ---------------------------------------------------------------------------------------------------------------
-- 3. v1 renewals. c1/c2/c3/c5 emit the exact price. c4 (2023 controller 0x2535...) emits msg.value and refunds
--    msg.value - price.base afterwards, so its kept ETH comes from ethereum.traces, per transaction:
--      kept = SUM(value of calls into c4) - SUM(value of calls out of c4)       [effective value calls only]
--             - SUM(baseCost + premium of c4 NameRegistered in the same tx)     [register() frames are exact]
--    for every tx with a paid c4 NameRenewed. "Effective" = tx succeeded and neither the call nor any ancestor in
--    the call tree (trace_address prefix) failed. c4 has no receive/fallback, so every value call into it is a
--    register() or renew() frame; every value call out of it is that frame's refund to msg.sender (c4.withdraw()
--    never ran inside such a tx: verified offline). Revenue is booked per tx, at the tx's block time. kept must lie
--    in [0, emitted cost] or the query fails; a tx without traces fails too. (kept = 0 happens once: renew(name, 0)
--    with msg.value 1e13 wei, fully refunded, tx 0x0277af0b..., 2023-12-11.) This replaces, for every month, the
--    curated table dune.ethereumnameservice.result_ethregistrarcontroller4_namerenewed that production used for
--    Dec 2024 - Sep 2025, and reproduces it there (1,473.48 ETH).
-- ---------------------------------------------------------------------------------------------------------------
v1_ren_raw AS (
  SELECT 'c1' AS ctrl, evt_block_time AS block_time, evt_block_number AS block_number, evt_tx_hash AS tx_hash,
    CAST(CAST(cost AS varchar) AS decimal(38, 0)) AS cost_wei
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_1_evt_namerenewed
  UNION ALL
  SELECT 'c2', evt_block_time, evt_block_number, evt_tx_hash, CAST(CAST(cost AS varchar) AS decimal(38, 0))
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_2_evt_namerenewed
  UNION ALL
  SELECT 'c3', evt_block_time, evt_block_number, evt_tx_hash, CAST(CAST(cost AS varchar) AS decimal(38, 0))
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_3_evt_namerenewed
  UNION ALL
  SELECT 'c4', evt_block_time, evt_block_number, evt_tx_hash, CAST(CAST(cost AS varchar) AS decimal(38, 0))
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_4_evt_namerenewed
  UNION ALL
  SELECT 'c5', evt_block_time, evt_block_number, evt_tx_hash, CAST(CAST(cost AS varchar) AS decimal(38, 0))
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_5_evt_namerenewed
),

v1_ren AS (
  SELECT * FROM v1_ren_raw WHERE block_number < 26282117 AND cost_wei > 0
),

c4_ren_tx AS (
  SELECT tx_hash, block_number, block_time, SUM(cost_wei) AS emitted_wei
  FROM v1_ren
  WHERE ctrl = 'c4'
  GROUP BY 1, 2, 3
),

c4_traces AS (
  SELECT t.tx_hash, t.trace_address, t."from", t.to, t.success,
    CAST(CAST(t.value AS varchar) AS decimal(38, 0)) AS value_wei,
    (t.type = 'call' AND COALESCE(t.call_type, 'call') = 'call') AS is_value_call
  FROM ethereum.traces t
  WHERE t.block_number >= 16925618 AND t.block_number < 26282117
    AND t.block_date >= DATE '2023-03-28' AND t.block_date <= DATE '2026-10-27'
    AND t.tx_success
    AND (t.to = 0x253553366da8546fc250f225fe3d25d0c782303b
         OR t."from" = 0x253553366da8546fc250f225fe3d25d0c782303b
         OR NOT t.success)
    AND t.tx_hash IN (SELECT tx_hash FROM c4_ren_tx)
),

c4_failed AS (
  SELECT tx_hash, trace_address FROM c4_traces WHERE NOT success
),

c4_effective_flows AS (
  SELECT f.tx_hash,
    SUM(CASE WHEN f.to = 0x253553366da8546fc250f225fe3d25d0c782303b THEN f.value_wei ELSE 0 END)
      - SUM(CASE WHEN f."from" = 0x253553366da8546fc250f225fe3d25d0c782303b THEN f.value_wei ELSE 0 END) AS net_wei
  FROM c4_traces f
  LEFT JOIN c4_failed x
    ON x.tx_hash = f.tx_hash
   AND cardinality(x.trace_address) <= cardinality(f.trace_address)
   AND slice(f.trace_address, 1, cardinality(x.trace_address)) = x.trace_address
  WHERE f.success AND f.is_value_call AND f.value_wei > 0 AND x.tx_hash IS NULL
  GROUP BY 1
),

c4_reg_in_ren_tx AS (
  SELECT r.tx_hash, SUM(r.paid_wei) AS reg_wei
  FROM v1_reg r
  WHERE r.ctrl = 'c4' AND r.tx_hash IN (SELECT tx_hash FROM c4_ren_tx)
  GROUP BY 1
),

c4_ren_kept AS (
  SELECT t.block_time,
    CASE
      WHEN k.kept_wei >= 0 AND k.kept_wei <= t.emitted_wei THEN k.kept_wei
      ELSE CAST(fail('c4 renewal refund: kept ETH outside [0, emitted] in tx ' || to_hex(t.tx_hash)) AS decimal(38, 0))
    END AS renewal_wei
  FROM c4_ren_tx t
  LEFT JOIN (
    SELECT f.tx_hash, f.net_wei - COALESCE(g.reg_wei, 0) AS kept_wei
    FROM c4_effective_flows f
    LEFT JOIN c4_reg_in_ren_tx g ON g.tx_hash = f.tx_hash
  ) k ON k.tx_hash = t.tx_hash
),

-- ---------------------------------------------------------------------------------------------------------------
-- 4. All ETH payments -> hourly sums -> USD at the hour's WETH price.
-- ---------------------------------------------------------------------------------------------------------------
eth_payments AS (
  SELECT block_time, registration_wei, premium_wei, CAST(0 AS decimal(38, 0)) AS renewal_wei FROM v1_reg_split
  UNION ALL
  SELECT block_time, 0, 0, cost_wei FROM v1_ren WHERE ctrl <> 'c4'
  UNION ALL
  SELECT block_time, 0, 0, renewal_wei FROM c4_ren_kept
),

eth_hourly AS (
  SELECT date_trunc('hour', block_time) AS hour,
    CAST(SUM(registration_wei) AS double) / 1e18 AS registration_eth,
    CAST(SUM(premium_wei) AS double) / 1e18 AS premium_eth,
    CAST(SUM(renewal_wei) AS double) / 1e18 AS renewal_eth
  FROM eth_payments
  GROUP BY 1
),

eth_usd_hourly AS (
  SELECT timestamp AS hour, price
  FROM prices.hour
  WHERE blockchain = 'ethereum'
    AND contract_address = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 -- WETH
    AND timestamp >= TIMESTAMP '2019-05-01' AND timestamp < TIMESTAMP '2026-10-28'
),

eth_monthly AS (
  SELECT date_trunc('month', h.hour) AS month,
    SUM(h.registration_eth) AS registration_eth,
    SUM(h.premium_eth) AS premium_eth,
    SUM(h.renewal_eth) AS renewal_eth,
    -- every ETH payment is before the freeze, so a missing hourly price is a data gap: fail instead of pricing at 0
    SUM(h.registration_eth * COALESCE(p.price, CAST(fail('no prices.hour WETH price for ' || CAST(h.hour AS varchar)) AS double))) AS registration_usd,
    SUM(h.premium_eth * COALESCE(p.price, CAST(fail('no prices.hour WETH price for ' || CAST(h.hour AS varchar)) AS double))) AS premium_usd,
    SUM(h.renewal_eth * COALESCE(p.price, CAST(fail('no prices.hour WETH price for ' || CAST(h.hour AS varchar)) AS double))) AS renewal_usd
  FROM eth_hourly h
  LEFT JOIN eth_usd_hourly p ON p.hour = h.hour
  GROUP BY 1
),

-- ---------------------------------------------------------------------------------------------------------------
-- 5. ENSv2 payments (USDC/DAI at $1). Data words (1-based byte offsets into data):
--    NameRegistered: w5 paymentToken = bytes 173..192, w6 base = 193..224, w7 premium = 225..256
--    NameRenewed:    w3 paymentToken = bytes 109..128, w4 amount = 129..160
-- ---------------------------------------------------------------------------------------------------------------
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

v2_monthly_token AS (
  SELECT date_trunc('month', block_time) AS month, payment_token,
    SUM(base_raw) AS base_raw, SUM(premium_raw) AS premium_raw, SUM(renewal_raw) AS renewal_raw
  FROM v2_decoded
  WHERE base_raw + premium_raw + renewal_raw > 0
  GROUP BY 1, 2
),

v2_monthly AS (
  SELECT month,
    SUM(CAST(base_raw AS double) / unit) AS registration_usd,
    SUM(CAST(premium_raw AS double) / unit) AS premium_usd,
    SUM(CAST(renewal_raw AS double) / unit) AS renewal_usd
  FROM (
    SELECT *,
      CASE payment_token
        WHEN 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48 THEN 1e6  -- USDC, 6 decimals
        WHEN 0x6b175474e89094c44da98b954eedeac495271d0f THEN 1e18 -- DAI, 18 decimals
        ELSE CAST(fail('unknown ENSv2 payment token ' || to_hex(payment_token)) AS double)
      END AS unit
    FROM v2_monthly_token
  ) t
  GROUP BY 1
),

-- ---------------------------------------------------------------------------------------------------------------
-- 6. Combine.
-- ---------------------------------------------------------------------------------------------------------------
combined AS (
  SELECT COALESCE(e.month, v.month) AS month,
    COALESCE(e.registration_usd, 0) + COALESCE(v.registration_usd, 0) AS registration_usd,
    COALESCE(e.premium_usd, 0) + COALESCE(v.premium_usd, 0) AS premium_usd,
    COALESCE(e.renewal_usd, 0) + COALESCE(v.renewal_usd, 0) AS renewal_usd,
    COALESCE(v.registration_usd, 0) + COALESCE(v.premium_usd, 0) + COALESCE(v.renewal_usd, 0) AS stablecoin_usd,
    COALESCE(e.registration_eth, 0) AS registration_eth,
    COALESCE(e.premium_eth, 0) AS premium_eth,
    COALESCE(e.renewal_eth, 0) AS renewal_eth
  FROM eth_monthly e
  FULL OUTER JOIN v2_monthly v ON v.month = e.month
)

SELECT
  month,
  ROUND(registration_usd, 2) AS registration_usd,
  ROUND(premium_usd, 2) AS premium_usd,
  ROUND(renewal_usd, 2) AS renewal_usd,
  ROUND(registration_usd + premium_usd + renewal_usd, 2) AS total_usd,
  ROUND(registration_eth, 6) AS registration_eth,
  ROUND(premium_eth, 6) AS premium_eth,
  ROUND(renewal_eth, 6) AS renewal_eth,
  ROUND(stablecoin_usd, 2) AS stablecoin_usd
FROM combined
ORDER BY 1
