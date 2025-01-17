import { Context, Event } from "ponder:registry";
import { delta, getValueFromEventArgs, max, min } from "./utils";
import {
  account,
  accountBalance,
  accountPower,
  delegations,
  proposalsOnchain,
  transfers,
  votesOnchain,
  votingPowerHistory,
  daoMetricsDayBuckets,
  token,
} from "ponder:schema";
import {
  BurningAddresses,
  CEXAddresses,
  DEXAddresses,
  LendingAddresses,
  MetricTypesEnum,
  secondsInDay,
  UNITreasuryAddresses,
} from "./constants";
import { MaxFeePerGasTooLowError, zeroAddress } from "viem";
import viemClient from "./viemClient";
import { and, eq, gte, inArray, lt, sql, sum } from "ponder";

export const delegateChanged = async (
  event: // | Event<"ENSToken:DelegateChanged">
  // | Event<"COMPToken:DelegateChanged">
  // | Event<"SHUToken:DelegateChanged">
  Event<"UNIToken:DelegateChanged">,
  context: Context,
  daoId: string,
) => {
  // Inserting accounts if didn't exist
  await context.db
    .insert(account)
    .values({
      id: event.args.delegator,
    })
    .onConflictDoNothing();

  await context.db
    .insert(account)
    .values({
      id: event.args.toDelegate,
    })
    .onConflictDoNothing();

  // Create a new delegation record
  await context.db.insert(delegations).values({
    id: [event.transaction.hash, event.log.logIndex].join("-"),
    daoId,
    delegateeAccountId: event.args.toDelegate,
    delegatorAccountId: event.args.delegator,
    timestamp: event.block.timestamp,
  });

  // Update the delegator's delegate
  await context.db
    .insert(accountPower)
    .values({
      id: [event.args.delegator, daoId].join("-"),
      accountId: event.args.delegator,
      daoId,
      delegate: event.args.toDelegate,
      active: false,
      lastVoteTimestamp: undefined,
    })
    .onConflictDoUpdate({
      delegate: event.args.toDelegate,
    });

  // Update the old delegatee's delegations count
  if (event.args.fromDelegate != zeroAddress) {
    await context.db
      .update(accountPower, { id: [event.args.fromDelegate, daoId].join("-") })
      .set((row) => ({ delegationsCount: row.delegationsCount - 1 }));
  }

  // Update the delegatee's delegations count
  await context.db
    .insert(accountPower)
    .values({
      id: [event.args.toDelegate, daoId].join("-"),
      accountId: event.args.toDelegate,
      daoId,
      delegationsCount: 1,
      active: false,
      lastVoteTimestamp: undefined,
    })
    .onConflictDoUpdate((current) => ({
      delegationsCount: (current.delegationsCount ?? 0) + 1,
    }));
};

