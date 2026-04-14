import type { handlerContext } from "../../generated/index.js";
import type { EventType_t } from "../../generated/src/db/Enums.gen.ts";
import type { Address, Hex } from "viem";
import { getAddress } from "viem";

import { ProposalStatus } from "../lib/constants.ts";

import { ensureAccountExists } from "./shared.ts";

export const voteCast = async (
  context: handlerContext,
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

  const normalizedVoter = getAddress(voter);
  const powerId = normalizedVoter;
  const existingPower = await context.AccountPower.get(powerId);
  context.AccountPower.set({
    id: powerId,
    accountId: normalizedVoter,
    daoId,
    votingPower: existingPower?.votingPower ?? 0n,
    votesCount: (existingPower?.votesCount ?? 0) + 1,
    proposalsCount: existingPower?.proposalsCount ?? 0,
    delegationsCount: existingPower?.delegationsCount ?? 0,
    lastVoteTimestamp: timestamp,
  });

  context.VoteOnchain.set({
    id: `${normalizedVoter}-${proposalId}`,
    txHash,
    daoId,
    proposalId,
    voterAccountId: normalizedVoter,
    support: support.toString(),
    votingPower,
    reason,
    timestamp,
  });

  // Update proposal vote totals
  const proposal = await context.ProposalOnchain.get(proposalId);
  if (proposal) {
    context.ProposalOnchain.set({
      ...proposal,
      againstVotes: proposal.againstVotes + (support === 0 ? votingPower : 0n),
      forVotes: proposal.forVotes + (support === 1 ? votingPower : 0n),
      abstainVotes: proposal.abstainVotes + (support === 2 ? votingPower : 0n),
    });
  }

  context.FeedEvent.set({
    id: `${txHash}-${logIndex}`,
    txHash,
    logIndex,
    eventType: "VOTE" as EventType_t,
    value: votingPower,
    timestamp,
    metadata: {
      voter: normalizedVoter,
      reason,
      support,
      votingPower: votingPower.toString(),
      proposalId,
      title: proposal?.title ?? null,
    },
  });
};

const MAX_TITLE_LENGTH = 200;

function parseProposalTitle(description: string): string {
  const normalized = description.replace(/\\n/g, "\n");
  const lines = normalized.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^# /.test(trimmed)) {
      return trimmed.replace(/^# +/, "");
    }
    break;
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || /^#{1,6}\s/.test(trimmed)) continue;
    return trimmed.length > MAX_TITLE_LENGTH
      ? trimmed.substring(0, MAX_TITLE_LENGTH) + "..."
      : trimmed;
  }

  return "";
}

export const proposalCreated = async (
  context: handlerContext,
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

  context.ProposalOnchain.set({
    id: proposalId,
    txHash,
    daoId,
    proposerAccountId: getAddress(proposer),
    targets: targets.map((a) => getAddress(a)),
    values: values.map((v) => v.toString()),
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
    forVotes: 0n,
    againstVotes: 0n,
    abstainVotes: 0n,
  });

  const powerId = getAddress(proposer);
  const existingPower = await context.AccountPower.get(powerId);
  const proposerVotingPower = existingPower?.votingPower ?? 0n;
  context.AccountPower.set({
    id: powerId,
    accountId: powerId,
    daoId,
    votingPower: proposerVotingPower,
    votesCount: existingPower?.votesCount ?? 0,
    proposalsCount: (existingPower?.proposalsCount ?? 0) + 1,
    delegationsCount: existingPower?.delegationsCount ?? 0,
    lastVoteTimestamp: existingPower?.lastVoteTimestamp ?? 0n,
  });

  context.FeedEvent.set({
    id: `${txHash}-${logIndex}`,
    txHash,
    logIndex,
    eventType: "PROPOSAL" as EventType_t,
    value: 0n,
    timestamp,
    metadata: {
      id: proposalId,
      proposer: getAddress(proposer),
      votingPower: proposerVotingPower.toString(),
      title,
    },
  });
};

export const updateProposalStatus = async (
  context: handlerContext,
  proposalId: string,
  status: string,
) => {
  const proposal = await context.ProposalOnchain.get(proposalId);
  if (proposal) {
    context.ProposalOnchain.set({ ...proposal, status });
  }
};

export const proposalExtended = async (
  context: handlerContext,
  proposalId: string,
  blockTime: number,
  extendedDeadline: bigint,
  txHash: Hex,
  logIndex: number,
  timestamp: bigint,
) => {
  const proposal = await context.ProposalOnchain.get(proposalId);
  if (!proposal) return;

  const endTimestamp =
    proposal.endTimestamp +
    BigInt((Number(extendedDeadline) - proposal.endBlock) * blockTime);

  context.ProposalOnchain.set({
    ...proposal,
    endBlock: Number(extendedDeadline),
    endTimestamp,
  });

  context.FeedEvent.set({
    id: `${txHash}-${logIndex}`,
    txHash,
    logIndex,
    eventType: "PROPOSAL_EXTENDED" as EventType_t,
    value: 0n,
    timestamp,
    metadata: {
      id: proposalId,
      title: proposal.title,
      endBlock: Number(extendedDeadline),
      endTimestamp: endTimestamp.toString(),
      proposer: getAddress(proposal.proposerAccountId),
    },
  });
};
