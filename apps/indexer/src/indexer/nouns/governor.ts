import { ponder } from "ponder:registry";
import { tokenPrice } from "ponder:schema";

import {
  updateProposalStatus,
  proposalCreated,
  voteCast,
} from "@/eventHandlers";
import { DaoIdEnum } from "@/lib/enums";
import { ProposalStatus } from "@/lib/constants";
import { truncateTimestampTime } from "@/eventHandlers/shared";

export function GovernorIndexer(blockTime: number) {
  const daoId = DaoIdEnum.NOUNS;

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
      price: event.args.amount,
      timestamp: truncateTimestampTime(event.block.timestamp),
    });
  });
}
