import { Address, getAddress } from "viem";
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
  const normalizedAddressList = addressList.map(getAddress);
  const isToRelevant = normalizedAddressList.includes(getAddress(to));
  const isFromRelevant = normalizedAddressList.includes(getAddress(from));

  if ((isToRelevant || isFromRelevant) && !(isToRelevant && isFromRelevant)) {
    let currentSupply: bigint = 0n;

    const { [supplyField]: newSupply } = await context.db
      .update(token, { id: getAddress(tokenAddress) })
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
