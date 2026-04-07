import type { Address } from "viem";
import { getAddress } from "viem";
import type { handlerContext } from "../../../generated/index.js";

import { DaoIdEnum } from "../../lib/enums.ts";
import { MetricTypesEnum } from "../../lib/constants.ts";
import {
  AddressCollection,
  storeDailyBucket,
  toAddressSet,
} from "../shared.ts";

export const updateTotalSupply = async (
  context: handlerContext,
  addressList: AddressCollection,
  metricType: MetricTypesEnum,
  from: Address,
  to: Address,
  value: bigint,
  daoId: DaoIdEnum,
  tokenAddress: Address,
  timestamp: bigint,
) => {
  const normalizedAddressList = toAddressSet(addressList);
  const isToBurningAddress = normalizedAddressList.has(getAddress(to));
  const isFromBurningAddress = normalizedAddressList.has(getAddress(from));
  const isTotalSupplyTransaction =
    (isToBurningAddress || isFromBurningAddress) &&
    !(isToBurningAddress && isFromBurningAddress);

  if (isTotalSupplyTransaction) {
    const isBurningTokens = normalizedAddressList.has(getAddress(to));
    const tokenId = getAddress(tokenAddress);
    const token = await context.Token.get(tokenId);
    if (!token) return false;

    const currentTotalSupply = token.totalSupply;
    const newTotalSupply = isBurningTokens
      ? currentTotalSupply - value
      : currentTotalSupply + value;

    context.Token.set({ ...token, totalSupply: newTotalSupply });

    await storeDailyBucket(
      context,
      metricType,
      currentTotalSupply,
      newTotalSupply,
      daoId,
      timestamp,
      tokenAddress,
    );

    return true;
  }

  return false;
};
