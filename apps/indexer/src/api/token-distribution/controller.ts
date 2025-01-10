import { DaysEnum } from "@/lib/daysEnum";
import { sql } from "ponder";
import { ponder } from "ponder:registry";
import { formatUnits, zeroAddress } from "viem";
import {
  CexSupplyQueryResult,
  CirculatingSupplyQueryResult,
  DelegatedSupplyQueryResult,
  DexSupplyQueryResult,
  LendingSupplyQueryResult,
  TotalSupplyQueryResult,
  TreasuryQueryResult,
} from "./types";
import {
  CEXAddresses,
  DEXAddresses,
  LendingAddresses,
  MetricTypesEnum,
  UNITreasuryAddresses,
} from "@/lib/constants";

ponder.get("/dao/:daoId/total-supply/compare", async (context) => {
  const daoId = context.req.param("daoId");
  const days: string | undefined = context.req.query("days");
  if (!days) {
    throw new Error('Query param "days" is mandatory');
  }
  const oldTimestamp =
    BigInt(Date.now()) - BigInt(DaysEnum[days as unknown as DaysEnum]);
  const queryResult = await context.db
    .execute(sql`         WITH "old_from_zero_address" as (
    SELECT SUM(t.amount) as "from_amount" 
    FROM "transfers" t 
    WHERE t."from_account_id"=${zeroAddress} 
  AND t."dao_id" = ${daoId}
  AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
  ),
  "old_to_zero_address" as (
    SELECT SUM(t.amount) as "to_amount" 
    FROM "transfers" t 
    WHERE t."to_account_id"=${zeroAddress} 
    AND t."dao_id" = ${daoId}
    AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
  ),
  "current_total_supply" as (
  SELECT SUM(ab.balance) as "balance" FROM "account_balance" ab
  )
  SELECT "old_from_zero_address"."from_amount" - COALESCE("old_to_zero_address"."to_amount", 0) as "oldTotalSupply",
  "current_total_supply"."balance" as "currentTotalSupply"
  FROM "old_from_zero_address" 
  JOIN "old_to_zero_address" on 1=1
  JOIN "current_total_supply" on 1=1;`);
  const totalSupplyCompare: TotalSupplyQueryResult = queryResult
    .rows[0] as TotalSupplyQueryResult;
  const changeRate = formatUnits(
    (BigInt(totalSupplyCompare.currentTotalSupply) * BigInt(1e18)) /
      BigInt(totalSupplyCompare.oldTotalSupply) -
      BigInt(1e18),
    18,
  );
  return context.json({ ...totalSupplyCompare, changeRate });
});

ponder.get("/dao/:daoId/delegated-supply/compare", async (context) => {
  const daoId = context.req.param("daoId");
  const days: string | undefined = context.req.query("days");
  if (!days) {
    throw new Error('Query param "days" is mandatory');
  }
  const oldTimestamp =
    BigInt(Date.now()) - BigInt(DaysEnum[days as unknown as DaysEnum]);
  const queryResult = await context.db.execute(sql`
  WITH  "old_delegated_supply" as (
    SELECT db.average as current_delegated_supply_amount from "dao_metrics_day_buckets" db 
    WHERE db.dao_id=${daoId} 
    AND db.metric_type=${MetricTypesEnum.DELEGATED_SUPPLY}
    AND db."date">=TO_TIMESTAMP(${oldTimestamp}::bigint / 1000)::DATE
    ORDER BY db."date" ASC LIMIT 1
  ),
 "current_delegated_supply"  AS (
    SELECT db.average as current_delegated_supply_amount from "dao_metrics_day_buckets" db 
    WHERE db.dao_id=${daoId} 
    AND db.metric_type=${MetricTypesEnum.DELEGATED_SUPPLY}
    ORDER BY db."date" DESC LIMIT 1
  )
  SELECT COALESCE("old_delegated_supply"."old_delegated_supply_amount",0) AS "oldDelegatedSupply", 
  COALESCE("current_delegated_supply"."current_delegated_supply_amount", 0) AS "currentDelegatedSupply"
  FROM "current_delegated_supply"
  LEFT JOIN "old_delegated_supply" ON 1=1;`);
  const delegatedSupplyCompare: DelegatedSupplyQueryResult = queryResult
    .rows[0] as DelegatedSupplyQueryResult;
  let changeRate;
  if (delegatedSupplyCompare.oldDelegatedSupply === "0") {
    changeRate = "0";
  } else {
    changeRate = formatUnits(
      (BigInt(delegatedSupplyCompare.currentDelegatedSupply) * BigInt(1e18)) /
        BigInt(delegatedSupplyCompare.oldDelegatedSupply) -
        BigInt(1e18),
      18
    );
  }
  return context.json({ ...delegatedSupplyCompare, changeRate });
});

