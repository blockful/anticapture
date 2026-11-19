-- Shutter DAO Timelock Liquid Treasury (excluding SHU)
-- Timelock: 0x36bD3044ab68f600f6d3e081056F34f2a58432c4
-- Output: date, stables, eth, uniswap_lp, octant, sablier, totalAssets
--
-- Categories:
--   stables  = USDC + USDT + sUSDS + sDAI + USDGLO + DSR position (in timelock, priced)
--   eth      = native ETH + WETH (in timelock, priced)
--   uniswap  = Uniswap V2 USDC/SHU LP position (USDC side only)
--   octant   = osUSDC strategy shares in timelock (~1:1 USDC)
--   sablier  = USDC + sDAI + USDGLO locked in Sablier streams (funded by timelock)

WITH
-- ==============================================
-- ERC-20 daily running balances in timelock
-- ==============================================
erc20_changes AS (
    SELECT
        date_trunc('day', evt_block_time) AS day,
        contract_address,
        SUM(
            CASE WHEN "to" = 0x36bD3044ab68f600f6d3e081056F34f2a58432c4
                 THEN CAST(value AS DECIMAL(38,0)) ELSE CAST(0 AS DECIMAL(38,0)) END
          - CASE WHEN "from" = 0x36bD3044ab68f600f6d3e081056F34f2a58432c4
                 THEN CAST(value AS DECIMAL(38,0)) ELSE CAST(0 AS DECIMAL(38,0)) END
        ) AS delta
    FROM erc20_ethereum.evt_Transfer
    WHERE ("to" = 0x36bD3044ab68f600f6d3e081056F34f2a58432c4
        OR "from" = 0x36bD3044ab68f600f6d3e081056F34f2a58432c4)
      AND contract_address IN (
          0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48, -- USDC
          0xdac17f958d2ee523a2206206994597c13d831ec7, -- USDT
          0xa3931d71877c0e7a3148cb7eb4463524fec27fbd, -- sUSDS
          0x83f20f44975d03b1b09e64809b757c47f942beea, -- sDAI
          0x4f604735c1cf31399c6e711d5962b2b3e0225ad3, -- USDGLO
          0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2, -- WETH
          0xb21FbD35AC45caC1D5011b74Ce06b31f8EB2C377  -- osUSDC (Morpho strategy shares)
      )
      AND evt_block_time >= TIMESTAMP '2024-01-16'
    GROUP BY 1, 2
),

erc20_running AS (
    SELECT
        day,
        contract_address,
        SUM(delta) OVER (PARTITION BY contract_address ORDER BY day) AS balance_raw
    FROM erc20_changes
),

-- Token metadata with category tags
tracked_tokens(contract_address, symbol, decimals, category) AS (
    VALUES
        (0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48, 'USDC',    6, 'stables'),
        (0xdac17f958d2ee523a2206206994597c13d831ec7, 'USDT',    6, 'stables'),
        (0xa3931d71877c0e7a3148cb7eb4463524fec27fbd, 'sUSDS',  18, 'stables'),
        (0x83f20f44975d03b1b09e64809b757c47f942beea, 'sDAI',   18, 'stables'),
        (0x4f604735c1cf31399c6e711d5962b2b3e0225ad3, 'USDGLO', 18, 'stables'),
        (0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2, 'WETH',   18, 'eth'),
        (0xb21FbD35AC45caC1D5011b74Ce06b31f8EB2C377, 'osUSDC',  6, 'octant')
),

