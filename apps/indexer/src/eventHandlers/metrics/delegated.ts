import { Address } from "viem";
import { token } from "ponder:schema";
import { Context } from "ponder:registry";

import { DaoIdEnum } from "@/lib/enums";
import { MetricTypesEnum } from "@/lib/constants";
import { storeDailyBucket } from "@/eventHandlers/shared";

export const updateDelegatedSupply = async (
  context: Context,
  daoId: DaoIdEnum,
  args: {
    tokenId: Address;
    newBalance: bigint;
    oldBalance: bigint;
    timestamp: bigint;
  },
) => {
  const { tokenId, newBalance, oldBalance, timestamp } = args;

  const currentDelegatedSupply = (await context.db.find(token, {
    id: tokenId,
  }))!.delegatedSupply;

  // Update the delegated supply
  const newDelegatedSupply = (
    await context.db.update(token, { id: tokenId }).set((row) => ({
      delegatedSupply: row.delegatedSupply + (newBalance - oldBalance),
    }))
  ).delegatedSupply;

  // Store delegated supply on daily bucket
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
