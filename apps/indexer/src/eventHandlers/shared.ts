import type { Address } from "viem";
import { getAddress } from "viem";
import type { handlerContext } from "../../generated/index.js";
import type { MetricType_t } from "../../generated/src/db/Enums.gen.ts";

import { MetricTypesEnum } from "../lib/constants.ts";
import { delta, max, min } from "../lib/utils.ts";
import { truncateTimestampToMidnight } from "../lib/date-helpers.ts";

const METRIC_TYPE_MAP: Record<MetricTypesEnum, MetricType_t> = {
  [MetricTypesEnum.TOTAL_SUPPLY]: "total",
  [MetricTypesEnum.DELEGATED_SUPPLY]: "delegated",
  [MetricTypesEnum.CEX_SUPPLY]: "cex",
  [MetricTypesEnum.DEX_SUPPLY]: "dex",
  [MetricTypesEnum.LENDING_SUPPLY]: "lending",
  [MetricTypesEnum.CIRCULATING_SUPPLY]: "circulating",
  [MetricTypesEnum.TREASURY]: "treasury",
  [MetricTypesEnum.NON_CIRCULATING_SUPPLY]: "non_circulating",
};

export type AddressCollection = readonly Address[] | ReadonlySet<Address>;

const normalizeAddressCollection = (
  addresses: AddressCollection,
): Address[] => {
  if (Array.isArray(addresses)) {
    return [...new Set(addresses.map((address) => getAddress(address)))];
  }

  return [...(addresses as ReadonlySet<Address>)];
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
  context: handlerContext,
  address: Address,
): Promise<void> => {
  await context.Account.getOrCreate({ id: getAddress(address) });
};

/**
 * Helper function to ensure multiple accounts exist
 */
export const ensureAccountsExist = async (
  context: handlerContext,
  addresses: Address[],
): Promise<void> => {
  const normalized = normalizeAddressCollection(addresses);
  if (normalized.length === 0) return;
  await Promise.all(
    normalized.map((id) => context.Account.getOrCreate({ id })),
  );
};

export const storeDailyBucket = async (
  context: handlerContext,
  metricType: MetricTypesEnum,
  currentValue: bigint,
  newValue: bigint,
  daoId: string,
  timestamp: bigint,
  tokenAddress: Address,
) => {
  const vol = delta(newValue, currentValue);
  const date = BigInt(truncateTimestampToMidnight(Number(timestamp)));
  const tokenId = getAddress(tokenAddress);
  const id = `${date}-${tokenId}-${metricType}`;

  const existing = await context.DaoMetricsDayBucket.get(id);
  if (existing) {
    context.DaoMetricsDayBucket.set({
      ...existing,
      average:
        (existing.average * BigInt(existing.count) + newValue) /
        BigInt(existing.count + 1),
      high: max(newValue, existing.high),
      low: min(newValue, existing.low),
      closeValue: newValue,
      volume: existing.volume + vol,
      count: existing.count + 1,
      lastUpdate: timestamp,
    });
  } else {
    context.DaoMetricsDayBucket.set({
      id,
      date,
      tokenId,
      metricType: METRIC_TYPE_MAP[metricType],
      daoId,
      average: newValue,
      openValue: newValue,
      high: newValue,
      low: newValue,
      closeValue: newValue,
      volume: vol,
      count: 1,
      lastUpdate: timestamp,
    });
  }
};

export const handleTransaction = async (
  context: handlerContext,
  transactionHash: string,
  from: Address,
  to: Address,
  timestamp: bigint,
  addresses: AddressCollection,
  {
    cex = [],
    dex = [],
    lending = [],
    burning = [],
  }: {
    cex?: AddressCollection;
    dex?: AddressCollection;
    lending?: AddressCollection;
    burning?: AddressCollection;
  } = {},
) => {
  const normalizedAddresses = normalizeAddressCollection(addresses);
  const normalizedCex = toAddressSet(cex);
  const normalizedDex = toAddressSet(dex);
  const normalizedLending = toAddressSet(lending);
  const normalizedBurning = toAddressSet(burning);

  const isCex = normalizedAddresses.some((addr) => normalizedCex.has(addr));
  const isDex = normalizedAddresses.some((addr) => normalizedDex.has(addr));
  const isLending = normalizedAddresses.some((addr) =>
    normalizedLending.has(addr),
  );
  const isTotal = normalizedAddresses.some((addr) =>
    normalizedBurning.has(addr),
  );

  if (!(isCex || isDex || isLending || isTotal)) {
    return;
  }

  const existing = await context.Transaction.get(transactionHash);
  context.Transaction.set({
    id: transactionHash,
    transactionHash,
    fromAddress: getAddress(from),
    toAddress: getAddress(to),
    timestamp,
    isCex: (existing?.isCex ?? false) || isCex,
    isDex: (existing?.isDex ?? false) || isDex,
    isLending: (existing?.isLending ?? false) || isLending,
    isTotal: (existing?.isTotal ?? false) || isTotal,
  });
};
