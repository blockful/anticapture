import { Context, Event } from "@/generated";
import { getValueFromEventArgs } from "./utils";
import viemClient from "./viemClient";

export const delegateChanged = async (
  event: // | Event<"ENSToken:DelegateChanged">
  // | Event<"COMPToken:DelegateChanged">
  // | Event<"SHUToken:DelegateChanged">
  Event<"UNIToken:DelegateChanged">,
  context: Context,
  daoId: string
) => {
  const { Delegations, Account, AccountPower } = context.db;

  //Inserting accounts if didn't exist
  await Account.upsert({
    id: event.args.delegator,
  });
  await Account.upsert({
    id: event.args.toDelegate,
  });
  // Create a new delegation record
  await Delegations.create({
    id: event.log.id,
    data: {
      dao: daoId,
      delegatee: event.args.toDelegate,
      delegator: event.args.delegator,
      timestamp: event.block.timestamp,
    },
  });

  // Update the delegator's delegate
  await AccountPower.upsert({
    id: [event.args.delegator, daoId].join("-"),
    create: {
      account: event.args.delegator,
      dao: daoId,
      delegate: event.args.toDelegate,
    },
    update: () => ({
      delegate: event.args.toDelegate,
    }),
  });

  // Update the delegatee's delegations count
  await AccountPower.upsert({
    id: [event.args.toDelegate, daoId].join("-"),
    create: {
      account: event.args.delegator,
      dao: daoId,
      delegationsCount: 1,
    },
    update: ({ current }) => ({
      delegationsCount: (current.delegationsCount ?? 0) + 1,
    }),
  });
};

export const delegatedVotesChanged = async (
  event: // | Event<"ENSToken:DelegateVotesChanged">
  // | Event<"COMPToken:DelegateVotesChanged">
  // | Event<"SHUToken:DelegateVotesChanged">
  Event<"UNIToken:DelegateVotesChanged">,
  context: Context,
  daoId: string
) => {
  const { VotingPowerHistory, AccountPower, Account } = context.db;

  //Inserting delegate account if didn't exist
  await Account.upsert({
    id: event.args.delegate,
  });

  const newBalance = getValueFromEventArgs<bigint, (typeof event)["args"]>(
    [
      { name: "newBalance", daos: ["ENS", "COMP", "UNI"] },
      { name: "newVotes", daos: ["SHU"] },
    ],
    event.args,
    daoId
  );

  // Create a new voting power history record
  await VotingPowerHistory.create({
    id: event.log.id,
    data: {
      account: event.args.delegate,
      dao: daoId,
      votingPower: newBalance,
      timestamp: event.block.timestamp,
    },
  });

  // Update the delegate's voting power
  await AccountPower.upsert({
    id: [event.args.delegate, daoId].join("-"),
    create: {
      account: event.args.delegate,
      dao: daoId,
      votingPower: newBalance,
    },
    update: () => ({
      votingPower: newBalance,
    }),
  });
};

export const tokenTransfer = async (
  event: // | Event<"ENSToken:Transfer">
  // | Event<"COMPToken:Transfer">
  // | Event<"SHUToken:Transfer">
  Event<"UNIToken:Transfer">,
  context: Context,
  daoId: "UNI"
) => {
  const { Transfers, Account, AccountBalance } = context.db;

  //Picking "value" from the event.args if the dao is ENS or SHU, otherwise picking "amount"
  const value = getValueFromEventArgs<bigint, (typeof event)["args"]>(
    [
      { name: "value", daos: ["ENS", "SHU"] },
      { name: "amount", daos: ["COMP", "UNI"] },
    ],
    event.args,
    daoId
  );

  //Inserting delegate account if didn't exist
  await Account.upsert({
    id: event.args.to,
  });
  await Account.upsert({
    id: event.args.from,
  });

  const uniTokenAddress = viemClient.daoConfigParams[daoId].tokenAddress;

  // Create a new transfer record
  await Transfers.create({
    id: event.log.id,
    data: {
      dao: daoId,
      token: uniTokenAddress,
      amount: value,
      from: event.args.from,
      to: event.args.to,
      timestamp: event.block.timestamp,
    },
  });

  // Update the from account's balance
  if (event.args.from !== "0x0000000000000000000000000000000000000000") {
    const fromAccount = await AccountBalance.upsert({
      id: [event.args.from, uniTokenAddress].join("-"),
      create: {
        token: uniTokenAddress,
        account: event.args.from,
        balance: BigInt(value),
      },
      update: ({ current }) => ({
        balance: (current.balance ?? BigInt(0)) - BigInt(value),
      }),
    });
    // Check if the balances are valid
    if (fromAccount.balance! < BigInt(0)) {
      console.log(`Invalid balance for ${event.args.from}`);
      throw new Error(`Invalid balance`);
    }
  }

  // Update the to account's balance
  await AccountBalance.upsert({
    id: [event.args.to, uniTokenAddress].join("-"),
    create: {
      token: uniTokenAddress,
      account: event.args.to,
      balance: BigInt(value),
    },
    update: ({ current }) => ({
      balance: (current.balance ?? BigInt(0)) + BigInt(value),
    }),
  });
};

