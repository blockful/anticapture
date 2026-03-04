import { Context } from "ponder:registry";
import {
  accountPower,
  feedEvent,
  proposalsOnchain,
  votesOnchain,
} from "ponder:schema";
import { Address, getAddress, Hex } from "viem";

import { ProposalStatus } from "@/lib/constants";

import { ensureAccountExists } from "./shared";

/**
 * ### Creates:
 * - New `Account` record (for voter if it doesn't exist)
 * - New `AccountPower` record (if voter doesn't have one for this DAO)
 * - New `votesOnchain` record with vote details (transaction hash, support, voting power, reason)
 *
 * ### Updates:
 * - `AccountPower`: Increments voter's total vote count by 1
 * - `AccountPower`: Sets last vote timestamp to current vote timestamp
 * - `AccountPower`: Sets first vote timestamp (only if voter has never voted before)
 * - `proposalsOnchain`: Increments `againstVotes` if support is 0 (against)
 * - `proposalsOnchain`: Increments `forVotes` if support is 1 (for)
 * - `proposalsOnchain`: Increments `abstainVotes` if support is 2 (abstain)
 */
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
    logIndex: number;
  },
) => {
  const {
    voter,
    timestamp,
    txHash,
    proposalId,
    support,
    votingPower,
    reason,
    logIndex,
  } = args;

  await ensureAccountExists(context, voter);

  // Update account power with vote statistics
  await context.db
    .insert(accountPower)
    .values({
      accountId: getAddress(voter),
      daoId,
      votesCount: 1,
      lastVoteTimestamp: timestamp,
    })
    .onConflictDoUpdate((current) => ({
      votesCount: current.votesCount + 1,
      lastVoteTimestamp: timestamp,
    }));

  // Create vote record
  await context.db.insert(votesOnchain).values({
    txHash: txHash,
    daoId,
    proposalId,
    voterAccountId: getAddress(voter),
    support: support.toString(),
    votingPower,
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

  const proposal = await context.db.find(proposalsOnchain, { id: proposalId });

  await context.db.insert(feedEvent).values({
    txHash,
    logIndex,
    type: "VOTE",
    value: votingPower,
    timestamp,
    metadata: {
      voter: getAddress(voter),
      reason,
      support,
      votingPower,
      proposalId,
      title: proposal?.title ?? undefined,
    },
  });
};

/**
 * ### Creates:
 * - New `Account` record (for proposer if it doesn't exist)
 * - New `proposalsOnchain` record with proposal details (targets, values, signatures, calldatas, blocks, description, status)
 * - New `AccountPower` record (if proposer doesn't have one for this DAO)
 *
 * ### Updates:
 * - `AccountPower`: Increments proposer's total proposals count by 1
 *
 * ### Calculates:
 * - Proposal end timestamp based on block delta and average block time
 * - Sets initial proposal status to PENDING
 */
export const proposalCreated = async (
  context: Context,
  daoId: string,
  blockTime: number,
  args: {
    proposalId: string;
    txHash: Hex;
    proposer: Address;
    targets: Address[];
    values: bigint[];
    signatures: string[];
    calldatas: Hex[];
    startBlock: string;
    endBlock: string;
    description: string;
    blockNumber: bigint;
    timestamp: bigint;
    proposalType?: number;
    logIndex: number;
  },
) => {
  const {
    proposer,
    proposalId,
    txHash,
    targets,
    values,
    signatures,
    calldatas,
    startBlock,
    endBlock,
    description,
    blockNumber,
    timestamp,
    logIndex,
  } = args;

  await ensureAccountExists(context, proposer);

  const title = description.split("\n")[0]?.replace(/^#+\s*/, "") || null;
  const blockDelta = parseInt(endBlock) - Number(blockNumber);
  await context.db.insert(proposalsOnchain).values({
    id: proposalId,
    txHash,
    daoId,
    proposerAccountId: getAddress(proposer),
    targets: targets.map((a) => getAddress(a)),
    values,
    signatures,
    calldatas,
    startBlock: parseInt(startBlock),
    endBlock: parseInt(endBlock),
    title,
    description,
    timestamp,
    status: ProposalStatus.PENDING,
    endTimestamp: timestamp + BigInt(blockDelta * blockTime),
    proposalType: args.proposalType,
  });

  // Update proposer's proposal count
  const { votingPower: proposerVotingPower } = await context.db
    .insert(accountPower)
    .values({
      accountId: getAddress(proposer),
      daoId,
      proposalsCount: 1,
    })
    .onConflictDoUpdate((current) => ({
      proposalsCount: current.proposalsCount + 1,
    }));

  // Insert feed event for activity feed
  // Proposals are always high relevance as they are significant governance actions
  await context.db.insert(feedEvent).values({
    txHash,
    logIndex,
    type: "PROPOSAL",
    timestamp,
    metadata: {
      id: proposalId,
      proposer: getAddress(proposer),
      votingPower: proposerVotingPower,
      title,
    },
  });
};

/**
 * ### Updates:
 * - `proposalsOnchain`: Sets the proposal status to the provided status value
 */
export const updateProposalStatus = async (
  context: Context,
  proposalId: string,
  status: string,
) => {
  await context.db.update(proposalsOnchain, { id: proposalId }).set({
    status,
  });
};

/**
 * ### Updates:
 * - `proposalsOnchain`: Sets the new deadline (endBlock) and endTimestamp
 */
export const proposalExtended = async (
  context: Context,
  proposalId: string,
  blockTime: number,
  extendedDeadline: bigint,
  txHash: Hex,
  logIndex: number,
  timestamp: bigint,
) => {
  let endTimestamp: bigint | undefined;

  await context.db.update(proposalsOnchain, { id: proposalId }).set((row) => {
    endTimestamp =
      row.endTimestamp +
      BigInt((Number(extendedDeadline) - row.endBlock) * blockTime);
    return {
      row,
      endBlock: Number(extendedDeadline),
      endTimestamp,
    };
  });

  const proposal = await context.db.find(proposalsOnchain, { id: proposalId });

  await context.db.insert(feedEvent).values({
    txHash,
    logIndex,
    type: "PROPOSAL_EXTENDED",
    timestamp,
    metadata: {
      id: proposalId,
      title: proposal?.title ?? undefined,
      endBlock: Number(extendedDeadline),
      endTimestamp,
      proposer: getAddress(proposal!.proposerAccountId),
    },
  });
};