-- ==============================================
-- Native ETH balance via traces
-- ==============================================
eth_changes AS (
    SELECT
        date_trunc('day', block_time) AS day,
        SUM(
            CASE WHEN "to" = 0x36bD3044ab68f600f6d3e081056F34f2a58432c4
                 THEN CAST(value AS DECIMAL(38,0)) ELSE CAST(0 AS DECIMAL(38,0)) END
          - CASE WHEN "from" = 0x36bD3044ab68f600f6d3e081056F34f2a58432c4
                 THEN CAST(value AS DECIMAL(38,0)) ELSE CAST(0 AS DECIMAL(38,0)) END
        ) AS delta
    FROM ethereum.traces
    WHERE ("to" = 0x36bD3044ab68f600f6d3e081056F34f2a58432c4
        OR "from" = 0x36bD3044ab68f600f6d3e081056F34f2a58432c4)
      AND success = true
      AND (call_type NOT IN ('delegatecall', 'staticcall') OR call_type IS NULL)
      AND block_time >= TIMESTAMP '2024-01-16'
    GROUP BY 1
),

eth_running AS (
    SELECT day, SUM(delta) OVER (ORDER BY day) AS balance_raw
    FROM eth_changes
),

-- ==============================================
-- Uniswap V2 LP position (USDC/SHU pair)
-- ==============================================
lp_changes AS (
    SELECT
        date_trunc('day', evt_block_time) AS day,
        SUM(
            CASE WHEN "to" = 0x36bD3044ab68f600f6d3e081056F34f2a58432c4
                 THEN CAST(value AS DECIMAL(38,0)) ELSE CAST(0 AS DECIMAL(38,0)) END
          - CASE WHEN "from" = 0x36bD3044ab68f600f6d3e081056F34f2a58432c4
                 THEN CAST(value AS DECIMAL(38,0)) ELSE CAST(0 AS DECIMAL(38,0)) END
        ) AS delta
    FROM erc20_ethereum.evt_Transfer
    WHERE ("to" = 0x36bD3044ab68f600f6d3e081056F34f2a58432c4
        OR "from" = 0x36bD3044ab68f600f6d3e081056F34f2a58432c4)
      AND contract_address = 0x7a922aea89288d8c91777beecc68df4a17151df1
      AND evt_block_time >= TIMESTAMP '2024-01-16'
    GROUP BY 1
),

lp_running AS (
    SELECT day, SUM(delta) OVER (ORDER BY day) AS balance_raw
    FROM lp_changes
),

lp_supply_changes AS (
    SELECT
        date_trunc('day', evt_block_time) AS day,
        SUM(
            CASE WHEN "from" = 0x0000000000000000000000000000000000000000
                 THEN CAST(value AS DECIMAL(38,0)) ELSE CAST(0 AS DECIMAL(38,0)) END
          - CASE WHEN "to" = 0x0000000000000000000000000000000000000000
                 THEN CAST(value AS DECIMAL(38,0)) ELSE CAST(0 AS DECIMAL(38,0)) END
        ) AS delta
    FROM erc20_ethereum.evt_Transfer
    WHERE contract_address = 0x7a922aea89288d8c91777beecc68df4a17151df1
      AND ("from" = 0x0000000000000000000000000000000000000000
        OR "to" = 0x0000000000000000000000000000000000000000)
    GROUP BY 1
),

lp_supply_running AS (
    SELECT day, SUM(delta) OVER (ORDER BY day) AS total_supply_raw
    FROM lp_supply_changes
),

pair_usdc_changes AS (
    SELECT
        date_trunc('day', evt_block_time) AS day,
        SUM(
            CASE WHEN "to" = 0x7a922aea89288d8c91777beecc68df4a17151df1
                 THEN CAST(value AS DECIMAL(38,0)) ELSE CAST(0 AS DECIMAL(38,0)) END
          - CASE WHEN "from" = 0x7a922aea89288d8c91777beecc68df4a17151df1
                 THEN CAST(value AS DECIMAL(38,0)) ELSE CAST(0 AS DECIMAL(38,0)) END
        ) AS delta
    FROM erc20_ethereum.evt_Transfer
    WHERE contract_address = 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
      AND ("to" = 0x7a922aea89288d8c91777beecc68df4a17151df1
        OR "from" = 0x7a922aea89288d8c91777beecc68df4a17151df1)
    GROUP BY 1
),

pair_usdc_running AS (
    SELECT day, SUM(delta) OVER (ORDER BY day) AS usdc_reserve_raw
    FROM pair_usdc_changes
),

