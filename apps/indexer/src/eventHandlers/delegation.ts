import type { handlerContext } from "../../generated/index.js";
import type { EventType_t } from "../../generated/src/db/Enums.gen.ts";
import type { Address, Hex } from "viem";
import { getAddress, zeroAddress } from "viem";

import {
  BurningAddresses,
  CEXAddresses,
  DEXAddresses,
  LendingAddresses,
} from "../lib/constants.ts";
import { DaoIdEnum } from "../lib/enums.ts";

import {
  createAddressSet,
  ensureAccountExists,
  ensureAccountsExist,
} from "./shared.ts";

type DelegationAddressSets = {
  cex: ReadonlySet<Address>;
  dex: ReadonlySet<Address>;
  lending: ReadonlySet<Address>;
  burning: ReadonlySet<Address>;
};

export const delegateChanged = async (
  context: handlerContext,
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

  await ensureAccountsExist(context, [delegator, delegate]);

  const delegatorBalanceId = `${normalizedDelegator}-${getAddress(tokenId)}`;
  const storedBalance = _delegatorBalance
    ? { balance: _delegatorBalance }
    : await context.AccountBalance.get(delegatorBalanceId);
  const delegatedValue = storedBalance?.balance ?? 0n;

  const { cex, dex, lending, burning } = addressSets ?? {
    cex: createAddressSet(Object.values(CEXAddresses[daoId] || {})),
    dex: createAddressSet(Object.values(DEXAddresses[daoId] || {})),
    lending: createAddressSet(Object.values(LendingAddresses[daoId] || {})),
    burning: createAddressSet(Object.values(BurningAddresses[daoId] || {})),
  };

  const isCex = cex.has(normalizedDelegator) || cex.has(normalizedDelegate);
  const isDex = dex.has(normalizedDelegator) || dex.has(normalizedDelegate);
  const isLending =
    lending.has(normalizedDelegator) || lending.has(normalizedDelegate);
  const isTotal =
    burning.has(normalizedDelegator) || burning.has(normalizedDelegate);

  const delegationId = `${txHash}-${normalizedDelegator}-${normalizedDelegate}`;
  const existingDelegation = await context.Delegation.get(delegationId);
  context.Delegation.set({
    id: delegationId,
    transactionHash: txHash,
    daoId,
    delegateAccountId: normalizedDelegate,
    delegatorAccountId: normalizedDelegator,
    delegatedValue: (existingDelegation?.delegatedValue ?? 0n) + delegatedValue,
    previousDelegate: getAddress(previousDelegate),
    timestamp,
    logIndex,
    isCex,
    isDex,
    isLending,
    isTotal,
    delegationType: undefined,
  });

  // Update delegator's balance record to point to new delegate
  const existingBalance = await context.AccountBalance.get(delegatorBalanceId);
  context.AccountBalance.set({
    id: delegatorBalanceId,
    accountId: normalizedDelegator,
    tokenId: getAddress(tokenId),
    balance: existingBalance?.balance ?? 0n,
    delegate: normalizedDelegate,
  });

  // Decrement previous delegate's count
  if (previousDelegate !== zeroAddress) {
    const prevPowerId = getAddress(previousDelegate);
    const prevPower = await context.AccountPower.get(prevPowerId);
    context.AccountPower.set({
      id: prevPowerId,
      accountId: prevPowerId,
      daoId,
      votingPower: prevPower?.votingPower ?? 0n,
      votesCount: prevPower?.votesCount ?? 0,
      proposalsCount: prevPower?.proposalsCount ?? 0,
      delegationsCount: Math.max(0, (prevPower?.delegationsCount ?? 0) - 1),
      lastVoteTimestamp: prevPower?.lastVoteTimestamp ?? 0n,
    });
  }

  // Increment new delegate's count
  const delegatePowerId = normalizedDelegate;
  const delegatePower = await context.AccountPower.get(delegatePowerId);
  context.AccountPower.set({
    id: delegatePowerId,
    accountId: normalizedDelegate,
    daoId,
    votingPower: delegatePower?.votingPower ?? 0n,
    votesCount: delegatePower?.votesCount ?? 0,
    proposalsCount: delegatePower?.proposalsCount ?? 0,
    delegationsCount: (delegatePower?.delegationsCount ?? 0) + 1,
    lastVoteTimestamp: delegatePower?.lastVoteTimestamp ?? 0n,
  });

  context.FeedEvent.set({
    id: `${txHash}-${logIndex}`,
    txHash,
    logIndex,
    eventType: "DELEGATION" as EventType_t,
    value: delegatedValue,
    timestamp,
    metadata: {
      delegator: normalizedDelegator,
      delegate: normalizedDelegate,
      previousDelegate: getAddress(previousDelegate),
      amount: delegatedValue.toString(),
    },
  });
};

export const delegatedVotesChanged = async (
  context: handlerContext,
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

  const diff = newBalance - oldBalance;
  const deltaMod = diff > 0n ? diff : -diff;

  context.VotingPowerHistory.set({
    id: `${txHash}-${normalizedDelegate}-${logIndex}`,
    daoId,
    transactionHash: txHash,
    accountId: normalizedDelegate,
    votingPower: newBalance,
    delta: diff,
    deltaMod,
    timestamp,
    logIndex,
  });

  const existingPower = await context.AccountPower.get(normalizedDelegate);
  context.AccountPower.set({
    id: normalizedDelegate,
    accountId: normalizedDelegate,
    daoId,
    votingPower: newBalance,
    votesCount: existingPower?.votesCount ?? 0,
    proposalsCount: existingPower?.proposalsCount ?? 0,
    delegationsCount: existingPower?.delegationsCount ?? 0,
    lastVoteTimestamp: existingPower?.lastVoteTimestamp ?? 0n,
  });

  context.FeedEvent.set({
    id: `${txHash}-${logIndex}`,
    txHash,
    logIndex,
    eventType: "DELEGATION_VOTES_CHANGED" as EventType_t,
    value: deltaMod,
    timestamp,
    metadata: {
      delta: diff.toString(),
      deltaMod: deltaMod.toString(),
      delegate: normalizedDelegate,
    },
  });
};
