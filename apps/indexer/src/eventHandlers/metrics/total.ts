import { Address, getAddress } from "viem";
import { token } from "ponder:schema";
import { Context } from "ponder:registry";

import { DaoIdEnum } from "@/lib/enums";
import { MetricTypesEnum } from "@/lib/constants";
import {
  AddressCollection,
  storeDailyBucket,
  toAddressSet,
} from "@/eventHandlers/shared";

export const updateTotalSupply = async (
  context: Context,
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
    let currentTotalSupply = 0n;
    const newTotalSupply = (
      await context.db
        .update(token, { id: getAddress(tokenAddress) })
        .set((row) => {
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

    return true;
  }

  return false;
};