-- ==============================================
-- DSR: DAI deposited into Maker DSR (pot) by timelock
-- Tracked via DAI transfers to/from sDAI contract (0x83f2...)
-- The pot uses internal accounting, no sDAI ERC20 is minted
-- ==============================================
-- Txs where the timelock migrated DSR to sUSDS via migration contract
dsr_migration_txs AS (
    SELECT DISTINCT evt_tx_hash
    FROM erc20_ethereum.evt_Transfer
    WHERE contract_address = 0xa3931d71877c0e7a3148cb7eb4463524fec27fbd -- sUSDS
      AND "from" = 0x0000000000000000000000000000000000000000
      AND "to" = 0x36bD3044ab68f600f6d3e081056F34f2a58432c4
),

dsr_changes AS (
    SELECT day, SUM(delta_usd) AS delta_usd FROM (
        -- Deposit: timelock sends DAI to sDAI contract (pot join)
        SELECT
            date_trunc('day', evt_block_time) AS day,
            CAST(CAST(value AS DECIMAL(38,0)) AS DOUBLE) / 1e18 AS delta_usd
        FROM erc20_ethereum.evt_Transfer
        WHERE contract_address = 0x6b175474e89094c44da98b954eedeac495271d0f
          AND "from" = 0x36bD3044ab68f600f6d3e081056F34f2a58432c4
          AND "to" = 0x83f20f44975d03b1b09e64809b757c47f942beea
          AND evt_block_time >= TIMESTAMP '2024-01-16'

        UNION ALL

        -- Withdraw: sDAI contract sends DAI to timelock (pot exit)
        SELECT
            date_trunc('day', evt_block_time) AS day,
            -CAST(CAST(value AS DECIMAL(38,0)) AS DOUBLE) / 1e18 AS delta_usd
        FROM erc20_ethereum.evt_Transfer
        WHERE contract_address = 0x6b175474e89094c44da98b954eedeac495271d0f
          AND "from" = 0x83f20f44975d03b1b09e64809b757c47f942beea
          AND "to" = 0x36bD3044ab68f600f6d3e081056F34f2a58432c4
          AND evt_block_time >= TIMESTAMP '2024-01-16'

        UNION ALL

        -- Migration exit: DAI minted to migration contract in timelock's txs
        SELECT
            date_trunc('day', e.evt_block_time) AS day,
            -CAST(CAST(e.value AS DECIMAL(38,0)) AS DOUBLE) / 1e18 AS delta_usd
        FROM erc20_ethereum.evt_Transfer e
        JOIN dsr_migration_txs m ON m.evt_tx_hash = e.evt_tx_hash
        WHERE e.contract_address = 0x6b175474e89094c44da98b954eedeac495271d0f
          AND e."from" = 0x0000000000000000000000000000000000000000
          AND e."to" = 0xf86141a5657cf52aeb3e30ebcca5ad3a8f714b89

        UNION ALL

        -- sDAI spent from timelock (e.g. to Sablier via BatchLockup or direct)
        -- sDAI was acquired via DSR without a mint event, so spending it
        -- reduces the DSR position
        SELECT
            date_trunc('day', evt_block_time) AS day,
            -CAST(CAST(value AS DECIMAL(38,0)) AS DOUBLE) / 1e18 AS delta_usd
        FROM erc20_ethereum.evt_Transfer
        WHERE contract_address = 0x83f20f44975d03b1b09e64809b757c47f942beea -- sDAI
          AND "from" = 0x36bD3044ab68f600f6d3e081056F34f2a58432c4
          AND evt_block_time >= TIMESTAMP '2024-01-16'

        UNION ALL

        -- sDAI received by timelock (e.g. from Sablier withdrawal)
        -- restores DSR position
        SELECT
            date_trunc('day', evt_block_time) AS day,
            CAST(CAST(value AS DECIMAL(38,0)) AS DOUBLE) / 1e18 AS delta_usd
        FROM erc20_ethereum.evt_Transfer
        WHERE contract_address = 0x83f20f44975d03b1b09e64809b757c47f942beea -- sDAI
          AND "to" = 0x36bD3044ab68f600f6d3e081056F34f2a58432c4
          AND evt_block_time >= TIMESTAMP '2024-01-16'
    ) sub
    GROUP BY 1
),