export const delegatedVotesChanged = async (
  event: // | Event<"ENSToken:DelegateVotesChanged">
  // | Event<"COMPToken:DelegateVotesChanged">
  // | Event<"SHUToken:DelegateVotesChanged">
  Event<"UNIToken:DelegateVotesChanged">,
  context: Context,
  daoId: string,
) => {
  //Inserting delegate account if didn't exist
  await context.db
    .insert(account)
    .values({
      id: event.args.delegate,
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

  // Create a new voting power history record
  await context.db.insert(votingPowerHistory).values({
    id: [event.transaction.hash, event.log.logIndex].join("-"),
    accountId: event.args.delegate,
    daoId,
    votingPower: newBalance,
    timestamp: event.block.timestamp,
  });

  // Update the delegate's voting power
  const delegateAccountPower = await context.db
    .insert(accountPower)
    .values({
      id: [event.args.delegate, daoId].join("-"),
      accountId: event.args.delegate,
      daoId,
      votingPower: newBalance,
      active: false,
      lastVoteTimestamp: undefined,
    })
    .onConflictDoUpdate({
      votingPower: newBalance,
    });

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
    daoId,
    MetricTypesEnum.DELEGATED_SUPPLY,
    currentDelegatedSupply,
    newDelegatedSupply,
  );

  if (!!delegateAccountPower.active) {
    const currentActiveSupply180d = (await context.db.find(token, {
      id: event.log.address,
    }))!.activeSupply180d;
    const newActiveSupply180d = (
      await context.db.update(token, { id: event.log.address }).set((row) => ({
        activeSupply180d: row.activeSupply180d + (newBalance - oldBalance),
      }))
    ).activeSupply180d;

    await storeDailyBucket(
      context,
      event,
      daoId,
      MetricTypesEnum.ACTIVE_SUPPLY_180D,
      currentActiveSupply180d,
      newActiveSupply180d,
    );
  }
};

export const tokenTransfer = async (
  event: // | Event<"ENSToken:Transfer">
  // | Event<"COMPToken:Transfer">
  // | Event<"SHUToken:Transfer">
  Event<"UNIToken:Transfer">,
  context: Context,
  daoId: "UNI",
) => {
  //Picking "value" from the event.args if the dao is ENS or SHU, otherwise picking "amount"
  const value = getValueFromEventArgs<bigint, (typeof event)["args"]>(
    [
      { name: "value", daos: ["ENS", "SHU"] },
      { name: "amount", daos: ["COMP", "UNI"] },
    ],
    event.args,
    daoId,
  );

  const { from, to } = event.args;

  //Inserting delegate account if didn't exist
  await context.db
    .insert(account)
    .values({
      id: to,
    })
    .onConflictDoNothing();
  await context.db
    .insert(account)
    .values({
      id: from,
    })
    .onConflictDoNothing();

  const uniTokenAddress = viemClient.daoConfigParams[daoId].tokenAddress;

  // Create a new transfer record
  await context.db.insert(transfers).values({
    id: [event.transaction.hash, event.log.logIndex].join("-"),
    daoId,
    tokenId: uniTokenAddress,
    amount: value,
    fromAccountId: from,
    toAccountId: to,
    timestamp: event.block.timestamp,
  });

  // Update the to account's balance
  await context.db
    .insert(accountBalance)
    .values({
      id: [to, uniTokenAddress].join("-"),
      tokenId: uniTokenAddress,
      accountId: to,
      balance: value,
    })
    .onConflictDoUpdate((current) => ({
      balance: current.balance + value,
    }));

  // Update the from account's balance
  await context.db
    .insert(accountBalance)
    .values({
      id: [from, uniTokenAddress].join("-"),
      tokenId: uniTokenAddress,
      accountId: from,
      balance: -value,
    })
    .onConflictDoUpdate((current) => ({
      balance: current.balance - value,
    }));

  const currentLendingSupply = (await context.db.find(token, {
    id: event.log.address,
  }))!.lendingSupply;

  const lendingAddressList = Object.values(LendingAddresses);
  const isLendingTransaction =
    lendingAddressList.includes(to) || lendingAddressList.includes(from);

  if (isLendingTransaction) {
    const isToLendingPool = lendingAddressList.includes(to);
    const newLendingSupply = (
      await context.db.update(token, { id: event.log.address }).set((row) => ({
        lendingSupply: isToLendingPool
          ? row.lendingSupply + value
          : row.lendingSupply - value,
      }))
    ).lendingSupply;

    await storeDailyBucket(
      context,
      event,
      daoId,
      MetricTypesEnum.LENDING_SUPPLY,
      currentLendingSupply,
      newLendingSupply,
    );
  }

  const currentCexSupply = (await context.db.find(token, {
    id: event.log.address,
  }))!.cexSupply;

  const cexAddressList = Object.values(CEXAddresses);
  const isCexTransaction =
    cexAddressList.includes(to) || cexAddressList.includes(from);

  if (isCexTransaction) {
    const isToCex = cexAddressList.includes(to);
    const newCexSupply = (
      await context.db.update(token, { id: event.log.address }).set((row) => ({
        cexSupply: isToCex ? row.cexSupply + value : row.cexSupply - value,
      }))
    ).cexSupply;

    await storeDailyBucket(
      context,
      event,
      daoId,
      MetricTypesEnum.CEX_SUPPLY,
      currentCexSupply,
      newCexSupply,
    );
  }

  const currentDexSupply = (await context.db.find(token, {
    id: event.log.address,
  }))!.dexSupply;

  const dexAddressList = Object.values(DEXAddresses);
  const isDexTransaction =
    dexAddressList.includes(to) || dexAddressList.includes(from);

  if (isDexTransaction) {
    const isToDex = dexAddressList.includes(to);
    const newDexSupply = (
      await context.db.update(token, { id: event.log.address }).set((row) => ({
        dexSupply: isToDex ? row.dexSupply + value : row.dexSupply - value,
      }))
    ).dexSupply;

    await storeDailyBucket(
      context,
      event,
      daoId,
      MetricTypesEnum.DEX_SUPPLY,
      currentDexSupply,
      newDexSupply,
    );
  }

  const currentTreasury = (await context.db.find(token, {
    id: event.log.address,
  }))!.treasury;

  const treasuryAddressList = Object.values(UNITreasuryAddresses);
  const isTreasuryTransaction =
    treasuryAddressList.includes(to) || treasuryAddressList.includes(from);
  const isInternalTreasuryTransfer =
    treasuryAddressList.includes(to) && treasuryAddressList.includes(from);

  if (isTreasuryTransaction && !isInternalTreasuryTransfer) {
    const isToTreasury = treasuryAddressList.includes(to);

    const newTreasury = (
      await context.db.update(token, { id: event.log.address }).set((row) => ({
        treasury: isToTreasury ? row.treasury + value : row.treasury - value,
      }))
    ).treasury;

    await storeDailyBucket(
      context,
      event,
      daoId,
      MetricTypesEnum.TREASURY,
      currentTreasury,
      newTreasury,
    );
  }

  const currentTotalSupply = (await context.db.find(token, {
    id: event.log.address,
  }))!.totalSupply;

  const burningAddressesAddressList = Object.values(BurningAddresses);
  const isTotalSupplyTransaction =
    burningAddressesAddressList.includes(to) ||
    burningAddressesAddressList.includes(from);

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
      daoId,
      MetricTypesEnum.TOTAL_SUPPLY,
      currentTotalSupply,
      newTotalSupply,
    );
  }

  const currentCirculatingSupply = (await context.db.find(token, {
    id: event.log.address,
  }))!.circulatingSupply;

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
      daoId,
      MetricTypesEnum.CIRCULATING_SUPPLY,
      currentCirculatingSupply,
      newCirculatingSupply,
    );
  }
};

