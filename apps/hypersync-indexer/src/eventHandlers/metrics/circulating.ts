import type { Address } from "viem";
import { getAddress } from "viem";
import type { handlerContext } from "../../../generated/index.js";

import { storeDailyBucket } from "../shared.ts";
import { MetricTypesEnum } from "../../lib/constants.ts";

export const updateCirculatingSupply = async (
  context: handlerContext,
  daoId: string,
  tokenAddress: Address,
  timestamp: bigint,
) => {
  const tokenId = getAddress(tokenAddress);
  const token = await context.Token.get(tokenId);
  if (!token) return false;

  const currentCirculatingSupply = token.circulatingSupply;
  const newCirculatingSupply =
    token.totalSupply - token.treasury - token.nonCirculatingSupply;

  if (currentCirculatingSupply === newCirculatingSupply) return false;

  context.Token.set({ ...token, circulatingSupply: newCirculatingSupply });

  await storeDailyBucket(
    context,
    MetricTypesEnum.CIRCULATING_SUPPLY,
    currentCirculatingSupply,
    newCirculatingSupply,
    daoId,
    timestamp,
    tokenAddress,
  );

  return true;
};
