import { Context } from "ponder:registry";
import {
  accountPower,
  proposalsOnchain,
  ProposalStatus,
  votesOnchain,
} from "ponder:schema";

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
      votesCount: current.votesCount + 1,
      lastVoteTimestamp: timestamp,
      // Only set firstVoteTimestamp if it's not already set (0 means never voted before)
      firstVoteTimestamp: current.firstVoteTimestamp ?? timestamp,
    }));

  // Create vote record
  await context.db.insert(votesOnchain).values({
    txHash: txHash,
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
      againstVotes: current.againstVotes + (support === 0 ? votingPower : 0n),
      forVotes: current.forVotes + (support === 1 ? votingPower : 0n),
      abstainVotes: current.abstainVotes + (support === 2 ? votingPower : 0n),
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
    signatures: string[];
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
    targets,
    values,
    signatures,
    calldatas,
    startBlock,
    endBlock,
    description,
    timestamp,
    status: ProposalStatus.PENDING,
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
    status: ProposalStatus.CANCELED,
  });
};

export const proposalExecuted = async (
  context: Context,
  proposalId: string,
) => {
  await context.db.update(proposalsOnchain, { id: proposalId }).set({
    status: ProposalStatus.EXECUTED,
  });
};
