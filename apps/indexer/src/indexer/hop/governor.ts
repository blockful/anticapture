import { ponder } from "ponder:registry";

import {
  proposalCreated,
  proposalExtended,
  updateProposalStatus,
  voteCast,
} from "@/eventHandlers";
import { ProposalStatus } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

export function HOPGovernorIndexer(blockTime: number) {
  const daoId = DaoIdEnum.HOP;

  ponder.on("HOPGovernor:VoteCast", async ({ event, context }) => {
    await voteCast(context, daoId, {
      proposalId: event.args.proposalId.toString(),
      voter: event.args.voter,
      reason: event.args.reason,
      support: event.args.support,
      timestamp: event.block.timestamp,
      txHash: event.transaction.hash,
      votingPower: event.args.weight,
      logIndex: event.log.logIndex,
    });
  });

  ponder.on("HOPGovernor:ProposalCreated", async ({ event, context }) => {
    await proposalCreated(context, daoId, blockTime, {
      proposalId: event.args.proposalId.toString(),
      proposer: event.args.proposer,
      txHash: event.transaction.hash,
      targets: [...event.args.targets],
      values: [...event.args.values],
      signatures: [...event.args.signatures],
      calldatas: [...event.args.calldatas],
      startBlock: event.args.voteStart.toString(),
      endBlock: event.args.voteEnd.toString(),
      description: event.args.description,
      timestamp: event.block.timestamp,
      blockNumber: event.block.number,
      logIndex: event.log.logIndex,
    });
  });

  ponder.on("HOPGovernor:ProposalCanceled", async ({ event, context }) => {
    await updateProposalStatus(
      context,
      event.args.proposalId.toString(),
      ProposalStatus.CANCELED,
    );
  });

  ponder.on("HOPGovernor:ProposalExecuted", async ({ event, context }) => {
    await updateProposalStatus(
      context,
      event.args.proposalId.toString(),
      ProposalStatus.EXECUTED,
    );
  });

  ponder.on(`HOPGovernor:ProposalExtended`, async ({ event, context }) => {
    await proposalExtended(
      context,
      event.args.proposalId.toString(),
      blockTime,
      event.args.extendedDeadline,
      event.transaction.hash,
      event.log.logIndex,
      event.block.timestamp,
    );
  });

  ponder.on("HOPGovernor:ProposalQueued", async ({ event, context }) => {
    await updateProposalStatus(
      context,
      event.args.proposalId.toString(),
      ProposalStatus.QUEUED,
    );
  });
}
