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
import { MetricTypesEnum } from "@/lib/constants";

ponder.get("/dao/:daoId/total-supply/compare", async (context) => {
  //Handling req query and params
  const daoId = context.req.param("daoId");
  const days: string | undefined = context.req.query("days");
  if (!days) {
    throw new Error('Query param "days" is mandatory');
  }
  //Creating Timestamp
  const oldTimestamp =
    BigInt(Date.now()) - BigInt(DaysEnum[days as unknown as DaysEnum]);

  //Running Query
  const queryResult = await context.db.execute(sql`         
  WITH  "old_total_supply" as (
    SELECT db.average as old_total_supply_amount from "dao_metrics_day_buckets" db 
    WHERE db.dao_id=${daoId} 
    AND db."metricType"=${MetricTypesEnum.TOTAL_SUPPLY}
    AND db."date">=TO_TIMESTAMP(${oldTimestamp}::bigint / 1000)::DATE
    ORDER BY db."date" ASC LIMIT 1
  ),
 "current_total_supply"  AS (
    SELECT db.average as current_total_supply_amount from "dao_metrics_day_buckets" db 
    WHERE db.dao_id=${daoId} 
    AND db."metricType"=${MetricTypesEnum.TOTAL_SUPPLY}
    ORDER BY db."date" DESC LIMIT 1
  )
  SELECT COALESCE("old_total_supply"."old_delegated_supply_amount",0) AS "oldTotalupply", 
  COALESCE("current_total_supply"."current_delegated_supply_amount", 0) AS "currentTotalSupply"
  FROM "current_total_supply"
  LEFT JOIN "old_total_supply" ON 1=1;`);
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
  //Handling req query and params
  const daoId = context.req.param("daoId");
  const days: string | undefined = context.req.query("days");
  if (!days) {
    throw new Error('Query param "days" is mandatory');
  }
  //Creating Timestamp
  const oldTimestamp =
    BigInt(Date.now()) - BigInt(DaysEnum[days as unknown as DaysEnum]);

  //Running Query
  const queryResult = await context.db.execute(sql`
  WITH  "old_delegated_supply" as (
    SELECT db.average as old_delegated_supply_amount from "dao_metrics_day_buckets" db 
    WHERE db.dao_id=${daoId} 
    AND db."metricType"=${MetricTypesEnum.DELEGATED_SUPPLY}
    AND db."date">=TO_TIMESTAMP(${oldTimestamp}::bigint / 1000)::DATE
    ORDER BY db."date" ASC LIMIT 1
  ),
 "current_delegated_supply"  AS (
    SELECT db.average as current_delegated_supply_amount from "dao_metrics_day_buckets" db 
    WHERE db.dao_id=${daoId} 
    AND db."metricType"=${MetricTypesEnum.DELEGATED_SUPPLY}
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
      18,
    );
  }
  return context.json({ ...delegatedSupplyCompare, changeRate });
});

ponder.get("/dao/:daoId/circulating-supply/compare", async (context) => {
  //Handling req query and params
  const daoId = context.req.param("daoId");
  const days: string | undefined = context.req.query("days");
  if (!days) {
    throw new Error('Query param "days" is mandatory');
  }
  //Creating Timestamp
  const oldTimestamp =
    BigInt(Date.now()) - BigInt(DaysEnum[days as unknown as DaysEnum]);

  //Running Query
  const queryResult = await context.db.execute(sql`
    WITH  "old_supply" as (
      SELECT db.average as old_supply_amount from "dao_metrics_day_buckets" db 
      WHERE db.dao_id=${daoId} 
      AND db.metric_type=${MetricTypesEnum.CIRCULATING_SUPPLY}
      AND db."date">=TO_TIMESTAMP(${oldTimestamp}::bigint / 1000)::DATE
      ORDER BY db."date" ASC LIMIT 1
    ),
   "current_supply"  AS (
      SELECT db.average as current_supply_amount from "dao_metrics_day_buckets" db 
      WHERE db.dao_id=${daoId} 
      AND db.metric_type=${MetricTypesEnum.CIRCULATING_SUPPLY}
      ORDER BY db."date" DESC LIMIT 1
    )
    SELECT COALESCE("old_supply"."old_supply_amount",0) AS "oldCirculatingSupply", 
    COALESCE("current_supply"."current_supply_amount", 0) AS "currentCirculatingSupply"
    FROM "current_supply"
    LEFT JOIN "old_supply" ON 1=1;
        `);
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
  //Handling req query and params
  const daoId = context.req.param("daoId");
  const days: string | undefined = context.req.query("days");
  if (!days) {
    throw new Error('Query param "days" is mandatory');
  }
  //Creating Timestamp
  const oldTimestamp =
    BigInt(Date.now()) - BigInt(DaysEnum[days as unknown as DaysEnum]);

  //Running Query
  const queryResult = await context.db.execute(sql`
    WITH  "old_treasury" as (
      SELECT db.average as old_supply_amount from "dao_metrics_day_buckets" db 
      WHERE db.dao_id=${daoId} 
      AND db.metric_type=${MetricTypesEnum.TREASURY}
      AND db."date">=TO_TIMESTAMP(${oldTimestamp}::bigint / 1000)::DATE
      ORDER BY db."date" ASC LIMIT 1
    ),
   "current_treasury"  AS (
      SELECT db.average as current_supply_amount from "dao_metrics_day_buckets" db 
      WHERE db.dao_id=${daoId} 
      AND db.metric_type=${MetricTypesEnum.TREASURY}
      ORDER BY db."date" DESC LIMIT 1
    )
    SELECT COALESCE("old_treasury"."old_supply_amount",0) AS "oldTreasury", 
    COALESCE("current_treasury"."current_supply_amount", 0) AS "currentTreasury"
    FROM "current_treasury"
    LEFT JOIN "old_treasury" ON 1=1;
  `);

  //Calculating Change Rate
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
  // Returning response
  return context.json({ ...treasuryCompare, changeRate });
});

ponder.get("/dao/:daoId/cex-supply/compare", async (context) => {
  //Handling req query and params
  const daoId = context.req.param("daoId");
  const days: string | undefined = context.req.query("days");
  if (!days) {
    throw new Error('Query param "days" is mandatory');
  }
  //Creating Timestamp
  const oldTimestamp =
    BigInt(Date.now()) - BigInt(DaysEnum[days as unknown as DaysEnum]);

  //Running Query
  const queryResult = await context.db.execute(sql`
  WITH  "old_cex_supply" as (
    SELECT db.average as old_cex_supply_amount from "dao_metrics_day_buckets" db 
    WHERE db.dao_id=${daoId} 
    AND db.metric_type=${MetricTypesEnum.CEX_SUPPLY}
    AND db."date">=TO_TIMESTAMP(${oldTimestamp}::bigint / 1000)::DATE
    ORDER BY db."date" ASC LIMIT 1
  ),
 "current_cex_supply"  AS (
    SELECT db.average as current_cex_supply_amount from "dao_metrics_day_buckets" db 
    WHERE db.dao_id=${daoId} 
    AND db.metric_type=${MetricTypesEnum.CEX_SUPPLY}
    ORDER BY db."date" DESC LIMIT 1
  )
  SELECT COALESCE("old_cex_supply"."old_cex_supply_amount",0) AS "oldCexSupply", 
  COALESCE("current_cex_supply"."current_cex_supply_amount", 0) AS "currentCexSupply"
  FROM "current_cex_supply"
  LEFT JOIN "old_cex_supply" ON 1=1;
`);

  //Calculating Change Rate
  const cexSupplyCompare: CexSupplyQueryResult = queryResult
    .rows[0] as CexSupplyQueryResult;
  let changeRate;
  if (cexSupplyCompare.oldCexSupply === "0") {
    changeRate = "0";
  } else {
    changeRate = formatUnits(
      (BigInt(cexSupplyCompare.currentCexSupply) * BigInt(1e18)) /
        BigInt(cexSupplyCompare.oldCexSupply) -
        BigInt(1e18),
      18,
    );
  }

  // Returning response
  return context.json({ ...cexSupplyCompare, changeRate });
});

ponder.get("/dao/:daoId/dex-supply/compare", async (context) => {
  //Handling req query and params
  const daoId = context.req.param("daoId");
  const days: string | undefined = context.req.query("days");
  if (!days) {
    throw new Error('Query param "days" is mandatory');
  }
  //Creating Timestamp
  const oldTimestamp =
    BigInt(Date.now()) - BigInt(DaysEnum[days as unknown as DaysEnum]);

  //Running Query
  const queryResult = await context.db.execute(sql`
    WITH  "old_supply" as (
      SELECT db.average as old_supply_amount from "dao_metrics_day_buckets" db 
      WHERE db.dao_id=${daoId} 
      AND db.metric_type=${MetricTypesEnum.DEX_SUPPLY}
      AND db."date">=TO_TIMESTAMP(${oldTimestamp}::bigint / 1000)::DATE
      ORDER BY db."date" ASC LIMIT 1
    ),
   "current_supply"  AS (
      SELECT db.average as current_supply_amount from "dao_metrics_day_buckets" db 
      WHERE db.dao_id=${daoId} 
      AND db.metric_type=${MetricTypesEnum.DEX_SUPPLY}
      ORDER BY db."date" DESC LIMIT 1
    )
    SELECT COALESCE("old_supply"."old_supply_amount",0) AS "oldDexSupply", 
    COALESCE("current_supply"."current_supply_amount", 0) AS "currentDexSupply"
    FROM "current_supply"
    LEFT JOIN "old_supply" ON 1=1;
  `);

  //Calculating Change Rate
  const dexSupplyCompare: DexSupplyQueryResult = queryResult
    .rows[0] as DexSupplyQueryResult;
  let changeRate;
  if (dexSupplyCompare.oldDexSupply === "0") {
    changeRate = "0";
  } else {
    changeRate = formatUnits(
      (BigInt(dexSupplyCompare.currentDexSupply) * BigInt(1e18)) /
        BigInt(dexSupplyCompare.oldDexSupply) -
        BigInt(1e18),
      18,
    );
  }

  // Returning response
  return context.json({ ...dexSupplyCompare, changeRate });
});

ponder.get("/dao/:daoId/lending-supply/compare", async (context) => {
  //Handling req query and params
  const daoId = context.req.param("daoId");
  const days: string | undefined = context.req.query("days");
  if (!days) {
    throw new Error('Query param "days" is mandatory');
  }
  //Creating Timestamp
  const oldTimestamp =
    BigInt(Date.now()) - BigInt(DaysEnum[days as unknown as DaysEnum]);

  //Running Query
  const queryResult = await context.db.execute(sql`
  WITH  "old_lending_supply" as (
    SELECT db.average as "old_lending_supply_amount" from "dao_metrics_day_buckets" db 
    WHERE db.dao_id=${daoId} 
    AND db."metricType"=${MetricTypesEnum.LENDING_SUPPLY}
    AND db."date">=TO_TIMESTAMP(${oldTimestamp}::bigint / 1000)::DATE
    ORDER BY db."date" ASC LIMIT 1
  ),
 "current_lending_supply"  AS (
    SELECT db.average as current_lending_supply_amount from "dao_metrics_day_buckets" db 
    WHERE db.dao_id=${daoId} 
    AND db."metricType"=${MetricTypesEnum.LENDING_SUPPLY}
    ORDER BY db."date" DESC LIMIT 1
  )
  SELECT COALESCE("old_lending_supply"."old_lending_supply_amount",0) AS "oldLendingSupply", 
  COALESCE("current_lending_supply"."current_lending_supply_amount", 0) AS "currentLendingSupply"
  FROM "current_lending_supply"
  LEFT JOIN "old_lending_supply" ON 1=1;
  `);

  //Calculating Change Rate
  const lendingSupplyCompare: LendingSupplyQueryResult = queryResult
    .rows[0] as LendingSupplyQueryResult;
  let changeRate;
  if (lendingSupplyCompare.oldLendingSupply === "0") {
    changeRate = "0";
  } else {
    changeRate = formatUnits(
      (BigInt(lendingSupplyCompare.currentLendingSupply) * BigInt(1e18)) /
        BigInt(lendingSupplyCompare.oldLendingSupply) -
        BigInt(1e18),
      18,
    );
  }
  // Returning response
  return context.json({ ...lendingSupplyCompare, changeRate });
});
