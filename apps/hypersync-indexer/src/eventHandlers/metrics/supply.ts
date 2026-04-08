import type { Address } from "viem";
import { getAddress } from "viem";
import type { handlerContext } from "../../../generated/index.js";

import {
  AddressCollection,
  storeDailyBucket,
  toAddressSet,
} from "../shared.ts";
import { MetricTypesEnum } from "../../lib/constants.ts";

export const updateSupplyMetric = async (
  context: handlerContext,
  supplyField:
    | "lendingSupply"
    | "cexSupply"
    | "dexSupply"
    | "treasury"
    | "nonCirculatingSupply",
  addressList: AddressCollection,
  metricType: MetricTypesEnum,
  from: Address,
  to: Address,
  value: bigint,
  daoId: string,
  tokenAddress: Address,
  timestamp: bigint,
) => {
  const normalizedAddressList = toAddressSet(addressList);
  const isToRelevant = normalizedAddressList.has(getAddress(to));
  const isFromRelevant = normalizedAddressList.has(getAddress(from));

  if ((isToRelevant || isFromRelevant) && !(isToRelevant && isFromRelevant)) {
    const tokenId = getAddress(tokenAddress);
    const token = await context.Token.get(tokenId);
    if (!token) return false;

    const currentSupply = token[supplyField];
    const newSupply = isToRelevant
      ? currentSupply + value
      : currentSupply - value;

    context.Token.set({ ...token, [supplyField]: newSupply });

    await storeDailyBucket(
      context,
      metricType,
      currentSupply,
      newSupply,
      daoId,
      timestamp,
      tokenAddress,
    );

    return true;
  }

  return false;
};
