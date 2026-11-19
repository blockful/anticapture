-- ENS New Wallets per Month. Replaces Dune query 7531718 (new_wallets_per_month).
-- Columns: month, new_wallets, cumulative_wallets (unchanged; mapped by fetchNewWallets).
-- Definition (changed): a wallet is new in the month it first becomes the registrant (owner) of a .eth name, i.e.
-- the first paid NameRegistered whose `owner` is that address:
--   v1: owner of the five ETH controllers' NameRegistered, blocks < 26,282,117 (ENSv2 freeze), cost > 0
--   v2: owner (data word 1) of ENSv2 ETHRegistrar NameRegistered, base + premium > 0
-- The previous query counted the first transaction sender (evt_tx_from) of any registration or renewal. That
-- counted relayers, bulk renewers and routers (86% of ENSv2 registrations, 1,261 of 1,465 to 2026-11-03, are sent
-- by an address other than the owner) and missed owners who never sent a transaction themselves. Renewals no longer
-- make a wallet new: renewing requires an earlier registration, whose owner was already counted. Owners of names
-- that never went through a controller (2019 auction, claims, migrated legacy names) are counted at their first
-- controller registration, if any.

WITH
registrations AS (
  SELECT evt_block_time AS block_time, owner, CAST(cost AS double) AS paid, evt_block_number AS block_number
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_1_evt_nameregistered
  UNION ALL
  SELECT evt_block_time, owner, CAST(cost AS double), evt_block_number
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_2_evt_nameregistered
  UNION ALL
  SELECT evt_block_time, owner, CAST(cost AS double), evt_block_number
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_3_evt_nameregistered
  UNION ALL
  SELECT evt_block_time, owner, CAST(baseCost AS double) + CAST(premium AS double), evt_block_number
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_4_evt_nameregistered
  UNION ALL
  SELECT evt_block_time, owner, CAST(baseCost AS double) + CAST(premium AS double), evt_block_number
  FROM ethereumnameservice_ethereum.ethregistrarcontroller_5_evt_nameregistered
),

v1_owners AS (
  SELECT block_time, owner FROM registrations WHERE block_number < 26282117 AND paid > 0
),

-- ETHRegistrar NameRegistered data: w1 owner = bytes 45..64, w6 base = 193..224, w7 premium = 225..256
v2_owners AS (
  SELECT block_time, varbinary_substring(data, 45, 20) AS owner
  FROM ethereum.logs
  WHERE block_number >= 26282117 AND block_date >= DATE '2026-10-27'
    AND contract_address = 0xd6d8369e55c94ae8afa714e6cf7ab5be54d5cc81 -- ETHRegistrar
    AND topic0 = 0xebd3982eafd13b820e3edb2a4abd57a82ce3b8802e0cd45637a5de51383f9fac -- NameRegistered
    AND CAST(varbinary_to_uint256(varbinary_substring(data, 193, 32)) AS double)
      + CAST(varbinary_to_uint256(varbinary_substring(data, 225, 32)) AS double) > 0
),

first_registration AS (
  SELECT owner, MIN(block_time) AS first_time
  FROM (
    SELECT block_time, owner FROM v1_owners
    UNION ALL
    SELECT block_time, owner FROM v2_owners
  ) o
  WHERE owner IS NOT NULL
  GROUP BY owner
),

monthly AS (
  SELECT date_trunc('month', first_time) AS month, COUNT(*) AS new_wallets
  FROM first_registration
  GROUP BY 1
)

SELECT
  month,
  new_wallets,
  SUM(new_wallets) OVER (ORDER BY month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_wallets
FROM monthly
ORDER BY month
