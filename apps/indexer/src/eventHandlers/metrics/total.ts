import { Address } from "viem";
import { token } from "ponder:schema";
import { Context } from "ponder:registry";

import { DaoIdEnum } from "@/lib/enums";
import { MetricTypesEnum } from "@/lib/constants";
import { storeDailyBucket } from "@/eventHandlers/shared";

export const updateTotalSupply = async (
  context: Context,
  addressList: Address[],
  metricType: MetricTypesEnum,
  from: Address,
  to: Address,
  value: bigint,
  daoId: DaoIdEnum,
  tokenAddress: Address,
  timestamp: bigint,
) => {
  const isToBurningAddress = addressList.includes(to);
  const isFromBurningAddress = addressList.includes(from);
  const isTotalSupplyTransaction =
    (isToBurningAddress || isFromBurningAddress) &&
    !(isToBurningAddress && isFromBurningAddress);

  if (isTotalSupplyTransaction) {
    const isBurningTokens = addressList.includes(to);
    let currentTotalSupply = 0n;
    const newTotalSupply = (
      await context.db.update(token, { id: tokenAddress }).set((row) => {
        currentTotalSupply = row.totalSupply;
        return {
          totalSupply: isBurningTokens
            ? row.totalSupply - value
            : row.totalSupply + value,
        };
      })
    ).totalSupply;

    await storeDailyBucket(
      context,
      metricType,
      currentTotalSupply,
      newTotalSupply,
      daoId,
      timestamp,
      tokenAddress,
    );
  }
};
