import { Address } from "viem";
import { Context, Event } from "ponder:registry";
import { account, daoMetricsDayBucket } from "ponder:schema";

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
  event: Event,
  metricType: MetricTypesEnum,
  currentValue: bigint,
  newValue: bigint,
  daoId: string,
) => {
  const volume = delta(newValue, currentValue);
  const dayStartTimestampInSeconds =
    new Date(parseInt(event.block.timestamp.toString() + "000")).setHours(
      0,
      0,
      0,
      0,
    ) / 1000;
  await context.db
    .insert(daoMetricsDayBucket)
    .values({
      date: BigInt(dayStartTimestampInSeconds),
      tokenId: event.log.address,
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
      high: max(newValue, row.low),
      low: min(newValue, row.low),
      close: newValue,
      volume: row.volume + volume,
      count: row.count + 1,
    }));
};
