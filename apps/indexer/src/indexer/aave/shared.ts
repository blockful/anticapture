import {
  transfer,
  accountBalance,
  accountPower,
  balanceHistory,
  delegation,
  feedEvent,
  token,
  votingPowerHistory,
} from "ponder:schema";
import { Context } from "ponder:registry";
import { Address, getAddress, zeroAddress } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import {
  MetricTypesEnum,
  BurningAddresses,
  CEXAddresses,
  DEXAddresses,
  LendingAddresses,
  TreasuryAddresses,
  NonCirculatingAddresses,
} from "@/lib/constants";
import { ensureAccountsExist } from "@/eventHandlers/shared";
import {
  updateCirculatingSupply,
  updateSupplyMetric,
  updateTotalSupply,
} from "@/eventHandlers/metrics";

export async function aaveSetup(
  context: Context,
  address: Address,
  daoId: DaoIdEnum,
  decimals: number,
) {
  await context.db.insert(token).values({
    id: address,
    name: daoId,
    decimals,
  });
}

export async function aaveTransfer(
  context: Context,
  {
    from: _from,
    to: _to,
    value,
    transactionHash,
    timestamp,
    logIndex,
  }: {
    from: Address;
    to: Address;
    value: bigint;
    transactionHash: `0x${string}`;
    timestamp: bigint;
    logIndex: number;
  },
  address: Address,
  daoId: DaoIdEnum,
) {
  const from = getAddress(_from);
  const to = getAddress(_to);
  const tokenId = getAddress(address);

  await ensureAccountsExist(context, [to, from]);

  await context.db
    .insert(transfer)
    .values({
      transactionHash,
      daoId,
      tokenId,
      amount: value,
      fromAccountId: from,
      toAccountId: to,
      timestamp,
      logIndex,
      isCex: false,
      isDex: false,
      isLending: false,
      isTotal: false,
    })
    .onConflictDoUpdate((current) => ({
      amount: current.amount + value,
    }));

  if (to !== zeroAddress) {
    const { balance: currentReceiverBalance, delegate: toDelegate } =
      await context.db
        .insert(accountBalance)
        .values({
          accountId: to,
          tokenId,
          balance: value,
          delegate: zeroAddress,
        })
        .onConflictDoUpdate((current) => ({
          balance: current.balance + value,
        }));

    if (toDelegate !== zeroAddress) {
      const { votingPower: currentVotingPower } = await context.db
        .insert(accountPower)
        .values({ accountId: toDelegate, daoId })
        .onConflictDoUpdate((current) => ({
          votingPower: current.votingPower + value,
        }));

      await context.db.insert(votingPowerHistory).values({
        daoId,
        transactionHash,
        accountId: toDelegate,
        votingPower: currentVotingPower + value,
        delta: value,
        deltaMod: value,
        timestamp,
        logIndex: logIndex + 1,
      });
    }

    await context.db
      .insert(balanceHistory)
      .values({
        daoId,
        transactionHash,
        accountId: to,
        balance: currentReceiverBalance,
        delta: value,
        deltaMod: value > 0n ? value : -value,
        timestamp,
        logIndex,
      })
      .onConflictDoNothing();
  }

  if (from !== zeroAddress) {
    const { balance: currentSenderBalance, delegate: fromDelegate } =
      await context.db
        .insert(accountBalance)
        .values({
          accountId: from,
          tokenId,
          balance: -value,
          delegate: zeroAddress,
        })
        .onConflictDoUpdate((current) => ({
          balance: current.balance - value,
        }));

    if (fromDelegate !== zeroAddress) {
      const { votingPower: currentVotingPower } = await context.db
        .insert(accountPower)
        .values({ accountId: fromDelegate, daoId })
        .onConflictDoUpdate((current) => ({
          votingPower: current.votingPower - value,
        }));

      await context.db.insert(votingPowerHistory).values({
        daoId,
        transactionHash,
        accountId: fromDelegate,
        votingPower: currentVotingPower - value,
        delta: -value,
        deltaMod: value > 0n ? value : -value,
        timestamp,
        logIndex: logIndex + 1,
      });
    }

    await context.db
      .insert(balanceHistory)
      .values({
        daoId,
        transactionHash,
        accountId: from,
        balance: currentSenderBalance,
        delta: -value,
        deltaMod: value > 0n ? value : -value,
        timestamp,
        logIndex,
      })
      .onConflictDoNothing();
  }

  await context.db.insert(feedEvent).values({
    txHash: transactionHash,
    logIndex,
    type: "TRANSFER",
    value,
    timestamp,
    metadata: {
      from,
      to,
      amount: value,
    },
  });

  const cexAddressList = Object.values(CEXAddresses[daoId]);
  const dexAddressList = Object.values(DEXAddresses[daoId]);
  const lendingAddressList = Object.values(LendingAddresses[daoId]);
  const treasuryAddressList = Object.values(TreasuryAddresses[daoId]);
  const nonCirculatingAddressList = Object.values(
    NonCirculatingAddresses[daoId],
  );
  const burningAddressList = Object.values(BurningAddresses[daoId]);

  await updateSupplyMetric(
    context,
    "lendingSupply",
    lendingAddressList,
    MetricTypesEnum.LENDING_SUPPLY,
    from,
    to,
    value,
    daoId,
    address,
    timestamp,
  );

  await updateSupplyMetric(
    context,
    "cexSupply",
    cexAddressList,
    MetricTypesEnum.CEX_SUPPLY,
    from,
    to,
    value,
    daoId,
    address,
    timestamp,
  );

  await updateSupplyMetric(
    context,
    "dexSupply",
    dexAddressList,
    MetricTypesEnum.DEX_SUPPLY,
    from,
    to,
    value,
    daoId,
    address,
    timestamp,
  );

  await updateSupplyMetric(
    context,
    "treasury",
    treasuryAddressList,
    MetricTypesEnum.TREASURY,
    from,
    to,
    value,
    daoId,
    address,
    timestamp,
  );

  await updateSupplyMetric(
    context,
    "nonCirculatingSupply",
    nonCirculatingAddressList,
    MetricTypesEnum.NON_CIRCULATING_SUPPLY,
    from,
    to,
    value,
    daoId,
    address,
    timestamp,
  );

  await updateTotalSupply(
    context,
    burningAddressList,
    MetricTypesEnum.TOTAL_SUPPLY,
    from,
    to,
    value,
    daoId,
    address,
    timestamp,
  );

  await updateCirculatingSupply(context, daoId, address, timestamp);
}

