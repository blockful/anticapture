import { Context } from "ponder:registry";
import {
  accountPower,
  feedEvent,
  proposalsOnchain,
  votesOnchain,
} from "ponder:schema";
import { Address, getAddress, Hex } from "viem";

import { ProposalStatus } from "@/lib/constants";
import { voteWeightByChoice, type VoteWeights } from "@/lib/vote-support";

import {
  applyProposalContentUpdate,
  parseProposalTitle,
  type ProposalContentPatch,
} from "./proposal-content";
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
    /**
     * How the ballot splits across the proposal counters. Defaults to the
     * whole weight on `support`; fractional ballots (support 255) pass the
     * decoded split instead.
     */
    weights?: VoteWeights;
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
    weights = voteWeightByChoice({ support, weight: votingPower }),
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
    logIndex,
  });

  // Update proposal vote totals
  await context.db
    .update(proposalsOnchain, { id: proposalId })
    .set((current) => ({
      againstVotes: current.againstVotes + weights.againstVotes,
      forVotes: current.forVotes + weights.forVotes,
      abstainVotes: current.abstainVotes + weights.abstainVotes,
    }));

  await context.db.insert(feedEvent).values({
    txHash,
    logIndex,
    type: "VOTE",
    value: votingPower,
    timestamp,
    proposalId,
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

  const title = parseProposalTitle(description);
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
    logIndex,
    status: ProposalStatus.PENDING,
    endTimestamp: timestamp + BigInt(blockDelta * blockTime),
    proposalType: args.proposalType,
  });

  // Update proposer's proposal count
  await context.db
    .insert(accountPower)
    .values({
      accountId: getAddress(proposer),
      daoId,
      proposalsCount: 1,
    })
    .onConflictDoUpdate((current) => ({
      proposalsCount: current.proposalsCount + 1,
    }));

  await context.db.insert(feedEvent).values({
    txHash,
    logIndex,
    type: "PROPOSAL",
    timestamp,
    proposalId,
  });
};

/**
 * Applies a proposal edit (Nouns `ProposalUpdated`,
 * `ProposalDescriptionUpdated`, `ProposalTransactionsUpdated`) without
 * touching the fields the event did not carry. A new description re-parses
 * the title.
 */
export const updateProposalContent = async (
  context: Context,
  proposalId: string,
  patch: ProposalContentPatch,
) => {
  await context.db
    .update(proposalsOnchain, { id: proposalId })
    .set((current) => applyProposalContentUpdate(current, patch));
};

/**
 * ### Updates:
 * - `proposalsOnchain`: Sets the proposal status to the provided status value
 * - `proposalsOnchain`: Sets queuedTimestamp and queuedTxHash when status is QUEUED
 * - `proposalsOnchain`: Sets executedTimestamp and executedTxHash when status is EXECUTED
 */
export const updateProposalStatus = async (
  context: Context,
  proposalId: string,
  status: ProposalStatus,
  timestamp: bigint,
  txHash: Hex,
) => {
  const extra: {
    queuedTimestamp?: bigint;
    executedTimestamp?: bigint;
    queuedTxHash?: string;
    executedTxHash?: string;
  } = {};
  if (status === ProposalStatus.QUEUED) {
    extra.queuedTimestamp = timestamp;
    extra.queuedTxHash = txHash;
  }
  if (status === ProposalStatus.EXECUTED) {
    extra.executedTimestamp = timestamp;
    extra.executedTxHash = txHash;
  }
  await context.db
    .update(proposalsOnchain, { id: proposalId })
    .set({ status, ...extra });
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
  await context.db.update(proposalsOnchain, { id: proposalId }).set((row) => ({
    row,
    endBlock: Number(extendedDeadline),
    endTimestamp:
      row.endTimestamp +
      BigInt((Number(extendedDeadline) - row.endBlock) * blockTime),
  }));

  await context.db.insert(feedEvent).values({
    txHash,
    logIndex,
    type: "PROPOSAL_EXTENDED",
    timestamp,
    proposalId,
  });
};
