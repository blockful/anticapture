import {
  PriceEntry,
  DaoMetricsDayBucket,
  MultilineChartDataSetPoint,
} from "@/shared/dao-config/types";
import { TreasuryAssetData } from "@/features/attack-profitability/hooks";
import { formatUnits } from "viem";

/**
 * Calculates total treasury by combining:
 * 1. Liquid Treasury (from providers like Dune/DefiLlama)
 * 2. Gov Token Treasury Value = (gov token quantity × price)
 *
 * Formula: Total = Liquid Treasury + (Gov Tokens × Price)
 *
 */
export function calculateTotalTreasury(
  tokenPrices: PriceEntry[],
  key: string,
  liquidTreasuryData: TreasuryAssetData[],
  govTreasuryQuantities: DaoMetricsDayBucket[] = [],
  decimals: number,
): MultilineChartDataSetPoint[] {
  // Maps liquid treasury and gov token quantities by timestamp
  const liquidTreasuryMap = new Map(
    liquidTreasuryData.map((item) => [item.date, item.liquidTreasury]),
  );
  const govQuantitiesMap = new Map(
    govTreasuryQuantities.map((item) => [
      Number(item.date) * 1000,
      Number(formatUnits(BigInt(item.close), decimals)),
    ]),
  );

  let lastLiquidTreasury = 0;
  let lastGovQuantity = 0;

  return tokenPrices.map(({ timestamp, price }) => {
    // Get or forward-fill liquid treasury value
    const liquidTreasury =
      liquidTreasuryMap.get(timestamp) ?? lastLiquidTreasury;
    if (liquidTreasuryMap.has(timestamp)) {
      lastLiquidTreasury = liquidTreasury;
    }

    // Get or forward-fill gov token quantity
    const govTokenQuantity = govQuantitiesMap.get(timestamp) ?? lastGovQuantity;
    if (govQuantitiesMap.has(timestamp)) {
      lastGovQuantity = govTokenQuantity;
    }

    const govTokenValue = Number(price) * govTokenQuantity;

    return {
      date: timestamp,
      [key]: liquidTreasury + govTokenValue, // Total = Liquid + Gov Token Value
    };
  });
}
