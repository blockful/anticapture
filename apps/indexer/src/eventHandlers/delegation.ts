import { Context } from "ponder:registry";
import {
  accountBalance,
  accountPower,
  delegation,
  votingPowerHistory,
  token,
} from "ponder:schema";
import { Address, Hex, zeroAddress } from "viem";

import { MetricTypesEnum } from "@/lib/constants";
import {
  ensureAccountExists,
  ensureAccountsExist,
  storeDailyBucket,
} from "./shared";

export const delegateChanged = async (
  context: Context,
  daoId: string,
  args: {
    delegator: Address;
    toDelegate: Address;
    tokenId: Address;
    fromDelegate: Address;
    txHash: Hex;
    timestamp: bigint;
    logIndex: number;
  },
) => {
  const {
    delegator,
    toDelegate,
    tokenId,
    txHash,
    fromDelegate,
    timestamp,
    logIndex,
  } = args;

  // Ensure all required accounts exist in parallel
  await ensureAccountsExist(context, [delegator, toDelegate]);

  // Get the delegator's current balance
  const delegatorBalance = await context.db.find(accountBalance, {
    accountId: delegator,
    tokenId,
  });

  await context.db.insert(delegation).values({
    transactionHash: txHash,
    daoId,
    delegateAccountId: toDelegate,
    delegatorAccountId: delegator,
    delegatedValue: delegatorBalance?.balance ?? BigInt(0),
    previousDelegate: fromDelegate,
    timestamp,
    logIndex,
  });

  // Update the delegator's delegate
  await context.db
    .insert(accountBalance)
    .values({
      accountId: delegator,
      tokenId,
      delegate: toDelegate,
      balance: BigInt(0),
    })
    .onConflictDoUpdate({
      delegate: toDelegate,
    });

  // Update the old delegate's delegations count
  if (fromDelegate != zeroAddress) {
    await context.db
      .update(accountPower, {
        accountId: fromDelegate,
      })
      .set((row) => ({ delegationsCount: row.delegationsCount - 1 }));
  }

  // Update the delegate's delegations count
  await context.db
    .insert(accountPower)
    .values({
      accountId: toDelegate,
      daoId,
      delegationsCount: 1,
    })
    .onConflictDoUpdate((current) => ({
      delegationsCount: (current.delegationsCount ?? 0) + 1,
    }));
};

export const delegatedVotesChanged = async (
  context: Context,
  daoId: string,
  args: {
    tokenId: Address;
    delegate: Address;
    txHash: Hex;
    newBalance: bigint;
    oldBalance: bigint;
    timestamp: bigint;
    logIndex: number;
  },
) => {
  const {
    delegate,
    txHash,
    newBalance,
    oldBalance,
    timestamp,
    tokenId,
    logIndex,
  } = args;

  await ensureAccountExists(context, delegate);

  await context.db
    .insert(votingPowerHistory)
    .values({
      daoId,
      transactionHash: txHash,
      accountId: delegate,
      votingPower: newBalance,
      delta: newBalance - oldBalance,
      timestamp,
      logIndex: logIndex - 1,
    })
    .onConflictDoUpdate(() => ({
      votingPower: newBalance,
    }));

  // Update the delegate's voting power
  await context.db
    .insert(accountPower)
    .values({
      accountId: delegate,
      daoId,
      votingPower: newBalance,
    })
    .onConflictDoUpdate(() => ({
      votingPower: newBalance,
    }));

  const currentDelegatedSupply = (await context.db.find(token, {
    id: tokenId,
  }))!.delegatedSupply;

  // Update the delegated supply
  const newDelegatedSupply = (
    await context.db.update(token, { id: tokenId }).set((row) => ({
      delegatedSupply: row.delegatedSupply + (newBalance - oldBalance),
    }))
  ).delegatedSupply;

  const date = BigInt(
    new Date(parseInt(timestamp.toString() + "000")).setHours(0, 0, 0, 0) /
      1000,
  );

  // Store delegated supply on daily bucket
  await storeDailyBucket(
    context,
    MetricTypesEnum.DELEGATED_SUPPLY,
    currentDelegatedSupply,
    newDelegatedSupply,
    daoId,
    date,
    tokenId,
  );
};