dsr_running AS (
    SELECT day, SUM(delta_usd) OVER (ORDER BY day) AS usd_value
    FROM dsr_changes
),

-- ==============================================
-- Sablier: track tokens locked in streams funded by timelock
-- Deposits: timelock -> BatchLockup (0xb5ec...) or timelock -> Sablier direct
-- Withdrawals: Sablier -> timelock or Sablier -> known stream recipients
-- Sablier contracts:
--   0xf86b... = V2 Lockup Tranched
--   0x3962... = V2 Lockup Linear
-- ==============================================
sablier_changes AS (
    SELECT
        date_trunc('day', evt_block_time) AS day,
        -- Deposits: timelock -> BatchLockup (proxy for Sablier deposit)
        SUM(CASE
            WHEN "from" = 0x36bD3044ab68f600f6d3e081056F34f2a58432c4
             AND "to" = 0xb5ec9706c3be9d22326d208f491e5deef7c8d9f0
            THEN CAST(CAST(value AS DECIMAL(38,0)) AS DOUBLE) / POWER(10, COALESCE(t.decimals, 18))
            ELSE 0 END
        -- Deposits: timelock -> Sablier direct
        + CASE
            WHEN "from" = 0x36bD3044ab68f600f6d3e081056F34f2a58432c4
             AND "to" IN (0xf86b359035208e4529686a1825f2d5bee38c28a8,
                          0x3962f6585946823440d274ad7c719b02b49de51e)
            THEN CAST(CAST(value AS DECIMAL(38,0)) AS DOUBLE) / POWER(10, COALESCE(t.decimals, 18))
            ELSE 0 END
        -- Withdrawals: Sablier -> timelock
        - CASE
            WHEN "from" IN (0xf86b359035208e4529686a1825f2d5bee38c28a8,
                            0x3962f6585946823440d274ad7c719b02b49de51e)
             AND "to" = 0x36bD3044ab68f600f6d3e081056F34f2a58432c4
            THEN CAST(CAST(value AS DECIMAL(38,0)) AS DOUBLE) / POWER(10, COALESCE(t.decimals, 18))
            ELSE 0 END
        -- Withdrawals: Sablier -> known stream recipients
        - CASE
            WHEN "from" IN (0xf86b359035208e4529686a1825f2d5bee38c28a8,
                            0x3962f6585946823440d274ad7c719b02b49de51e)
             AND "to" IN (0x000ee9a6bcec9aadcc883bd52b2c9a75fb098991,
                          0xb75e2fb01521bd7b6369f831414840a54a3c7234,
                          0xcf2cbe40eb659a7ba8f2b2be437d8acafc8a268a)
            THEN CAST(CAST(value AS DECIMAL(38,0)) AS DOUBLE) / POWER(10, COALESCE(t.decimals, 18))
            ELSE 0 END
        ) AS delta_usd
    FROM erc20_ethereum.evt_Transfer e
    LEFT JOIN tokens.erc20 t ON t.contract_address = e.contract_address AND t.blockchain = 'ethereum'
    WHERE e.contract_address IN (
        0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48, -- USDC
        0x83f20f44975d03b1b09e64809b757c47f942beea, -- sDAI
        0x4f604735c1cf31399c6e711d5962b2b3e0225ad3  -- USDGLO
    )
    AND (
        -- Deposits from timelock
        ("from" = 0x36bD3044ab68f600f6d3e081056F34f2a58432c4
         AND "to" IN (0xb5ec9706c3be9d22326d208f491e5deef7c8d9f0,
                      0xf86b359035208e4529686a1825f2d5bee38c28a8,
                      0x3962f6585946823440d274ad7c719b02b49de51e))
        OR
        -- Withdrawals from Sablier to timelock or recipients
        ("from" IN (0xf86b359035208e4529686a1825f2d5bee38c28a8,
                    0x3962f6585946823440d274ad7c719b02b49de51e)
         AND "to" IN (0x36bD3044ab68f600f6d3e081056F34f2a58432c4,
                      0x000ee9a6bcec9aadcc883bd52b2c9a75fb098991,
                      0xb75e2fb01521bd7b6369f831414840a54a3c7234,
                      0xcf2cbe40eb659a7ba8f2b2be437d8acafc8a268a))
    )
    AND evt_block_time >= TIMESTAMP '2024-01-16'
    GROUP BY 1
),

