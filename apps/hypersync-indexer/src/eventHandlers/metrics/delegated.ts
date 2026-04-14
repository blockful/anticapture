import type { Address } from "viem";
import { getAddress } from "viem";
import type { handlerContext } from "../../../generated/index.js";

import { DaoIdEnum } from "../../lib/enums.ts";
import { MetricTypesEnum } from "../../lib/constants.ts";
import { storeDailyBucket } from "../shared.ts";

export const updateDelegatedSupply = async (
  context: handlerContext,
  daoId: DaoIdEnum,
  tokenId: Address,
  amount: bigint,
  timestamp: bigint,
) => {
  const normalizedId = getAddress(tokenId);
  const token = await context.Token.get(normalizedId);
  if (!token) return;

  const currentDelegatedSupply = token.delegatedSupply;
  const newDelegatedSupply = currentDelegatedSupply + amount;

  context.Token.set({ ...token, delegatedSupply: newDelegatedSupply });

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
