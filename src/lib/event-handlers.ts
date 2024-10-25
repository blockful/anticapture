import { Context, Event } from "@/generated";

export const delegateChanged = async (
  event:
    | Event<"ENSToken:DelegateChanged">
    | Event<"COMPToken:DelegateChanged">
    | Event<"UNIToken:DelegateChanged">
    | Event<"SHUToken:DelegateChanged">,
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
  event:
    | Event<"ENSToken:DelegateVotesChanged">
    | Event<"COMPToken:DelegateVotesChanged">
    | Event<"UNIToken:DelegateVotesChanged">
    | Event<"SHUToken:DelegateVotesChanged">,
  context: Context,
  daoId: string
) => {
  const { VotingPowerHistory, AccountPower, Account } = context.db;

  //Inserting delegate account if didn't exist
  await Account.upsert({
    id: event.args.delegate,
  });

  const newBalance =
    daoId !== "SHU"
      ? (event as Exclude<typeof event, Event<"SHUToken:DelegateVotesChanged">>)
          .args.newBalance
      : (event as Event<"SHUToken:DelegateVotesChanged">).args.newVotes;

  // Create a new voting power history record
  await VotingPowerHistory.create({
    id: [event.log.id, daoId].join("-"),
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
  event:
    | Event<"ENSToken:Transfer">
    | Event<"COMPToken:Transfer">
    | Event<"UNIToken:Transfer">
    | Event<"SHUToken:Transfer">,
  context: Context,
  daoId: string
) => {
  const { Transfers, AccountPower, Account } = context.db;

  //Picking "value" from the event.args if the dao is ENS or SHU, otherwise picking "amount"
  const value = ["ENS", "SHU"].includes(daoId)
    ? (
        event as Exclude<
          typeof event,
          Event<"COMPToken:Transfer"> & Event<"UNIToken:Transfer">
        >
      ).args.value
    : (
        event as Exclude<
          typeof event,
          Event<"ENSToken:Transfer"> & Event<"SHUToken:Transfer">
        >
      ).args.amount;

  //Inserting delegate account if didn't exist
  await Account.upsert({
    id: event.args.to,
  });
  await Account.upsert({
    id: event.args.from,
  });

  // Create a new transfer record
  await Transfers.create({
    id: event.log.id,
    data: {
      dao: daoId,
      amount: value,
      from: event.args.from,
      to: event.args.to,
      timestamp: event.block.timestamp,
    },
  });

  // Update the from account's balance
  if (event.args.from !== "0x0000000000000000000000000000000000000000") {
    const fromAccount = await AccountPower.upsert({
      id: [event.args.from, daoId].join("-"),
      create: {
        dao: daoId,
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
      console.log(
        "evaluation",
        event.args.from !== "0x0000000000000000000000000000000000000000"
      );
      throw new Error(`Invalid balance`);
    }
  }

  // Update the to account's balance
  await AccountPower.upsert({
    id: [event.args.to, daoId].join("-"),
    create: {
      dao: daoId,
      account: event.args.to,
      balance: BigInt(value),
    },
    update: ({ current }) => ({
      balance: (current.balance ?? BigInt(0)) + BigInt(value),
    }),
  });
};

export const voteCast = async (
  event:
    | Event<"ENSGovernor:VoteCast">,
  context: Context,
  daoId: string
) => {
  const { VotesOnchain, AccountPower, Account, ProposalsOnchain } = context.db;

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
      proposalId: event.args.proposalId.toString(),
      voter: event.args.voter,
      support: event.args.support.toString(),
      weight: event.args.weight.toString(),
      reason: event.args.reason,
      timestamp: event.block.timestamp,
    },
  });

  await ProposalsOnchain.update({
    id: event.args.proposalId.toString(),
    data: ({ current }) => ({
      forVotes:
        (current.forVotes ?? BigInt(0)) +
        (event.args.support === 0 ? event.args.weight : BigInt(0)),
      againstVotes:
        (current.againstVotes ?? BigInt(0)) +
        (event.args.support === 1 ? event.args.weight : BigInt(0)),
      abstainVotes:
        (current.abstainVotes ?? BigInt(0)) +
        (event.args.support === 2 ? event.args.weight : BigInt(0)),
    }),
  });
};