sablier_running AS (
    SELECT day, SUM(delta_usd) OVER (ORDER BY day) AS usd_value
    FROM sablier_changes
),

-- ==============================================
-- Continuous daily timeline
-- ==============================================
days AS (
    SELECT day
    FROM UNNEST(sequence(
        DATE '2024-01-16',
        current_date - INTERVAL '1' DAY,
        INTERVAL '1' DAY
    )) AS t(day)
),

-- ==============================================
-- Forward-fill ERC-20 balances
-- ==============================================
erc20_daily AS (
    SELECT
        d.day,
        tt.contract_address,
        tt.symbol,
        tt.decimals,
        tt.category,
        COALESCE(
            e.balance_raw,
            LAST_VALUE(e.balance_raw) IGNORE NULLS OVER (
                PARTITION BY tt.contract_address ORDER BY d.day
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ),
            CAST(0 AS DECIMAL(38,0))
        ) AS balance_raw
    FROM days d
    CROSS JOIN tracked_tokens tt
    LEFT JOIN erc20_running e
        ON e.day = d.day AND e.contract_address = tt.contract_address
),

eth_daily AS (
    SELECT
        d.day,
        COALESCE(
            e.balance_raw,
            LAST_VALUE(e.balance_raw) IGNORE NULLS OVER (
                ORDER BY d.day
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ),
            CAST(0 AS DECIMAL(38,0))
        ) AS balance_raw
    FROM days d
    LEFT JOIN eth_running e ON e.day = d.day
),

lp_daily AS (
    SELECT
        d.day,
        COALESCE(
            lb.balance_raw,
            LAST_VALUE(lb.balance_raw) IGNORE NULLS OVER (
                ORDER BY d.day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ),
            CAST(0 AS DECIMAL(38,0))
        ) AS lp_balance,
        COALESCE(
            ls.total_supply_raw,
            LAST_VALUE(ls.total_supply_raw) IGNORE NULLS OVER (
                ORDER BY d.day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ),
            CAST(1 AS DECIMAL(38,0))
        ) AS total_supply,
        COALESCE(
            pu.usdc_reserve_raw,
            LAST_VALUE(pu.usdc_reserve_raw) IGNORE NULLS OVER (
                ORDER BY d.day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ),
            CAST(0 AS DECIMAL(38,0))
        ) AS usdc_reserve
    FROM days d
    LEFT JOIN lp_running lb ON lb.day = d.day
    LEFT JOIN lp_supply_running ls ON ls.day = d.day
    LEFT JOIN pair_usdc_running pu ON pu.day = d.day
),

-- ==============================================
-- Price each asset
-- ==============================================
erc20_priced AS (
    SELECT
        ed.day,
        ed.category,
        ed.symbol,
        CAST(ed.balance_raw AS DOUBLE) / POWER(10, ed.decimals) AS balance,
        CAST(ed.balance_raw AS DOUBLE) / POWER(10, ed.decimals)
        * COALESCE(
            p.price,
            CASE
                WHEN ed.symbol IN ('USDC', 'USDT', 'USDGLO', 'osUSDC', 'sUSDS', 'sDAI') THEN 1.0
                ELSE 0.0
            END
        ) AS usd_value
    FROM erc20_daily ed
    LEFT JOIN prices.usd_daily p
        ON p.contract_address = ed.contract_address
        AND p.blockchain = 'ethereum'
        AND p.day = ed.day
    WHERE ed.balance_raw > 0
),