export async function aaveDelegateChanged(
  context: Context,
  {
    delegationType,
    delegator: _delegator,
    delegatee: _delegate,
    transactionHash,
    timestamp,
    logIndex,
  }: {
    delegationType: number;
    delegator: Address;
    delegatee: Address;
    transactionHash: `0x${string}`;
    timestamp: bigint;
    logIndex: number;
  },
  address: Address,
  daoId: DaoIdEnum,
) {
  if (delegationType === 1) {
    // proposal delegation
    return;
  }

  const delegator = getAddress(_delegator);
  const delegate = getAddress(_delegate);
  const tokenId = getAddress(address);

  await ensureAccountsExist(context, [delegator, delegate]);

  const previousDelegate =
    (await context.db.find(accountBalance, { accountId: delegator, tokenId }))
      ?.delegate ?? zeroAddress;

  const redelegation = previousDelegate !== zeroAddress;

  const delegatorBalance = await context.db
    .insert(accountBalance)
    .values({ accountId: delegator, tokenId, delegate, balance: 0n })
    .onConflictDoUpdate({ delegate });

  await context.db
    .insert(delegation)
    .values({
      transactionHash,
      daoId,
      delegateAccountId: delegate,
      delegatorAccountId: delegator,
      delegatedValue: delegatorBalance.balance,
      previousDelegate,
      timestamp,
      logIndex,
      isCex: false,
      isDex: false,
      isLending: false,
      isTotal: false,
      type: delegationType,
    })
    .onConflictDoUpdate((current) => ({
      delegatedValue: current.delegatedValue + delegatorBalance.balance,
    }));

  if (delegate !== zeroAddress) {
    await context.db
      .insert(accountPower)
      .values({
        accountId: delegate,
        daoId,
        delegationsCount: 1,
        votingPower: delegatorBalance.balance,
      })
      .onConflictDoUpdate((current) => ({
        delegationsCount: current.delegationsCount + 1,
        votingPower: current.votingPower + delegatorBalance.balance,
      }));

    await context.db
      .insert(votingPowerHistory)
      .values({
        daoId,
        transactionHash,
        accountId: delegate,
        votingPower: delegatorBalance.balance,
        delta: delegatorBalance.balance,
        deltaMod: delegatorBalance.balance,
        timestamp,
        logIndex: logIndex + 1,
      })
      .onConflictDoNothing();
  }

  if (redelegation) {
    const previousVp = await context.db
      .update(accountPower, { accountId: previousDelegate })
      .set((current) => ({
        delegationsCount: current.delegationsCount - 1,
        votingPower: current.votingPower - delegatorBalance.balance,
      }));

    await context.db
      .insert(votingPowerHistory)
      .values({
        daoId,
        transactionHash,
        accountId: previousDelegate,
        votingPower: previousVp.votingPower - delegatorBalance.balance,
        delta: -delegatorBalance.balance,
        deltaMod: delegatorBalance.balance,
        timestamp,
        logIndex: logIndex + 1,
      })
      .onConflictDoNothing();
  }

  await context.db.insert(feedEvent).values({
    txHash: transactionHash,
    logIndex,
    type: "DELEGATION",
    value: delegatorBalance.balance,
    timestamp,
    metadata: {
      delegator,
      delegate,
      previousDelegate,
      amount: delegatorBalance.balance,
    },
  });
}