export const voteCast = async (
  event: // | Event<"ENSGovernor:VoteCast">
  Event<"UNIGovernor:VoteCast">,
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

  await context.db
    .insert(account)
    .values({
      id: event.args.voter,
    })
    .onConflictDoNothing();

  const voterStatusBeforeUpdate = (
    (
      await context.db.sql
        .select({ active: accountPower.active })
        .from(accountPower)
        .where(
          and(
            eq(accountPower.accountId, event.args.voter),
            eq(accountPower.daoId, daoId),
          ),
        )
    )[0] ?? { active: false }
  ).active;

  const voterAccountPower = await context.db
    .insert(accountPower)
    .values({
      id: [event.args.voter, daoId].join("-"),
      daoId,
      accountId: event.args.voter,
      votesCount: 1,
      active: true,
      lastVoteTimestamp: event.block.timestamp,
    })
    .onConflictDoUpdate((current) => ({
      votesCount: (current.votesCount ?? 0) + 1,
    }));

  // Create vote record
  await context.db.insert(votesOnchain).values({
    id: [event.transaction.hash, event.log.logIndex].join("-"),
    daoId,
    proposalId: [proposalId, daoId].join("-"),
    voterAccountId: event.args.voter,
    support: event.args.support.toString(),
    weight: weight.toString(),
    reason: event.args.reason,
    timestamp: event.block.timestamp,
  });

  await context.db
    .update(proposalsOnchain, { id: [proposalId, daoId].join("-") })
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

  // Calculating Timestamp that is considered the low limit for activity.
  // Currently the user needs to have voted in the last 180 days to be considered active.
  const beginActiveTimestamp = event.block.timestamp - BigInt(180 * 86400); // 180 days * 86400 seconds

  const currentActiveSupply180d =
    (
      await context.db.find(token, {
        id: event.log.address,
      })
    )?.activeSupply180d ?? BigInt(0);

  // Getting Inactive Supply from Active Users
  const queryInactiveSupplyFromActiveUsers = await context.db.sql
    .select({
      id: accountPower.id,
      account: accountPower.accountId,
      votingPower: accountPower.votingPower,
    })
    .from(accountPower)
    .where(
      and(
        eq(accountPower.active, true),
        lt(accountPower.lastVoteTimestamp, beginActiveTimestamp),
      ),
    );
  // Update now inactive users 'active' flag
  await context.db.sql
    .update(accountPower)
    .set({ active: false })
    .where(
      inArray(
        accountPower.id,
        queryInactiveSupplyFromActiveUsers.map(({ id }) => id),
      ),
    );
  const newActiveSupply180d = (
    await context.db.update(token, { id: event.log.address }).set((row) => ({
      activeSupply180d:
        row.activeSupply180d -
        queryInactiveSupplyFromActiveUsers.reduce(
          (acc, current) => acc + current.votingPower,
          BigInt(0),
        ) +
        (!voterStatusBeforeUpdate ? voterAccountPower.votingPower : 0n),
    }))
  ).activeSupply180d;

  await storeDailyBucket(
    context,
    event,
    daoId,
    MetricTypesEnum.ACTIVE_SUPPLY_180D,
    currentActiveSupply180d,
    newActiveSupply180d,
  );
};

