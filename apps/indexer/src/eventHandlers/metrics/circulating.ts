import { Address } from "viem";
import { token } from "ponder:schema";
import { Context } from "ponder:registry";

import { storeDailyBucket } from "../shared";
import { MetricTypesEnum } from "@/lib/constants";

export const updateCirculatingSupply = async (
  context: Context,
  metricType: MetricTypesEnum,
  daoId: string,
  tokenAddress: Address,
  timestamp: bigint,
) => {
  let currentCirculatingSupply = 0n;
  let newCirculatingSupply = 0n;
  await context.db.update(token, { id: tokenAddress }).set((current) => {
    currentCirculatingSupply = current.circulatingSupply;
    newCirculatingSupply = current.totalSupply - current.treasury;
    return {
      circulatingSupply: newCirculatingSupply,
    };
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
};
