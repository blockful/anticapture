-- ENS Revenue per Month in USD
-- Source: Steakhouse accounting (ground truth) for Registration vs Renewal
-- Source: v4+v5 NameRegistered for Premium breakdown within Registration
-- Steakhouse account 3211 = Registration revenue, 3212 = Renewal revenue
-- Steakhouse uses accrual accounting but close to cash basis for 1-year registrations

-- Revenue from Steakhouse (authoritative)
SELECT
  date_trunc('month', period) AS month,
  CASE account
    WHEN 3211 THEN 'Registration'
    WHEN 3212 THEN 'Renewal'
  END AS category,
  ROUND(SUM(amount), 2) AS revenue_usd,
  ROUND(SUM(token_amount), 6) AS revenue_eth
FROM dune.steakhouse.result_ens_accounting_revenues
WHERE ledger = 'REV'
  AND account IN (3211, 3212)
  AND amount > 0
GROUP BY 1, 2
ORDER BY 1, 2