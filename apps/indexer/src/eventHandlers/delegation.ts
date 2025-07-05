import { Context, Event } from "ponder:registry";
import {
  account,
  accountBalance,
  accountPower,
  delegation,
  votingPowerHistory,
  daoMetricsDayBucket,
  token,
} from "ponder:schema";
import { Address, zeroAddress } from "viem";

import {
  getValueFromEventArgs,
  delta,
  max,
  min,
} from "@/lib/utils";
import { MetricTypesEnum } from "@/lib/constants";
import {
  DaoDelegateChangedEvent,
  DaoDelegateVotesChangedEvent,
} from "@/indexer/types";

/**
 * Helper function to ensure an account exists in the database
 * Verifies address type and inserts account if it doesn't exist
 */
// TODO: Decouple this to be used also in transfer.ts
const ensureAccountExists = async (
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
const ensureAccountsExist = async (
  context: Context,
  addresses: Address[],
): Promise<void> => {
  await Promise.all(
    addresses.map((address) => ensureAccountExists(context, address)),
  );
};

const storeDailyBucket = async (
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

export const delegateChanged = async (
  event: DaoDelegateChangedEvent,
  context: Context,
  daoId: string,
) => {
  // Ensure all required accounts exist in parallel
  await ensureAccountsExist(context, [
    event.args.delegator,
    event.args.toDelegate,
  ]);

  // Get the delegator's current balance
  const delegatorBalance = await context.db.find(accountBalance, {
    accountId: event.args.delegator,
    tokenId: event.log.address,
  });

  const delegatedValue = delegatorBalance?.balance ?? BigInt(0);

  // Create a new delegation record
  await context.db.insert(delegation).values({
    transactionHash: event.transaction.hash,
    daoId,
    delegateAccountId: event.args.toDelegate,
    delegatorAccountId: event.args.delegator,
    delegatedValue,
    previousDelegate: event.args.fromDelegate,
    timestamp: event.block.timestamp,
  });

  // Update the delegator's delegate
  await context.db
    .insert(accountBalance)
    .values({
      accountId: event.args.delegator,
      tokenId: event.log.address,
      delegate: event.args.toDelegate,
      balance: BigInt(0),
    })
    .onConflictDoUpdate({
      delegate: event.args.toDelegate,
    });

  // Update the old delegate's delegations count
  if (event.args.fromDelegate != zeroAddress) {
    await context.db
      .update(accountPower, {
        accountId: event.args.fromDelegate,
      })
      .set((row) => ({ delegationsCount: row.delegationsCount - 1 }));
  }

  // Update the delegate's delegations count
  await context.db
    .insert(accountPower)
    .values({
      accountId: event.args.toDelegate,
      daoId,
      delegationsCount: 1,
    })
    .onConflictDoUpdate((current) => ({
      delegationsCount: (current.delegationsCount ?? 0) + 1,
    }));
};

export const delegatedVotesChanged = async (
  event: DaoDelegateVotesChangedEvent,
  context: Context,
  daoId: string,
) => {
  // Ensure delegate account exists
  await ensureAccountExists(context, event.args.delegate);

  const newBalance = getValueFromEventArgs<bigint, (typeof event)["args"]>(
    [
      { name: "newBalance", daos: ["ENS", "COMP", "UNI"] },
      { name: "newVotes", daos: ["SHU"] },
    ],
    event.args,
    daoId,
  );

  const oldBalance = getValueFromEventArgs<bigint, (typeof event)["args"]>(
    [
      { name: "previousBalance", daos: ["ENS", "COMP", "UNI"] },
      { name: "previousVotes", daos: ["SHU"] },
    ],
    event.args,
    daoId,
  );

  await context.db
    .insert(votingPowerHistory)
    .values({
      daoId,
      transactionHash: event.transaction.hash,
      accountId: event.args.delegate,
      votingPower: newBalance,
      timestamp: event.block.timestamp,
    })
    .onConflictDoUpdate(() => ({
      votingPower: newBalance,
    }));

  // Update the delegate's voting power
  await context.db
    .insert(accountPower)
    .values({
      accountId: event.args.delegate,
      daoId,
      votingPower: newBalance,
    })
    .onConflictDoUpdate(() => ({
      votingPower: newBalance,
    }));

  const currentDelegatedSupply = (await context.db.find(token, {
    id: event.log.address,
  }))!.delegatedSupply;

  // Update the delegated supply
  const newDelegatedSupply = (
    await context.db.update(token, { id: event.log.address }).set((row) => ({
      delegatedSupply: row.delegatedSupply + (newBalance - oldBalance),
    }))
  ).delegatedSupply;

  // Store delegated supply on daily bucket
  await storeDailyBucket(
    context,
    event,
    MetricTypesEnum.DELEGATED_SUPPLY,
    currentDelegatedSupply,
    newDelegatedSupply,
    daoId,
  );
};
