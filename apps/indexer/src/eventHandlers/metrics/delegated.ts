import { Address } from "viem";
import { token } from "ponder:schema";
import { Context } from "ponder:registry";

import { DaoIdEnum } from "@/lib/enums";
import { MetricTypesEnum } from "@/lib/constants";
import { storeDailyBucket } from "@/eventHandlers/shared";

export const updateDelegatedSupply = async (
  context: Context,
  daoId: DaoIdEnum,
  tokenId: Address,
  amount: bigint,
  timestamp: bigint,
) => {
  let currentDelegatedSupply = 0n;

  // TODO is token.delegatedSupply the same as the last dailyMetric.delegatedSupply?

  const { delegatedSupply: newDelegatedSupply } = await context.db
    .update(token, { id: tokenId })
    .set((current) => {
      currentDelegatedSupply = current.delegatedSupply;
      return {
        delegatedSupply: current.delegatedSupply + amount,
      };
    });

  await storeDailyBucket(
    context,
    MetricTypesEnum.DELEGATED_SUPPLY,
    currentDelegatedSupply,
    newDelegatedSupply,
    daoId,
    timestamp,
    tokenId,
  );
};
