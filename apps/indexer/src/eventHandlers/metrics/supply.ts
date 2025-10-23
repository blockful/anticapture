import { Address } from "viem";
import { token } from "ponder:schema";
import { Context } from "ponder:registry";

import { storeDailyBucket } from "../shared";
import { MetricTypesEnum } from "@/lib/constants";

export const updateSupplyMetric = async (
  context: Context,
  supplyField: "lendingSupply" | "cexSupply" | "dexSupply" | "treasury",
  addressList: Address[],
  metricType: MetricTypesEnum,
  from: Address,
  to: Address,
  value: bigint,
  daoId: string,
  tokenAddress: Address,
  timestamp: bigint,
) => {
  const isToRelevant = addressList.includes(to);
  const isFromRelevant = addressList.includes(from);

  if ((isToRelevant || isFromRelevant) && !(isToRelevant && isFromRelevant)) {
    let currentSupply: bigint = 0n;

    const { [supplyField]: newSupply } = await context.db
      .update(token, { id: tokenAddress })
      .set((current) => {
        currentSupply = current[supplyField];
        return {
          [supplyField]: isToRelevant
            ? current[supplyField] + value
            : current[supplyField] - value,
        };
      });

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
