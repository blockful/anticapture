import { ponder } from "ponder:registry";

import {
  updateProposalStatus,
  proposalCreated,
  voteCast,
} from "@/eventHandlers";
import { DaoIdEnum } from "@/lib/enums";
import { ProposalStatus } from "@/lib/constants";

export function LilNounsGovernorIndexer(blockTime: number) {
  const daoId = DaoIdEnum.LIL_NOUNS;

  ponder.on(`LilNounsGovernor:VoteCast`, async ({ event, context }) => {
    await voteCast(context, daoId, {
      proposalId: event.args.proposalId.toString(),
      voter: event.args.voter,
      reason: event.args.reason,
      support: event.args.support ? 1 : 0,
      timestamp: event.block.timestamp,
      txHash: event.transaction.hash,
      votingPower: event.args.votes,
      logIndex: event.log.logIndex,
    });
  });

  ponder.on(`LilNounsGovernor:ProposalCreated`, async ({ event, context }) => {
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
      blockNumber: event.block.number,
      logIndex: event.log.logIndex,
    });
  });

  ponder.on(`LilNounsGovernor:ProposalCanceled`, async ({ event, context }) => {
    await updateProposalStatus(
      context,
      event.args.id.toString(),
      ProposalStatus.CANCELED,
    );
  });

  ponder.on(`LilNounsGovernor:ProposalExecuted`, async ({ event, context }) => {
    await updateProposalStatus(
      context,
      event.args.id.toString(),
      ProposalStatus.EXECUTED,
    );
  });

  ponder.on(`LilNounsGovernor:ProposalQueued`, async ({ event, context }) => {
    await updateProposalStatus(
      context,
      event.args.id.toString(),
      ProposalStatus.QUEUED,
    );
  });
}
