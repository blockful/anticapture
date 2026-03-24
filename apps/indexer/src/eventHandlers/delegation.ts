import { Context } from "ponder:registry";
import {
  accountBalance,
  accountPower,
  delegation,
  feedEvent,
  votingPowerHistory,
} from "ponder:schema";
import { Address, getAddress, Hex, zeroAddress } from "viem";

import {
  BurningAddresses,
  CEXAddresses,
  DEXAddresses,
  LendingAddresses,
} from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

import {
  createAddressSet,
  ensureAccountExists,
  ensureAccountsExist,
} from "./shared";

type DelegationAddressSets = {
  cex: ReadonlySet<Address>;
  dex: ReadonlySet<Address>;
  lending: ReadonlySet<Address>;
  burning: ReadonlySet<Address>;
};

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
  addressSets?: DelegationAddressSets,
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
  const normalizedTokenId = getAddress(tokenId);
  const normalizedPreviousDelegate = getAddress(previousDelegate);

  const delegatorBalancePromise =
    _delegatorBalance === undefined
      ? context.db.find(accountBalance, {
          accountId: normalizedDelegator,
          tokenId: normalizedTokenId,
        })
      : Promise.resolve({ balance: _delegatorBalance });

  await Promise.all([
    ensureAccountsExist(context, [delegator, delegate]),
    delegatorBalancePromise,
  ]);

  const delegatorBalance = await delegatorBalancePromise;

  // Pre-compute address lists for flag determination (normalized to checksum)
  const { cex, dex, lending, burning } = addressSets ?? {
    cex: createAddressSet(Object.values(CEXAddresses[daoId] || {})),
    dex: createAddressSet(Object.values(DEXAddresses[daoId] || {})),
    lending: createAddressSet(Object.values(LendingAddresses[daoId] || {})),
    burning: createAddressSet(Object.values(BurningAddresses[daoId] || {})),
  };

  // Determine flags for the delegation
  const isCex = cex.has(normalizedDelegator) || cex.has(normalizedDelegate);
  const isDex = dex.has(normalizedDelegator) || dex.has(normalizedDelegate);
  const isLending =
    lending.has(normalizedDelegator) || lending.has(normalizedDelegate);
  const isBurning =
    burning.has(normalizedDelegator) || burning.has(normalizedDelegate);
  const isTotal = isBurning;

  const delegationWrite = context.db
    .insert(delegation)
    .values({
      transactionHash: txHash,
      daoId,
      delegateAccountId: normalizedDelegate,
      delegatorAccountId: normalizedDelegator,
      delegatedValue: delegatorBalance?.balance ?? 0n,
      previousDelegate: normalizedPreviousDelegate,
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

  const accountBalanceWrite = context.db
    .insert(accountBalance)
    .values({
      accountId: normalizedDelegator,
      tokenId: normalizedTokenId,
      delegate: normalizedDelegate,
      balance: BigInt(0),
    })
    .onConflictDoUpdate({
      delegate: normalizedDelegate,
    });

  const writes: Promise<unknown>[] = [
    delegationWrite,
    accountBalanceWrite,
    context.db.insert(feedEvent).values({
      txHash,
      logIndex,
      type: "DELEGATION",
      value: delegatorBalance?.balance ?? 0n,
      timestamp,
      metadata: {
        delegator: normalizedDelegator,
        delegate: normalizedDelegate,
        previousDelegate: normalizedPreviousDelegate,
        amount: delegatorBalance?.balance ?? 0n,
      },
    }),
  ];

  const nextDelegatePowerWrite = context.db
    .insert(accountPower)
    .values({
      accountId: normalizedDelegate,
      daoId,
      delegationsCount: 1,
    })
    .onConflictDoUpdate((current) => ({
      delegationsCount: current.delegationsCount + 1,
    }));

  if (previousDelegate !== zeroAddress) {
    const previousDelegatePowerWrite = context.db
      .insert(accountPower)
      .values({
        accountId: normalizedPreviousDelegate,
        daoId,
      })
      .onConflictDoUpdate((current) => ({
        delegationsCount: Math.max(0, current.delegationsCount - 1),
      }));

    if (normalizedPreviousDelegate === normalizedDelegate) {
      await Promise.all(writes);
      await previousDelegatePowerWrite;
      await nextDelegatePowerWrite;
      return;
    }

    writes.push(previousDelegatePowerWrite);
  }

  writes.push(nextDelegatePowerWrite);

  await Promise.all(writes);
};

export const selfDelegateIfUnset = async (
  context: Context,
  daoId: DaoIdEnum,
  args: {
    delegator: Address;
    tokenId: Address;
    txHash: Hex;
    timestamp: bigint;
    logIndex: number;
  },
  addressSets?: DelegationAddressSets,
) => {
  const normalizedDelegator = getAddress(args.delegator);
  const normalizedTokenId = getAddress(args.tokenId);

  const delegatorBalance = await context.db.find(accountBalance, {
    accountId: normalizedDelegator,
    tokenId: normalizedTokenId,
  });

  if (!delegatorBalance || delegatorBalance.delegate !== zeroAddress) {
    return;
  }

  await delegateChanged(
    context,
    daoId,
    {
      delegator: normalizedDelegator,
      delegate: normalizedDelegator,
      tokenId: normalizedTokenId,
      previousDelegate: zeroAddress,
      txHash: args.txHash,
      timestamp: args.timestamp,
      logIndex: args.logIndex,
      delegatorBalance: delegatorBalance.balance,
    },
    addressSets,
  );
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

  await Promise.all([
    context.db
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
      .onConflictDoNothing(),
    context.db
      .insert(accountPower)
      .values({
        accountId: normalizedDelegate,
        daoId,
        votingPower: newBalance,
      })
      .onConflictDoUpdate(() => ({
        votingPower: newBalance,
      })),
    context.db.insert(feedEvent).values({
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
    }),
  ]);
};
