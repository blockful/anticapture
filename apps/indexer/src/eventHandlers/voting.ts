import { Context } from "ponder:registry";
import { accountPower, proposalsOnchain, votesOnchain } from "ponder:schema";

import { ensureAccountExists } from "./shared";
import { Address, Hex } from "viem";

export const voteCast = async (
  context: Context,
  daoId: string,
  args: {
    proposalId: string;
    voter: Address;
    reason: string;
    support: number;
    timestamp: bigint;
    txHash: Hex;
    votingPower: bigint;
  },
) => {
  const { voter, timestamp, txHash, proposalId, support, votingPower, reason } =
    args;

  await ensureAccountExists(context, voter);

  // Update account power with vote statistics
  await context.db
    .insert(accountPower)
    .values({
      accountId: voter,
      daoId,
      votesCount: 1,
      lastVoteTimestamp: timestamp,
      firstVoteTimestamp: timestamp, // Set as first vote timestamp for new accounts
    })
    .onConflictDoUpdate((current) => ({
      votesCount: (current.votesCount ?? 0) + 1,
      lastVoteTimestamp: timestamp,
      // Only set firstVoteTimestamp if it's not already set (0 means never voted before)
      firstVoteTimestamp: current.firstVoteTimestamp ?? timestamp,
    }));

  // Create vote record
  await context.db.insert(votesOnchain).values({
    id: txHash,
    daoId,
    proposalId,
    voterAccountId: voter,
    support: support.toString(),
    votingPower: votingPower.toString(),
    reason,
    timestamp,
  });

  // Update proposal vote totals
  await context.db
    .update(proposalsOnchain, { id: proposalId })
    .set((current) => ({
      againstVotes:
        (current.againstVotes ?? BigInt(0)) +
        (support === 0 ? votingPower : BigInt(0)),
      forVotes:
        (current.forVotes ?? BigInt(0)) +
        (support === 1 ? votingPower : BigInt(0)),
      abstainVotes:
        (current.abstainVotes ?? BigInt(0)) +
        (support === 2 ? votingPower : BigInt(0)),
    }));
};

export const proposalCreated = async (
  context: Context,
  daoId: string,
  args: {
    proposalId: string;
    proposer: Address;
    targets: Address[];
    values: bigint[];
    signatures: Hex[];
    calldatas: Hex[];
    startBlock: string;
    endBlock: string;
    description: string;
    timestamp: bigint;
  },
) => {
  const {
    proposer,
    proposalId,
    targets,
    values,
    signatures,
    calldatas,
    startBlock,
    endBlock,
    description,
    timestamp,
  } = args;

  await ensureAccountExists(context, proposer);

  await context.db.insert(proposalsOnchain).values({
    id: proposalId,
    daoId,
    proposerAccountId: proposer,
    targets: JSON.stringify(targets),
    values: JSON.stringify(values),
    signatures: JSON.stringify(signatures),
    calldatas: JSON.stringify(calldatas),
    startBlock,
    endBlock,
    description,
    timestamp,
    status: "Pending",
  });

  // Update proposer's proposal count
  await context.db
    .insert(accountPower)
    .values({
      accountId: proposer,
      daoId,
      proposalsCount: 1,
    })
    .onConflictDoUpdate((current) => ({
      proposalsCount: current.proposalsCount + 1,
    }));
};

export const proposalCanceled = async (
  context: Context,
  proposalId: string,
) => {
  await context.db.update(proposalsOnchain, { id: proposalId }).set({
    status: "CANCELED",
  });
};

export const proposalExecuted = async (
  context: Context,
  proposalId: string,
) => {
  await context.db.update(proposalsOnchain, { id: proposalId }).set({
    status: "EXECUTED",
  });
};
