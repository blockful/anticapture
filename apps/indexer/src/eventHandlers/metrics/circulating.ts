import { Address } from "viem";
import { token } from "ponder:schema";
import { Context } from "ponder:registry";

import { storeDailyBucket } from "../shared";
import { MetricTypesEnum } from "@/lib/constants";

export const updateCirculatingSupply = async (
  context: Context,
  tokenData: {
    circulatingSupply: bigint;
    totalSupply: bigint;
    treasury: bigint;
  },
  metricType: MetricTypesEnum,
  daoId: string,
  tokenAddress: Address,
  timestamp: bigint,
) => {
  const currentCirculatingSupply = tokenData.circulatingSupply ?? BigInt(0);

  // Calculate circulating supply as total supply minus treasury
  const newCirculatingSupply = tokenData.totalSupply - tokenData.treasury;

  if (newCirculatingSupply !== currentCirculatingSupply) {
    await context.db.update(token, { id: tokenAddress }).set({
      circulatingSupply: newCirculatingSupply,
    });

    await storeDailyBucket(
      context,
      metricType,
      currentCirculatingSupply,
      newCirculatingSupply,
      daoId,
      timestamp,
      tokenAddress,
    );
  }
};
