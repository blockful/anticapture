import { Context, Event } from "ponder:registry";
import {
  delta,
  getValueFromEventArgs,
  max,
  min,
  verifyAddressType,
} from "./utils";
import {
  account,
  accountBalance,
  accountPower,
  delegation,
  proposalsOnchain,
  transfer,
  votesOnchain,
  votingPowerHistory,
  daoMetricsDayBucket,
  token,
} from "ponder:schema";
import {
  BurningAddresses,
  CEXAddresses,
  DEXAddresses,
  LendingAddresses,
  MetricTypesEnum,
  TREASURY_ADDRESSES,
} from "./constants";
import { Address, zeroAddress } from "viem";
import { DaoIdEnum } from "./enums";
import {
  DaoDelegateChangedEvent,
  DaoDelegateVotesChangedEvent,
  DaoProposalCanceledEvent,
  DaoProposalCreatedEvent,
  DaoProposalExecutedEvent,
  DaoTransferEvent,
  DaoVoteCastEvent,
} from "@/indexer/types";

export const delegateChanged = async (
  event: DaoDelegateChangedEvent,
  context: Context,
  daoId: string,
) => {
  // Inserting accounts if didn't exist with type verification
  const delegatorType = await verifyAddressType(
    context.client,
    event.args.delegator,
  );
  const toDelegateType = await verifyAddressType(
    context.client,
    event.args.toDelegate,
  );

  await context.db
    .insert(account)
    .values({
      id: event.args.delegator,
      type: delegatorType,
    })
    .onConflictDoNothing();

  await context.db
    .insert(account)
    .values({
      id: event.args.toDelegate,
      type: toDelegateType,
    })
    .onConflictDoNothing();

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
  const delegateType = await verifyAddressType(
    context.client,
    event.args.delegate,
  );

  await context.db
    .insert(account)
    .values({
      id: event.args.delegate,
      type: delegateType,
    })
    .onConflictDoNothing();

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

  await context.db.insert(votingPowerHistory).values({
    transactionHash: event.transaction.hash,
    accountId: event.args.delegate,
    votingPower: newBalance,
    timestamp: event.block.timestamp,
  });

  // Update the delegate's voting power
  await context.db
    .insert(accountPower)
    .values({
      accountId: event.args.delegate,
      daoId,
      votingPower: newBalance,
    })
    .onConflictDoUpdate((current) => ({
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

export const tokenTransfer = async (
  event: DaoTransferEvent,
  context: Context,
  daoId: DaoIdEnum,
  tokenAddress: Address,
) => {
  //Picking "value" from the event.args if the dao is ENS or SHU, otherwise picking "amount"
  const value = getValueFromEventArgs<bigint, (typeof event)["args"]>(
    [
      { name: "value", daos: ["ENS", "SHU", "ARB"] },
      { name: "amount", daos: ["COMP", "UNI"] },
    ],
    event.args,
    daoId,
  );

  const { from, to } = event.args;

  //Inserting accounts if didn't exist with type verification
  const toType = await verifyAddressType(context.client, to);
  const fromType = await verifyAddressType(context.client, from);

  await context.db
    .insert(account)
    .values({
      id: to,
      type: toType,
    })
    .onConflictDoNothing();

  await context.db
    .insert(account)
    .values({
      id: from,
      type: fromType,
    })
    .onConflictDoNothing();

  await context.db
    .insert(transfer)
    .values({
      transactionHash: event.transaction.hash,
      tokenId: tokenAddress,
      amount: value,
      fromAccountId: from,
      toAccountId: to,
      timestamp: event.block.timestamp,
    })
    .onConflictDoNothing();

  // Update the to account's balance
  await context.db
    .insert(accountBalance)
    .values({
      accountId: to,
      tokenId: tokenAddress,
      balance: value,
      delegate: zeroAddress,
    })
    .onConflictDoUpdate((current) => ({
      balance: current.balance + value,
    }));

  // Update the from account's balance (skip if minting from zero address)
  if (from !== zeroAddress) {
    await context.db
      .insert(accountBalance)
      .values({
        accountId: from,
        tokenId: tokenAddress,
        balance: -value,
        delegate: zeroAddress,
      })
      .onConflictDoUpdate((current) => ({
        balance: current.balance - value,
      }));
  }

  const currentLendingSupply =
    (
      await context.db.find(token, {
        id: event.log.address,
      })
    )?.lendingSupply ?? BigInt(0);

  const lendingAddressList = Object.values(LendingAddresses[daoId]);
  const isToLending = lendingAddressList.includes(to);
  const isFromLending = lendingAddressList.includes(from);

  if ((isToLending || isFromLending) && !(isToLending && isFromLending)) {
    const newLendingSupply = (
      await context.db.update(token, { id: event.log.address }).set((row) => ({
        lendingSupply: isToLending
          ? row.lendingSupply + value
          : row.lendingSupply - value,
      }))
    ).lendingSupply;

    await storeDailyBucket(
      context,
      event,
      MetricTypesEnum.LENDING_SUPPLY,
      currentLendingSupply,
      newLendingSupply,
      daoId,
    );
  }

  const currentCexSupply =
    (
      await context.db.find(token, {
        id: event.log.address,
      })
    )?.cexSupply ?? BigInt(0);

  const cexAddressList = Object.values(CEXAddresses[daoId]);
  const isToCex = cexAddressList.includes(to);
  const isFromCex = cexAddressList.includes(from);

  if ((isToCex || isFromCex) && !(isToCex && isFromCex)) {
    const newCexSupply = (
      await context.db.update(token, { id: event.log.address }).set((row) => ({
        cexSupply: isToCex ? row.cexSupply + value : row.cexSupply - value,
      }))
    ).cexSupply;

    await storeDailyBucket(
      context,
      event,
      MetricTypesEnum.CEX_SUPPLY,
      currentCexSupply,
      newCexSupply,
      daoId,
    );
  }

  const currentDexSupply =
    (
      await context.db.find(token, {
        id: event.log.address,
      })
    )?.dexSupply ?? BigInt(0);

  const dexAddressList = Object.values(DEXAddresses[daoId]);
  const isToDex = dexAddressList.includes(to);
  const isFromDex = dexAddressList.includes(from);

  if ((isToDex || isFromDex) && !(isToDex && isFromDex)) {
    const newDexSupply = (
      await context.db.update(token, { id: event.log.address }).set((row) => ({
        dexSupply: isToDex ? row.dexSupply + value : row.dexSupply - value,
      }))
    ).dexSupply;

    await storeDailyBucket(
      context,
      event,
      MetricTypesEnum.DEX_SUPPLY,
      currentDexSupply,
      newDexSupply,
      daoId,
    );
  }

  const currentTreasury =
    (
      await context.db.find(token, {
        id: event.log.address,
      })
    )?.treasury ?? BigInt(0);

  const treasuryAddressList = Object.values(TREASURY_ADDRESSES[daoId]);
  const isToTreasury = treasuryAddressList.includes(to);
  const isFromTreasury = treasuryAddressList.includes(from);

  const isTreasuryTransaction =
    (isToTreasury || isFromTreasury) && !(isToTreasury && isFromTreasury);

  if (isTreasuryTransaction) {
    const newTreasury = (
      await context.db.update(token, { id: event.log.address }).set((row) => ({
        treasury: isToTreasury ? row.treasury + value : row.treasury - value,
      }))
    ).treasury;

    await storeDailyBucket(
      context,
      event,
      MetricTypesEnum.TREASURY,
      currentTreasury,
      newTreasury,
      daoId,
    );
  }

  const currentTotalSupply =
    (
      await context.db.find(token, {
        id: event.log.address,
      })
    )?.totalSupply ?? BigInt(0);

  const burningAddressesAddressList = Object.values(BurningAddresses[daoId]);
  const isToBurningAddress = burningAddressesAddressList.includes(to);
  const isFromBurningAddress = burningAddressesAddressList.includes(from);
  const isTotalSupplyTransaction =
    (isToBurningAddress || isFromBurningAddress) &&
    !(isToBurningAddress && isFromBurningAddress);

  if (isTotalSupplyTransaction) {
    const isBurningTokens = burningAddressesAddressList.includes(to);
    const newTotalSupply = (
      await context.db.update(token, { id: event.log.address }).set((row) => ({
        totalSupply: isBurningTokens
          ? row.totalSupply - value
          : row.totalSupply + value,
      }))
    ).totalSupply;

    await storeDailyBucket(
      context,
      event,
      MetricTypesEnum.TOTAL_SUPPLY,
      currentTotalSupply,
      newTotalSupply,
      daoId,
    );
  }

  const currentCirculatingSupply =
    (
      await context.db.find(token, {
        id: event.log.address,
      })
    )?.circulatingSupply ?? BigInt(0);

  const isCirculatingSupplyTransaction =
    isTotalSupplyTransaction || isTreasuryTransaction;

  if (isCirculatingSupplyTransaction) {
    const newCirculatingSupply = (
      await context.db.update(token, { id: event.log.address }).set((row) => ({
        circulatingSupply: row.totalSupply - row.treasury,
      }))
    ).circulatingSupply;

    await storeDailyBucket(
      context,
      event,
      MetricTypesEnum.CIRCULATING_SUPPLY,
      currentCirculatingSupply,
      newCirculatingSupply,
      daoId,
    );
  }
};

export const voteCast = async (
  event: DaoVoteCastEvent,
  context: Context,
  daoId: string,
) => {
  const weight = getValueFromEventArgs<bigint, (typeof event)["args"]>(
    [
      { name: "weight", daos: ["ENS"] },
      { name: "votes", daos: ["UNI"] },
    ],
    event.args,
    daoId,
  );

  const proposalId = getValueFromEventArgs<bigint, (typeof event)["args"]>(
    [{ name: "proposalId", daos: ["ENS", "UNI"] }],
    event.args,
    daoId,
  );

  // Insert voter account with type verification
  const voterType = await verifyAddressType(context.client, event.args.voter);

  await context.db
    .insert(account)
    .values({
      id: event.args.voter,
      type: voterType,
    })
    .onConflictDoNothing();

  await context.db
    .insert(accountPower)
    .values({
      accountId: event.args.voter,
      daoId,
      votesCount: 1,
      lastVoteTimestamp: event.block.timestamp,
      firstVoteTimestamp: event.block.timestamp, // Set as first vote timestamp for new accounts
    })
    .onConflictDoUpdate((current) => ({
      votesCount: (current.votesCount ?? 0) + 1,
      lastVoteTimestamp: event.block.timestamp,
      // Only set firstVoteTimestamp if it's not already set (0 means never voted before)
      firstVoteTimestamp: current.firstVoteTimestamp ?? event.block.timestamp,
    }));

  // Create vote record
  await context.db.insert(votesOnchain).values({
    id: event.transaction.hash,
    proposalId: String(proposalId),
    voterAccountId: event.args.voter,
    support: event.args.support.toString(),
    votingPower: weight.toString(),
    reason: event.args.reason,
    timestamp: event.block.timestamp,
  });

  await context.db
    .update(proposalsOnchain, { id: String(proposalId) })
    .set((current) => ({
      againstVotes:
        (current.againstVotes ?? BigInt(0)) +
        (event.args.support === 0 ? weight : BigInt(0)),
      forVotes:
        (current.forVotes ?? BigInt(0)) +
        (event.args.support === 1 ? weight : BigInt(0)),
      abstainVotes:
        (current.abstainVotes ?? BigInt(0)) +
        (event.args.support === 2 ? weight : BigInt(0)),
    }));
};

export const proposalCreated = async (
  event: DaoProposalCreatedEvent,
  context: Context,
  daoId: string,
) => {
  const proposalId = getValueFromEventArgs<bigint, (typeof event)["args"]>(
    [
      { name: "proposalId", daos: ["ENS"] },
      { name: "id", daos: ["UNI"] },
    ],
    event.args,
    daoId,
  );

  // Insert proposer account with type verification
  const proposerType = await verifyAddressType(
    context.client,
    event.args.proposer,
  );

  await context.db
    .insert(account)
    .values({
      id: event.args.proposer,
      type: proposerType,
    })
    .onConflictDoNothing();

  // Create proposal record
  await context.db.insert(proposalsOnchain).values({
    id: String(proposalId),
    proposerAccountId: event.args.proposer,
    targets: JSON.stringify(event.args.targets),
    values: JSON.stringify(event.args.values.map((v: bigint) => v.toString())),
    signatures: JSON.stringify(event.args.signatures),
    calldatas: JSON.stringify(event.args.calldatas),
    startBlock: event.args.startBlock.toString(),
    endBlock: event.args.endBlock.toString(),
    description: event.args.description,
    timestamp: event.block.timestamp,
    status: "Pending",
    forVotes: BigInt(0),
    againstVotes: BigInt(0),
    abstainVotes: BigInt(0),
  });

  await context.db
    .insert(accountPower)
    .values({
      accountId: event.args.proposer,
      daoId,
      proposalsCount: 1,
    })
    .onConflictDoUpdate((current) => ({
      proposalsCount: (current.proposalsCount ?? 0) + 1,
    }));
};

export const proposalCanceled = async (
  event: DaoProposalCanceledEvent,
  context: Context,
  daoId: string,
) => {
  const proposalId = getValueFromEventArgs<bigint, (typeof event)["args"]>(
    [
      { name: "proposalId", daos: ["ENS"] },
      { name: "id", daos: ["UNI"] },
    ],
    event.args,
    daoId,
  );
  await context.db.update(proposalsOnchain, { id: String(proposalId) }).set({
    status: "CANCELED",
  });
};

export const proposalExecuted = async (
  event: DaoProposalExecutedEvent,
  context: Context,
  daoId: string,
) => {
  const proposalId = getValueFromEventArgs<bigint, (typeof event)["args"]>(
    [
      { name: "proposalId", daos: ["ENS"] },
      { name: "id", daos: ["UNI"] },
    ],
    event.args,
    daoId,
  );
  await context.db.update(proposalsOnchain, { id: String(proposalId) }).set({
    status: "EXECUTED",
  });
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
