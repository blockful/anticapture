import { Context } from "ponder:registry";
import { accountPower, proposalsOnchain, votesOnchain } from "ponder:schema";

import { getValueFromEventArgs } from "@/lib/utils";
import {
  DaoProposalCanceledEvent,
  DaoProposalCreatedEvent,
  DaoProposalExecutedEvent,
  DaoVoteCastEvent,
} from "@/indexer/types";
import { ensureAccountExists } from "./shared";

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

  // Ensure voter account exists
  await ensureAccountExists(context, event.args.voter);

  // Update account power with vote statistics
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
    daoId,
    proposalId: String(proposalId),
    voterAccountId: event.args.voter,
    support: event.args.support.toString(),
    votingPower: weight.toString(),
    reason: event.args.reason,
    timestamp: event.block.timestamp,
  });

  // Update proposal vote totals
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

  // Ensure proposer account exists
  await ensureAccountExists(context, event.args.proposer);

  // Create proposal record
  await context.db.insert(proposalsOnchain).values({
    id: String(proposalId),
    daoId,
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
  });

  // Update proposer's proposal count
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