export const voteCast = async (
  event: // | Event<"ENSGovernor:VoteCast">
  Event<"UNIGovernor:VoteCast">,
  context: Context,
  daoId: string
) => {
  const { VotesOnchain, AccountPower, Account, ProposalsOnchain } = context.db;

  const weight = getValueFromEventArgs<bigint, (typeof event)["args"]>(
    [
      { name: "weight", daos: ["ENS"] },
      { name: "votes", daos: ["UNI"] },
    ],
    event.args,
    daoId
  );

  const proposalId = getValueFromEventArgs<bigint, (typeof event)["args"]>(
    [
      { name: "proposalId", daos: ["ENS"] },
      { name: "id", daos: ["UNI"] },
    ],
    event.args,
    daoId
  );

  await Account.upsert({
    id: event.args.voter,
  });

  await AccountPower.upsert({
    id: [event.args.voter, daoId].join("-"),
    create: {
      dao: daoId,
      account: event.args.voter,
      votesCount: 1,
    },
    update: ({ current }) => ({
      votesCount: (current.votesCount ?? 0) + 1,
    }),
  });

  // Create vote record
  await VotesOnchain.create({
    id: event.log.id,
    data: {
      dao: daoId,
      proposalId: [proposalId, daoId].join("-"),
      voter: event.args.voter,
      support: event.args.support.toString(),
      weight: weight.toString(),
      reason: event.args.reason,
      timestamp: event.block.timestamp,
    },
  });

  await ProposalsOnchain.update({
    id: [proposalId, daoId].join("-"),
    data: ({ current }) => ({
      forVotes:
        (current.forVotes ?? BigInt(0)) +
        (event.args.support === 0 ? weight : BigInt(0)),
      againstVotes:
        (current.againstVotes ?? BigInt(0)) +
        (event.args.support === 1 ? weight : BigInt(0)),
      abstainVotes:
        (current.abstainVotes ?? BigInt(0)) +
        (event.args.support === 2 ? weight : BigInt(0)),
    }),
  });
};

export const proposalCreated = async (
  event: // | Event<"ENSGovernor:ProposalCreated">
  Event<"UNIGovernor:ProposalCreated">,
  context: Context,
  daoId: string
) => {
  const { ProposalsOnchain, Account, AccountPower } = context.db;

  const proposalId = getValueFromEventArgs<bigint, (typeof event)["args"]>(
    [
      { name: "proposalId", daos: ["ENS"] },
      { name: "id", daos: ["UNI"] },
    ],
    event.args,
    daoId
  );

  await Account.upsert({
    id: event.args.proposer,
  });

  // Create proposal record
  await ProposalsOnchain.create({
    id: [proposalId, daoId].join("-"),
    data: {
      dao: daoId,
      proposer: event.args.proposer,
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
    },
  });

  await AccountPower.upsert({
    id: event.args.proposer,
    create: {
      dao: daoId,
      account: event.args.proposer,
      proposalsCount: 1,
    },
    update: ({ current }) => ({
      proposalsCount: (current.proposalsCount ?? 0) + 1,
    }),
  });
};

export const proposalCanceled = async (
  event: // | Event<"ENSGovernor:ProposalCanceled">
  Event<"UNIGovernor:ProposalCanceled">,
  context: Context,
  daoId: string
) => {
  const { ProposalsOnchain } = context.db;
  const proposalId = getValueFromEventArgs<bigint, (typeof event)["args"]>(
    [
      { name: "proposalId", daos: ["ENS"] },
      { name: "id", daos: ["UNI"] },
    ],
    event.args,
    daoId
  );
  await ProposalsOnchain.update({
    id: [proposalId, daoId].join("-"),
    data: { status: "CANCELED" },
  });
};

export const proposalExecuted = async (
  event: // | Event<"ENSGovernor:ProposalExecuted">
  Event<"UNIGovernor:ProposalExecuted">,
  context: Context,
  daoId: string
) => {
  const { ProposalsOnchain } = context.db;
  const proposalId = getValueFromEventArgs<bigint, (typeof event)["args"]>(
    [
      { name: "proposalId", daos: ["ENS"] },
      { name: "id", daos: ["UNI"] },
    ],
    event.args,
    daoId
  );
  await ProposalsOnchain.update({
    id: [proposalId, daoId].join("-"),
    data: { status: "EXECUTED" },
  });
};
