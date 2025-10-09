import { Address } from "viem";
import { Context } from "ponder:registry";
import { account, daoMetricsDayBucket, transaction } from "ponder:schema";

import { MetricTypesEnum } from "@/lib/constants";
import { delta, max, min } from "@/lib/utils";

export const ensureAccountExists = async (
  context: Context,
  address: Address,
): Promise<void> => {
  await context.db
    .insert(account)
    .values({
      id: address,
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
  await Promise.all(
    addresses.map((address) => ensureAccountExists(context, address)),
  );
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
      date: truncateTimestampTime(timestamp),
      tokenId: tokenAddress,
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

export const createOrUpdateTransaction = async (
  context: Context,
  transactionHash: string,
  from: Address,
  to: Address,
  timestamp: bigint,
) => {
  await context.db
    .insert(transaction)
    .values({
      transactionHash,
      fromAddress: from,
      toAddress: to,
      timestamp,
    })
    .onConflictDoNothing(); // Only create if doesn't exist
};

export const updateTransactionFlags = async (
  context: Context,
  transactionHash: string,
  isCex: boolean,
  isDex: boolean,
  isLending: boolean,
  isTotal: boolean,
) => {
  await context.db.update(transaction, { transactionHash }).set((existing) => ({
    // Use OR logic to accumulate flags from multiple events
    isCex: existing.isCex || isCex,
    isDex: existing.isDex || isDex,
    isLending: existing.isLending || isLending,
    isTotal: existing.isTotal || isTotal,
  }));
};

export const handleTransaction = async (
  context: Context,
  transactionHash: string,
  from: Address,
  to: Address,
  timestamp: bigint,
  addresses: Address[], // The addresses involved in this event
  {
    cex = [],
    dex = [],
    lending = [],
    burning = [],
  }: {
    cex?: Address[];
    dex?: Address[];
    lending?: Address[];
    burning?: Address[];
  } = {
    cex: [],
    dex: [],
    lending: [],
    burning: [],
  },
) => {
  await createOrUpdateTransaction(
    context,
    transactionHash,
    from,
    to,
    timestamp,
  );

  await updateTransactionFlags(
    context,
    transactionHash,
    addresses.some((addr) => cex.includes(addr)),
    addresses.some((addr) => dex.includes(addr)),
    addresses.some((addr) => lending.includes(addr)),
    addresses.some((addr) => burning.includes(addr)),
  );
};

const truncateTimestampTime = (timestampSeconds: bigint): bigint => {
  const SECONDS_IN_DAY = BigInt(86400); // 24 * 60 * 60
  return (timestampSeconds / SECONDS_IN_DAY) * SECONDS_IN_DAY;
};
