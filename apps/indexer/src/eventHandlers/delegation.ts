import { Context } from "ponder:registry";
import {
  accountBalance,
  accountPower,
  delegation,
  votingPowerHistory,
  token,
} from "ponder:schema";
import { Address, Hex } from "viem";

import { MetricTypesEnum } from "@/lib/constants";
import {
  ensureAccountExists,
  ensureAccountsExist,
  storeDailyBucket,
} from "./shared";
import { DaoIdEnum } from "@/lib/enums";
import {
  BurningAddresses,
  CEXAddresses,
  DEXAddresses,
  LendingAddresses,
} from "@/lib/constants";

/**
 * ### Creates:
 * - New `Account` records (for delegator and delegate if they don't exist)
 * - New `Delegation` record with calculated delegated value and flags
 * - New `AccountBalance` record (if delegator doesn't have one for this token)
 * - New `AccountPower` record (if delegate doesn't have one for this DAO)
 * - New `Transaction` record (if this transaction hasn't been processed)
 *
 * ### Updates:
 * - `Delegation`: Adds to existing delegated value if record already exists
 * - `AccountBalance`: Changes the delegate assignment for the delegator
 * - `AccountPower`: Increments the delegate's delegation count
 * - `Transaction`: Updates transaction flags if record already exists
 */
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
    .onConflictDoUpdate((current) => ({
      delegatedValue:
        current.delegatedValue + (delegatorBalance?.balance ?? 0n),
    }));

  // Transaction flag updates moved to DAO-specific indexer

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

  await context.db
    .insert(accountPower)
    .values({
      accountId: toDelegate,
      daoId,
    })
    .onConflictDoNothing();
};

/**
 * ### Creates:
 * - New `Account` record (for delegate if it doesn't exist)
 * - New `VotingPowerHistory` record with voting power change details
 * - New `AccountPower` record (if delegate doesn't have one for this DAO)
 * - New daily metric records (via `storeDailyBucket`)
 *
 * ### Updates:
 * - `AccountPower`: Sets the delegate's current voting power to new balance
 * - `Token`: Adjusts delegated supply by the balance delta
 * - Daily bucket metrics for delegated supply tracking
 */
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

  // Validate daoId is a valid DaoIdEnum value
  if (!Object.values(DaoIdEnum).includes(daoId as DaoIdEnum)) {
    throw new Error(`Invalid daoId: ${daoId}`);
  }

  const deltaMod = newBalance - oldBalance;

  // Transaction handling moved to DAO-specific indexer
  await context.db
    .insert(votingPowerHistory)
    .values({
      daoId,
      transactionHash: txHash,
      accountId: delegate,
      votingPower: newBalance,
      delta: newBalance - oldBalance,
      deltaMod: deltaMod > 0n ? deltaMod : -deltaMod,
      timestamp,
      logIndex,
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

  // Store delegated supply on daily bucket
  await storeDailyBucket(
    context,
    MetricTypesEnum.DELEGATED_SUPPLY,
    currentDelegatedSupply,
    newDelegatedSupply,
    daoId,
    timestamp,
    tokenId,
  );
};
