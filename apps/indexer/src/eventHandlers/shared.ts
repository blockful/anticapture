import { Address } from "viem";
import { Context } from "ponder:registry";
import { account, daoMetricsDayBucket, transaction } from "ponder:schema";

import { MetricTypesEnum } from "@/lib/constants";
import { delta, max, min } from "@/lib/utils";
import { DaoIdEnum } from "@/lib/enums";

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
  date: bigint,
  tokenAddress: Address,
) => {
  const volume = delta(newValue, currentValue);
  await context.db
    .insert(daoMetricsDayBucket)
    .values({
      date: truncateTimestampTime(date),
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
    })
    .onConflictDoUpdate((row) => ({
      average:
        (row.average * BigInt(row.count) + newValue) / BigInt(row.count + 1),
      high: max(newValue, row.high),
      low: min(newValue, row.low),
      close: newValue,
      volume: row.volume + volume,
      count: row.count + 1,
    }));
};

export const createOrUpdateTransaction = async (
  context: Context,
  daoId: DaoIdEnum,
  transactionHash: string,
  from: Address | null,
  to: Address | null,
  timestamp: bigint,
) => {
  if (!from || !to) {
    return;
  }

  await context.db
    .insert(transaction)
    .values({
      transactionHash,
      fromAddress: from,
      toAddress: to,
      isCex: false, // Will be updated by individual events
      isDex: false, // Will be updated by individual events
      isLending: false, // Will be updated by individual events
      isTotal: false, // Will be updated by individual events
      timestamp,
    })
    .onConflictDoNothing(); // Only create if doesn't exist
};

export const updateTransactionFlags = async (
  context: Context,
  daoId: DaoIdEnum,
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
  daoId: DaoIdEnum,
  transactionHash: string,
  from: Address | null,
  to: Address | null,
  timestamp: bigint,
  addresses: Address[], // The addresses involved in this event
) => {
  // Early return if we can't create a transaction record
  if (!from || !to) {
    return;
  }

  // Import address constants
  const { CEXAddresses, DEXAddresses, LendingAddresses, BurningAddresses } =
    await import("@/lib/constants");

  // First, create or update the transaction record
  await createOrUpdateTransaction(
    context,
    daoId,
    transactionHash,
    from,
    to,
    timestamp,
  );

  // Calculate transaction flags based on addresses
  const cexAddresses = Object.values(CEXAddresses[daoId] || {});
  const dexAddresses = Object.values(DEXAddresses[daoId] || {});
  const lendingAddresses = Object.values(LendingAddresses[daoId] || {});
  const burningAddresses = Object.values(BurningAddresses[daoId] || {});

  const isCex = addresses.some((addr) => cexAddresses.includes(addr));
  const isDex = addresses.some((addr) => dexAddresses.includes(addr));
  const isLending = addresses.some((addr) => lendingAddresses.includes(addr));
  const isTotal = addresses.some((addr) => burningAddresses.includes(addr));

  // Then, update the transaction flags
  await updateTransactionFlags(
    context,
    daoId,
    transactionHash,
    isCex,
    isDex,
    isLending,
    isTotal,
  );
};

const truncateTimestampTime = (timestampSeconds: bigint): bigint => {
  const SECONDS_IN_DAY = BigInt(86400); // 24 * 60 * 60
  return (timestampSeconds / SECONDS_IN_DAY) * SECONDS_IN_DAY;
};
