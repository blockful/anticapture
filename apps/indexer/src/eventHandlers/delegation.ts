import { Context } from "ponder:registry";
import {
  accountBalance,
  accountPower,
  delegation,
  feedEvent,
  votingPowerHistory,
} from "ponder:schema";
import { Address, getAddress, Hex, zeroAddress } from "viem";

import { ensureAccountExists, ensureAccountsExist } from "./shared";
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
  daoId: DaoIdEnum,
  args: {
    delegator: Address;
    delegate: Address;
    tokenId: Address;
    previousDelegate: Address;
    txHash: Hex;
    timestamp: bigint;
    logIndex: number;
    delegatorBalance?: bigint;
  },
) => {
  const {
    delegator,
    delegate,
    tokenId,
    txHash,
    previousDelegate,
    timestamp,
    logIndex,
    delegatorBalance: _delegatorBalance,
  } = args;

  const normalizedDelegator = getAddress(delegator);
  const normalizedDelegate = getAddress(delegate);

  // Ensure all required accounts exist in parallel
  await ensureAccountsExist(context, [delegator, delegate]);

  const delegatorBalance = _delegatorBalance
    ? { balance: _delegatorBalance }
    : await context.db.find(accountBalance, {
        accountId: normalizedDelegator,
        tokenId: getAddress(tokenId),
      });

  // Pre-compute address lists for flag determination (normalized to checksum)
  const lendingAddressList = Object.values(LendingAddresses[daoId] || {}).map(
    getAddress,
  );
  const cexAddressList = Object.values(CEXAddresses[daoId] || {}).map(
    getAddress,
  );
  const dexAddressList = Object.values(DEXAddresses[daoId] || {}).map(
    getAddress,
  );
  const burningAddressList = Object.values(BurningAddresses[daoId] || {}).map(
    getAddress,
  );

  // Determine flags for the delegation
  const isCex =
    cexAddressList.includes(normalizedDelegator) ||
    cexAddressList.includes(normalizedDelegate);
  const isDex =
    dexAddressList.includes(normalizedDelegator) ||
    dexAddressList.includes(normalizedDelegate);
  const isLending =
    lendingAddressList.includes(normalizedDelegator) ||
    lendingAddressList.includes(normalizedDelegate);
  const isBurning =
    burningAddressList.includes(normalizedDelegator) ||
    burningAddressList.includes(normalizedDelegate);
  const isTotal = isBurning;

  await context.db
    .insert(delegation)
    .values({
      transactionHash: txHash,
      daoId,
      delegateAccountId: normalizedDelegate,
      delegatorAccountId: normalizedDelegator,
      delegatedValue: delegatorBalance?.balance ?? 0n,
      previousDelegate: getAddress(previousDelegate),
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

  await context.db
    .insert(accountBalance)
    .values({
      accountId: normalizedDelegator,
      tokenId: getAddress(tokenId),
      delegate: normalizedDelegate,
      balance: BigInt(0),
    })
    .onConflictDoUpdate({
      delegate: normalizedDelegate,
    });

  if (previousDelegate !== zeroAddress) {
    await context.db
      .insert(accountPower)
      .values({
        accountId: getAddress(previousDelegate),
        daoId,
      })
      .onConflictDoUpdate((current) => ({
        delegationsCount: Math.max(0, current.delegationsCount - 1),
      }));
  }

  await context.db
    .insert(accountPower)
    .values({
      accountId: normalizedDelegate,
      daoId,
      delegationsCount: 1,
    })
    .onConflictDoUpdate((current) => ({
      delegationsCount: current.delegationsCount + 1,
    }));

  await context.db.insert(feedEvent).values({
    txHash,
    logIndex,
    type: "DELEGATION",
    value: delegatorBalance?.balance ?? 0n,
    timestamp,
    metadata: {
      delegator: normalizedDelegator,
      delegate: normalizedDelegate,
      previousDelegate: getAddress(previousDelegate),
      amount: delegatorBalance?.balance ?? 0n,
    },
  });
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
  daoId: DaoIdEnum,
  args: {
    delegate: Address;
    txHash: Hex;
    newBalance: bigint;
    oldBalance: bigint;
    timestamp: bigint;
    logIndex: number;
  },
) => {
  const { delegate, txHash, newBalance, oldBalance, timestamp, logIndex } =
    args;

  const normalizedDelegate = getAddress(delegate);

  await ensureAccountExists(context, delegate);

  const delta = newBalance - oldBalance;
  const deltaMod = delta > 0n ? delta : -delta;

  await context.db
    .insert(votingPowerHistory)
    .values({
      daoId,
      transactionHash: txHash,
      accountId: normalizedDelegate,
      votingPower: newBalance,
      delta,
      deltaMod,
      timestamp,
      logIndex,
    })
    .onConflictDoNothing();

  await context.db
    .insert(accountPower)
    .values({
      accountId: normalizedDelegate,
      daoId,
      votingPower: newBalance,
    })
    .onConflictDoUpdate(() => ({
      votingPower: newBalance,
    }));

  await context.db.insert(feedEvent).values({
    txHash,
    logIndex,
    type: "DELEGATION_VOTES_CHANGED",
    value: deltaMod,
    timestamp,
    metadata: {
      delta,
      deltaMod,
      delegate: normalizedDelegate,
    },
  });
};
