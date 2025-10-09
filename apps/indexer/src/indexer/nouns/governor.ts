import { ponder } from "ponder:registry";
import { Address, zeroAddress } from "viem";
import { dao, tokenPrice } from "ponder:schema";

import {
  updateProposalStatus,
  proposalCreated,
  voteCast,
} from "@/eventHandlers";
import { DaoIdEnum } from "@/lib/enums";
import { DAOClient } from "@/interfaces/client";
import {
  MetricTypesEnum,
  ProposalStatus,
  TreasuryAddresses,
} from "@/lib/constants";
import { env } from "@/env";
import { updateSupplyMetric } from "@/eventHandlers/metrics";
import { truncateTimestampTime } from "@/eventHandlers/shared";

export function GovernorIndexer(
  client: DAOClient,
  blockTime: number,
  tokenAddress: Address,
) {
  const daoId = DaoIdEnum.NOUNS;

  ponder.on(`NounsGovernor:setup`, async ({ context }) => {
    const [
      votingPeriod,
      quorum,
      votingDelay,
      timelockDelay,
      proposalThreshold,
    ] = await Promise.all([
      client.getVotingPeriod(),
      client.getQuorum(null),
      client.getVotingDelay(),
      client.getTimelockDelay(),
      client.getProposalThreshold(),
    ]);

    await context.db.insert(dao).values({
      id: daoId,
      votingPeriod,
      quorum,
      votingDelay,
      timelockDelay,
      proposalThreshold,
      chainId: env.CHAIN_ID,
    });
  });

  ponder.on(`NounsGovernor:VoteCast`, async ({ event, context }) => {
    await voteCast(context, daoId, {
      proposalId: event.args.proposalId.toString(),
      voter: event.args.voter,
      reason: event.args.reason,
      support: event.args.support ? 1 : 0,
      timestamp: event.block.timestamp,
      txHash: event.transaction.hash,
      votingPower: event.args.votes,
    });
  });

  ponder.on(`NounsGovernor:ProposalCreated`, async ({ event, context }) => {
    await proposalCreated(context, daoId, blockTime, {
      proposalId: event.args.id.toString(),
      txHash: event.transaction.hash,
      proposer: event.args.proposer,
      targets: [...event.args.targets],
      values: [...event.args.values],
      signatures: [...event.args.signatures],
      calldatas: [...event.args.calldatas],
      startBlock: event.args.startBlock.toString(),
      endBlock: event.args.endBlock.toString(),
      description: event.args.description,
      timestamp: event.block.timestamp,
    });
  });

  ponder.on(`NounsGovernor:ProposalCanceled`, async ({ event, context }) => {
    await updateProposalStatus(
      context,
      event.args.id.toString(),
      ProposalStatus.CANCELED,
    );
  });

  ponder.on(`NounsGovernor:ProposalExecuted`, async ({ event, context }) => {
    await updateProposalStatus(
      context,
      event.args.id.toString(),
      ProposalStatus.EXECUTED,
    );
  });

  ponder.on(`NounsGovernor:ProposalQueued`, async ({ event, context }) => {
    await updateProposalStatus(
      context,
      event.args.id.toString(),
      ProposalStatus.QUEUED,
    );
  });

  ponder.on(`NounsAuction:AuctionSettled`, async ({ event, context }) => {
    await context.db.insert(tokenPrice).values({
      tokenId: tokenAddress,
      price: event.args.amount,
      timestamp: truncateTimestampTime(event.block.timestamp),
    });

    if (!event.transaction.to) return;
    await updateSupplyMetric(
      context,
      "treasury",
      Object.values(TreasuryAddresses[daoId]),
      MetricTypesEnum.TREASURY,
      zeroAddress,
      event.transaction.to,
      event.args.amount,
      daoId,
      tokenAddress,
      event.block.timestamp,
    );
  });
}
