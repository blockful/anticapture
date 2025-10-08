import { Address } from "viem";
import { token } from "ponder:schema";
import { Context } from "ponder:registry";

import { storeDailyBucket } from "../shared";
import { MetricTypesEnum } from "@/lib/constants";

export const updateSupplyMetric = async (
  context: Context,
  tokenData: {
    lendingSupply: bigint;
    cexSupply: bigint;
    dexSupply: bigint;
    treasury: bigint;
  },
  supplyField: keyof typeof tokenData,
  addressList: Address[],
  metricType: MetricTypesEnum,
  from: Address,
  to: Address,
  value: bigint,
  daoId: string,
  tokenAddress: Address,
  timestamp: bigint,
) => {
  const currentSupply = tokenData[supplyField] ?? BigInt(0);
  const isToRelevant = addressList.includes(to);
  const isFromRelevant = addressList.includes(from);

  if ((isToRelevant || isFromRelevant) && !(isToRelevant && isFromRelevant)) {
    const updateObject = {} as Record<string, bigint>;
    updateObject[supplyField] = isToRelevant
      ? tokenData[supplyField] + value
      : tokenData[supplyField] - value;

    const newSupply = (
      await context.db
        .update(token, { id: tokenAddress })
        .set(() => updateObject)
    )[supplyField];

    await storeDailyBucket(
      context,
      metricType,
      currentSupply,
      newSupply,
      daoId,
      timestamp,
      tokenAddress,
    );
  }
};