ponder.get("/dao/:daoId/circulating-supply/compare", async (context) => {
  const daoId = context.req.param("daoId");
  const days: string | undefined = context.req.query("days");
  if (!days) {
    throw new Error('Query param "days" is mandatory');
  }
  const oldTimestamp =
    BigInt(Date.now()) - BigInt(DaysEnum[days as unknown as DaysEnum]);
  const queryResult = await context.db.execute(sql`
   WITH "old_from_zero_address" as (
          SELECT SUM(t.amount) as "from_amount" 
          FROM "transfers" t 
          WHERE t."from_account_id"=${zeroAddress} 
          AND t."dao_id" = ${daoId}
          AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
        ),
        "old_to_zero_address" as (
          SELECT SUM(t.amount) as "to_amount" 
          FROM "transfers" t 
          WHERE t."to_account_id"=${zeroAddress} 
          AND t."dao_id" = ${daoId}
          AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
        ),
        "old_from_treasury" as (
          SELECT SUM(t.amount) as "from_amount" 
          FROM "transfers" t 
          WHERE t."from_account_id" IN (${Object.values(UNITreasuryAddresses).join(", ")})
          AND t."dao_id" = ${daoId}
          AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
        ),
        "old_to_treasury"as (
          SELECT SUM(t.amount) as "to_amount" 
          FROM "transfers" t 
          WHERE t."to_account_id" IN (${Object.values(UNITreasuryAddresses).join(", ")})
          AND t."dao_id" = ${daoId}
          AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
        ),
        "current_circulating_supply" as (
          SELECT SUM(ab.balance) AS "current_circulating_supply"
          FROM "account_balance" ab WHERE ab."account_id" NOT IN (${Object.values(UNITreasuryAddresses).join(", ")})
        )
        SELECT (COALESCE("old_from_zero_address"."from_amount",0) - COALESCE("old_to_zero_address"."to_amount", 0)) - 
        (COALESCE("old_to_treasury"."to_amount", 0) - COALESCE("old_from_treasury"."from_amount",0))
        as "oldCirculatingSupply",
        "current_circulating_supply"."current_circulating_supply"
        as "currentCirculatingSupply"
        FROM "old_from_zero_address" 
        JOIN "old_to_zero_address" ON 1=1
        JOIN "old_from_treasury" ON 1=1
        JOIN "old_to_treasury" ON 1=1
        JOIN "current_circulating_supply" ON 1=1;`);
  const circulatingSupplyCompare: CirculatingSupplyQueryResult = queryResult
    .rows[0] as CirculatingSupplyQueryResult;
  const changeRate = formatUnits(
    (BigInt(circulatingSupplyCompare.currentCirculatingSupply) * BigInt(1e18)) /
      BigInt(circulatingSupplyCompare.oldCirculatingSupply) -
      BigInt(1e18),
    18,
  );
  return context.json({ ...circulatingSupplyCompare, changeRate });
});