export const proposalCreated = async (
  event: // | Event<"ENSGovernor:ProposalCreated">
  Event<"UNIGovernor:ProposalCreated">,
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

  await context.db
    .insert(account)
    .values({
      id: event.args.proposer,
    })
    .onConflictDoNothing();

  // Create proposal record
  await context.db.insert(proposalsOnchain).values({
    id: [proposalId, daoId].join("-"),
    daoId,
    proposerAccountId: event.args.proposer,
    targets: JSON.stringify(event.args.targets),
    values: JSON.stringify(event.args.values.map((v) => v.toString())),
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
      id: event.args.proposer,
      daoId,
      accountId: event.args.proposer,
      proposalsCount: 1,
      active: false,
      lastVoteTimestamp: undefined,
    })
    .onConflictDoUpdate((current) => ({
      proposalsCount: (current.proposalsCount ?? 0) + 1,
    }));
};

export const proposalCanceled = async (
  event: // | Event<"ENSGovernor:ProposalCanceled">
  Event<"UNIGovernor:ProposalCanceled">,
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
  await context.db
    .update(proposalsOnchain, { id: [proposalId, daoId].join("-") })
    .set({
      status: "CANCELED",
    });
};

export const proposalExecuted = async (
  event: // | Event<"ENSGovernor:ProposalExecuted">
  Event<"UNIGovernor:ProposalExecuted">,
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
  await context.db
    .update(proposalsOnchain, { id: [proposalId, daoId].join("-") })
    .set({
      status: "EXECUTED",
    });
};

const storeDailyBucket = async (
  context: Context,
  event: Event,
  daoId: string,
  metricType: MetricTypesEnum,
  currentValue: bigint,
  newValue: bigint,
) => {
  const volume = delta(newValue, currentValue);

  await context.db
    .insert(daoMetricsDayBuckets)
    .values({
      date: event.block.timestamp,
      daoId,
      tokenId: event.log.address,
      metricType,
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
