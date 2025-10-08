import { ponder } from "ponder:registry";

import {
  updateProposalStatus,
  proposalCreated,
  voteCast,
} from "@/eventHandlers";
import { DaoIdEnum } from "@/lib/enums";
import { DAOClient } from "@/interfaces/client";
import { dao } from "ponder:schema";
import { ProposalStatus } from "@/lib/constants";
import { env } from "@/env";

export function GovernorIndexer(client: DAOClient, blockTime: number) {
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

  // ponder.on(`NounsGovernor:AuctionSettled`, async ({ event, context }) => {
  // await delegatedVotesChanged(context, daoId, {
  //   tokenId: event.log.address,
  //   delegate: event.args.delegate,
  //   txHash: event.transaction.hash,
  //   newBalance: event.args.newBalance,
  //   oldBalance: event.args.previousBalance,
  //   timestamp: event.block.timestamp,
  //   logIndex: event.log.logIndex,
  // });
  // });
}