ponder.get("/dao/:daoId/treasury/compare", async (context) => {
  const daoId = context.req.param("daoId");
  const days: string | undefined = context.req.query("days");
  if (!days) {
    throw new Error('Query param "days" is mandatory');
  }
  const oldTimestamp =
    BigInt(Date.now()) - BigInt(DaysEnum[days as unknown as DaysEnum]);
  const queryResult = await context.db.execute(sql`
    WITH "old_from_treasury" as (
      SELECT SUM(t.amount) as "from_amount" 
      FROM "transfers" t 
      WHERE t."from_account_id" IN (${Object.values(UNITreasuryAddresses).join(", ")})
      AND t."dao_id" = ${daoId}
      AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
    ),
    "old_to_treasury" as (
      SELECT SUM(t.amount) as "to_amount" 
      FROM "transfers" t 
      WHERE t."to_account_id" IN (${Object.values(UNITreasuryAddresses).join(", ")})
      AND t."dao_id" = ${daoId}
      AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
    ),
    "current_treasury" as (
      SELECT SUM(ab.balance) AS "current_treasury"
      FROM "account_balance" ab WHERE ab."account_id" IN (${Object.values(UNITreasuryAddresses).join(", ")})
    )
    SELECT (COALESCE("old_to_treasury"."to_amount", 0) - COALESCE("old_from_treasury"."from_amount", 0))
    as "oldTreasury",
    COALESCE("current_treasury"."current_treasury", 0)
    as "currentTreasury"
    FROM "old_from_treasury"
    JOIN "old_to_treasury" ON 1=1
    JOIN "current_treasury" ON 1=1;
  `);
  const treasuryCompare: TreasuryQueryResult = queryResult
    .rows[0] as TreasuryQueryResult;
  let changeRate;
  if (treasuryCompare.oldTreasury === "0") {
    changeRate = "0";
  } else {
    changeRate = formatUnits(
      (BigInt(treasuryCompare.currentTreasury) * BigInt(1e18)) /
        BigInt(treasuryCompare.oldTreasury) -
        BigInt(1e18),
      18,
    );
  }
  return context.json({ ...treasuryCompare, changeRate });
});

ponder.get("/dao/:daoId/cex-supply/compare", async (context) => {
  const daoId = context.req.param("daoId");
  const days: string | undefined = context.req.query("days");
  if (!days) {
    throw new Error('Query param "days" is mandatory');
  }
  const oldTimestamp =
    BigInt(Date.now()) - BigInt(DaysEnum[days as unknown as DaysEnum]);
  const queryResult = await context.db.execute(sql`
    WITH "old_from_cex" as (
      SELECT SUM(t.amount) as "from_amount" 
      FROM "transfers" t 
      WHERE UPPER(t."from_account_id") IN (${Object.values(CEXAddresses)
        .map((addr) => addr.toUpperCase())
        .join(", ")})
      AND t."dao_id" = ${daoId}
      AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
    ),
    "old_to_cex" as (
      SELECT SUM(t.amount) as "to_amount" 
      FROM "transfers" t 
      WHERE UPPER(t."to_account_id") IN (${Object.values(CEXAddresses)
        .map((addr) => addr.toUpperCase())
        .join(", ")})
      AND t."dao_id" = ${daoId}
      AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
    ),
    "current_cex_supply" as (
      SELECT SUM(ab.balance) AS "current_cex_supply"
      FROM "account_balance" ab WHERE UPPER(ab."account_id") IN (${Object.values(
        CEXAddresses,
      )
        .map((addr) => addr.toUpperCase())
        .join(", ")})
    )
    SELECT (COALESCE("old_to_cex"."to_amount", 0) - COALESCE("old_from_cex"."from_amount", 0))
    as "oldCexSupply",
    COALESCE("current_cex_supply"."current_cex_supply", 0)
    as "currentCexSupply"
    FROM "old_from_cex"
    JOIN "old_to_cex" ON 1=1
    JOIN "current_cex_supply" ON 1=1;`);
  const cexCompare: CexSupplyQueryResult = queryResult
    .rows[0] as CexSupplyQueryResult;
  let changeRate;
  if (cexCompare.oldCexSupply === "0") {
    changeRate = "0";
  } else {
    changeRate = formatUnits(
      (BigInt(cexCompare.currentCexSupply) * BigInt(1e18)) /
        BigInt(cexCompare.oldCexSupply) -
        BigInt(1e18),
      18,
    );
  }
  return context.json({ ...cexCompare, changeRate });
});

