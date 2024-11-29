import { Context, Event } from "@/generated";
import { getValueFromEventArgs } from "./utils";
import viemClient from "./viemClient";
import {
  Account,
  AccountBalance,
  AccountPower,
  Delegations,
  ProposalsOnchain,
  Transfers,
  VotesOnchain,
  VotingPowerHistory,
} from "../../ponder.schema";

export const delegateChanged = async (
  event: // | Event<"ENSToken:DelegateChanged">
  // | Event<"COMPToken:DelegateChanged">
  // | Event<"SHUToken:DelegateChanged">
  Event<"UNIToken:DelegateChanged">,
  context: Context,
  daoId: string
) => {
  //Inserting accounts if didn't exist
  await context.db
    .insert(Account)
    .values({
      id: event.args.delegator,
    })
    .onConflictDoNothing();
  await context.db
    .insert(Account)
    .values({
      id: event.args.toDelegate,
    })
    .onConflictDoNothing();
  // Create a new delegation record
  await context.db.insert(Delegations).values({
    id: event.log.id,
    daoId,
    delegateeAccountId: event.args.toDelegate,
    delegatorAccountId: event.args.delegator,
    timestamp: event.block.timestamp,
  });

  // Update the delegator's delegate
  await context.db
    .insert(AccountPower)
    .values({
      id: [event.args.delegator, daoId].join("-"),
      accountId: event.args.delegator,
      daoId,
      delegate: event.args.toDelegate,
    })
    .onConflictDoUpdate({
      delegate: event.args.toDelegate,
    });

  // Update the delegatee's delegations count
  await context.db
    .insert(AccountPower)
    .values({
      id: [event.args.toDelegate, daoId].join("-"),
      accountId: event.args.toDelegate,
      daoId,
      delegationsCount: 1,
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
  daoId: string
) => {
  //Inserting delegate account if didn't exist
  await context.db
    .insert(Account)
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
    daoId
  );

  // Create a new voting power history record
  await context.db.insert(VotingPowerHistory).values({
    id: event.log.id,
    accountId: event.args.delegate,
    daoId,
    votingPower: newBalance,
    timestamp: event.block.timestamp,
  });

  // Update the delegate's voting power
  await context.db
    .insert(AccountPower)
    .values({
      id: [event.args.delegate, daoId].join("-"),
      accountId: event.args.delegate,
      daoId,
      votingPower: newBalance,
    })
    .onConflictDoUpdate({
      votingPower: newBalance,
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
  await context.db
    .insert(Account)
    .values({
      id: event.args.to,
    })
    .onConflictDoNothing();
  await context.db
    .insert(Account)
    .values({
      id: event.args.from,
    })
    .onConflictDoNothing();

  const uniTokenAddress = viemClient.daoConfigParams[daoId].tokenAddress;

  // Create a new transfer record
  await context.db.insert(Transfers).values({
    id: event.log.id,
    daoId,
    tokenId: uniTokenAddress,
    amount: value,
    fromAccountId: event.args.from,
    toAccountId: event.args.to,
    timestamp: event.block.timestamp,
  });

  // Update the from account's balance
  if (event.args.from !== "0x0000000000000000000000000000000000000000") {
    const fromAccount = await context.db
      .insert(AccountBalance)
      .values({
        id: [event.args.from, uniTokenAddress].join("-"),
        tokenId: uniTokenAddress,
        accountId: event.args.from,
        balance: BigInt(value),
      })
      .onConflictDoUpdate((current) => ({
        balance: (current.balance ?? BigInt(0)) - BigInt(value),
      }));
    // Check if the balances are valid
    if (fromAccount.balance! < BigInt(0)) {
      console.log(`Invalid balance for ${event.args.from}`);
      throw new Error(`Invalid balance`);
    }
  }

  // Update the to account's balance
  await context.db
    .insert(AccountBalance)
    .values({
      id: [event.args.to, uniTokenAddress].join("-"),
      tokenId: uniTokenAddress,
      accountId: event.args.to,
      balance: BigInt(value),
    })
    .onConflictDoUpdate((current) => ({
      balance: (current.balance ?? BigInt(0)) + BigInt(value),
    }));
};

export const voteCast = async (
  event: // | Event<"ENSGovernor:VoteCast">
  Event<"UNIGovernor:VoteCast">,
  context: Context,
  daoId: string
) => {
  const weight = getValueFromEventArgs<bigint, (typeof event)["args"]>(
    [
      { name: "weight", daos: ["ENS"] },
      { name: "votes", daos: ["UNI"] },
    ],
    event.args,
    daoId
  );

  const proposalId = getValueFromEventArgs<bigint, (typeof event)["args"]>(
    [{ name: "proposalId", daos: ["ENS", "UNI"] }],
    event.args,
    daoId
  );

  await context.db
    .insert(Account)
    .values({
      id: event.args.voter,
    })
    .onConflictDoNothing();

  await context.db
    .insert(AccountPower)
    .values({
      id: [event.args.voter, daoId].join("-"),
      daoId,
      accountId: event.args.voter,
      votesCount: 1,
    })
    .onConflictDoUpdate((current) => ({
      votesCount: (current.votesCount ?? 0) + 1,
    }));

  // Create vote record
  await context.db.insert(VotesOnchain).values({
    id: event.log.id,
    daoId,
    proposalId: [proposalId, daoId].join("-"),
    voterAccountId: event.args.voter,
    support: event.args.support.toString(),
    weight: weight.toString(),
    reason: event.args.reason,
    timestamp: event.block.timestamp,
  });

  await context.db
    .update(ProposalsOnchain, [proposalId, daoId].join("-"))
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
  event: // | Event<"ENSGovernor:ProposalCreated">
  Event<"UNIGovernor:ProposalCreated">,
  context: Context,
  daoId: string
) => {
  const proposalId = getValueFromEventArgs<bigint, (typeof event)["args"]>(
    [
      { name: "proposalId", daos: ["ENS"] },
      { name: "id", daos: ["UNI"] },
    ],
    event.args,
    daoId
  );

  await context.db
    .insert(Account)
    .values({
      id: event.args.proposer,
    })
    .onConflictDoNothing();

  // Create proposal record
  await context.db.insert(ProposalsOnchain).values({
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
    .insert(AccountPower)
    .values({
      id: event.args.proposer,
      create: {
        daoId,
        accountId: event.args.proposer,
        proposalsCount: 1,
      },
    })
    .onConflictDoUpdate((current) => ({
      proposalsCount: (current.proposalsCount ?? 0) + 1,
    }));
};

export const proposalCanceled = async (
  event: // | Event<"ENSGovernor:ProposalCanceled">
  Event<"UNIGovernor:ProposalCanceled">,
  context: Context,
  daoId: string
) => {
  const proposalId = getValueFromEventArgs<bigint, (typeof event)["args"]>(
    [
      { name: "proposalId", daos: ["ENS"] },
      { name: "id", daos: ["UNI"] },
    ],
    event.args,
    daoId
  );
  await context.db.insert(ProposalsOnchain).values({
    id: [proposalId, daoId].join("-"),
    status: "CANCELED",
  });
};

export const proposalExecuted = async (
  event: // | Event<"ENSGovernor:ProposalExecuted">
  Event<"UNIGovernor:ProposalExecuted">,
  context: Context,
  daoId: string
) => {
  const proposalId = getValueFromEventArgs<bigint, (typeof event)["args"]>(
    [
      { name: "proposalId", daos: ["ENS"] },
      { name: "id", daos: ["UNI"] },
    ],
    event.args,
    daoId
  );
  await context.db.update(ProposalsOnchain, [proposalId, daoId].join("-")).set({
    status: "EXECUTED",
  });
};
