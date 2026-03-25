import { ponder } from "ponder:registry";
import {
  accountBalance,
  accountPower,
  feedEvent,
  proposalsOnchain,
} from "ponder:schema";
import { getAddress } from "viem";

import {
  delegateChanged,
  updateProposalStatus,
  voteCast,
} from "@/eventHandlers";
import { ensureAccountExists } from "@/eventHandlers/shared";
import { CONTRACT_ADDRESSES, ProposalStatus } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

const MAX_TITLE_LENGTH = 200;

/**
 * Extracts a proposal title from a markdown description.
 *
 * Strategy:
 * 1. Normalize literal `\n` sequences to real newlines (some proposers
 *    submit descriptions with escaped newlines).
 * 2. If the first non-empty line is an H1 (`# Title`), use it.
 * 3. Otherwise, use the first non-empty line that is not a section header
 *    (H2+), truncated to MAX_TITLE_LENGTH characters.
 */
function parseProposalTitle(description: string): string {
  // Try JSON first — some Tornado proposals use {"title":"...","description":"..."}
  try {
    const parsed = JSON.parse(description) as {
      title?: string;
      description?: string;
    };
    if (parsed.title) return parsed.title;
  } catch {
    // Not JSON, continue with markdown parsing
  }

  // Normalize literal "\n" (two chars) into real newlines
  const normalized = description.replace(/\\n/g, "\n");
  const lines = normalized.split("\n");

  // Pass 1: look for an H1 among leading lines (before any content)
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^# /.test(trimmed)) {
      return trimmed.replace(/^# +/, "");
    }
    break; // stop at first non-empty, non-H1 line
  }

  // Pass 2: no H1 found — use first non-empty, non-header line
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || /^#{1,6}\s/.test(trimmed)) continue;
    return trimmed.length > MAX_TITLE_LENGTH
      ? trimmed.substring(0, MAX_TITLE_LENGTH) + "..."
      : trimmed;
  }

  return "";
}

/**
 * Custom governance indexer for Tornado Cash DAO.
 *
 * Key differences from standard governors:
 * - ProposalCreated uses timestamps (startTime/endTime) instead of block numbers
 * - Voted event uses bool support instead of uint8
 * - Delegation happens through the governance contract (Delegated/Undelegated events)
 */
export function TORNGovernorIndexer(blockTime: number) {
  const daoId = DaoIdEnum.TORN;
  const TORN_TOKEN_ADDRESS = getAddress(
    CONTRACT_ADDRESSES[DaoIdEnum.TORN].token.address,
  );

  ponder.on("TORNGovernor:ProposalCreated", async ({ event, context }) => {
    const { id, proposer, target, startTime, endTime, description } =
      event.args;
    const proposalIdStr = id.toString();

    await ensureAccountExists(context, proposer);

    const title = parseProposalTitle(description);

    // Convert timestamps to synthetic block numbers for schema compat
    const startBlock =
      Number(event.block.number) +
      Math.floor(
        (Number(startTime) - Number(event.block.timestamp)) / blockTime,
      );
    const endBlock =
      Number(event.block.number) +
      Math.floor((Number(endTime) - Number(event.block.timestamp)) / blockTime);

    await context.db.insert(proposalsOnchain).values({
      id: proposalIdStr,
      txHash: event.transaction.hash,
      daoId,
      proposerAccountId: getAddress(proposer),
      targets: [getAddress(target)],
      values: [],
      signatures: [],
      calldatas: [],
      startBlock,
      endBlock,
      title,
      description,
      timestamp: event.block.timestamp,
      logIndex: event.log.logIndex,
      status: ProposalStatus.ACTIVE,
      endTimestamp: endTime,
    });

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

    await context.db.insert(feedEvent).values({
      txHash: event.transaction.hash,
      logIndex: event.log.logIndex,
      type: "PROPOSAL",
      timestamp: event.block.timestamp,
      metadata: {
        id: proposalIdStr,
        proposer: getAddress(proposer),
        votingPower: proposerVotingPower,
        title,
      },
    });
  });

  ponder.on("TORNGovernor:Voted", async ({ event, context }) => {
    const { proposalId, voter, support, votes } = event.args;

    await voteCast(context, daoId, {
      proposalId: proposalId.toString(),
      voter,
      reason: "",
      support: support ? 1 : 0,
      timestamp: event.block.timestamp,
      txHash: event.transaction.hash,
      votingPower: votes,
      logIndex: event.log.logIndex,
    });
  });

  ponder.on("TORNGovernor:ProposalExecuted", async ({ event, context }) => {
    await updateProposalStatus(
      context,
      event.args.proposalId.toString(),
      ProposalStatus.EXECUTED,
    );
  });

  ponder.on("TORNGovernor:Delegated", async ({ event, context }) => {
    const { account, to } = event.args;

    // Look up the previous delegate from accountBalance
    const existing = await context.db.find(accountBalance, {
      accountId: getAddress(account),
      tokenId: TORN_TOKEN_ADDRESS,
    });
    const previousDelegate = existing?.delegate ?? getAddress(account);

    await delegateChanged(context, daoId, {
      delegator: account,
      delegate: to,
      tokenId: TORN_TOKEN_ADDRESS,
      previousDelegate,
      txHash: event.transaction.hash,
      timestamp: event.block.timestamp,
      logIndex: event.log.logIndex,
    });
  });

  ponder.on("TORNGovernor:Undelegated", async ({ event, context }) => {
    const { account, from } = event.args;

    // Undelegation: delegate reverts to self, previous delegate was `from`
    await delegateChanged(context, daoId, {
      delegator: account,
      delegate: account,
      tokenId: TORN_TOKEN_ADDRESS,
      previousDelegate: from,
      txHash: event.transaction.hash,
      timestamp: event.block.timestamp,
      logIndex: event.log.logIndex,
    });
  });
}
