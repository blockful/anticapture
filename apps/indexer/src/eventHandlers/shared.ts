import { Address, getAddress } from "viem";
import { Context } from "ponder:registry";
import { account, daoMetricsDayBucket } from "ponder:schema";

import { MetricTypesEnum } from "@/lib/constants";
import { delta, max, min } from "@/lib/utils";
import { truncateTimestampToMidnight } from "@/lib/date-helpers";

export type AddressCollection = readonly Address[] | ReadonlySet<Address>;

const normalizeAddressCollection = (
  addresses: AddressCollection,
): Address[] => {
  if (Array.isArray(addresses)) {
    return [...new Set(addresses.map((address) => getAddress(address)))];
  }

  return [...addresses];
};

export const createAddressSet = (
  addresses: readonly Address[],
): ReadonlySet<Address> =>
  new Set(addresses.map((address) => getAddress(address)));

export const toAddressSet = (
  addresses: AddressCollection,
): ReadonlySet<Address> => {
  if (Array.isArray(addresses)) {
    return new Set(addresses.map((address) => getAddress(address)));
  }

  return addresses as ReadonlySet<Address>;
};

export const ensureAccountExists = async (
  context: Context,
  address: Address,
): Promise<void> => {
  await context.db
    .insert(account)
    .values({
      id: getAddress(address),
    })
    .onConflictDoNothing();
};

/**
 * Helper function to ensure multiple accounts exist in parallel
 */
export const ensureAccountsExist = async (
  context: Context,
  addresses: Address[],
): Promise<void> => {
  const normalizedAddresses = normalizeAddressCollection(addresses);
  if (normalizedAddresses.length === 0) {
    return;
  }

  await context.db
    .insert(account)
    .values(normalizedAddresses.map((id) => ({ id })))
    .onConflictDoNothing();
};

export const storeDailyBucket = async (
  context: Context,
  metricType: MetricTypesEnum,
  currentValue: bigint,
  newValue: bigint,
  daoId: string,
  timestamp: bigint,
  tokenAddress: Address,
) => {
  const volume = delta(newValue, currentValue);
  await context.db
    .insert(daoMetricsDayBucket)
    .values({
      date: BigInt(truncateTimestampToMidnight(Number(timestamp))),
      tokenId: getAddress(tokenAddress),
      metricType,
      daoId,
      average: newValue,
      open: newValue,
      high: newValue,
      low: newValue,
      close: newValue,
      volume,
      count: 1,
      lastUpdate: timestamp,
    })
    .onConflictDoUpdate((row) => ({
      average:
        (row.average * BigInt(row.count) + newValue) / BigInt(row.count + 1),
      high: max(newValue, row.high),
      low: min(newValue, row.low),
      close: newValue,
      volume: row.volume + volume,
      count: row.count + 1,
      lastUpdate: timestamp,
    }));
};
