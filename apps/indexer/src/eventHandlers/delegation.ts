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
  createOrUpdateTransaction,
  updateTransactionFlags,
} from "./shared";
import { DaoIdEnum } from "@/lib/enums";
import {
  BurningAddresses,
  CEXAddresses,
  DEXAddresses,
  LendingAddresses,
} from "@/lib/constants";

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
    transactionFrom: Address;
    transactionTo: Address;
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
    transactionFrom,
    transactionTo,
    logIndex,
  } = args;

  // Ensure all required accounts exist in parallel
  await ensureAccountsExist(context, [delegator, toDelegate]);

  // Create or update transaction record with flags
  // Use transaction sender/recipient if provided, otherwise use delegator/delegate
  await createOrUpdateTransaction(
    context,
    daoId as DaoIdEnum,
    txHash,
    transactionFrom,
    transactionTo,
    timestamp,
  );

  // Get the delegator's current balance
  const delegatorBalance = await context.db.find(accountBalance, {
    accountId: delegator,
    tokenId,
  });

  // Pre-compute address lists for flag determination
  const lendingAddressList = Object.values(
    LendingAddresses[daoId as DaoIdEnum] || {},
  );
  const cexAddressList = Object.values(CEXAddresses[daoId as DaoIdEnum] || {});
  const dexAddressList = Object.values(DEXAddresses[daoId as DaoIdEnum] || {});
  const burningAddressList = Object.values(
    BurningAddresses[daoId as DaoIdEnum] || {},
  );

  // Determine flags for the delegation
  const isCex =
    cexAddressList.includes(delegator) || cexAddressList.includes(toDelegate);
  const isDex =
    dexAddressList.includes(delegator) || dexAddressList.includes(toDelegate);
  const isLending =
    lendingAddressList.includes(delegator) ||
    lendingAddressList.includes(toDelegate);
  const isBurning =
    burningAddressList.includes(delegator) ||
    burningAddressList.includes(toDelegate);
  const isTotal = isBurning;

  await context.db
    .insert(delegation)
    .values({
      transactionHash: txHash,
      daoId,
      delegateAccountId: toDelegate,
      delegatorAccountId: delegator,
      delegatedValue: delegatorBalance?.balance ?? 0n,
      previousDelegate: fromDelegate,
      timestamp,
      logIndex,
      isCex,
      isDex,
      isLending,
      isTotal,
    })
    .onConflictDoNothing();

  // Update transaction-level flags based on this delegation
  await updateTransactionFlags(
    context,
    daoId as DaoIdEnum,
    txHash,
    isCex,
    isDex,
    isLending,
    isTotal,
  );

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
    transactionFrom: Address;
    transactionTo: Address;
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
    transactionFrom,
    transactionTo,
    logIndex,
  } = args;

  await ensureAccountExists(context, delegate);

  // Validate daoId is a valid DaoIdEnum value
  if (!Object.values(DaoIdEnum).includes(daoId as DaoIdEnum)) {
    throw new Error(`Invalid daoId: ${daoId}`);
  }

  // Create or update transaction record with flags
  await createOrUpdateTransaction(
    context,
    daoId as DaoIdEnum,
    txHash,
    transactionFrom,
    transactionTo,
    timestamp,
  );

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
    .onConflictDoNothing();

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
