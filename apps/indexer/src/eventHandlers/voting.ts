import { Context } from "ponder:registry";
import { accountPower, proposalsOnchain, votesOnchain } from "ponder:schema";
import { Address, Hex } from "viem";

import { ensureAccountExists } from "./shared";
import { ProposalStatus } from "@/lib/constants";

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
    timestamp: bigint;
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
    timestamp,
  } = args;

  await ensureAccountExists(context, proposer);

  const blockDelta = parseInt(endBlock) - parseInt(startBlock);
  await context.db.insert(proposalsOnchain).values({
    id: proposalId,
    txHash,
    daoId,
    proposerAccountId: proposer,
    targets,
    values,
    signatures,
    calldatas,
    startBlock: parseInt(startBlock),
    endBlock: parseInt(endBlock),
    description,
    timestamp,
    status: ProposalStatus.PENDING,
    endTimestamp: timestamp + BigInt(Math.floor(blockDelta * blockTime)),
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