eth_priced AS (
    SELECT
        ed.day,
        CAST(ed.balance_raw AS DOUBLE) / 1e18 AS balance,
        CAST(ed.balance_raw AS DOUBLE) / 1e18
        * COALESCE(p.price, 0) AS usd_value
    FROM eth_daily ed
    LEFT JOIN prices.usd_daily p
        ON p.contract_address = 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2
        AND p.blockchain = 'ethereum'
        AND p.day = ed.day
    WHERE ed.balance_raw > 0
),

lp_priced AS (
    SELECT
        day,
        CASE
            WHEN total_supply > 0 AND lp_balance > 0
            THEN (CAST(lp_balance AS DOUBLE) / CAST(total_supply AS DOUBLE))
                 * (CAST(usdc_reserve AS DOUBLE) / 1e6)
            ELSE 0.0
        END AS usd_value
    FROM lp_daily
),

-- ==============================================
-- Aggregate by category
-- ==============================================
stables_daily AS (
    SELECT day, SUM(usd_value) AS usd_value
    FROM erc20_priced
    WHERE category = 'stables'
    GROUP BY 1
),

eth_cat_daily AS (
    SELECT
        d.day,
        COALESCE(weth.usd_value, 0) + COALESCE(native.usd_value, 0) AS usd_value
    FROM days d
    LEFT JOIN (
        SELECT day, SUM(usd_value) AS usd_value
        FROM erc20_priced WHERE category = 'eth' GROUP BY 1
    ) weth ON weth.day = d.day
    LEFT JOIN eth_priced native ON native.day = d.day
),

octant_daily AS (
    SELECT day, SUM(usd_value) AS usd_value
    FROM erc20_priced
    WHERE category = 'octant'
    GROUP BY 1
),

dsr_daily AS (
    SELECT
        d.day,
        COALESCE(
            dr.usd_value,
            LAST_VALUE(dr.usd_value) IGNORE NULLS OVER (
                ORDER BY d.day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ),
            0.0
        ) AS usd_value
    FROM days d
    LEFT JOIN dsr_running dr ON dr.day = d.day
),

sablier_daily AS (
    SELECT
        d.day,
        COALESCE(
            s.usd_value,
            LAST_VALUE(s.usd_value) IGNORE NULLS OVER (
                ORDER BY d.day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ),
            0.0
        ) AS usd_value
    FROM days d
    LEFT JOIN sablier_running s ON s.day = d.day
)

-- ==============================================
-- Final output: one column per category
-- ==============================================
SELECT
    date_format(d.day, '%Y-%m-%d') AS date,
    ROUND(COALESCE(st.usd_value, 0) + COALESCE(dsr.usd_value, 0), 2) AS stables,
    ROUND(COALESCE(eth.usd_value, 0), 2) AS eth,
    ROUND(COALESCE(lp.usd_value, 0), 2) AS uniswap_lp,
    ROUND(COALESCE(oct.usd_value, 0), 2) AS octant,
    ROUND(COALESCE(sab.usd_value, 0), 2) AS sablier,
    ROUND(
        COALESCE(st.usd_value, 0)
        + COALESCE(eth.usd_value, 0)
        + COALESCE(lp.usd_value, 0)
        + COALESCE(oct.usd_value, 0)
        + COALESCE(dsr.usd_value, 0)
        + COALESCE(sab.usd_value, 0),
    2) AS totalAssets
FROM days d
LEFT JOIN stables_daily st ON st.day = d.day
LEFT JOIN eth_cat_daily eth ON eth.day = d.day
LEFT JOIN lp_priced lp ON lp.day = d.day
LEFT JOIN octant_daily oct ON oct.day = d.day
LEFT JOIN dsr_daily dsr ON dsr.day = d.day
LEFT JOIN sablier_daily sab ON sab.day = d.day
ORDER BY 1