ponder.get("/dao/:daoId/dex-supply/compare", async (context) => {
  const daoId = context.req.param("daoId");
  const days: string | undefined = context.req.query("days");
  if (!days) {
    throw new Error('Query param "days" is mandatory');
  }
  const oldTimestamp =
    BigInt(Date.now()) - BigInt(DaysEnum[days as unknown as DaysEnum]);
  const queryResult = await context.db.execute(sql`
    WITH "old_from_dex" as (
      SELECT SUM(t.amount) as "from_amount" 
      FROM "transfers" t 
      WHERE UPPER(t."from_account_id") IN (${Object.values(DEXAddresses)
        .map((addr) => addr.toUpperCase())
        .join(", ")})
      AND t."dao_id" = ${daoId}
      AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
    ),
    "old_to_dex" as (
      SELECT SUM(t.amount) as "to_amount" 
      FROM "transfers" t 
      WHERE UPPER(t."to_account_id") IN (${Object.values(DEXAddresses)
        .map((addr) => addr.toUpperCase())
        .join(", ")})
      AND t."dao_id" = ${daoId}
      AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
    ),
    "current_dex_supply" as (
      SELECT SUM(ab.balance) AS "current_dex_supply"
      FROM "account_balance" ab WHERE UPPER(ab."account_id") IN (${Object.values(
        DEXAddresses,
      )
        .map((addr) => addr.toUpperCase())
        .join(", ")})
    )
    SELECT (COALESCE("old_to_dex"."to_amount",0) - COALESCE("old_from_dex"."from_amount", 0))
    as "oldDexSupply",
    COALESCE("current_dex_supply"."current_dex_supply", 0)
    as "currentDexSupply"
    FROM "old_from_dex"
    JOIN "old_to_dex" ON 1=1
    JOIN "current_dex_supply" ON 1=1;`);
  const dexCompare: DexSupplyQueryResult = queryResult
    .rows[0] as DexSupplyQueryResult;
  let changeRate;
  if (dexCompare.oldDexSupply === "0") {
    changeRate = "0";
  } else {
    changeRate = formatUnits(
      (BigInt(dexCompare.currentDexSupply) * BigInt(1e18)) /
        BigInt(dexCompare.oldDexSupply) -
        BigInt(1e18),
      18,
    );
  }
  return context.json({ ...dexCompare, changeRate });
});

ponder.get("/dao/:daoId/lending-supply/compare", async (context) => {
  const daoId = context.req.param("daoId");
  const days: string | undefined = context.req.query("days");
  if (!days) {
    throw new Error('Query param "days" is mandatory');
  }
  const oldTimestamp =
    BigInt(Date.now()) - BigInt(DaysEnum[days as unknown as DaysEnum]);
  const queryResult = await context.db.execute(sql`
    WITH "old_from_lending" as (
      SELECT SUM(t.amount) as "from_amount" 
      FROM "transfers" t 
      WHERE UPPER(t."from_account_id") IN (${Object.values(LendingAddresses)
        .map((addr) => addr.toUpperCase())
        .join(", ")})
      AND t."dao_id" = ${daoId}
      AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
  ),
  "old_to_lending" as (
    SELECT SUM(t.amount) as "to_amount" 
    FROM "transfers" t 
    WHERE UPPER(t."to_account_id") IN (${Object.values(LendingAddresses)
      .map((addr) => addr.toUpperCase())
      .join(", ")})
    AND t."dao_id" = ${daoId}
    AND timestamp < ${BigInt(oldTimestamp.toString().slice(0, 10))}
  ),
  "current_lending_supply" as (
    SELECT SUM(ab.balance) AS "current_lending_supply"
    FROM "account_balance" ab WHERE UPPER(ab."account_id") IN (${Object.values(
      LendingAddresses,
    )
      .map((addr) => addr.toUpperCase())
      .join(", ")})
  )
  SELECT COALESCE(("old_to_lending"."to_amount" - "old_from_lending"."from_amount"),0)
  as "oldLendingSupply",
  COALESCE("current_lending_supply"."current_lending_supply", 0)
  as "currentLendingSupply"
  FROM "old_from_lending"
  JOIN "old_to_lending" ON 1=1
  JOIN "current_lending_supply" ON 1=1;
  `);
  const lendingCompare: LendingSupplyQueryResult = queryResult
    .rows[0] as LendingSupplyQueryResult;
  let changeRate;
  if (lendingCompare.oldLendingSupply === "0") {
    changeRate = "0";
  } else {
    changeRate = formatUnits(
      (BigInt(lendingCompare.currentLendingSupply) * BigInt(1e18)) /
        BigInt(lendingCompare.oldLendingSupply) -
        BigInt(1e18),
      18,
    );
  }
  return context.json({ ...lendingCompare, changeRate });
});
