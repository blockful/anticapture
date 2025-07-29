import { Address } from "viem";
import { Context } from "ponder:registry";
import { account, daoMetricsDayBucket, transaction } from "ponder:schema";

import { MetricTypesEnum } from "@/lib/constants";
import { delta, max, min } from "@/lib/utils";
import { 
  BurningAddresses, 
  CEXAddresses, 
  DEXAddresses, 
  LendingAddresses, 
  TREASURY_ADDRESSES 
} from "@/lib/constants";
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
      date,
      tokenId: tokenAddress,
      metricType,
      daoId,
      average: newValue,
      open: currentValue,
      high: max(newValue, currentValue),
      low: min(newValue, currentValue),
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
  value: bigint = 0n,
) => {
  if (!from || !to) {
    return;
  }

  // Get address lists for the specific DAO
  const cexAddresses = Object.values(CEXAddresses[daoId] || {});
  const dexAddresses = Object.values(DEXAddresses[daoId] || {});
  const lendingAddresses = Object.values(LendingAddresses[daoId] || {});
  const treasuryAddresses = Object.values(TREASURY_ADDRESSES[daoId] || {});
  const burningAddresses = Object.values(BurningAddresses[daoId] || {});

  // Determine flags
  const isCex = cexAddresses.includes(from) || cexAddresses.includes(to);
  const isDex = dexAddresses.includes(from) || dexAddresses.includes(to);
  const isLending = lendingAddresses.includes(from) || lendingAddresses.includes(to);
  const isTreasury = treasuryAddresses.includes(from) || treasuryAddresses.includes(to);
  const isBurning = burningAddresses.includes(from) || burningAddresses.includes(to);
  
  // Determine isTotal flag - true if it's a burning transaction (affects total supply)
  const isTotal = isBurning;
  
  // Determine isCirculating flag - true if it affects circulating supply
  // Circulating supply is affected by treasury and burning transactions
  const isCirculating = isTreasury || isBurning;

  await context.db
    .insert(transaction)
    .values({
      transactionHash,
      fromAddress: from,
      toAddress: to,
      value,
      isCex,
      isDex,
      isLending,
      isTreasury,
      isBurning,
      isTotal,
      isCirculating,
      timestamp,
    })
    .onConflictDoUpdate((existing) => ({
      // Use OR logic to preserve existing true flags
      isCex: existing.isCex || isCex,
      isDex: existing.isDex || isDex,
      isLending: existing.isLending || isLending,
      isTreasury: existing.isTreasury || isTreasury,
      isBurning: existing.isBurning || isBurning,
      isTotal: existing.isTotal || isTotal,
      isCirculating: existing.isCirculating || isCirculating,
      value: value,
      timestamp: timestamp,
    }));
};
